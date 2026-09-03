import fs from "fs";
import path from "path";
import {
  StockInvestment,
  SipInvestment,
  AccountingSnapshot,
  InvestmentPortfolioData
} from "../types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const PORTFOLIO_FILE = path.join(DATA_DIR, "user_investments.json");

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial realistic default portfolio
function getInitialPortfolio(): { stocks: StockInvestment[]; sips: SipInvestment[]; accountingHistory: AccountingSnapshot[] } {
  const stocks: StockInvestment[] = [
    {
      id: "stk-1",
      symbol: "TATAMOTORS",
      name: "Tata Motors Ltd",
      quantity: 50,
      buyPrice: 820.0,
      currentPrice: 945.5,
      investedAmount: 41000.0,
      currentValue: 47275.0,
      unrealizedPnl: 6275.0,
      unrealizedPnlPct: 15.3,
      dayChangePct: 1.45,
      sector: "Automobile",
      purchaseDate: "2024-03-15",
    },
    {
      id: "stk-2",
      symbol: "INFY",
      name: "Infosys Ltd",
      quantity: 35,
      buyPrice: 1520.0,
      currentPrice: 1680.0,
      investedAmount: 53200.0,
      currentValue: 58800.0,
      unrealizedPnl: 5600.0,
      unrealizedPnlPct: 10.53,
      dayChangePct: 0.85,
      sector: "IT & Technology",
      purchaseDate: "2024-04-10",
    },
    {
      id: "stk-3",
      symbol: "RELIANCE",
      name: "Reliance Industries Ltd",
      quantity: 20,
      buyPrice: 2780.0,
      currentPrice: 2940.0,
      investedAmount: 55600.0,
      currentValue: 58800.0,
      unrealizedPnl: 3200.0,
      unrealizedPnlPct: 5.76,
      dayChangePct: -0.4,
      sector: "Energy / Conglomerate",
      purchaseDate: "2024-05-02",
    },
    {
      id: "stk-4",
      symbol: "ITC",
      name: "ITC Limited",
      quantity: 100,
      buyPrice: 410.0,
      currentPrice: 472.0,
      investedAmount: 41000.0,
      currentValue: 47200.0,
      unrealizedPnl: 6200.0,
      unrealizedPnlPct: 15.12,
      dayChangePct: 0.65,
      sector: "FMCG",
      purchaseDate: "2024-02-18",
    },
    {
      id: "stk-5",
      symbol: "HDFCBANK",
      name: "HDFC Bank Ltd",
      quantity: 40,
      buyPrice: 1480.0,
      currentPrice: 1610.0,
      investedAmount: 59200.0,
      currentValue: 64400.0,
      unrealizedPnl: 5200.0,
      unrealizedPnlPct: 8.78,
      dayChangePct: 1.1,
      sector: "Banking / Financials",
      purchaseDate: "2024-03-22",
    }
  ];

  const sips: SipInvestment[] = [
    {
      id: "sip-1",
      fundName: "Parag Parikh Flexi Cap Fund - Direct Growth",
      category: "Flexi Cap",
      frequency: "Monthly",
      installmentAmount: 5000,
      totalInstallments: 14,
      investedAmount: 70000,
      units: 945.32,
      avgNav: 74.05,
      currentNav: 89.60,
      currentValue: 84700.67,
      unrealizedPnl: 14700.67,
      unrealizedPnlPct: 21.0,
      dayChangePct: 0.72,
      nextSipDate: "2026-09-10",
      startDate: "2025-07-10",
      status: "ACTIVE"
    },
    {
      id: "sip-2",
      fundName: "UTI Nifty 50 Index Fund - Direct Growth",
      category: "Index Fund",
      frequency: "Monthly",
      installmentAmount: 4000,
      totalInstallments: 12,
      investedAmount: 48000,
      units: 320.15,
      avgNav: 149.93,
      currentNav: 171.40,
      currentValue: 54873.71,
      unrealizedPnl: 6873.71,
      unrealizedPnlPct: 14.32,
      dayChangePct: 0.55,
      nextSipDate: "2026-09-15",
      startDate: "2025-09-15",
      status: "ACTIVE"
    },
    {
      id: "sip-3",
      fundName: "Nippon India Small Cap Fund - Direct Growth",
      category: "Equity",
      frequency: "Monthly",
      installmentAmount: 3000,
      totalInstallments: 10,
      investedAmount: 30000,
      units: 182.4,
      avgNav: 164.47,
      currentNav: 206.80,
      currentValue: 37720.32,
      unrealizedPnl: 7720.32,
      unrealizedPnlPct: 25.73,
      dayChangePct: 1.15,
      nextSipDate: "2026-09-05",
      startDate: "2025-11-05",
      status: "ACTIVE"
    }
  ];

  // Past daily snapshots accounting for market open & market close
  const accountingHistory: AccountingSnapshot[] = [
    {
      id: "snap-1",
      date: "2026-09-01",
      time: "09:15:00",
      sessionType: "MARKET_OPEN",
      label: "Market Opening (09:15 AM)",
      totalInvested: 398000,
      stocksInvested: 250000,
      sipInvested: 148000,
      totalCurrentValue: 436200,
      stocksCurrentValue: 268000,
      sipCurrentValue: 168200,
      totalPnl: 38200,
      totalPnlPct: 9.60,
      dayChangeAmount: 0,
      dayChangePct: 0,
      notes: "Month beginning market opening baseline check."
    },
    {
      id: "snap-2",
      date: "2026-09-01",
      time: "15:30:00",
      sessionType: "MARKET_CLOSE",
      label: "End of Day (03:30 PM)",
      totalInvested: 398000,
      stocksInvested: 250000,
      sipInvested: 148000,
      totalCurrentValue: 439800,
      stocksCurrentValue: 270500,
      sipCurrentValue: 169300,
      totalPnl: 41800,
      totalPnlPct: 10.50,
      dayChangeAmount: 3600,
      dayChangePct: 0.83,
      notes: "Positive market closing driven by Auto & IT rally."
    },
    {
      id: "snap-3",
      date: "2026-09-02",
      time: "09:15:00",
      sessionType: "MARKET_OPEN",
      label: "Market Opening (09:15 AM)",
      totalInvested: 398000,
      stocksInvested: 250000,
      sipInvested: 148000,
      totalCurrentValue: 440200,
      stocksCurrentValue: 270800,
      sipCurrentValue: 169400,
      totalPnl: 42200,
      totalPnlPct: 10.60,
      dayChangeAmount: 400,
      dayChangePct: 0.09,
      notes: "Opening gap-up recorded across broader indices."
    },
    {
      id: "snap-4",
      date: "2026-09-02",
      time: "15:30:00",
      sessionType: "MARKET_CLOSE",
      label: "End of Day (03:30 PM)",
      totalInvested: 398000,
      stocksInvested: 250000,
      sipInvested: 148000,
      totalCurrentValue: 444100,
      stocksCurrentValue: 273600,
      sipCurrentValue: 170500,
      totalPnl: 46100,
      totalPnlPct: 11.58,
      dayChangeAmount: 3900,
      dayChangePct: 0.89,
      notes: "Steady buying in banking & bluechip FMCG."
    },
    {
      id: "snap-5",
      date: "2026-09-03",
      time: "09:15:00",
      sessionType: "MARKET_OPEN",
      label: "Market Opening (09:15 AM)",
      totalInvested: 398000,
      stocksInvested: 250000,
      sipInvested: 148000,
      totalCurrentValue: 444600,
      stocksCurrentValue: 274000,
      sipCurrentValue: 170600,
      totalPnl: 46600,
      totalPnlPct: 11.71,
      dayChangeAmount: 500,
      dayChangePct: 0.11,
      notes: "Today's opening recorded successfully."
    }
  ];

  return { stocks, sips, accountingHistory };
}

