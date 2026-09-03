import fs from "fs";
import path from "path";
import {
  StockInvestment,
  SipInvestment,
  AccountingSnapshot,
  InvestmentPortfolioData
} from "../types.js";
import { growwClient } from "./growwClient.js";

const DATA_DIR = path.join(process.cwd(), "data");
const PORTFOLIO_FILE = path.join(DATA_DIR, "user_investments.json");

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial zero portfolio - No mock/fake/random numbers
function getInitialPortfolio(): { stocks: StockInvestment[]; sips: SipInvestment[]; accountingHistory: AccountingSnapshot[] } {
  return {
    stocks: [],
    sips: [],
    accountingHistory: []
  };
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
        this.stocks = Array.isArray(parsed.stocks) ? parsed.stocks : [];
        this.sips = Array.isArray(parsed.sips) ? parsed.sips : [];
        this.accountingHistory = Array.isArray(parsed.accountingHistory) ? parsed.accountingHistory : [];
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

  public clearPortfolio(): void {
    this.stocks = [];
    this.sips = [];
    this.accountingHistory = [];
    this.saveToDisk();
  }

  public async syncWithGroww(): Promise<{ success: boolean; message: string; stockCount: number; sipCount: number }> {
    try {
      const holdingsRes = await growwClient.getUserHoldings();
      const sipsRes = await growwClient.getUserSips();

      if (!holdingsRes.success && !sipsRes.success) {
        return {
          success: false,
          message: holdingsRes.error || "Failed to fetch portfolio from Groww API. Check your Groww API credentials in System Config.",
          stockCount: 0,
          sipCount: 0
        };
      }

      let importedStocks = 0;
      if (holdingsRes.success && Array.isArray(holdingsRes.holdings) && holdingsRes.holdings.length > 0) {
        this.stocks = holdingsRes.holdings.map((h: any, idx: number) => {
          const qty = Number(h.quantity || h.qty || 0);
          const buyPrice = Number(h.averagePrice || h.avgPrice || h.buyPrice || 0);
          const currentPrice = Number(h.ltp || h.closePrice || h.lastPrice || buyPrice);
          const invested = Math.round(qty * buyPrice * 100) / 100;
          const currentVal = Math.round(qty * currentPrice * 100) / 100;
          const pnl = Math.round((currentVal - invested) * 100) / 100;
          const pnlPct = invested > 0 ? Math.round((pnl / invested) * 10000) / 100 : 0;
          return {
            id: `groww-stk-${idx}-${Date.now()}`,
            symbol: (h.tradingSymbol || h.symbol || "UNKNOWN").toUpperCase(),
            name: h.companyName || h.name || h.tradingSymbol || "Stock Holding",
            quantity: qty,
            buyPrice,
            currentPrice,
            investedAmount: invested,
            currentValue: currentVal,
            unrealizedPnl: pnl,
            unrealizedPnlPct: pnlPct,
            dayChangePct: Number(h.dayChangePercentage || 0),
            sector: h.sector || "Equity",
            purchaseDate: h.purchaseDate || new Date().toISOString().slice(0, 10)
          };
        });
        importedStocks = this.stocks.length;
      }

      let importedSips = 0;
      if (sipsRes.success && Array.isArray(sipsRes.sips) && sipsRes.sips.length > 0) {
        this.sips = sipsRes.sips.map((s: any, idx: number) => {
          const instAmount = Number(s.installmentAmount || s.amount || 0);
          const installments = Number(s.totalInstallments || s.installments || 1);
          const units = Number(s.units || 0);
          const avgNav = Number(s.avgNav || s.purchaseNav || 0);
          const currentNav = Number(s.currentNav || s.nav || avgNav);
          const invested = Math.round(instAmount * installments * 100) / 100;
          const currentVal = Math.round(units * currentNav * 100) / 100;
          const pnl = Math.round((currentVal - invested) * 100) / 100;
          const pnlPct = invested > 0 ? Math.round((pnl / invested) * 10000) / 100 : 0;
          return {
            id: `groww-sip-${idx}-${Date.now()}`,
            fundName: s.schemeName || s.fundName || "Mutual Fund",
            category: s.category || "Equity",
            frequency: s.frequency || "Monthly",
            installmentAmount: instAmount,
            totalInstallments: installments,
            investedAmount: invested,
            units,
            avgNav,
            currentNav,
            currentValue: currentVal,
            unrealizedPnl: pnl,
            unrealizedPnlPct: pnlPct,
            dayChangePct: Number(s.dayChangePct || 0),
            nextSipDate: s.nextSipDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            startDate: s.startDate || new Date().toISOString().slice(0, 10),
            status: "ACTIVE"
          };
        });
        importedSips = this.sips.length;
      }

      this.saveToDisk();
      return {
        success: true,
        message: `Successfully synchronized ${importedStocks} stocks and ${importedSips} SIPs from Groww API.`,
        stockCount: importedStocks,
        sipCount: importedSips
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Groww API synchronization failed.",
        stockCount: 0,
        sipCount: 0
      };
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

  public async tickMarketPrices(): Promise<void> {
    if (this.stocks.length === 0) return;
    for (const s of this.stocks) {
      try {
        const quote = await growwClient.getQuote(s.symbol);
        if (quote && quote.ltp > 0) {
          const prev = s.currentPrice;
          s.currentPrice = quote.ltp;
          s.dayChangePct = prev > 0 ? Math.round(((quote.ltp - prev) / prev) * 10000) / 100 : 0;
        }
      } catch {
        // preserve current price if network fails
      }
    }
    this.saveToDisk();
  }

  /**
   * Import holdings and SIPs directly from a Groww exported CSV file
   */
  public importGrowwCsv(csvText: string): { success: boolean; message: string; stockCount: number; sipCount: number } {
    try {
      const clean = csvText.replace(/^\uFEFF/, "").trim();
      if (!clean) {
        return { success: false, message: "CSV content is empty.", stockCount: 0, sipCount: 0 };
      }

      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = "";
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        return { success: false, message: "CSV must contain a header row and at least one data row.", stockCount: 0, sipCount: 0 };
      }

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

      const findCol = (...aliases: string[]): number => {
        for (const a of aliases) {
          const cleanAlias = a.toLowerCase().replace(/[^a-z0-9]/g, "");
          const idx = headers.findIndex((h) => h.includes(cleanAlias) || cleanAlias.includes(h));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const nameCol = findCol("stockname", "companyname", "schemename", "name", "instrument", "security");
      const symCol = findCol("symbol", "tradingsymbol", "ticker", "scrip", "isin");
      const qtyCol = findCol("quantity", "qty", "shares", "units", "holdingqty");
      const buyPriceCol = findCol("buyprice", "averageprice", "avgprice", "avgcost", "purchaseprice", "buyingprice");
      const ltpCol = findCol("ltp", "currentprice", "lastprice", "closeprice", "cmp", "nav", "marketprice");
      const sectorCol = findCol("sector", "category", "assetclass");

      const cleanNum = (val: string | undefined, defaultVal: number = 0): number => {
        if (!val) return defaultVal;
        const cleaned = val.replace(/[₹$,\s]/g, "");
        const num = parseFloat(cleaned);
        return isNaN(num) ? defaultVal : num;
      };

      let importedStocks = 0;
      let importedSips = 0;
      const newStocks: StockInvestment[] = [];
      const newSips: SipInvestment[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

        const rawName = nameCol !== -1 && row[nameCol] ? row[nameCol] : (symCol !== -1 ? row[symCol] : `Holding ${i}`);
        const rawSym = symCol !== -1 && row[symCol] ? row[symCol].toUpperCase().trim() : (rawName ? rawName.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, "") : `STK${i}`);
        const qty = cleanNum(qtyCol !== -1 ? row[qtyCol] : "0", 0);
        const buyPrice = cleanNum(buyPriceCol !== -1 ? row[buyPriceCol] : "0", 0);
        const ltp = cleanNum(ltpCol !== -1 ? row[ltpCol] : "0", buyPrice);
        const sector = sectorCol !== -1 && row[sectorCol] ? row[sectorCol] : "Equity";

        const isFund = rawName.toLowerCase().includes("fund") ||
          rawName.toLowerCase().includes("growth") ||
          rawName.toLowerCase().includes("direct") ||
          sector.toLowerCase().includes("mutual");

        if (isFund && (qty > 0 || buyPrice > 0)) {
          const invested = Math.round(qty * buyPrice * 100) / 100;
          const currentVal = Math.round(qty * ltp * 100) / 100;
          const pnl = Math.round((currentVal - invested) * 100) / 100;
          const pnlPct = invested > 0 ? Math.round((pnl / invested) * 10000) / 100 : 0;
          newSips.push({
            id: `groww-sip-${Date.now()}-${i}`,
            fundName: rawName || "Mutual Fund",
            category: "Flexi Cap",
            frequency: "Monthly",
            installmentAmount: buyPrice > 0 ? Math.round(buyPrice * qty) : 1000,
            totalInstallments: 1,
            investedAmount: invested,
            units: qty,
            avgNav: buyPrice,
            currentNav: ltp,
            currentValue: currentVal,
            unrealizedPnl: pnl,
            unrealizedPnlPct: pnlPct,
            dayChangePct: 0,
            nextSipDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            startDate: new Date().toISOString().slice(0, 10),
            status: "ACTIVE"
          });
          importedSips++;
        } else if (qty > 0 || buyPrice > 0) {
          const invested = Math.round(qty * buyPrice * 100) / 100;
          const currentVal = Math.round(qty * ltp * 100) / 100;
          const pnl = Math.round((currentVal - invested) * 100) / 100;
          const pnlPct = invested > 0 ? Math.round((pnl / invested) * 10000) / 100 : 0;
          newStocks.push({
            id: `groww-stk-${Date.now()}-${i}`,
            symbol: rawSym,
            name: rawName,
            quantity: qty,
            buyPrice,
            currentPrice: ltp,
            investedAmount: invested,
            currentValue: currentVal,
            unrealizedPnl: pnl,
            unrealizedPnlPct: pnlPct,
            dayChangePct: 0,
            sector,
            purchaseDate: new Date().toISOString().slice(0, 10)
          });
          importedStocks++;
        }
      }

      if (importedStocks > 0 || importedSips > 0) {
        this.stocks = newStocks;
        if (newSips.length > 0) this.sips = newSips;
        this.saveToDisk();
        return {
          success: true,
          message: `Successfully imported ${importedStocks} stocks and ${importedSips} mutual funds from Groww CSV!`,
          stockCount: importedStocks,
          sipCount: importedSips
        };
      }

      return {
        success: false,
        message: "No valid stock or fund positions found in the CSV. Ensure headers include Symbol/Name, Quantity, and Average Price.",
        stockCount: 0,
        sipCount: 0
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to parse CSV: ${err.message || "Unknown format error"}`,
        stockCount: 0,
        sipCount: 0
      };
    }
  }
}

export const investmentStore = new InvestmentStore();
