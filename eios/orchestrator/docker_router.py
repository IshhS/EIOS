"""
EIOS Docker Integration Layer
------------------------------
Talks to the Docker Engine API (via Unix socket on Linux/Mac or named pipe on Windows)
to provide real container discovery, stats, and lifecycle management.

Endpoints:
  GET  /api/docker/containers        – list all containers with status
  GET  /api/docker/containers/{id}/stats – live CPU/mem for one container
  GET  /api/docker/stats             – aggregate stats for all running containers
  POST /api/docker/containers/{id}/start
  POST /api/docker/containers/{id}/stop
  POST /api/docker/containers/{id}/restart
  GET  /api/docker/networks          – list Docker networks
  GET  /api/docker/volumes           – list Docker volumes
"""

from __future__ import annotations

import logging
import os
import platform
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException

log = logging.getLogger("eios.docker")

router = APIRouter(prefix="/api/docker", tags=["docker"])

# ── Docker socket transport ────────────────────────────────────────────────────
def _docker_transport() -> httpx.AsyncHTTPTransport | None:
    """Return the correct transport for the local Docker Engine."""
    system = platform.system()
    if system == "Windows":
        # Windows Docker Desktop exposes a named pipe
        pipe = r"//./pipe/docker_engine"
        try:
            return httpx.AsyncHTTPTransport(uds=pipe)
        except Exception:
            # Fallback: Docker Desktop also listens on TCP by default
            return None
    else:
        # Linux / macOS
        sock = "/var/run/docker.sock"
        if os.path.exists(sock):
            return httpx.AsyncHTTPTransport(uds=sock)
    return None


# Docker TCP fallback (Docker Desktop on Windows can expose port 2375)
DOCKER_TCP = os.getenv("DOCKER_HOST", "http://localhost:2375")
DOCKER_UNIX_BASE = "http://docker"          # used with UDS transport


async def _docker_get(path: str) -> Any:
    transport = _docker_transport()
    try:
        if transport:
            async with httpx.AsyncClient(transport=transport, base_url=DOCKER_UNIX_BASE) as client:
                r = await client.get(path, timeout=5.0)
                r.raise_for_status()
                return r.json()
        else:
            # Fall back to TCP
            async with httpx.AsyncClient(base_url=DOCKER_TCP) as client:
                r = await client.get(path, timeout=5.0)
                r.raise_for_status()
                return r.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Docker Engine not reachable. Ensure Docker Desktop is running.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))


async def _docker_post(path: str) -> Any:
    transport = _docker_transport()
    try:
        if transport:
            async with httpx.AsyncClient(transport=transport, base_url=DOCKER_UNIX_BASE) as client:
                r = await client.post(path, timeout=10.0)
                if r.status_code not in (200, 204):
                    r.raise_for_status()
                return {"status": "ok"}
        else:
            async with httpx.AsyncClient(base_url=DOCKER_TCP) as client:
                r = await client.post(path, timeout=10.0)
                if r.status_code not in (200, 204):
                    r.raise_for_status()
                return {"status": "ok"}
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Docker Engine not reachable.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))


def _parse_container(c: dict) -> dict:
    """Normalize a Docker container object into EIOS format."""
    names = c.get("Names", [])
    name = names[0].lstrip("/") if names else c.get("Id", "")[:12]

    ports = c.get("Ports", [])
    port_str = ", ".join(
        f"{p.get('PublicPort', '')}:{p.get('PrivatePort', '')}"
        for p in ports
        if p.get("PublicPort")
    ) or "—"

    state = c.get("State", "unknown").lower()
    status_map = {
        "running": "running",
        "exited": "stopped",
        "paused": "paused",
        "restarting": "restarting",
        "dead": "dead",
        "created": "created",
    }
    status = status_map.get(state, state)

    labels = c.get("Labels", {}) or {}
    compose_service = labels.get("com.docker.compose.service", "")
    compose_project = labels.get("com.docker.compose.project", "")

    return {
        "id": c.get("Id", "")[:12],
        "full_id": c.get("Id", ""),
        "name": name,
        "image": c.get("Image", ""),
        "status": status,
        "state": state,
        "ports": port_str,
        "created": c.get("Created", 0),
        "uptime": c.get("Status", ""),
        "compose_service": compose_service,
        "compose_project": compose_project,
        "labels": labels,
        "otlp_connected": any(
            kw in (c.get("Image", "") + name).lower()
            for kw in ["otel", "opentelemetry", "jaeger", "prometheus"]
        ),
        "category": _infer_category(name, c.get("Image", ""), labels),
    }


def _infer_category(name: str, image: str, labels: dict) -> str:
    combined = (name + image).lower()
    if any(kw in combined for kw in ["postgres", "mysql", "redis", "mongo", "db"]):
        return "database"
    if any(kw in combined for kw in ["kafka", "zookeeper", "collector", "prometheus", "jaeger",
                                       "grafana", "otel", "opensearch"]):
        return "infra"
    return "app"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/containers")
