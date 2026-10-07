import { useState, useRef, useEffect } from "react";
import { Terminal, Minus, Square, X } from "lucide-react";

interface TerminalWindowProps {
  onClose: () => void;
  onMinimize: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onRunEco?: () => void;
  activeServicesCount?: number;
  totalServicesCount?: number;
}

export function TerminalWindow({
  onClose,
  onMinimize,
  isMaximized,
  onToggleMaximize,
  onRunEco,
  activeServicesCount = 48,
  totalServicesCount = 52,
}: TerminalWindowProps) {
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<{ cmd: string; output?: string | JSX.Element }[]>([
    {
      cmd: "eios status",
      output: (
        <div className="flex flex-col sm:flex-row items-center gap-3 py-1 select-none">
          {/* Solid Status Table with User Palette: #02243d, #26658C, #A7EBF2, #B5E3C8 */}
          <div className="border border-[#26658C] bg-[#021f36] rounded p-2 text-[#A7EBF2]">
            <div className="text-center font-bold text-[#A7EBF2] border-b border-[#26658C] pb-0.5 mb-1 tracking-wider text-[9.5px]">
              EIOS ENTERPRISE STATUS
            </div>
            <div className="grid grid-cols-2 gap-x-3 text-[10px] leading-relaxed">
              <span className="text-slate-400">System Health</span>
              <span className="text-[#B5E3C8] font-bold">: OK</span>

              <span className="text-slate-400">Enterprise Score</span>
              <span className="text-[#A7EBF2] font-bold">: 94%</span>

              <span className="text-slate-400">Active Services</span>
              <span className="text-slate-200">: {activeServicesCount} / {totalServicesCount}</span>

              <span className="text-slate-400">AI Engine</span>
              <span className="text-[#B5E3C8]">: RUNNING</span>

              <span className="text-slate-400">Event Bus</span>
              <span className="text-[#B5E3C8]">: CONNECTED</span>

              <span className="text-slate-400">Database</span>
              <span className="text-[#54ACBF]">: OPERATIONAL</span>

              <span className="text-slate-400">Cloud Sync</span>
              <span className="text-[#54ACBF]">: ACTIVE</span>

              <span className="text-slate-400">Security</span>
              <span className="text-[#B5E3C8]">: SECURE</span>

              <span className="text-slate-400">Backup</span>
              <span className="text-slate-300">: SUCCESS (2h ago)</span>
            </div>
          </div>

          {/* ASCII Logo matching reference */}
          <div className="flex flex-col justify-center text-[#54ACBF] font-bold text-[8px] leading-tight">
            <pre className="text-[#54ACBF]">
{`  ######  ####  ####   #### 
  #         #  #    # #     
  #####     #  #    #  #### 
  #         #  #    #      #
  ######  ####  ####   #### `}
            </pre>
            <div className="mt-1 text-[9px] text-slate-300 font-medium">
              Enterprise Intelligent OS
            </div>
            <div className="text-[8.5px] text-[#54ACBF]">
              Kernel 1.0.0-enterprise
            </div>
          </div>
        </div>
      ),
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    if (trimmed === "clear") {
      setHistory([]);
      setInputVal("");
      return;
    }

    let output: JSX.Element | string = "";

    if (trimmed === "status") {
      output = (
        <div className="text-[#B5E3C8] font-mono text-[10px]">
          [OK] All 34 kernel microservices running. Enterprise mesh latency: 1.2ms. RAM cap: 3.8GB WSL2 active.
        </div>
      );
    } else if (trimmed === "health") {
      output = (
        <div className="text-[#A7EBF2] font-mono text-[10px]">
          System Health Score: 94/100 | Anomalies: 0 detected | Zero-Trust Mesh: Enforced
        </div>
      );
    } else if (trimmed === "services") {
      output = (
        <div className="text-[#54ACBF] font-mono text-[10px] space-y-0.5">
          <div>• frontend-store: HEALTHY (port 8080)</div>
          <div>• otel-collector: STREAMING (port 4317)</div>
          <div>• kafka-broker: CONNECTED (port 9092)</div>
          <div>• postgres-db: READY (5432)</div>
        </div>
      );
    } else if (trimmed === "eco" || trimmed === "eios fix-ram") {
      onRunEco?.();
      output = (
        <div className="text-[#B5E3C8] font-mono text-[10px]">
          [Eco Governor Applied] Heavy background indexing throttled. Windows host responsiveness preserved.
        </div>
      );
    } else if (trimmed === "logs") {
      output = (
        <div className="text-slate-300 font-mono text-[10px] space-y-0.5">
          <div className="text-slate-400">[10:41:02] KERNEL: Ingest buffer flushed 1.2M metrics</div>
          <div className="text-[#B5E3C8]">[10:41:45] MESH: TLS 1.3 handshake verified on all 34 nodes</div>
          <div className="text-[#54ACBF]">[10:42:10] WATCHDOG: Memory stabilized at 46% (3.2 GB / 7.6 GB)</div>
        </div>
      );
    } else if (trimmed === "help") {
      output = (
        <div className="text-slate-400 font-mono text-[10px]">
          Available commands: <span className="text-[#A7EBF2]">status</span>, <span className="text-[#A7EBF2]">health</span>, <span className="text-[#A7EBF2]">services</span>, <span className="text-[#A7EBF2]">logs</span>, <span className="text-[#A7EBF2]">eco</span>, <span className="text-[#A7EBF2]">clear</span>
        </div>
      );
    } else {
      output = (
        <div className="text-[#F08A7C] font-mono text-[10px]">
          Command not found: {trimmed}. Type 'help' for available commands.
        </div>
      );
    }

    setHistory((prev) => [...prev, { cmd: trimmed, output }]);
    setInputVal("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <div
      className={`os-window flex flex-col overflow-hidden transition-all duration-200 ${
        isMaximized
          ? "fixed inset-6 z-40 rounded-xl shadow-2xl"
          : "h-[305px] w-full rounded-xl"
      }`}
    >
      {/* Titlebar with User Palette */}
      <div className="flex h-8 items-center justify-between border-b border-[#0d2e49] bg-[#021424] px-3 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-[#54ACBF]" />
          <span className="font-display text-xs font-semibold text-slate-200">
            EIOS Terminal
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onMinimize}
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#023859] text-slate-400 hover:text-white"
            title="Minimize"
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            onClick={onToggleMaximize}
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#023859] text-slate-400 hover:text-white"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Square className="h-2.5 w-2.5" />
          </button>
          <button
            onClick={onClose}
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#E04A5F] text-slate-400 hover:text-white"
            title="Close"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Terminal Buffer (Dark solid #010814) */}
      <div className="flex-1 overflow-y-auto p-3 font-mono-code text-[11px] leading-relaxed scrollbar-themed bg-[#010814] text-slate-300">
        {history.map((item, idx) => (
          <div key={idx} className="mb-2 space-y-1">
            <div className="text-[#A7EBF2] font-semibold">
              <span className="text-[#B5E3C8]">eios@core:~$</span> {item.cmd}
            </div>
            {item.output && <div className="mt-1">{item.output}</div>}
          </div>
        ))}

        {/* Active Command Prompt */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeCommand(inputVal);
          }}
          className="flex items-center gap-1.5 mt-1"
        >
          <span className="text-[#B5E3C8] font-semibold text-[11px]">
            eios@core:~$
          </span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type 'status', 'health', 'logs'..."
            className="flex-1 bg-transparent text-slate-200 outline-none placeholder-slate-600 font-mono-code text-[11px]"
            autoFocus
          />
          <span className="inline-block h-3.5 w-1.5 bg-[#54ACBF]" />
        </form>

        <div ref={bottomRef} />
      </div>

      {/* Quick Action Pill Bar */}
      <div className="flex h-7 items-center gap-1.5 border-t border-[#0d2e49] bg-[#010e1c] px-2.5 text-[10px] text-slate-400 overflow-x-auto scrollbar-themed select-none">
        <span className="text-[#54ACBF] font-mono text-[9px]">Commands:</span>
        {["status", "health", "services", "logs", "eco", "help", "clear"].map((cmd) => (
          <button
            key={cmd}
            onClick={() => executeCommand(cmd)}
            className="rounded bg-[#02243d] px-2 py-0.5 text-[#A7EBF2] hover:bg-[#023859] hover:text-white border border-[#0d2e49] transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
