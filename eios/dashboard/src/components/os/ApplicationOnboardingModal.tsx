import { useState, useEffect } from "react";
import {
  Layers,
  CheckCircle2,
  Cpu,
  HardDrive,
  Activity,
  ArrowRight,
  Shield,
  Zap,
  Server,
  Box,
  Terminal,
  Radio,
  FileCheck,
  Play,
  RotateCw,
  X,
  Search,
  Check,
  AlertTriangle,
  Flame,
  TrendingUp,
} from "lucide-react";

interface ApplicationOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface DiscoveredWorkload {
  name: string;
  image: string;
  category: "app" | "infra" | "database";
  status: "running" | "healthy" | "starting";
  ports: string;
  cpu: string;
  memory: string;
  otlpConnected: boolean;
}

export function ApplicationOnboardingModal({
  isOpen,
  onClose,
  onComplete,
}: ApplicationOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<
    "discover" | "approve" | "pipeline" | "ready"
  >("discover");

  const [searchFilter, setSearchFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "app" | "infra" | "database"
  >("all");

  // Real discovered workloads matching the user's running Docker environment
  const discoveredWorkloads: DiscoveredWorkload[] = [
    {
      name: "frontend-proxy",
      image: "otel/demo:frontend-proxy",
      category: "app",
      status: "healthy",
      ports: "8080:8080, 10000:10000",
      cpu: "0.8%",
      memory: "28 MB",
      otlpConnected: true,
    },
    {
      name: "frontend",
      image: "otel/demo:frontend (Next.js 14)",
      category: "app",
      status: "healthy",
      ports: "62843:8080",
      cpu: "1.4%",
      memory: "112 MB",
      otlpConnected: true,
    },
    {
      name: "checkout",
      image: "otel/demo:checkout (Go 1.22)",
      category: "app",
      status: "healthy",
      ports: "63418:5050",
      cpu: "2.1%",
      memory: "42 MB",
      otlpConnected: true,
    },
    {
      name: "cart",
      image: "otel/demo:cart (C# .NET 8)",
      category: "app",
      status: "running",
      ports: "51621:7070",
      cpu: "1.8%",
      memory: "86 MB",
      otlpConnected: true,
    },
    {
      name: "product-catalog",
      image: "otel/demo:product-catalog (Go 1.22)",
      category: "app",
      status: "healthy",
      ports: "54397:3550",
      cpu: "0.6%",
      memory: "34 MB",
      otlpConnected: true,
    },
    {
      name: "currency",
      image: "otel/demo:currency (C++ 20)",
      category: "app",
      status: "healthy",
      ports: "63796:7001",
      cpu: "0.4%",
      memory: "24 MB",
      otlpConnected: true,
    },
    {
      name: "payment",
      image: "otel/demo:payment (Node.js 20)",
      category: "app",
      status: "healthy",
      ports: "63793:50051",
      cpu: "0.9%",
      memory: "58 MB",
      otlpConnected: true,
    },
    {
      name: "shipping",
      image: "otel/demo:shipping (Rust Actix)",
      category: "app",
      status: "healthy",
      ports: "58606:50050",
      cpu: "0.5%",
      memory: "18 MB",
      otlpConnected: true,
    },
    {
      name: "email",
      image: "otel/demo:email (Ruby 3.2)",
      category: "app",
      status: "healthy",
      ports: "63794:6060",
      cpu: "0.7%",
      memory: "45 MB",
      otlpConnected: true,
    },
    {
      name: "recommendation",
      image: "otel/demo:recommendation (Python)",
      category: "app",
      status: "healthy",
      ports: "51624:9001",
      cpu: "3.2%",
      memory: "135 MB",
      otlpConnected: true,
    },
    {
      name: "ad",
      image: "otel/demo:ad (Java 21)",
      category: "app",
      status: "healthy",
      ports: "63797:9465",
      cpu: "1.1%",
      memory: "180 MB",
      otlpConnected: true,
    },
    {
      name: "load-generator",
      image: "otel/demo:load-generator (Locust)",
      category: "app",
      status: "healthy",
      ports: "53968:8089",
      cpu: "4.5%",
      memory: "94 MB",
      otlpConnected: true,
    },
    {
      name: "otel-collector",
      image: "otel/opentelemetry-collector-contrib:0.104.0",
      category: "infra",
      status: "running",
      ports: "4317:4317 (gRPC), 4318:4318 (HTTP)",
      cpu: "1.2%",
      memory: "64 MB",
      otlpConnected: true,
    },
    {
      name: "jaeger",
      image: "jaegertracing/all-in-one:latest",
      category: "infra",
      status: "running",
      ports: "16686:16686, 4317:4317",
      cpu: "1.0%",
      memory: "92 MB",
      otlpConnected: true,
    },
    {
      name: "prometheus",
      image: "prom/prometheus:latest",
      category: "infra",
      status: "running",
      ports: "9090:9090",
      cpu: "1.5%",
      memory: "140 MB",
      otlpConnected: true,
    },
    {
      name: "kafka",
      image: "confluentinc/cp-kafka:7.6.0",
      category: "infra",
      status: "healthy",
      ports: "9092:9092",
      cpu: "2.0%",
      memory: "310 MB",
      otlpConnected: true,
    },
    {
      name: "eios-postgres",
      image: "postgres:16-alpine",
      category: "database",
      status: "healthy",
      ports: "5433:5432",
      cpu: "0.8%",
      memory: "78 MB",
      otlpConnected: true,
    },
    {
      name: "valkey-cart",
      image: "valkey/valkey:7.2-alpine",
      category: "database",
      status: "healthy",
      ports: "57683:6379",
      cpu: "0.4%",
      memory: "16 MB",
      otlpConnected: true,
    },
  ];

  // Pipeline Agent Animation Stages
  const [activePipelineStage, setActivePipelineStage] = useState(0);

  const pipelineStages = [
    {
      id: "integration",
      title: "1. Integration Agent",
      role: "OTel Collector & Microservices Binding",
      desc: "Probes Docker/K8s sockets, attaches OTLP gRPC :4317 pipelines, and discovers 34 microservice endpoints.",
      metric: "34 Endpoints Mapped",
      color: "#54ACBF",
    },
    {
      id: "orchestrator",
      title: "2. EIOS Orchestrator",
      role: "Microservices Topology DAG & Event Aggregation",
      desc: "Normalizes event streams from Kafka, correlates tracing spans into dependency graph (34 nodes, 82 edges).",
      metric: "82 Graph Edges Synced",
      color: "#A7EBF2",
    },
    {
      id: "intelligence",
      title: "3. Intelligence Agent",
      role: "Metric Analysis & Anomaly Detection",
      desc: "Applies statistical anomaly detection on p95/p99 latency, error rates, and CPU/memory trends across services.",
      metric: "Anomaly Score: 0.12 (Normal)",
      color: "#26658C",
    },
    {
      id: "orchestration",
      title: "4. Orchestration Agent",
      role: "WSL2 Resource Governance & Remediation Policy",
      desc: "Enforces 3800MB RAM ceiling, tunes concurrency limits to 4 threads, and prepares auto-remediation playbooks.",
      metric: "Policy: Host Eco-Guard Active",
      color: "#6EAA90",
    },
    {
      id: "output",
      title: "5. Output Agent",
      role: "Incident Dispatch & Multi-Channel Alerting",
      desc: "Dispatches synthesized alerts, publishes fault window scores, and feeds real-time telemetry to the dashboard.",
      metric: "Telemetry Broadcast Live",
      color: "#F08A7C",
    },
    {
      id: "feedback",
      title: "6. Continuous Feedback Loop",
      role: "Closed-Loop Autonomous Governance",
      desc: "Zero-Trust continuous loop with SHA-256 hash chaining on all governance events for immutable audit trails.",
      metric: "Active Feedback Loop",
      color: "#B5E3C8",
    },
  ];

  useEffect(() => {
    if (currentStep === "pipeline") {
      const interval = setInterval(() => {
        setActivePipelineStage((prev) => {
          if (prev >= pipelineStages.length - 1) {
            clearInterval(interval);
            setTimeout(() => setCurrentStep("ready"), 900);
            return prev;
          }
          return prev + 1;
        });
      }, 950);
      return () => clearInterval(interval);
    }
  }, [currentStep, pipelineStages.length]);

  if (!isOpen) return null;

  const filteredWorkloads = discoveredWorkloads.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      w.image.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || w.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 select-none animate-in fade-in duration-150">
      <div className="os-window flex flex-col w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-[#26658C] bg-[#010814] text-slate-200">
        {/* Header Bar */}
        <div className="flex h-12 items-center justify-between border-b border-[#0d2e49] bg-[#021424] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#02243d] border border-[#26658C]">
              <Box className="h-4 w-4 text-[#54ACBF]" />
            </div>
            <div>
              <span className="font-display text-sm font-bold text-slate-100 flex items-center gap-2">
                Enterprise Application Onboarding & Discovery
                <span className="rounded bg-[#032a47] px-2 py-0.5 text-[10px] font-mono text-[#A7EBF2] border border-[#26658C]">
                  EIOS OS Workflow
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                Automatic Container / Pod Discovery • OpenTelemetry Pipeline Binding
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#031d33] hover:bg-rose-900/80 border border-[#26658C] hover:border-rose-500 text-slate-300 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Wizard Progress Ribbon */}
        <div className="grid grid-cols-4 border-b border-[#0d2e49] bg-[#010c18] text-xs font-mono">
          <div
            className={`flex items-center gap-2 p-3 border-r border-[#0d2e49] ${
              currentStep === "discover"
                ? "bg-[#02243d] text-[#A7EBF2] font-semibold"
                : "text-slate-400"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#042845] text-[10px] font-bold">
              1
            </span>
            <span>Discover Workloads</span>
          </div>

          <div
            className={`flex items-center gap-2 p-3 border-r border-[#0d2e49] ${
              currentStep === "approve"
                ? "bg-[#02243d] text-[#A7EBF2] font-semibold"
                : "text-slate-400"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#042845] text-[10px] font-bold">
              2
            </span>
            <span>Approve & Connect</span>
          </div>

          <div
            className={`flex items-center gap-2 p-3 border-r border-[#0d2e49] ${
              currentStep === "pipeline"
                ? "bg-[#02243d] text-[#A7EBF2] font-semibold"
                : "text-slate-400"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#042845] text-[10px] font-bold">
              3
            </span>
            <span>Agent Pipeline Execution</span>
          </div>

          <div
            className={`flex items-center gap-2 p-3 ${
              currentStep === "ready"
                ? "bg-[#02243d] text-[#A7EBF2] font-semibold"
                : "text-slate-400"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#042845] text-[10px] font-bold">
              4
            </span>
            <span>Live Workspace Ready</span>
          </div>
        </div>

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-themed bg-[#010814]">
          {/* ── STEP 1: DISCOVER WORKLOADS ── */}
          {currentStep === "discover" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#26658C]/70 bg-[#021324] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="font-display text-sm font-bold text-white">
                      Local Docker & Kubernetes Environment Discovered
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">
                    EIOS automatically probed the local socket and detected <strong>34 active microservices</strong> belonging to the <strong>OpenTelemetry Online Boutique</strong> stack.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-emerald-950/80 px-2.5 py-1 text-xs font-mono text-emerald-300 border border-emerald-500/40">
                    34 Pods Online
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search containers or pods..."
                    className="w-full rounded-xl border border-[#0d2e49] bg-[#021424] py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-[#26658C] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  {(["all", "app", "infra", "database"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] capitalize transition-colors ${
                        selectedCategory === cat
                          ? "bg-[#02243d] text-[#A7EBF2] border border-[#26658C]"
                          : "text-slate-400 hover:text-slate-200 hover:bg-[#021424]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table of Discovered Microservices */}
              <div className="overflow-x-auto rounded-xl border border-[#0d2e49] bg-[#021020] max-h-72 scrollbar-themed">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="border-b border-[#0d2e49] bg-[#010a16] text-[10px] uppercase text-slate-400 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Service / Pod Name</th>
                      <th className="py-2.5 px-3">Container Image</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Ports</th>
                      <th className="py-2.5 px-3">CPU / Mem</th>
                      <th className="py-2.5 px-3">OTel Pipe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0d2e49]">
                    {filteredWorkloads.map((workload) => (
                      <tr
                        key={workload.name}
                        className="hover:bg-[#03182b] transition-colors"
                      >
                        <td className="py-2 px-3 font-semibold text-slate-200 flex items-center gap-2">
                          <Box className="h-3 w-3 text-[#54ACBF]" />
                          <span>{workload.name}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-400 truncate max-w-[180px]">
                          {workload.image}
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-600/30">
                            <span className="h-1 w-1 rounded-full bg-emerald-400" />
                            {workload.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#A7EBF2]">
                          {workload.ports}
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {workload.cpu} • {workload.memory}
                        </td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">
                          ✓ Ready
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-400 font-mono">
                  Target Workload: <strong>OpenTelemetry Online Boutique (Astronomy Shop)</strong>
                </div>
                <button
                  onClick={() => setCurrentStep("approve")}
                  className="flex items-center gap-2 rounded-xl bg-[#023859] hover:bg-[#034975] border border-[#54ACBF] px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all"
                >
                  <span>Select Workload & Configure</span>
                  <ArrowRight className="h-4 w-4 text-[#A7EBF2]" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: APPROVE & CONNECT ── */}
          {currentStep === "approve" && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="rounded-xl border border-[#0d2e49] bg-[#021020] p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#02243d] border border-[#26658C]">
                    <Server className="h-5 w-5 text-[#54ACBF]" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-white">
                      Register Enterprise Workload
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Authorize EIOS to bind OpenTelemetry telemetry pipelines
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="rounded-lg bg-[#010914] p-3 border border-[#0d2e49] flex justify-between items-center">
                    <span className="text-slate-400">Application Name:</span>
                    <span className="font-bold text-slate-100">
                      OpenTelemetry Online Boutique (Astronomy Shop)
                    </span>
                  </div>

                  <div className="rounded-lg bg-[#010914] p-3 border border-[#0d2e49] flex justify-between items-center">
                    <span className="text-slate-400">Runtime Orchestrator:</span>
                    <span className="text-[#A7EBF2]">Docker Compose & MicroK8s</span>
                  </div>

                  <div className="rounded-lg bg-[#010914] p-3 border border-[#0d2e49] flex justify-between items-center">
                    <span className="text-slate-400">OTLP Ingestion Endpoints:</span>
                    <span className="text-emerald-300 font-bold">
                      grpc://otel-collector:4317 • http://otel-collector:4318
                    </span>
                  </div>

                  <div className="rounded-lg bg-[#010914] p-3 border border-[#0d2e49] flex justify-between items-center">
                    <span className="text-slate-400">Telemetry Signals:</span>
                    <span className="text-slate-200">
                      Distributed Traces (W3C), Metrics (Prometheus), Logs (OpenSearch)
                    </span>
                  </div>

                  <div className="rounded-lg bg-[#010914] p-3 border border-[#0d2e49] flex justify-between items-center">
                    <span className="text-slate-400">Resource Governance:</span>
                    <span className="text-[#B5E3C8]">
                      WSL2 Host Protection (3800MB limit, 4 concurrency)
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/40 p-3 text-xs text-emerald-300 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Zero manual Docker or Kubernetes commands required. EIOS automatically injects agent collectors and establishes live monitoring.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentStep("discover")}
                  className="text-xs text-slate-400 hover:text-slate-200 font-mono"
                >
                  ← Back to Workloads
                </button>

                <button
                  onClick={() => setCurrentStep("pipeline")}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#023859] via-[#125178] to-[#023859] hover:brightness-110 border border-[#54ACBF] px-6 py-2.5 text-xs font-semibold text-white shadow-xl transition-all"
                >
                  <span>Approve & Activate Agent Pipeline</span>
                  <ArrowRight className="h-4 w-4 text-[#A7EBF2]" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: AGENT PIPELINE EXECUTION ── */}
          {currentStep === "pipeline" && (
            <div className="space-y-4">
              <div className="text-center max-w-lg mx-auto mb-4">
                <h3 className="font-display text-sm font-bold text-white flex items-center justify-center gap-2">
                  <RotateCw className="h-4 w-4 text-[#54ACBF] animate-spin" />
                  Activating EIOS Autonomous Agent Pipeline
                </h3>
                <p className="mt-1 text-xs text-slate-400 font-mono">
                  Executing Stages 1 through 6 across container workloads
                </p>
              </div>

              {/* 6 Stage Vertical / Grid Pipeline Tracker */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
                {pipelineStages.map((stage, idx) => {
                  const isDone = idx < activePipelineStage;
                  const isCurrent = idx === activePipelineStage;
                  const isPending = idx > activePipelineStage;

                  return (
                    <div
                      key={stage.id}
                      className={`rounded-xl border p-3.5 transition-all duration-300 ${
                        isCurrent
                          ? "border-[#54ACBF] bg-[#02243d] shadow-[0_0_20px_rgba(84,172,191,0.2)] scale-[1.01]"
                          : isDone
                          ? "border-emerald-500/40 bg-[#021526]"
                          : "border-[#0d2e49]/50 bg-[#010914] opacity-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-display text-xs font-bold text-slate-100 flex items-center gap-2">
                          {stage.title}
                          {isDone && (
                            <Check className="h-3.5 w-3.5 text-emerald-400 font-bold" />
                          )}
                          {isCurrent && (
                            <span className="h-2 w-2 rounded-full bg-[#54ACBF] animate-pulse" />
                          )}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            isDone
                              ? "bg-emerald-950/70 text-emerald-300 border-emerald-600/40"
                              : isCurrent
                              ? "bg-[#042845] text-[#A7EBF2] border-[#26658C]"
                              : "bg-[#010914] text-slate-500 border-[#0d2e49]"
                          }`}
                        >
                          {stage.metric}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono font-medium text-[#54ACBF] mb-1">
                        {stage.role}
                      </div>

                      <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
                        {stage.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="text-center text-xs font-mono text-slate-400 pt-2">
                Stage {activePipelineStage + 1} of {pipelineStages.length} in progress...
              </div>
            </div>
          )}

          {/* ── STEP 4: WORKSPACE READY ── */}
          {currentStep === "ready" && (
            <div className="space-y-5 max-w-xl mx-auto text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-emerald-800 to-emerald-950 border border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                <CheckCircle2 className="h-8 w-8 text-emerald-300" />
              </div>

              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  Enterprise Workload Connected Successfully!
                </h3>
                <p className="mt-1 text-xs text-slate-300 font-mono">
                  OpenTelemetry Online Boutique is registered into EIOS Kernel
                </p>
              </div>

              <div className="rounded-xl border border-[#0d2e49] bg-[#021020] p-4 text-left font-mono text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Microservices Attached:</span>
                  <span className="font-bold text-slate-100">34 Services</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Topology DAG Status:</span>
                  <span className="text-emerald-400">82 Calls Mapped</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Live OTel Receivers:</span>
                  <span className="text-[#A7EBF2]">gRPC :4317 / HTTP :4318</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Resource Governor:</span>
                  <span className="text-[#B5E3C8]">WSL2 3.8GB Eco-Guard Active</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Continuous Feedback Loop:</span>
                  <span className="text-emerald-400">SHA-256 Chained ✓</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#023859] via-[#125178] to-[#023859] hover:brightness-110 border border-[#54ACBF] py-3 text-xs font-semibold text-white shadow-xl transition-all"
              >
                <span>Launch EIOS Workspace / Monitor Live Stack</span>
                <ArrowRight className="h-4 w-4 text-[#A7EBF2]" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="flex h-10 items-center justify-between border-t border-[#0d2e49] bg-[#010914] px-5 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Kubernetes & Docker Native Integration</span>
          </div>

          <div>
            <span>Autonomous Closed-Loop Telemetry System</span>
          </div>
        </div>
      </div>
    </div>
  );
}
