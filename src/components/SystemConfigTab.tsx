import React, { useState } from "react";
import {
  Settings,
  Shield,
  Activity,
  Save,
  HelpCircle,
  CheckCircle2,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Server,
  Copy,
  Download,
  AlertOctagon,
  Cpu,
  Zap,
  TrendingDown,
  Percent
} from "lucide-react";
import { SystemConfig, Heartbeat } from "../types";

interface SystemConfigTabProps {
  config: SystemConfig | null;
  heartbeats: Heartbeat[];
  onSaveConfig: (newCfg: any) => void;
  onHardReset: (capital: number, hardReset: boolean) => void;
}

export const SystemConfigTab: React.FC<SystemConfigTabProps> = ({
  config,
  heartbeats,
  onSaveConfig,
  onHardReset,
}) => {
  // Trading Params State
  const [mode, setMode] = useState<"PAPER" | "LIVE">(config?.trading.mode || "PAPER");
  const [capital, setCapital] = useState<number>(config?.trading.initial_capital || 100000);
  const [maxTradeAmount, setMaxTradeAmount] = useState<number>(config?.trading.max_trade_amount || 15000);
  const [maxPosPct, setMaxPosPct] = useState<number>((config?.trading.max_position_pct || 0.1) * 100);
  const [stopLoss, setStopLoss] = useState<number>(config?.trading.stop_loss_pct || 2.0);
  const [takeProfit, setTakeProfit] = useState<number>(config?.trading.take_profit_pct || 4.0);
  const [maxPositions, setMaxPositions] = useState<number>(config?.trading.max_concurrent_positions || 5);
  const [interval, setInterval] = useState<number>(config?.trading.poll_interval_seconds || 60);
  const [weeks, setWeeks] = useState<number>(config?.trading.paper_training_weeks || 3);

  // Groww Credentials State
  const [growwToken, setGrowwToken] = useState<string>(config?.credentials?.groww_api_token || "");
  const [growwSecret, setGrowwSecret] = useState<string>(config?.credentials?.groww_api_secret || "");
  const [growwTotp, setGrowwTotp] = useState<string>(config?.credentials?.groww_totp_key || "");
  const [showSecrets, setShowSecrets] = useState<boolean>(false);

  // Reset Modal State
  const [resetAmount, setResetAmount] = useState<number>(0);
  const [confirmText, setConfirmText] = useState<string>("");
  const [savedMsg, setSavedMsg] = useState<string>("");
  const [copiedService, setCopiedService] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      mode,
      initial_capital: Number(capital),
      max_trade_amount: Number(maxTradeAmount),
      max_position_pct: Number(maxPosPct) / 100,
      stop_loss_pct: Number(stopLoss),
      take_profit_pct: Number(takeProfit),
      max_concurrent_positions: Number(maxPositions),
      poll_interval_seconds: Number(interval),
      paper_training_weeks: Number(weeks),
      groww_api_token: growwToken,
      groww_api_secret: growwSecret,
      groww_totp_key: growwTotp,
    });
    setSavedMsg("Configuration & API credentials saved successfully!");
    setTimeout(() => setSavedMsg(""), 3500);
  };

  const handleExecuteHardReset = () => {
    if (confirmText !== "RESET") {
      alert("Please type 'RESET' in capital letters to confirm hard reset.");
      return;
    }
    onHardReset(Number(resetAmount), true);
    setConfirmText("");
    alert(`Hard reset complete! All trades & signals wiped. Capital set to ₹${resetAmount.toLocaleString("en-IN")}`);
  };

  const systemdCode = `[Unit]
Description=Groww Algorithmic Trader & ML Daemon (My Money Maker)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/groww-trader
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5s
WatchdogSec=60s
KillMode=process
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATABASE_MODE=WAL
EnvironmentFile=/home/pi/groww-trader/.env

[Install]
WantedBy=multi-user.target`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(systemdCode);
    setCopiedService(true);
    setTimeout(() => setCopiedService(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Groww API Credentials Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              Groww API Key & Live Secret Credentials
            </h3>
            <p className="text-xs text-slate-400">
              Enter your official Groww Developer API keys. Stored securely on your server/Raspberry Pi environment.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSecrets(!showSecrets)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium self-start sm:self-auto transition-colors"
          >
            {showSecrets ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
            {showSecrets ? "Hide Credentials" : "Show Credentials"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 text-[11px] font-semibold mb-1">GROWW_API_TOKEN</label>
            <input
              type={showSecrets ? "text" : "password"}
              value={growwToken}
              onChange={(e) => setGrowwToken(e.target.value)}
              placeholder="e.g. grw_live_token_xxxx"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] font-semibold mb-1">GROWW_API_SECRET</label>
            <input
              type={showSecrets ? "text" : "password"}
              value={growwSecret}
              onChange={(e) => setGrowwSecret(e.target.value)}
              placeholder="e.g. sec_groww_xxxx"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] font-semibold mb-1">GROWW_TOTP_KEY (2FA Auto-Login)</label>
            <input
              type={showSecrets ? "text" : "password"}
              value={growwTotp}
              onChange={(e) => setGrowwTotp(e.target.value)}
              placeholder="e.g. JBSWY3DPEHPK3PXP"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300/90 flex items-start gap-2">
          <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Where to get keys:</strong> Login to <u>developer.groww.in</u> &rarr; Create App &rarr; Copy API Key, App Secret & TOTP Secret Key. You can also define these directly in your Raspberry Pi's <code>.env</code> file.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Settings Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            Trading Daemon & Risk Controls
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Execution Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "PAPER" | "LIVE")}
                className="w-full bg-slate-800 border border-slate-700 text-white font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="PAPER">📝 PAPER TRADING (Simulated orders, zero risk)</option>
                <option value="LIVE">🔴 LIVE TRADING (Real order placement via Groww API)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Starting Capital (₹)</label>
                <input
                  type="number"
                  step={5000}
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Max Amount per Order (₹)</label>
                <input
                  type="number"
                  step={1000}
                  value={maxTradeAmount}
                  onChange={(e) => setMaxTradeAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Max Position %</label>
                <div className="relative">
                  <input
                    type="number"
                    step={1}
                    value={maxPosPct}
                    onChange={(e) => setMaxPosPct(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-3 pr-7 py-2 font-mono"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-400 text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 text-rose-400">Stop Loss %</label>
                <div className="relative">
                  <input
                    type="number"
                    step={0.5}
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-rose-300 font-bold rounded-lg pl-3 pr-7 py-2 font-mono"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-400 text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 text-emerald-400">Take Profit %</label>
                <div className="relative">
                  <input
                    type="number"
                    step={0.5}
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-emerald-300 font-bold rounded-lg pl-3 pr-7 py-2 font-mono"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-400 text-xs">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Max Positions</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxPositions}
                  onChange={(e) => setMaxPositions(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Poll Interval (s)</label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Paper Weeks</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={weeks}
                  onChange={(e) => setWeeks(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-950/40 transition-all text-xs"
              >
                <Save className="w-4 h-4" />
                Save Risk & System Parameters
              </button>
              {savedMsg && (
                <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-4 h-4" /> {savedMsg}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Hard Reset Data Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-rose-400 mb-2 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Hard Data Reset & Starting Capital Clean
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Wipe all open positions, closed trade logs, signals, equity points, and reset cash balance to start fresh (e.g. starting at ₹0 or a new amount).
            </p>

            <div className="bg-slate-950 border border-rose-900/40 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">
                  New Starting Balance (₹)
                </label>
                <input
                  type="number"
                  value={resetAmount}
                  onChange={(e) => setResetAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Set to 0 to start with zero balance, or enter custom capital.</span>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">
                  Confirmation Keyword (Type "RESET")
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="RESET"
                  className="w-full bg-slate-900 border border-slate-700 text-rose-300 font-mono font-bold rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="button"
                onClick={handleExecuteHardReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Execute Hard Reset & Wipe All Data
              </button>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 text-[11px] text-slate-400 space-y-1">
            <p>• <strong>Resets:</strong> Cash balance, Positions table, Trade log history, Model training runs, System log files</p>
            <p>• <strong>Preserves:</strong> Watchlist symbols and Groww API keys</p>
          </div>
        </div>
      </div>

      {/* Raspberry Pi Daemon & Systemd Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Raspberry Pi Systemd Daemon & Fault-Tolerance File Generator
            </h3>
            <p className="text-xs text-slate-400">
              Run automatically on Linux/Raspberry Pi OS. Includes auto-restart, Watchdog pinging, SQLite WAL resilience against power cuts.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
              {copiedService ? "Copied!" : "Copy .service File"}
            </button>

            <a
              href="/api/systemd/download"
              download="groww-trader.service"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download .service File
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Code display */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-x-auto select-all">
            <pre className="leading-relaxed">{systemdCode}</pre>
          </div>

          {/* Linux Installation Steps */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4 text-xs text-slate-300 space-y-3">
            <h4 className="font-bold text-emerald-400 flex items-center gap-2">
              <Zap className="w-4 h-4" /> 4 Steps to Deploy on Raspberry Pi:
            </h4>

            <ol className="list-decimal list-inside space-y-2 text-[11px] font-mono text-slate-300 leading-relaxed">
              <li className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block font-sans">1. Copy service file to systemd:</span>
                <code>sudo cp groww-trader.service /etc/systemd/system/</code>
              </li>
              <li className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block font-sans">2. Reload systemd daemon manager:</span>
                <code>sudo systemctl daemon-reload</code>
              </li>
              <li className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block font-sans">3. Enable auto-start on boot & start now:</span>
                <code>sudo systemctl enable --now groww-trader</code>
              </li>
              <li className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block font-sans">4. View real-time streaming system logs:</span>
                <code>sudo journalctl -u groww-trader -f</code>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Heartbeat Status Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Daemon Heartbeat Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-medium uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 rounded-l-lg">Time</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Market Open</th>
                <th className="py-2.5 px-4">Mode</th>
                <th className="py-2.5 px-4 rounded-r-lg">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {heartbeats.map((hb) => (
                <tr key={hb.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(hb.timestamp).toLocaleTimeString("en-IN")}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      {hb.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-400">
                    {hb.marketOpen ? "🟢 Open" : "🔴 Closed"}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-300">{hb.mode}</td>
                  <td className="py-2.5 px-4 text-slate-300">{hb.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