class InvestmentStore {
  private stocks: StockInvestment[] = [];
  private sips: SipInvestment[] = [];
  private accountingHistory: AccountingSnapshot[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(PORTFOLIO_FILE)) {
        const raw = fs.readFileSync(PORTFOLIO_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        this.stocks = parsed.stocks || [];
        this.sips = parsed.sips || [];
        this.accountingHistory = parsed.accountingHistory || [];
      } else {
        const initial = getInitialPortfolio();
        this.stocks = initial.stocks;
        this.sips = initial.sips;
        this.accountingHistory = initial.accountingHistory;
        this.saveToDisk();
      }
    } catch (e) {
      console.error("Error loading investment portfolio:", e);
      const initial = getInitialPortfolio();
      this.stocks = initial.stocks;
      this.sips = initial.sips;
      this.accountingHistory = initial.accountingHistory;
    }
  }

  private saveToDisk() {
    try {
      const data = {
        stocks: this.stocks,
        sips: this.sips,
        accountingHistory: this.accountingHistory
      };
      fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving investment portfolio to disk:", e);
    }
  }

  public getPortfolioData(): InvestmentPortfolioData {
    // Recompute values dynamically
    let stocksInvested = 0;
    let stocksValue = 0;
    this.stocks.forEach((s) => {
      s.investedAmount = Math.round(s.quantity * s.buyPrice * 100) / 100;
      s.currentValue = Math.round(s.quantity * s.currentPrice * 100) / 100;
      s.unrealizedPnl = Math.round((s.currentValue - s.investedAmount) * 100) / 100;
      s.unrealizedPnlPct = s.investedAmount > 0
        ? Math.round(((s.currentValue - s.investedAmount) / s.investedAmount) * 10000) / 100
        : 0;
      stocksInvested += s.investedAmount;
      stocksValue += s.currentValue;
    });

    let sipInvested = 0;
    let sipValue = 0;
    this.sips.forEach((m) => {
      m.investedAmount = Math.round(m.installmentAmount * m.totalInstallments * 100) / 100;
      m.currentValue = Math.round(m.units * m.currentNav * 100) / 100;
      m.unrealizedPnl = Math.round((m.currentValue - m.investedAmount) * 100) / 100;
      m.unrealizedPnlPct = m.investedAmount > 0
        ? Math.round(((m.currentValue - m.investedAmount) / m.investedAmount) * 10000) / 100
        : 0;
      sipInvested += m.investedAmount;
      sipValue += m.currentValue;
    });

    const totalInvested = Math.round((stocksInvested + sipInvested) * 100) / 100;
    const totalCurrentValue = Math.round((stocksValue + sipValue) * 100) / 100;
    const totalPnl = Math.round((totalCurrentValue - totalInvested) * 100) / 100;
    const totalPnlPct = totalInvested > 0
      ? Math.round(((totalCurrentValue - totalInvested) / totalInvested) * 10000) / 100
      : 0;

    // Day change compared to last snapshot
    let dayChangeAmount = 0;
    let dayChangePct = 0;
    if (this.accountingHistory.length > 0) {
      const lastSnap = this.accountingHistory[this.accountingHistory.length - 1];
      dayChangeAmount = Math.round((totalCurrentValue - lastSnap.totalCurrentValue) * 100) / 100;
      dayChangePct = lastSnap.totalCurrentValue > 0
        ? Math.round((dayChangeAmount / lastSnap.totalCurrentValue) * 10000) / 100
        : 0;
    }

    const lastSnap = this.accountingHistory[this.accountingHistory.length - 1];

    return {
      stocks: this.stocks,
      sips: this.sips,
      accountingHistory: this.accountingHistory,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalPnl,
        totalPnlPct,
        dayChangeAmount,
        dayChangePct,
        stocksInvested,
        stocksValue,
        sipInvested,
        sipValue,
        lastAccountingSession: lastSnap ? lastSnap.sessionType : "NONE",
        lastAccountingTimestamp: lastSnap ? `${lastSnap.date} ${lastSnap.time}` : "None"
      }
    };
  }

  public recordAccountingSnapshot(sessionType: "MARKET_OPEN" | "MARKET_CLOSE", customNotes?: string): AccountingSnapshot {
    const portfolio = this.getPortfolioData();
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8);

    const prevSnap = this.accountingHistory.length > 0 ? this.accountingHistory[this.accountingHistory.length - 1] : null;
    const dayChangeAmount = prevSnap ? Math.round((portfolio.summary.totalCurrentValue - prevSnap.totalCurrentValue) * 100) / 100 : 0;
    const dayChangePct = prevSnap && prevSnap.totalCurrentValue > 0
      ? Math.round((dayChangeAmount / prevSnap.totalCurrentValue) * 10000) / 100
      : 0;

    const snapshot: AccountingSnapshot = {
      id: `snap-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      sessionType,
      label: sessionType === "MARKET_OPEN" ? "Market Opening (09:15 AM)" : "End of Day (03:30 PM)",
      totalInvested: portfolio.summary.totalInvested,
      stocksInvested: portfolio.summary.stocksInvested,
      sipInvested: portfolio.summary.sipInvested,
      totalCurrentValue: portfolio.summary.totalCurrentValue,
      stocksCurrentValue: portfolio.summary.stocksValue,
      sipCurrentValue: portfolio.summary.sipValue,
      totalPnl: portfolio.summary.totalPnl,
      totalPnlPct: portfolio.summary.totalPnlPct,
      dayChangeAmount,
      dayChangePct,
      notes: customNotes || (sessionType === "MARKET_OPEN"
        ? "Morning market open accounting recorded."
        : "Market close / End-of-Day accounting recorded.")
    };

    this.accountingHistory.push(snapshot);
    this.saveToDisk();
    return snapshot;
  }

  public addStock(stock: {
    symbol: string;
    name: string;
    quantity: number;
    buyPrice: number;
    currentPrice: number;
    sector?: string;
  }): StockInvestment {
    const investedAmount = stock.quantity * stock.buyPrice;
    const currentValue = stock.quantity * stock.currentPrice;
    const newStock: StockInvestment = {
      id: `stk-${Date.now()}`,
      symbol: stock.symbol.toUpperCase().trim(),
      name: stock.name.trim(),
      quantity: Number(stock.quantity),
      buyPrice: Number(stock.buyPrice),
      currentPrice: Number(stock.currentPrice),
      investedAmount,
      currentValue,
      unrealizedPnl: currentValue - investedAmount,
      unrealizedPnlPct: investedAmount > 0 ? ((currentValue - investedAmount) / investedAmount) * 100 : 0,
      dayChangePct: 0.0,
      sector: stock.sector || "Equity",
      purchaseDate: new Date().toISOString().slice(0, 10)
    };
    this.stocks.push(newStock);
    this.saveToDisk();
    return newStock;
  }

  public deleteStock(id: string): boolean {
    const initLen = this.stocks.length;
    this.stocks = this.stocks.filter((s) => s.id !== id);
    if (this.stocks.length !== initLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public addSip(sip: {
    fundName: string;
    category: "Equity" | "Debt" | "Hybrid" | "Index Fund" | "Large Cap" | "Flexi Cap";
    frequency: "Daily" | "Weekly" | "Monthly";
    installmentAmount: number;
    totalInstallments: number;
    units: number;
    avgNav: number;
    currentNav: number;
  }): SipInvestment {
    const investedAmount = sip.installmentAmount * sip.totalInstallments;
    const currentValue = sip.units * sip.currentNav;
    const newSip: SipInvestment = {
      id: `sip-${Date.now()}`,
      fundName: sip.fundName.trim(),
      category: sip.category,
      frequency: sip.frequency,
      installmentAmount: Number(sip.installmentAmount),
      totalInstallments: Number(sip.totalInstallments),
      investedAmount,
      units: Number(sip.units),
      avgNav: Number(sip.avgNav),
      currentNav: Number(sip.currentNav),
      currentValue,
      unrealizedPnl: currentValue - investedAmount,
      unrealizedPnlPct: investedAmount > 0 ? ((currentValue - investedAmount) / investedAmount) * 100 : 0,
      dayChangePct: 0.0,
      nextSipDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      startDate: new Date().toISOString().slice(0, 10),
      status: "ACTIVE"
    };
    this.sips.push(newSip);
    this.saveToDisk();
    return newSip;
  }

  public deleteSip(id: string): boolean {
    const initLen = this.sips.length;
    this.sips = this.sips.filter((m) => m.id !== id);
    if (this.sips.length !== initLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public tickMarketPrices(): void {
    // Simulate slight natural market price movement on holdings
    this.stocks.forEach((s) => {
      const deltaPct = (Math.random() - 0.48) * 1.2; // slight upward drift
      const newPrice = Math.max(1, s.currentPrice * (1 + deltaPct / 100));
      s.currentPrice = Math.round(newPrice * 100) / 100;
      s.dayChangePct = Math.round(deltaPct * 100) / 100;
    });

    this.sips.forEach((m) => {
      const navDeltaPct = (Math.random() - 0.47) * 0.6;
      const newNav = Math.max(1, m.currentNav * (1 + navDeltaPct / 100));
      m.currentNav = Math.round(newNav * 100) / 100;
      m.dayChangePct = Math.round(navDeltaPct * 100) / 100;
    });

    this.saveToDisk();
  }
}

export const investmentStore = new InvestmentStore();
