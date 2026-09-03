import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { OverviewTab } from "./components/OverviewTab";
import { PositionsTab } from "./components/PositionsTab";
import { WatchlistTab } from "./components/WatchlistTab";
import { MlStatusTab } from "./components/MlStatusTab";
import { LogsTab } from "./components/LogsTab";
import { SystemConfigTab } from "./components/SystemConfigTab";
import { MobileDashboard } from "./components/MobileDashboard";
import { HistoricalTrainingTab } from "./components/HistoricalTrainingTab";
import { PaperBotTab } from "./components/PaperBotTab";
import { QuantPipelineTab } from "./components/QuantPipelineTab";
import { InvestmentDashboard } from "./components/InvestmentDashboard";
import { MicroDeliveryAlgoTab } from "./components/MicroDeliveryAlgoTab";
import {
  PortfolioStats,
  Position,
  Trade,
  EquityPoint,
  WatchlistItem,
  TradingSignal,
  ModelRun,
  SystemConfig,
  Heartbeat
} from "./types";
import { LayoutDashboard, Clock, Eye, Cpu, Terminal, Settings, GraduationCap, Bot, BrainCircuit, PiggyBank, Users } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("my_investments");
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [mlStatus, setMlStatus] = useState<any>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [autoCycle, setAutoCycle] = useState<boolean>(true);

  // Fetch initial portfolio & application state
  const fetchData = async () => {
    try {
      const [portRes, watchRes, sigRes, mlRes, cfgRes] = await Promise.all([
        fetch("/api/portfolio"),
        fetch("/api/watchlist"),
        fetch("/api/signals"),
        fetch("/api/ml/status"),
        fetch("/api/config"),
      ]);

      const portData = await portRes.json();
      const watchData = await watchRes.json();
      const sigData = await sigRes.json();
      const mlData = await mlRes.json();
      const cfgData = await cfgRes.json();

      setStats(portData.stats);
      setPositions(portData.positions);
      setClosedTrades(portData.closedTrades);
      setEquityCurve(portData.equityCurve);

      setWatchlist(watchData);
      setSignals(sigData);
      setMlStatus(mlData);

      setConfig(cfgData.config);
      setHeartbeats(cfgData.heartbeats || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-Cycle timer
  useEffect(() => {
    if (!autoCycle) return;
    const interval = setInterval(() => {
      runCycle();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoCycle]);

  // Actions
  const runCycle = async () => {
    setLoading(true);
    try {
      await fetch("/api/trader/cycle", { method: "POST" });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const retrainModel = async () => {
    setLoading(true);
    try {
      await fetch("/api/trader/train-model", { method: "POST" });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetPortfolio = async (capital?: number, hardReset: boolean = false) => {
    if (!hardReset && !window.confirm("Are you sure you want to reset capital back to starting balance?")) return;
    setLoading(true);
    try {
      await fetch("/api/trader/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capital, hardReset }),
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    window.open("/api/reports/download?type=trades", "_blank");
  };

  const handleSelectIndex = async (indexId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/trader/select-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: indexId }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Error selecting index:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (stock: {
    symbol: string;
    category: string;
    priority: number;
    tags: string;
    notes: string;
  }) => {
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stock),
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add stock");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStock = async (symbol: string, enabled: boolean) => {
    try {
      await fetch(`/api/watchlist/${symbol}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStock = async (symbol: string) => {
    if (!window.confirm(`Delete ${symbol} from watchlist?`)) return;
    try {
      await fetch(`/api/watchlist/${symbol}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveConfig = async (newCfg: Partial<SystemConfig["trading"]>) => {
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCfg),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const navTabs = [
    { id: "my_investments", label: "My Stocks & SIP Portfolio", icon: PiggyBank },
    { id: "micro_delivery_algo", label: "10-Customer Micro Algo", icon: Users },
    { id: "overview", label: "Index Engine Overview", icon: LayoutDashboard },
    { id: "positions", label: "Positions & Trades", icon: Clock },
    { id: "watchlist", label: "Watchlist & Signals", icon: Eye },
    { id: "quant", label: "Quant ML Pipeline", icon: BrainCircuit },
    { id: "historical", label: "Historical Training", icon: GraduationCap },
    { id: "paperbot", label: "Auto Paper Bot", icon: Bot },
    { id: "ml", label: "ML Model Status", icon: Cpu },
    { id: "logs", label: "System Logs", icon: Terminal },
    { id: "config", label: "System & Config", icon: Settings },
  ];

  if (currentPath === "/mobile") {
    return (
      <MobileDashboard
        stats={stats}
        positions={positions}
        signals={signals}
        watchlist={watchlist}
        mlStatus={mlStatus}
        config={config}
        autoCycle={autoCycle}
        onToggleAutoCycle={() => setAutoCycle(!autoCycle)}
        onRunCycle={runCycle}
        onRetrainModel={retrainModel}
        selectedIndex={stats?.selectedIndex || "nifty_50"}
        onSelectIndex={handleSelectIndex}
        loading={loading}
        onNavigateDesktop={() => navigateTo("/")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        stats={stats}
        autoCycle={autoCycle}
        setAutoCycle={setAutoCycle}
        onRunCycle={runCycle}
        onRetrainModel={retrainModel}
        onResetPortfolio={resetPortfolio}
        onDownloadReport={downloadReport}
        onSelectIndex={handleSelectIndex}
        loading={loading}
        onNavigateMobile={() => navigateTo("/mobile")}
      />

      {/* Main Content Area */}
      <main className="max-w-[1850px] mx-auto px-3 sm:px-6 py-3.5 space-y-3.5">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        {activeTab === "my_investments" && (
          <InvestmentDashboard />
        )}

        {activeTab === "micro_delivery_algo" && (
          <MicroDeliveryAlgoTab />
        )}

        {activeTab === "overview" && (
          <OverviewTab stats={stats} equityCurve={equityCurve} watchlist={watchlist} />
        )}

        {activeTab === "positions" && (
          <PositionsTab positions={positions} closedTrades={closedTrades} onRunCycle={runCycle} />
        )}

        {activeTab === "watchlist" && (
          <WatchlistTab
            watchlist={watchlist}
            signals={signals}
            onAddStock={handleAddStock}
            onToggleStock={handleToggleStock}
            onDeleteStock={handleDeleteStock}
          />
        )}

        {activeTab === "quant" && (
          <QuantPipelineTab
            availableIndexes={stats?.availableIndexes || []}
            selectedIndex={stats?.selectedIndex || "nifty_50"}
          />
        )}

        {activeTab === "historical" && (
          <HistoricalTrainingTab
            availableIndexes={stats?.availableIndexes || []}
            selectedIndex={stats?.selectedIndex || "nifty_50"}
            onSelectIndex={handleSelectIndex}
            marketStatusText={stats?.marketStatusText}
            marketOpen={stats?.marketOpen}
          />
        )}

        {activeTab === "paperbot" && (
          <PaperBotTab
            marketStatusText={stats?.marketStatusText}
            marketOpen={stats?.marketOpen}
          />
        )}

        {activeTab === "ml" && (
          <MlStatusTab mlStatus={mlStatus} onRetrainModel={retrainModel} loading={loading} />
        )}

        {activeTab === "logs" && <LogsTab />}

        {activeTab === "config" && (
          <SystemConfigTab
            config={config}
            heartbeats={heartbeats}
            onSaveConfig={handleSaveConfig}
            onHardReset={(capital, hardReset) => resetPortfolio(capital, hardReset)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          My Money Maker — Groww API Paper & Algorithmic Trading Platform • Built for NSE India Market
        </p>
      </footer>
    </div>
  );
}
