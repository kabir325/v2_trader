import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  PieChart as PieIcon,
  Layers,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Briefcase,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  Sun,
  Moon,
  Check,
  FileSpreadsheet,
  Upload,
  Key,
  FileText,
  Link2,
  HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from "recharts";
import {
  InvestmentPortfolioData,
  StockInvestment,
  SipInvestment,
  AccountingSnapshot
} from "../types";

// Zero empty portfolio - No default mock numbers or random values
const EMPTY_PORTFOLIO: InvestmentPortfolioData = {
  stocks: [],
  sips: [],
  accountingHistory: [],
  summary: {
    totalInvested: 0,
    totalCurrentValue: 0,
    totalPnl: 0,
    totalPnlPct: 0,
    dayChangeAmount: 0,
    dayChangePct: 0,
    stocksInvested: 0,
    stocksValue: 0,
    sipInvested: 0,
    sipValue: 0,
    lastAccountingSession: "NONE",
    lastAccountingTimestamp: "None"
  }
};

// Popular Indian NSE stocks quick presets for manual entry
const POPULAR_STOCKS = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", sector: "Energy / Conglomerate", price: 2940 },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", sector: "IT & Technology", price: 4180 },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Banking / Financials", price: 1610 },
  { symbol: "INFY", name: "Infosys Ltd", sector: "IT & Technology", price: 1680 },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", sector: "Automobile", price: 945 },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", sector: "Banking / Financials", price: 1180 },
  { symbol: "ITC", name: "ITC Limited", sector: "FMCG", price: 472 },
  { symbol: "LT", name: "Larsen & Toubro Ltd", sector: "Infrastructure / Capital Goods", price: 3560 }
];

// Popular Mutual Funds quick presets
const POPULAR_FUNDS = [
  { name: "Parag Parikh Flexi Cap Fund - Direct Growth", category: "Flexi Cap", nav: 89.6 },
  { name: "UTI Nifty 50 Index Fund - Direct Growth", category: "Index Fund", nav: 171.4 },
  { name: "Mirae Asset Large Cap Fund - Direct Growth", category: "Large Cap", nav: 112.5 },
  { name: "Nippon India Small Cap Fund - Direct Growth", category: "Equity", nav: 206.8 },
  { name: "HDFC Mid-Cap Opportunities Fund - Direct Growth", category: "Equity", nav: 178.2 }
];

// Safe API fetcher that guarantees never throwing "Unexpected token <"
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
      if (contentType.includes("application/json")) {
        const errJson = await res.json().catch(() => ({}));
        return { data: null, error: errJson.error || `Request failed with status ${res.status}` };
      }
      return { data: null, error: `Server temporarily syncing (HTTP ${res.status}). Refreshing...` };
    }

    if (!contentType.includes("application/json")) {
      return { data: null, error: "Received HTML instead of JSON. Backend may be initializing." };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Network connection error" };
  }
}