async def list_containers(all: bool = True) -> list[dict]:
    """List all Docker containers (running + stopped if all=True)."""
    params = "?all=true" if all else ""
    data = await _docker_get(f"/containers/json{params}")
    return [_parse_container(c) for c in data]


@router.get("/containers/{container_id}/stats")
async def container_stats(container_id: str) -> dict:
    """Get real-time CPU & memory for a single container (one-shot, no stream)."""
    data = await _docker_get(f"/containers/{container_id}/stats?stream=false")

    # CPU calculation
    cpu_delta = data["cpu_stats"]["cpu_usage"]["total_usage"] - \
                data["precpu_stats"]["cpu_usage"]["total_usage"]
    system_delta = data["cpu_stats"].get("system_cpu_usage", 0) - \
                   data["precpu_stats"].get("system_cpu_usage", 0)
    num_cpus = data["cpu_stats"].get("online_cpus") or \
               len(data["cpu_stats"]["cpu_usage"].get("percpu_usage", [1]))
    cpu_pct = (cpu_delta / system_delta * num_cpus * 100.0) if system_delta > 0 else 0.0

    # Memory
    mem = data.get("memory_stats", {})
    mem_usage = mem.get("usage", 0)
    # Docker reports cache inside stats; subtract to get true RSS
    mem_cache = mem.get("stats", {}).get("cache", 0) or mem.get("stats", {}).get("inactive_file", 0)
    mem_real = max(0, mem_usage - mem_cache)
    mem_limit = mem.get("limit", 1)
    mem_pct = (mem_real / mem_limit * 100.0) if mem_limit > 0 else 0.0

    return {
        "id": container_id,
        "cpu_pct": round(cpu_pct, 2),
        "memory_bytes": mem_real,
        "memory_mb": round(mem_real / 1024 / 1024, 1),
        "memory_limit_mb": round(mem_limit / 1024 / 1024, 1),
        "memory_pct": round(mem_pct, 2),
        "networks": {
            k: {
                "rx_bytes": v.get("rx_bytes", 0),
                "tx_bytes": v.get("tx_bytes", 0),
            }
            for k, v in data.get("networks", {}).items()
        },
    }


@router.get("/stats")
async def all_container_stats() -> list[dict]:
    """Lightweight CPU/memory summary for all running containers."""
    import asyncio
    containers_raw = await _docker_get("/containers/json")  # running only
    container_ids = [(c["Id"][:12], c["Id"]) for c in containers_raw]

    async def fetch_one(short_id: str, full_id: str) -> dict:
        try:
            s = await container_stats(full_id)
            s["id"] = short_id
            return s
        except Exception:
            return {"id": short_id, "cpu_pct": 0.0, "memory_mb": 0, "memory_pct": 0.0}

    results = await asyncio.gather(*[fetch_one(sid, fid) for sid, fid in container_ids])
    return list(results)


@router.post("/containers/{container_id}/start")
async def start_container(container_id: str) -> dict:
    result = await _docker_post(f"/containers/{container_id}/start")
    log.info("started container %s", container_id)
    return result


@router.post("/containers/{container_id}/stop")
async def stop_container(container_id: str) -> dict:
    result = await _docker_post(f"/containers/{container_id}/stop")
    log.info("stopped container %s", container_id)
    return result


@router.post("/containers/{container_id}/restart")
async def restart_container(container_id: str) -> dict:
    result = await _docker_post(f"/containers/{container_id}/restart")
    log.info("restarted container %s", container_id)
    return result


@router.get("/networks")
async def list_networks() -> list[dict]:
    data = await _docker_get("/networks")
    return [
        {
            "id": n.get("Id", "")[:12],
            "name": n.get("Name", ""),
            "driver": n.get("Driver", ""),
            "scope": n.get("Scope", ""),
            "containers": len(n.get("Containers", {})),
        }
        for n in data
    ]


@router.get("/volumes")
async def list_volumes() -> list[dict]:
    data = await _docker_get("/volumes")
    vols = data.get("Volumes", []) or []
    return [
        {
            "name": v.get("Name", ""),
            "driver": v.get("Driver", ""),
            "mountpoint": v.get("Mountpoint", ""),
            "created": v.get("CreatedAt", ""),
        }
        for v in vols
    ]


@router.get("/info")
async def docker_info() -> dict:
    """Return Docker Engine system info."""
    data = await _docker_get("/info")
    return {
        "containers": data.get("Containers", 0),
        "containers_running": data.get("ContainersRunning", 0),
        "containers_paused": data.get("ContainersPaused", 0),
        "containers_stopped": data.get("ContainersStopped", 0),
        "images": data.get("Images", 0),
        "server_version": data.get("ServerVersion", ""),
        "os": data.get("OperatingSystem", ""),
        "architecture": data.get("Architecture", ""),
        "mem_total_gb": round(data.get("MemTotal", 0) / 1024 / 1024 / 1024, 2),
        "cpus": data.get("NCPU", 0),
    }