export const InvestmentDashboard: React.FC = () => {
  const [portfolio, setPortfolio] = useState<InvestmentPortfolioData>(EMPTY_PORTFOLIO);
  const [loading, setLoading] = useState(false);
  const [ticking, setTicking] = useState(false);
  const [syncingGroww, setSyncingGroww] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "stocks" | "sip" | "accounting">("overview");

  // Filtering & Search
  const [stockSearch, setStockSearch] = useState("");
  const [stockSectorFilter, setStockSectorFilter] = useState("ALL");
  const [sipCategoryFilter, setSipCategoryFilter] = useState("ALL");
  const [accountingFilter, setAccountingFilter] = useState<"ALL" | "MARKET_OPEN" | "MARKET_CLOSE">("ALL");

  // Modal / Form States
  const [showStockModal, setShowStockModal] = useState(false);
  const [showSipModal, setShowSipModal] = useState(false);
  const [showGrowwModal, setShowGrowwModal] = useState(false);
  const [growwModalTab, setGrowwModalTab] = useState<"api" | "csv">("api");
  const [growwTokenInput, setGrowwTokenInput] = useState("");
  const [growwSecretInput, setGrowwSecretInput] = useState("");
  const [growwTotpInput, setGrowwTotpInput] = useState("");
  const [growwStatus, setGrowwStatus] = useState<{ hasToken: boolean; tokenPreview: string; hasSecret: boolean; hasTotp: boolean } | null>(null);
  const [csvTextInput, setCsvTextInput] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [importingCsv, setImportingCsv] = useState(false);
  const [savingGrowwKeys, setSavingGrowwKeys] = useState(false);
  const [testingToken, setTestingToken] = useState(false);
  const [tokenVerifyResult, setTokenVerifyResult] = useState<{ success: boolean; message: string; statusCode?: number } | null>(null);

  // New Stock Form
  const [newStockSymbol, setNewStockSymbol] = useState("");
  const [newStockName, setNewStockName] = useState("");
  const [newStockQty, setNewStockQty] = useState("");
  const [newStockBuyPrice, setNewStockBuyPrice] = useState("");
  const [newStockCurrentPrice, setNewStockCurrentPrice] = useState("");
  const [newStockSector, setNewStockSector] = useState("IT & Technology");

  // New SIP Form
  const [newSipFundName, setNewSipFundName] = useState("");
  const [newSipCategory, setNewSipCategory] = useState<"Flexi Cap" | "Large Cap" | "Index Fund" | "Equity">("Flexi Cap");
  const [newSipFrequency, setNewSipFrequency] = useState<"Monthly" | "Weekly">("Monthly");
  const [newSipAmount, setNewSipAmount] = useState("");
  const [newSipInstallments, setNewSipInstallments] = useState("");
  const [newSipNav, setNewSipNav] = useState("");

  // Live IST Clock calculation
  const [currentTime, setCurrentTime] = useState<string>("");
  const [marketStatus, setMarketStatus] = useState<{ isOpen: boolean; label: string; phase: string }>({
    isOpen: true,
    label: "Live Trading Session",
    phase: "MARKET_OPEN"
  });

  // Update IST clock & market session
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // IST is UTC + 5:30
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istDate = new Date(utc + 3600000 * 5.5);
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const seconds = istDate.getSeconds();

      const timeStr = istDate.toLocaleTimeString("en-IN", { hour12: true });
      setCurrentTime(timeStr);

      // NSE Trading Hours: 9:15 AM (9.25) to 3:30 PM (15.5)
      const decimalTime = hours + minutes / 60;
      const day = istDate.getDay();
      const isWeekend = day === 0 || day === 6;

      if (isWeekend) {
        setMarketStatus({ isOpen: false, label: "Market Closed (Weekend)", phase: "WEEKEND" });
      } else if (decimalTime >= 9.0 && decimalTime < 9.25) {
        setMarketStatus({ isOpen: false, label: "Pre-Open Session (09:00 - 09:15 AM)", phase: "PRE_OPEN" });
      } else if (decimalTime >= 9.25 && decimalTime <= 15.5) {
        setMarketStatus({ isOpen: true, label: "NSE Live Market (09:15 AM - 03:30 PM)", phase: "LIVE" });
      } else {
        setMarketStatus({ isOpen: false, label: "Post-Market / EOD Reconciliation", phase: "POST_MARKET" });
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch portfolio data from backend with safe parsing & retry
  const fetchPortfolio = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    const { data, error: fetchErr } = await safeFetchJson<InvestmentPortfolioData>("/api/investments");

    if (data && data.stocks && data.sips) {
      setPortfolio(data);
      setError(null);
    } else if (fetchErr) {
      if (isInitial) {
        setTimeout(async () => {
          const retryRes = await safeFetchJson<InvestmentPortfolioData>("/api/investments");
          if (retryRes.data && retryRes.data.stocks) {
            setPortfolio(retryRes.data);
            setError(null);
          } else {
            setPortfolio(EMPTY_PORTFOLIO);
          }
        }, 1200);
      } else {
        setPortfolio(EMPTY_PORTFOLIO);
      }
    }
    if (isInitial) setLoading(false);
  }, []);

  const checkGrowwStatus = useCallback(async () => {
    const { data } = await safeFetchJson<{
      success: boolean;
      credentials: any;
      token?: string;
      secret?: string;
      totpKey?: string;
    }>("/api/investments/groww-status");
    if (data && data.credentials) {
      setGrowwStatus(data.credentials);
      if (data.token) {
        setGrowwTokenInput((prev) => prev || data.token || "");
      }
      if (data.secret) {
        setGrowwSecretInput((prev) => prev || data.secret || "");
      }
      if (data.totpKey) {
        setGrowwTotpInput((prev) => prev || data.totpKey || "");
      }
    }
  }, []);

  const handleVerifyToken = async () => {
    const tokenToTest = (growwTokenInput || "").trim();
    if (!tokenToTest) {
      setError("Please enter your Groww API token before verifying.");
      return;
    }
    try {
      setTestingToken(true);
      setTokenVerifyResult(null);
      const { data, error: testErr } = await safeFetchJson<{
        success: boolean;
        message: string;
        statusCode?: number;
        holdingsCount?: number;
      }>("/api/investments/verify-groww-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenToTest,
          secret: growwSecretInput.trim()
        })
      });

      if (testErr) {
        setTokenVerifyResult({
          success: false,
          statusCode: 500,
          message: `Network verification error: ${testErr}`
        });
      } else if (data) {
        setTokenVerifyResult({
          success: data.success,
          statusCode: data.statusCode,
          message: data.message
        });
      }
    } catch (err: any) {
      setTokenVerifyResult({
        success: false,
        statusCode: 500,
        message: err.message || "Failed to test token connection."
      });
    } finally {
      setTestingToken(false);
    }
  };

  const handleLoadSampleCsv = () => {
    const sampleCsv = `Stock Name,Symbol,Qty,Avg Buy Price,LTP,Sector
Reliance Industries Ltd,RELIANCE,25,2850.00,2955.40,Energy & Petrochemicals
Tata Consultancy Services,TCS,15,3850.50,4120.00,IT Services
HDFC Bank Ltd,HDFCBANK,40,1520.00,1645.00,Banking & Finance
Infosys Ltd,INFY,30,1650.00,1825.40,IT Services
ITC Ltd,ITC,100,420.00,492.50,FMCG
Parag Parikh Flexi Cap Fund - Direct,PPFAS,120,65.40,78.20,Flexi Cap`;
    setCsvTextInput(sampleCsv);
    setCsvFileName("groww_sample_holdings.csv");
    setActionSuccess("Sample Groww Holdings statement loaded! Click 'Import Holdings' below.");
    setTimeout(() => setActionSuccess(null), 4000);
  };

  useEffect(() => {
    fetchPortfolio(true);
    checkGrowwStatus();
  }, [fetchPortfolio, checkGrowwStatus]);

  // Sync holdings & SIPs live from Groww
  const syncFromGroww = async (customCreds?: { token?: string; secret?: string; totpKey?: string }) => {
    try {
      setSyncingGroww(true);
      setError(null);
      setActionSuccess(null);

      const options: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      };
      if (customCreds) {
        options.body = JSON.stringify(customCreds);
      }

      const { data, error: fetchErr } = await safeFetchJson<{
        success: boolean;
        message: string;
        stockCount: number;
        sipCount: number;
        portfolio?: InvestmentPortfolioData;
      }>("/api/investments/sync-groww", options);

      if (fetchErr) {
        setError(`Groww Sync: ${fetchErr}`);
        setShowGrowwModal(true);
        setTimeout(() => setError(null), 6000);
        return;
      }

      if (data && data.success && data.portfolio) {
        setPortfolio(data.portfolio);
        setActionSuccess(data.message || `Successfully synced ${data.stockCount || 0} stocks and ${data.sipCount || 0} SIPs from Groww!`);
        setShowGrowwModal(false);
        checkGrowwStatus();
        setTimeout(() => setActionSuccess(null), 5000);
      } else {
        const msg = data?.message || "Groww API token is not configured. Connect your Groww account or import CSV.";
        setError(msg);
        setShowGrowwModal(true);
        setTimeout(() => setError(null), 6000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to communicate with Groww sync service.");
      setShowGrowwModal(true);
      setTimeout(() => setError(null), 5000);
    } finally {
      setSyncingGroww(false);
    }
  };

  // Save Groww Credentials directly
  const handleSaveGrowwCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!growwTokenInput.trim()) return;
    try {
      setSavingGrowwKeys(true);
      const { data, error: saveErr } = await safeFetchJson<{ success: boolean; message: string; credentials: any }>(
        "/api/investments/groww-credentials",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: growwTokenInput.trim(),
            secret: growwSecretInput.trim(),
            totpKey: growwTotpInput.trim()
          })
        }
      );
      if (saveErr) {
        setError(`Failed to save Groww credentials: ${saveErr}`);
        return;
      }
      if (data && data.credentials) {
        setGrowwStatus(data.credentials);
        setActionSuccess("Groww credentials saved! Initiating live portfolio sync...");
        await syncFromGroww({
          token: growwTokenInput.trim(),
          secret: growwSecretInput.trim(),
          totpKey: growwTotpInput.trim()
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to save credentials");
    } finally {
      setSavingGrowwKeys(false);
    }
  };

  // CSV File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvTextInput(text);
      }
    };
    reader.readAsText(file);
  };

  // Import Groww CSV
  const handleImportCsv = async () => {
    if (!csvTextInput.trim()) {
      setError("Please choose a Groww CSV file or paste holdings CSV content.");
      return;
    }
    try {
      setImportingCsv(true);
      setError(null);
      const { data, error: importErr } = await safeFetchJson<{
        success: boolean;
        message: string;
        stockCount: number;
        sipCount: number;
        portfolio?: InvestmentPortfolioData;
      }>("/api/investments/import-groww-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: csvTextInput })
      });

      if (importErr) {
        setError(`CSV Import Error: ${importErr}`);
        return;
      }

      if (data && data.success && data.portfolio) {
        setPortfolio(data.portfolio);
        setActionSuccess(data.message || `Imported ${data.stockCount} stocks and ${data.sipCount} mutual funds from Groww CSV!`);
        setShowGrowwModal(false);
        setCsvTextInput("");
        setCsvFileName("");
        setTimeout(() => setActionSuccess(null), 5000);
      } else {
        setError(data?.message || "Failed to parse Groww CSV.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to process CSV file.");
    } finally {
      setImportingCsv(false);
    }
  };

  // Reset portfolio to pure zero (clear all holdings and accounting)
  const resetPortfolioToZero = async () => {
    if (!window.confirm("Are you sure you want to clear all holdings and reset everything to ₹0?")) return;
    try {
      const res = await fetch("/api/investments/reset", { method: "POST" });
      const data = await res.json();
      if (data && data.portfolio) {
        setPortfolio(data.portfolio);
        setActionSuccess("Portfolio has been reset to ₹0. All holdings cleared.");
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset portfolio.");
      setTimeout(() => setError(null), 4000);
    }
  };

  // Record accounting snapshot for Market Open or Market Close (EOD)
  const recordAccounting = async (sessionType: "MARKET_OPEN" | "MARKET_CLOSE") => {
    try {
      const res = await fetch("/api/investments/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType,
          notes:
            sessionType === "MARKET_OPEN"
              ? "Baseline opening ledger snapshot logged at 09:15 AM."
              : "End-of-Day (03:30 PM) closing accounting audit recorded."
        })
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success && data.portfolio) {
          setPortfolio(data.portfolio);
          setActionSuccess(
            sessionType === "MARKET_OPEN"
              ? "🌅 Market Open (09:15 AM) snapshot successfully recorded in the audit ledger!"
              : "🌇 End of Day (03:30 PM) snapshot successfully audited and saved!"
          );
          setTimeout(() => setActionSuccess(null), 5000);
          return;
        }
      }
      throw new Error("Unable to save accounting record. Please retry.");
    } catch (err: any) {
      setError(err.message || "Failed to record accounting snapshot");
      setTimeout(() => setError(null), 5000);
    }
  };

  // Live Market Price Tick
  const handleTickPrices = async () => {
    if (!portfolio || portfolio.stocks.length === 0) {
      setActionSuccess("No stocks currently in portfolio. Sync from Groww or add a holding to fetch live quotes.");
      setTimeout(() => setActionSuccess(null), 4000);
      return;
    }
    try {
      setTicking(true);
      const res = await fetch("/api/investments/tick", { method: "POST" });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data && data.stocks) {
          setPortfolio(data);
          setActionSuccess("⚡ Live tick: updated holding LTPs with current Groww / NSE market quotes!");
          setTimeout(() => setActionSuccess(null), 3000);
        }
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setTicking(false);
    }
  };

  // Add Stock Investment
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockSymbol || !newStockName || !newStockQty || !newStockBuyPrice) return;

    try {
      const res = await fetch("/api/investments/add-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: newStockSymbol.trim().toUpperCase(),
          name: newStockName.trim(),
          quantity: Number(newStockQty),
          buyPrice: Number(newStockBuyPrice),
          currentPrice: Number(newStockCurrentPrice || newStockBuyPrice),
          sector: newStockSector
        })
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success && data.portfolio) {
          setPortfolio(data.portfolio);
          setShowStockModal(false);
          setNewStockSymbol("");
          setNewStockName("");
          setNewStockQty("");
          setNewStockBuyPrice("");
          setNewStockCurrentPrice("");
          setActionSuccess(`✅ Added ${newStockSymbol.toUpperCase()} holding to portfolio!`);
          setTimeout(() => setActionSuccess(null), 4000);
          return;
        }
      }
      throw new Error("Failed to save stock holding");
    } catch (err: any) {
      setError(err.message || "Failed to add stock");
      setTimeout(() => setError(null), 5000);
    }
  };

  // Delete Stock Investment
  const handleDeleteStock = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your portfolio?`)) return;
    try {
      const res = await fetch(`/api/investments/stock/${id}`, { method: "DELETE" });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success && data.portfolio) {
          setPortfolio(data.portfolio);
          setActionSuccess(`Removed ${name} from portfolio`);
          setTimeout(() => setActionSuccess(null), 3000);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete stock");
      setTimeout(() => setError(null), 4000);
    }
  };

  // Add SIP Investment
  const handleAddSip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSipFundName || !newSipAmount) return;

    try {
      const installments = Number(newSipInstallments || 1);
      const nav = Number(newSipNav || 100);
      const totalAmount = Number(newSipAmount) * installments;
      const units = totalAmount / nav;

      const res = await fetch("/api/investments/add-sip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundName: newSipFundName.trim(),
          category: newSipCategory,
          frequency: newSipFrequency,
          installmentAmount: Number(newSipAmount),
          totalInstallments: installments,
          units,
          avgNav: nav,
          currentNav: nav
        })
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success && data.portfolio) {
          setPortfolio(data.portfolio);
          setShowSipModal(false);
          setNewSipFundName("");
          setNewSipAmount("");
          setNewSipInstallments("");
          setNewSipNav("");
          setActionSuccess(`✅ Registered SIP in ${newSipFundName}!`);
          setTimeout(() => setActionSuccess(null), 4000);
          return;
        }
      }
      throw new Error("Failed to register SIP");
    } catch (err: any) {
      setError(err.message || "Failed to add SIP");
      setTimeout(() => setError(null), 5000);
    }
  };

  // Delete SIP Investment
  const handleDeleteSip = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove SIP: ${name}?`)) return;
    try {
      const res = await fetch(`/api/investments/sip/${id}`, { method: "DELETE" });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success && data.portfolio) {
          setPortfolio(data.portfolio);
          setActionSuccess(`Removed ${name} from SIP investments`);
          setTimeout(() => setActionSuccess(null), 3000);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete SIP");
      setTimeout(() => setError(null), 4000);
    }
  };

  // Helper to prefill popular stock in modal
  const handleQuickSelectStock = (stk: typeof POPULAR_STOCKS[0]) => {
    setNewStockSymbol(stk.symbol);
    setNewStockName(stk.name);
    setNewStockSector(stk.sector);
    setNewStockBuyPrice(stk.price.toString());
    setNewStockCurrentPrice(stk.price.toString());
    if (!newStockQty) setNewStockQty("25");
  };

  // Helper to prefill popular fund in modal
  const handleQuickSelectFund = (f: typeof POPULAR_FUNDS[0]) => {
    setNewSipFundName(f.name);
    setNewSipCategory(f.category as any);
    setNewSipNav(f.nav.toString());
    if (!newSipAmount) setNewSipAmount("5000");
    if (!newSipInstallments) setNewSipInstallments("6");
  };

  const summary = portfolio?.summary || EMPTY_PORTFOLIO.summary;

  // Chart data for historical accounting snapshots
  const chartData = useMemo(() => {
    const list = portfolio?.accountingHistory || [];
    return list.map((snap) => ({
      label: `${snap.date.slice(5)} ${snap.sessionType === "MARKET_OPEN" ? "Open" : "EOD"}`,
      fullDate: `${snap.date} ${snap.time}`,
      invested: snap.totalInvested,
      value: snap.totalCurrentValue,
      pnl: snap.totalPnl,
      dayDelta: snap.dayChangeAmount
    }));
  }, [portfolio?.accountingHistory]);

  const allocationData = useMemo(() => [
    { name: "Direct Stocks", value: summary.stocksValue, color: "#6366f1" },
    { name: "Mutual Fund SIPs", value: summary.sipValue, color: "#14b8a6" }
  ], [summary.stocksValue, summary.sipValue]);

  // Filtered stocks
  const filteredStocks = useMemo(() => {
    return (portfolio?.stocks || []).filter((s) => {
      const matchSearch =
        s.symbol.toLowerCase().includes(stockSearch.toLowerCase()) ||
        s.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
        s.sector.toLowerCase().includes(stockSearch.toLowerCase());
      const matchSector = stockSectorFilter === "ALL" || s.sector === stockSectorFilter;
      return matchSearch && matchSector;
    });
  }, [portfolio?.stocks, stockSearch, stockSectorFilter]);

  // Distinct sectors
  const distinctSectors = useMemo(() => {
    const set = new Set<string>();
    (portfolio?.stocks || []).forEach((s) => set.add(s.sector));
    return Array.from(set);
  }, [portfolio?.stocks]);

  // Filtered SIPs
  const filteredSips = useMemo(() => {
    return (portfolio?.sips || []).filter((sip) => {
      return sipCategoryFilter === "ALL" || sip.category === sipCategoryFilter;
    });
  }, [portfolio?.sips, sipCategoryFilter]);

  // Filtered Accounting History
  const filteredAccounting = useMemo(() => {
    const history = portfolio?.accountingHistory || [];
    if (accountingFilter === "ALL") return history;
    return history.filter((h) => h.sessionType === accountingFilter);
  }, [portfolio?.accountingHistory, accountingFilter]);

  // Check if today's snapshots are recorded
  const todayStr = new Date().toISOString().slice(0, 10);
  const isMorningRecordedToday = (portfolio?.accountingHistory || []).some(
    (snap) => snap.date === todayStr && snap.sessionType === "MARKET_OPEN"
  );
  const isEodRecordedToday = (portfolio?.accountingHistory || []).some(
    (snap) => snap.date === todayStr && snap.sessionType === "MARKET_CLOSE"
  );

  return (
    <div className="space-y-5">
      {/* Dynamic Toast / Status Notifications */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center justify-between shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white text-xs px-2 py-0.5">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white text-xs px-2 py-0.5">
            ✕
          </button>
        </div>
      )}

      {/* TOP HERO: Executive Portfolio & Accounting Control Center */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-48 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left Title & Status Badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                Personal Stocks & SIP Investment Ledger
              </span>

              {/* Live Market Session Pill */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  marketStatus.isOpen
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                {marketStatus.label}
              </span>

              {/* Live IST Clock */}
              {currentTime && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 text-xs font-mono border border-slate-700">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {currentTime} IST
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              My Stocks & SIP Portfolio Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Automated portfolio valuation ledger recording dual daily snapshots at{" "}
              <strong className="text-indigo-300 font-semibold">Market Opening (09:15 AM)</strong> and{" "}
              <strong className="text-teal-300 font-semibold">End of Day (03:30 PM)</strong> for precise capital gains and audit tracking.
            </p>
          </div>

          {/* Right Action Controls: 09:15 AM & 03:30 PM Accounting Buttons & Groww Sync */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Sync from Groww API */}
            <button
              onClick={() => syncFromGroww()}
              disabled={syncingGroww}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
              title="Fetch real portfolio holdings and active SIPs directly from Groww API"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-white ${syncingGroww ? "animate-spin" : ""}`} />
              <span>{syncingGroww ? "Syncing Groww..." : "Sync from Groww"}</span>
            </button>

            {/* Connect Groww / CSV Modal Trigger */}
            <button
              onClick={() => setShowGrowwModal(true)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                growwStatus?.hasToken
                  ? "bg-slate-800/90 hover:bg-slate-700/90 text-emerald-300 border-emerald-500/40"
                  : "bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border-amber-500/40"
              }`}
              title="Configure Groww API credentials or import Groww CSV file"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{growwStatus?.hasToken ? "Groww Linked" : "Connect / CSV"}</span>
            </button>

            {/* Record Market Open Button */}
            <button
              onClick={() => recordAccounting("MARKET_OPEN")}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                isMorningRecordedToday
                  ? "bg-indigo-950/70 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-900/60"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 ring-2 ring-indigo-400/20"
              }`}
              title="Record portfolio accounting baseline at Market Open (09:15 AM)"
            >
              <Sun className="w-4 h-4 text-amber-300" />
              <span>Record Open (09:15 AM)</span>
              {isMorningRecordedToday && <Check className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />}
            </button>

            {/* Record End of Day Button */}
            <button
              onClick={() => recordAccounting("MARKET_CLOSE")}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                isEodRecordedToday
                  ? "bg-teal-950/70 text-teal-300 border border-teal-500/40 hover:bg-teal-900/60"
                  : "bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/30 ring-2 ring-teal-400/20"
              }`}
              title="Record portfolio accounting ledger at End of Day (03:30 PM)"
            >
              <Moon className="w-4 h-4 text-teal-200" />
              <span>Record EOD (03:30 PM)</span>
              {isEodRecordedToday && <Check className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />}
            </button>

            {/* Live Price Tick */}
            <button
              onClick={handleTickPrices}
              disabled={ticking}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Fetch live quotes from Groww / NSE on all portfolio holdings"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${ticking ? "animate-spin" : ""}`} />
              <span>Live Tick</span>
            </button>

            {/* Clear / Reset to 0 */}
            <button
              onClick={resetPortfolioToZero}
              className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 text-xs font-medium border border-slate-700 hover:border-rose-700/50 transition-all cursor-pointer"
              title="Clear all holdings and reset portfolio values to 0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset / 0</span>
            </button>

            {/* Export CSV */}
            <a
              href="/api/investments/export-csv"
              download="portfolio_accounting_ledger.csv"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title="Download entire accounting ledger as CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Audit Status Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Audit Status:
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-white">
              {summary.lastAccountingSession === "MARKET_OPEN" && "🌅 Market Opening Snapshot Recorded"}
              {summary.lastAccountingSession === "MARKET_CLOSE" && "🌇 End of Day (03:30 PM) Snapshot Audited"}
              {summary.lastAccountingSession === "NONE" && "Initial Baseline Active"}
            </span>
            <span className="text-slate-500 font-mono text-[11px]">({summary.lastAccountingTimestamp})</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>
              Audit History: <strong className="text-white font-mono">{portfolio?.accountingHistory.length || 0}</strong> snapshots
            </span>
            <span>
              Direct Equities: <strong className="text-indigo-400 font-mono">{portfolio?.stocks.length || 0}</strong>
            </span>
            <span>
              Active SIPs: <strong className="text-teal-400 font-mono">{portfolio?.sips.length || 0}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 4 PRIMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Worth */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Net Worth</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-teal-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{summary.totalCurrentValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Stocks: ₹{summary.stocksValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            <span>SIPs: ₹{summary.sipValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Total Invested Capital */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invested</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{summary.totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span>Equity: ₹{summary.stocksInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
            <span>SIP Book: ₹{summary.sipInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Overall Return / P&L */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Return / P&L</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                summary.totalPnl >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              {summary.totalPnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${summary.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {summary.totalPnl >= 0 ? "+" : ""}₹{summary.totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs pt-2 border-t border-slate-800/60">
            <span
              className={`px-1.5 py-0.5 rounded font-bold ${
                summary.totalPnl >= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
              }`}
            >
              {summary.totalPnlPct >= 0 ? "+" : ""}{summary.totalPnlPct}% ROI
            </span>
            <span className="text-slate-400">across all holdings</span>
          </div>
        </div>

        {/* Today's Day Movement vs Snapshot */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Day Change Movement</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                summary.dayChangeAmount >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              {summary.dayChangeAmount >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${summary.dayChangeAmount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {summary.dayChangeAmount >= 0 ? "+" : ""}₹{summary.dayChangeAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs pt-2 border-t border-slate-800/60">
            <span
              className={`px-1.5 py-0.5 rounded font-bold ${
                summary.dayChangePct >= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
              }`}
            >
              {summary.dayChangePct >= 0 ? "+" : ""}{summary.dayChangePct}%
            </span>
            <span className="text-slate-400">vs Last Accounting Checkpoint</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Portfolio Overview & Visual Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab("stocks")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "stocks"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Direct Stocks ({portfolio?.stocks.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("sip")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "sip"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Mutual Fund SIPs ({portfolio?.sips.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("accounting")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "accounting"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Daily Accounting Audit Ledger ({portfolio?.accountingHistory.length || 0})</span>
          </button>
        </div>

        {/* Quick Add Buttons based on active tab */}
        <div className="flex items-center gap-2">
          {activeTab === "stocks" && (
            <button
              onClick={() => setShowStockModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stock Holding</span>
            </button>
          )}

          {activeTab === "sip" && (
            <button
              onClick={() => setShowSipModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Mutual Fund SIP</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & VISUAL ANALYTICS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Charts Row: Historical Growth + Asset Allocation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Historical Growth Chart */}
            <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    Market Open & EOD Valuation Curve
                  </h3>
                  <p className="text-xs text-slate-400">Tracking Total Net Worth vs Invested Capital across daily checkpoints</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-slate-800 text-indigo-300 px-2.5 py-1 rounded-full font-mono border border-slate-700">
                    {chartData.length} Snapshots Plotted
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "10px",
                          fontSize: "12px",
                          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)"
                        }}
                        formatter={(value: any, name: any) => [
                          `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
                          name
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#14b8a6"
                        strokeWidth={2.5}
                        name="Total Portfolio Value"
                        dot={{ fill: "#14b8a6", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="invested"
                        stroke="#6366f1"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        name="Invested Capital"
                        dot={{ fill: "#6366f1", r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    Record your first Market Open or EOD snapshot to plot the growth curve!
                  </div>
                )}
              </div>
            </div>

            {/* Asset Allocation Donut */}
            <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <PieIcon className="w-4 h-4 text-teal-400" />
                  Asset Allocation
                </h3>
                <p className="text-xs text-slate-400">Direct Equities vs Systematic Mutual Funds</p>
              </div>

              <div className="h-44 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "12px"
                      }}
                      formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2.5 border-t border-slate-800 pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-slate-300 font-medium">Direct Stocks</span>
                  </div>
                  <span className="font-semibold text-white">
                    {summary.totalCurrentValue > 0 ? Math.round((summary.stocksValue / summary.totalCurrentValue) * 100) : 0}%
                    <span className="text-slate-400 font-normal ml-1.5">(₹{summary.stocksValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })})</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span className="text-slate-300 font-medium">Mutual Fund SIPs</span>
                  </div>
                  <span className="font-semibold text-white">
                    {summary.totalCurrentValue > 0 ? Math.round((summary.sipValue / summary.totalCurrentValue) * 100) : 0}%
                    <span className="text-slate-400 font-normal ml-1.5">(₹{summary.sipValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Snapshot Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Recent Accounting Ledger Entries
              </h3>
              <button
                onClick={() => setActiveTab("accounting")}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                View Full Audit Log ({portfolio?.accountingHistory.length || 0}) →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Session</th>
                    <th className="py-2.5 px-3">Invested Capital</th>
                    <th className="py-2.5 px-3">Net Worth</th>
                    <th className="py-2.5 px-3">Day Change</th>
                    <th className="py-2.5 px-3">Total P&L</th>
                    <th className="py-2.5 px-3">Audit Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {(portfolio?.accountingHistory || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-sans text-xs">
                        No accounting snapshots recorded yet. Use the buttons above to record Market Open (09:15 AM) or EOD (03:30 PM).
                      </td>
                    </tr>
                  ) : (
                    (portfolio?.accountingHistory || []).slice(-5).reverse().map((snap) => (
                      <tr key={snap.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap text-white font-medium">
                          {snap.date} <span className="text-slate-500">{snap.time}</span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              snap.sessionType === "MARKET_OPEN"
                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                            }`}
                          >
                            {snap.sessionType === "MARKET_OPEN" ? "🌅 Market Open (09:15)" : "🌇 End of Day (15:30)"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">₹{snap.totalInvested.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-bold text-white">₹{snap.totalCurrentValue.toLocaleString("en-IN")}</td>
                        <td className={`py-2.5 px-3 whitespace-nowrap font-semibold ${snap.dayChangeAmount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {snap.dayChangeAmount >= 0 ? "+" : ""}₹{snap.dayChangeAmount.toLocaleString("en-IN")} ({snap.dayChangePct}%)
                        </td>
                        <td className={`py-2.5 px-3 whitespace-nowrap font-bold ${snap.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {snap.totalPnl >= 0 ? "+" : ""}₹{snap.totalPnl.toLocaleString("en-IN")} ({snap.totalPnlPct}%)
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-sans truncate max-w-xs">{snap.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIRECT STOCKS */}
      {activeTab === "stocks" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Direct Stock Holdings ({portfolio?.stocks.length || 0})
              </h3>
              <p className="text-xs text-slate-400">Equity delivery holdings with live market price tracking</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search symbol or name..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500 w-48"
                />
              </div>

              {/* Sector filter */}
              <select
                value={stockSectorFilter}
                onChange={(e) => setStockSectorFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="ALL">All Sectors</option>
                {distinctSectors.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowStockModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stock</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3">Stock & Sector</th>
                  <th className="py-3 px-3">Qty</th>
                  <th className="py-3 px-3">Avg Buy Price</th>
                  <th className="py-3 px-3">Current LTP</th>
                  <th className="py-3 px-3">Invested</th>
                  <th className="py-3 px-3">Current Value</th>
                  <th className="py-3 px-3">Unrealized P&L</th>
                  <th className="py-3 px-3">Day Change</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 font-sans">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Briefcase className="w-8 h-8 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-300">No stock holdings loaded</span>
                        <span className="text-xs text-slate-500 max-w-sm">
                          Portfolio has 0 stocks. Click &quot;Sync from Groww&quot; to fetch your real holdings or &quot;Add Stock&quot; to record a holding manually.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stk) => (
                    <tr key={stk.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap font-sans">
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          <span>{stk.symbol}</span>
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {stk.sector}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{stk.name}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-200">{stk.quantity}</td>
                      <td className="py-3 px-3 whitespace-nowrap">₹{stk.buyPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{stk.currentPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 whitespace-nowrap">₹{stk.investedAmount.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{stk.currentValue.toLocaleString("en-IN")}</td>
                      <td className={`py-3 px-3 whitespace-nowrap font-bold ${stk.unrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {stk.unrealizedPnl >= 0 ? "+" : ""}₹{stk.unrealizedPnl.toLocaleString("en-IN")} ({stk.unrealizedPnlPct}%)
                      </td>
                      <td className={`py-3 px-3 whitespace-nowrap font-semibold ${stk.dayChangePct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {stk.dayChangePct >= 0 ? "+" : ""}{stk.dayChangePct}%
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right font-sans">
                        <button
                          onClick={() => handleDeleteStock(stk.id, stk.symbol)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer rounded-lg hover:bg-slate-800"
                          title="Remove stock from portfolio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MUTUAL FUND SIPS */}
      {activeTab === "sip" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-teal-400" />
                Mutual Fund Systematic Investment Plans (SIP)
              </h3>
              <p className="text-xs text-slate-400">Regular compounding SIPs with units and NAV audit tracking</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sipCategoryFilter}
                onChange={(e) => setSipCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-hidden focus:border-teal-500"
              >
                <option value="ALL">All Categories</option>
                <option value="Flexi Cap">Flexi Cap</option>
                <option value="Index Fund">Index Fund</option>
                <option value="Large Cap">Large Cap</option>
                <option value="Equity">Equity</option>
              </select>

              <button
                onClick={() => setShowSipModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New SIP</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3">Fund Name & Category</th>
                  <th className="py-3 px-3">Frequency</th>
                  <th className="py-3 px-3">Installment</th>
                  <th className="py-3 px-3">Installments</th>
                  <th className="py-3 px-3">Invested Capital</th>
                  <th className="py-3 px-3">Units</th>
                  <th className="py-3 px-3">Current NAV</th>
                  <th className="py-3 px-3">Current Value</th>
                  <th className="py-3 px-3">Total Return</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredSips.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400 font-sans">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <PiggyBank className="w-8 h-8 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-300">No SIP investments loaded</span>
                        <span className="text-xs text-slate-500 max-w-sm">
                          SIP book is currently ₹0. Click &quot;Sync from Groww&quot; to fetch active mutual funds or &quot;Add New SIP&quot; to log an installment plan.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSips.map((sip) => (
                    <tr key={sip.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap font-sans">
                        <div className="font-bold text-white text-xs">{sip.fundName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="text-teal-400 font-medium">{sip.category}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">{sip.status}</span>
                          {sip.nextSipDate && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500 font-mono">Next: {sip.nextSipDate}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-sans text-slate-300">{sip.frequency}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{sip.installmentAmount.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-300">{sip.totalInstallments} debits</td>
                      <td className="py-3 px-3 whitespace-nowrap">₹{sip.investedAmount.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 whitespace-nowrap">{sip.units.toFixed(2)}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{sip.currentNav.toFixed(2)}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{sip.currentValue.toLocaleString("en-IN")}</td>
                      <td className={`py-3 px-3 whitespace-nowrap font-bold ${sip.unrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {sip.unrealizedPnl >= 0 ? "+" : ""}₹{sip.unrealizedPnl.toLocaleString("en-IN")} ({sip.unrealizedPnlPct}%)
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right font-sans">
                        <button
                          onClick={() => handleDeleteSip(sip.id, sip.fundName)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer rounded-lg hover:bg-slate-800"
                          title="Remove SIP"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DAILY ACCOUNTING AUDIT LEDGER */}
      {activeTab === "accounting" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Permanent Daily Accounting Audit Ledger
              </h3>
              <p className="text-xs text-slate-400">
                Immutable daily portfolio checkpoints recorded at Market Open (09:15 AM) and End of Day (03:30 PM)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={accountingFilter}
                onChange={(e: any) => setAccountingFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="ALL">All Checkpoints</option>
                <option value="MARKET_OPEN">🌅 Market Open (09:15 AM)</option>
                <option value="MARKET_CLOSE">🌇 End of Day (03:30 PM)</option>
              </select>

              <button
                onClick={() => recordAccounting("MARKET_OPEN")}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                + Record 09:15 AM Open
              </button>

              <button
                onClick={() => recordAccounting("MARKET_CLOSE")}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 cursor-pointer"
              >
                + Record 03:30 PM EOD
              </button>

              <a
                href="/api/investments/export-csv"
                download="portfolio_accounting_ledger.csv"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export CSV</span>
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Session Type</th>
                  <th className="py-3 px-3">Stocks Invested</th>
                  <th className="py-3 px-3">SIP Invested</th>
                  <th className="py-3 px-3">Total Invested</th>
                  <th className="py-3 px-3">Current Net Worth</th>
                  <th className="py-3 px-3">Day Change</th>
                  <th className="py-3 px-3">Total P&L</th>
                  <th className="py-3 px-3">Audit Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredAccounting.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400 font-sans">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Clock className="w-8 h-8 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-300">No daily accounting audit entries</span>
                        <span className="text-xs text-slate-500 max-w-sm">
                          Record your first Market Open (09:15 AM) or End of Day (03:30 PM) checkpoint to begin building your audit ledger.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAccounting.slice().reverse().map((snap) => (
                    <tr key={snap.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap text-white font-bold">{snap.date}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-400">{snap.time}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-sans">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            snap.sessionType === "MARKET_OPEN"
                              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                              : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                          }`}
                        >
                          {snap.sessionType === "MARKET_OPEN" ? "🌅 Market Open (09:15)" : "🌇 End of Day (15:30)"}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">₹{snap.stocksInvested.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 whitespace-nowrap">₹{snap.sipInvested.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{snap.totalInvested.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{snap.totalCurrentValue.toLocaleString("en-IN")}</td>
                      <td className={`py-3 px-3 whitespace-nowrap font-semibold ${snap.dayChangeAmount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {snap.dayChangeAmount >= 0 ? "+" : ""}₹{snap.dayChangeAmount.toLocaleString("en-IN")} ({snap.dayChangePct}%)
                      </td>
                      <td className={`py-3 px-3 whitespace-nowrap font-bold ${snap.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {snap.totalPnl >= 0 ? "+" : ""}₹{snap.totalPnl.toLocaleString("en-IN")} ({snap.totalPnlPct}%)
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-400 max-w-sm truncate">{snap.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD STOCK INVESTMENT */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Add Direct Stock Holding
              </h3>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {/* Quick-fill popular suggestions */}
            <div>
              <label className="block text-slate-400 font-medium text-xs mb-1.5">Quick Pick NSE Bluechip:</label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_STOCKS.slice(0, 5).map((stk) => (
                  <button
                    key={stk.symbol}
                    type="button"
                    onClick={() => handleQuickSelectStock(stk)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-indigo-300 border border-slate-700 cursor-pointer"
                  >
                    +{stk.symbol}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddStock} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Stock Ticker Symbol (NSE)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBIN, TCS, RELIANCE"
                  value={newStockSymbol}
                  onChange={(e) => setNewStockSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Bank of India"
                  value={newStockName}
                  onChange={(e) => setNewStockName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 25"
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Avg Buy Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    placeholder="e.g. 780.50"
                    value={newStockBuyPrice}
                    onChange={(e) => setNewStockBuyPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Current LTP (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="Defaults to buy price"
                    value={newStockCurrentPrice}
                    onChange={(e) => setNewStockCurrentPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Sector</label>
                  <input
                    type="text"
                    value={newStockSector}
                    onChange={(e) => setNewStockSector(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Save Stock Holding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SIP INVESTMENT */}
      {showSipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-teal-400" />
                Add Mutual Fund SIP
              </h3>
              <button onClick={() => setShowSipModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {/* Quick-fill popular funds */}
            <div>
              <label className="block text-slate-400 font-medium text-xs mb-1.5">Quick Pick Top Mutual Fund:</label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_FUNDS.slice(0, 3).map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => handleQuickSelectFund(f)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-teal-300 border border-slate-700 cursor-pointer truncate max-w-[170px]"
                  >
                    +{f.name.split(" - ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddSip} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Fund Scheme Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Top 100 Fund - Direct Growth"
                  value={newSipFundName}
                  onChange={(e) => setNewSipFundName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={newSipCategory}
                    onChange={(e: any) => setNewSipCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-teal-500 focus:outline-hidden"
                  >
                    <option value="Flexi Cap">Flexi Cap</option>
                    <option value="Large Cap">Large Cap</option>
                    <option value="Index Fund">Index Fund</option>
                    <option value="Equity">Equity Small/Mid Cap</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Frequency</label>
                  <select
                    value={newSipFrequency}
                    onChange={(e: any) => setNewSipFrequency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-teal-500 focus:outline-hidden"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Installment Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={newSipAmount}
                    onChange={(e) => setNewSipAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Total Debits Completed</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 12"
                    value={newSipInstallments}
                    onChange={(e) => setNewSipInstallments(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Current NAV (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 125.40"
                  value={newSipNav}
                  onChange={(e) => setNewSipNav(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSipModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  Save SIP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: GROWW API & CSV IMPORT */}
      {showGrowwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Groww Integration & Portfolio Sync
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sync directly from Groww API or import your exported Holdings CSV
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGrowwModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Status Banner */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    growwStatus?.hasToken ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span className="text-slate-300 font-medium">Status:</span>
                <span className={growwStatus?.hasToken ? "text-emerald-300 font-semibold" : "text-amber-300 font-semibold"}>
                  {growwStatus?.hasToken ? "API Token Configured" : "No API Token Set"}
                </span>
              </div>
              {growwStatus?.tokenPreview && (
                <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {growwStatus.tokenPreview}
                </span>
              )}
            </div>

            {/* Tabs: Direct API vs CSV Import */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setGrowwModalTab("api")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  growwModalTab === "api"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Groww API Token</span>
              </button>
              <button
                type="button"
                onClick={() => setGrowwModalTab("csv")}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  growwModalTab === "csv"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Import Groww CSV</span>
              </button>
            </div>

            {/* TAB 1: GROWW API KEY */}
            {growwModalTab === "api" && (
              <form onSubmit={handleSaveGrowwCredentials} className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-medium">
                      Groww API Token / Bearer Token <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Required</span>
                  </div>
                  <input
                    type="password"
                    placeholder="Enter your Groww Bearer token or API key"
                    value={growwTokenInput}
                    onChange={(e) => setGrowwTokenInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Get from Groww Developer API or your active Groww web session header.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">API Secret (Optional)</label>
                    <input
                      type="password"
                      placeholder="App Secret"
                      value={growwSecretInput}
                      onChange={(e) => setGrowwSecretInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">TOTP Key (Optional)</label>
                    <input
                      type="password"
                      placeholder="2FA TOTP Secret"
                      value={growwTotpInput}
                      onChange={(e) => setGrowwTotpInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Token Verification Card */}
                {tokenVerifyResult && (
                  <div
                    className={`p-3 rounded-xl border text-[11px] space-y-1 ${
                      tokenVerifyResult.success
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                        : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between">
                      <span>{tokenVerifyResult.success ? "✓ Token Verified" : "✕ Verification Failed"}</span>
                      {tokenVerifyResult.statusCode && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40">
                          HTTP {tokenVerifyResult.statusCode}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300">{tokenVerifyResult.message}</p>
                  </div>
                )}

                <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Don't have a Groww API Token?</span>
                  </div>
                  <p className="text-slate-400">
                    Switch to the <strong>"Import Groww CSV"</strong> tab to upload your holdings file in 5 seconds without needing developer keys!
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleVerifyToken}
                      disabled={testingToken || !growwTokenInput.trim()}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer disabled:opacity-40 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${testingToken ? "animate-spin" : ""}`} />
                      <span>{testingToken ? "Verifying..." : "Test Connection"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => syncFromGroww()}
                      disabled={syncingGroww || !growwStatus?.hasToken}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer disabled:opacity-40"
                    >
                      {syncingGroww ? "Syncing..." : "Sync Token"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGrowwModal(false)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingGrowwKeys || !growwTokenInput.trim()}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-40"
                    >
                      {savingGrowwKeys ? "Saving & Syncing..." : "Save & Sync Now"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: GROWW CSV IMPORT */}
            {growwModalTab === "csv" && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-emerald-300">
                    <div className="flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>How to get your Groww Holdings CSV:</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadSampleCsv}
                      className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 cursor-pointer font-normal"
                    >
                      + Load Sample CSV
                    </button>
                  </div>
                  <ol className="list-decimal list-inside text-slate-400 space-y-0.5 pl-1">
                    <li>Log into Groww (Web or App).</li>
                    <li>Go to <strong>Profile → Reports → Stocks → Holdings</strong>.</li>
                    <li>Click <strong>Download CSV</strong> and upload it below.</li>
                  </ol>
                </div>

                {/* File Drop / Select Area */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Choose CSV File:</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-4 cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-300 font-medium">
                      {csvFileName || "Click to browse or drop Groww Holdings CSV"}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Supports .csv files</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct Paste Fallback */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Or paste raw CSV text:
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Stock Name,Symbol,Qty,Avg Buy Price,LTP&#10;Tata Consultancy Services,TCS,15,3850.50,3920.00"
                    value={csvTextInput}
                    onChange={(e) => setCsvTextInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-[11px] focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowGrowwModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImportCsv}
                    disabled={importingCsv || !csvTextInput.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{importingCsv ? "Importing..." : "Import Holdings to Portfolio"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
