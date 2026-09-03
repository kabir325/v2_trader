import fs from "fs";
import path from "path";
import {
  MicroCustomer,
  MicroDeliveryStock,
  MicroCustomerHolding,
  MicroCustomerTrade,
  MicroDeliveryAlgoState
} from "../types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const ALGO_FILE = path.join(DATA_DIR, "micro_delivery_algo.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 60+ Real Indian Stocks with prices under ₹100
const MASTER_STOCK_UNIVERSE: MicroDeliveryStock[] = [
  { symbol: "SUZLON", name: "Suzlon Energy Ltd", currentPrice: 54.50, previousClose: 53.80, dayChangePct: 1.30, sector: "Renewable Energy" },
  { symbol: "YESBANK", name: "Yes Bank Ltd", currentPrice: 21.40, previousClose: 21.10, dayChangePct: 1.42, sector: "Private Banking" },
  { symbol: "IDEA", name: "Vodafone Idea Ltd", currentPrice: 8.90, previousClose: 8.75, dayChangePct: 1.71, sector: "Telecom" },
  { symbol: "NHPC", name: "NHPC Limited", currentPrice: 84.20, previousClose: 83.50, dayChangePct: 0.84, sector: "Hydro Power" },
  { symbol: "GMRINFRA", name: "GMR Airports Infrastructure", currentPrice: 87.30, previousClose: 86.80, dayChangePct: 0.58, sector: "Infrastructure" },
  { symbol: "RENUKA", name: "Shree Renuka Sugars Ltd", currentPrice: 42.60, previousClose: 42.00, dayChangePct: 1.43, sector: "Agro & Sugar" },
  { symbol: "ALOKINDS", name: "Alok Industries Ltd", currentPrice: 24.50, previousClose: 24.10, dayChangePct: 1.66, sector: "Textiles" },
  { symbol: "PNB", name: "Punjab National Bank", currentPrice: 97.10, previousClose: 96.20, dayChangePct: 0.94, sector: "PSU Banking" },
  { symbol: "UCOBANK", name: "UCO Bank", currentPrice: 48.50, previousClose: 47.90, dayChangePct: 1.25, sector: "PSU Banking" },
  { symbol: "CENTRALBK", name: "Central Bank of India", currentPrice: 53.80, previousClose: 53.10, dayChangePct: 1.32, sector: "PSU Banking" },
  { symbol: "BANKMAHA", name: "Bank of Maharashtra", currentPrice: 56.40, previousClose: 55.70, dayChangePct: 1.26, sector: "PSU Banking" },
  { symbol: "SOUTHBANK", name: "South Indian Bank Ltd", currentPrice: 26.80, previousClose: 26.30, dayChangePct: 1.90, sector: "Private Banking" },
  { symbol: "IOB", name: "Indian Overseas Bank", currentPrice: 58.90, previousClose: 58.20, dayChangePct: 1.20, sector: "PSU Banking" },
  { symbol: "DISHTV", name: "Dish TV India Ltd", currentPrice: 11.90, previousClose: 11.75, dayChangePct: 1.28, sector: "Media & DTH" },
  { symbol: "RPOWER", name: "Reliance Power Ltd", currentPrice: 32.80, previousClose: 32.10, dayChangePct: 2.18, sector: "Power" },
  { symbol: "RTNPOWER", name: "RattanIndia Power Ltd", currentPrice: 16.40, previousClose: 15.90, dayChangePct: 3.14, sector: "Power" },
  { symbol: "JPPOWER", name: "Jaiprakash Power Ventures", currentPrice: 17.80, previousClose: 17.40, dayChangePct: 2.30, sector: "Power" },
  { symbol: "HCC", name: "Hindustan Construction Co", currentPrice: 39.50, previousClose: 38.90, dayChangePct: 1.54, sector: "Construction" },
  { symbol: "GTLINFRA", name: "GTL Infrastructure Ltd", currentPrice: 2.45, previousClose: 2.40, dayChangePct: 2.08, sector: "Telecom Infra" },
  { symbol: "JAICORPLTD", name: "Jai Corp Limited", currentPrice: 66.20, previousClose: 65.50, dayChangePct: 1.07, sector: "Industrials" },
  { symbol: "IFCI", name: "IFCI Limited", currentPrice: 58.10, previousClose: 57.20, dayChangePct: 1.57, sector: "Finance" },
  { symbol: "MMTC", name: "MMTC Limited", currentPrice: 78.40, previousClose: 77.50, dayChangePct: 1.16, sector: "Commodity Trading" },
  { symbol: "SJVN", name: "SJVN Limited", currentPrice: 98.20, previousClose: 97.50, dayChangePct: 0.72, sector: "Renewable Power" },
  { symbol: "NBCC", name: "NBCC (India) Limited", currentPrice: 92.60, previousClose: 91.80, dayChangePct: 0.87, sector: "Infrastructure" },
  { symbol: "HUDCO", name: "Housing & Urban Dev Corp", currentPrice: 98.50, previousClose: 97.80, dayChangePct: 0.72, sector: "Housing Finance" },
  { symbol: "SAIL", name: "Steel Authority of India", currentPrice: 98.40, previousClose: 97.60, dayChangePct: 0.82, sector: "Metals" },
  { symbol: "BHEL", name: "Bharat Heavy Electricals", currentPrice: 95.80, previousClose: 94.90, dayChangePct: 0.95, sector: "Heavy Electricals" },
  { symbol: "TV18BRDCST", name: "TV18 Broadcast Ltd", currentPrice: 42.10, previousClose: 41.50, dayChangePct: 1.45, sector: "Media" },
  { symbol: "NETWORK18", name: "Network18 Media & Inv", currentPrice: 78.90, previousClose: 78.10, dayChangePct: 1.02, sector: "Media" },
  { symbol: "MOREPENLAB", name: "Morepen Laboratories Ltd", currentPrice: 52.40, previousClose: 51.60, dayChangePct: 1.55, sector: "Pharma" },
  { symbol: "HATHWAY", name: "Hathway Cable & Datacom", currentPrice: 20.30, previousClose: 20.00, dayChangePct: 1.50, sector: "Telecom / Media" },
  { symbol: "DEN", name: "Den Networks Ltd", currentPrice: 51.20, previousClose: 50.60, dayChangePct: 1.19, sector: "Media" },
  { symbol: "URJA", name: "Urja Global Ltd", currentPrice: 19.80, previousClose: 19.30, dayChangePct: 2.59, sector: "Solar / Energy" },
  { symbol: "BAJAJHIND", name: "Bajaj Hindusthan Sugar", currentPrice: 34.20, previousClose: 33.70, dayChangePct: 1.48, sector: "Sugar" },
  { symbol: "SUNDARAM", name: "Sundaram Multi Pap Ltd", currentPrice: 4.80, previousClose: 4.70, dayChangePct: 2.13, sector: "Paper" },
  { symbol: "SUBEX", name: "Subex Limited", currentPrice: 32.10, previousClose: 31.70, dayChangePct: 1.26, sector: "IT Services" },
  { symbol: "TRIDENT", name: "Trident Limited", currentPrice: 38.60, previousClose: 38.10, dayChangePct: 1.31, sector: "Textiles / Home" },
  { symbol: "VAKRANGEE", name: "Vakrangee Limited", currentPrice: 24.20, previousClose: 23.80, dayChangePct: 1.68, sector: "E-Governance" },
  { symbol: "VIKASECO", name: "Vikas EcoTech Ltd", currentPrice: 3.90, previousClose: 3.80, dayChangePct: 2.63, sector: "Specialty Chem" },
  { symbol: "FCSSOFT", name: "FCS Software Solutions", currentPrice: 4.20, previousClose: 4.10, dayChangePct: 2.44, sector: "IT Services" },
  { symbol: "ORIENTPPR", name: "Orient Paper & Industries", currentPrice: 48.90, previousClose: 48.20, dayChangePct: 1.45, sector: "Paper" },
  { symbol: "GIPCL", name: "Gujarat Ind Power Co", currentPrice: 94.20, previousClose: 93.40, dayChangePct: 0.86, sector: "Power" },
  { symbol: "MARKSANS", name: "Marksans Pharma Ltd", currentPrice: 96.50, previousClose: 95.80, dayChangePct: 0.73, sector: "Pharma" },
  { symbol: "INFIBEAM", name: "Infibeam Avenues Ltd", currentPrice: 31.80, previousClose: 31.20, dayChangePct: 1.92, sector: "Fintech / Payments" },
  { symbol: "EASEMYTRIP", name: "Easy Trip Planners Ltd", currentPrice: 38.40, previousClose: 37.90, dayChangePct: 1.32, sector: "Online Travel" },
  { symbol: "ZOMATO_SUB", name: "Zomato Delivery Unit", currentPrice: 98.00, previousClose: 97.20, dayChangePct: 0.82, sector: "Consumer Tech" },
  { symbol: "MOTHERSON_W", name: "Motherson Wiring India", currentPrice: 72.50, previousClose: 71.80, dayChangePct: 0.97, sector: "Auto Ancillary" },
  { symbol: "DCBBANK", name: "DCB Bank Ltd", currentPrice: 94.80, previousClose: 94.00, dayChangePct: 0.85, sector: "Private Banking" },
  { symbol: "KARURVYSYA", name: "Karur Vysya Bank", currentPrice: 99.10, previousClose: 98.40, dayChangePct: 0.71, sector: "Private Banking" },
  { symbol: "MANAPPURAM", name: "Manappuram Finance", currentPrice: 98.70, previousClose: 97.90, dayChangePct: 0.82, sector: "NBFC Gold" },
  { symbol: "TEXRAIL", name: "Texmaco Rail & Eng", currentPrice: 99.40, previousClose: 98.50, dayChangePct: 0.91, sector: "Rail Infra" },
  { symbol: "HBLPOWER", name: "HBL Power Systems", currentPrice: 97.20, previousClose: 96.40, dayChangePct: 0.83, sector: "Batteries / Electronics" },
  { symbol: "HFCL", name: "HFCL Limited", currentPrice: 96.00, previousClose: 95.10, dayChangePct: 0.95, sector: "Telecom Equipment" },
  { symbol: "PTC", name: "PTC India Limited", currentPrice: 98.30, previousClose: 97.60, dayChangePct: 0.72, sector: "Power Trading" },
  { symbol: "ENGINERSIN", name: "Engineers India Ltd", currentPrice: 99.00, previousClose: 98.20, dayChangePct: 0.81, sector: "Engineering" },
  { symbol: "NBVENTURES", name: "Nava Bharat Ventures", currentPrice: 95.40, previousClose: 94.60, dayChangePct: 0.85, sector: "Metals / Power" },
  { symbol: "HINDCOPPER", name: "Hindustan Copper Ltd", currentPrice: 99.50, previousClose: 98.80, dayChangePct: 0.71, sector: "Metals" },
  { symbol: "NFL", name: "National Fertilizers Ltd", currentPrice: 96.80, previousClose: 96.00, dayChangePct: 0.83, sector: "Fertilizers" },
  { symbol: "RCF", name: "Rashtriya Chemicals & Fert", currentPrice: 98.90, previousClose: 98.00, dayChangePct: 0.92, sector: "Fertilizers" },
  { symbol: "GSFC", name: "Gujarat State Fert & Chem", currentPrice: 97.50, previousClose: 96.70, dayChangePct: 0.83, sector: "Chemicals" }
];

// 10 Customers with each having capital strictly < 100 Rs (total < 1000 Rs)
// 95 + 98 + 92 + 96 + 90 + 95 + 99 + 94 + 97 + 90 = 946 Rs (Strictly < 1000 Rs)
function getInitialCustomers(): MicroCustomer[] {
  const customerConfigs = [
    { name: "Customer 1 (Aarav)", capital: 95, color: "#4f46e5" },
    { name: "Customer 2 (Diya)", capital: 98, color: "#06b6d4" },
    { name: "Customer 3 (Rohan)", capital: 92, color: "#10b981" },
    { name: "Customer 4 (Ananya)", capital: 96, color: "#f59e0b" },
    { name: "Customer 5 (Kabir)", capital: 90, color: "#ec4899" },
    { name: "Customer 6 (Pooja)", capital: 95, color: "#8b5cf6" },
    { name: "Customer 7 (Vikram)", capital: 99, color: "#14b8a6" },
    { name: "Customer 8 (Sneha)", capital: 94, color: "#f97316" },
    { name: "Customer 9 (Arjun)", capital: 97, color: "#3b82f6" },
    { name: "Customer 10 (Meera)", capital: 90, color: "#84cc16" },
  ];

  return customerConfigs.map((cfg, idx) => ({
    id: `cust-${idx + 1}`,
    name: cfg.name,
    avatarColor: cfg.color,
    initialCapital: cfg.capital,
    cashBalance: cfg.capital,
    investedValue: 0,
    totalNetWorth: cfg.capital,
    realizedProfit: 0,
    totalTrades: 0,
    winningTrades: 0,
    activeHoldings: []
  }));
}

class MicroDeliveryAlgoStore {
  private state: MicroDeliveryAlgoState;

  constructor() {
    this.state = this.loadFromDisk();
  }

  private loadFromDisk(): MicroDeliveryAlgoState {
    try {
      if (fs.existsSync(ALGO_FILE)) {
        const raw = fs.readFileSync(ALGO_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch (e) {
      console.error("Error loading micro delivery algo state:", e);
    }

    const customers = getInitialCustomers();
    const totalCapital = customers.reduce((sum, c) => sum + c.initialCapital, 0);

    const initialState: MicroDeliveryAlgoState = {
      dayCount: 1,
      currentDate: new Date().toISOString().slice(0, 10),
      marketPhase: "MARKET_OPEN",
      targetProfitPct: 5.0,
      maxCustomerBudget: 99.0,
      customers,
      recentTrades: [],
      stockUniverse: MASTER_STOCK_UNIVERSE,
      totalAlgoCapital: totalCapital,
      totalCurrentValue: totalCapital,
      totalRealizedProfit: 0,
      totalActivePositions: 0,
      autoTickEnabled: false,
      lastRunTimestamp: new Date().toISOString()
    };

    this.saveToDisk(initialState);
    return initialState;
  }

  private saveToDisk(customState?: MicroDeliveryAlgoState) {
    try {
      const s = customState || this.state;
      fs.writeFileSync(ALGO_FILE, JSON.stringify(s, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving micro delivery algo state to disk:", e);
    }
  }

  public getState(): MicroDeliveryAlgoState {
    this.recalculateHoldingsAndTotals();
    return this.state;
  }

  private recalculateHoldingsAndTotals() {
    let grandInvested = 0;
    let grandCash = 0;
    let grandRealized = 0;
    let totalPositions = 0;

    this.state.customers.forEach((cust) => {
      let custInvested = 0;
      cust.activeHoldings.forEach((h) => {
        // Find latest price from universe
        const stock = this.state.stockUniverse.find((s) => s.symbol === h.symbol);
        if (stock) {
          h.currentPrice = stock.currentPrice;
        }
        h.currentValue = Math.round(h.quantity * h.currentPrice * 100) / 100;
        h.pnlAmount = Math.round((h.currentValue - h.investedAmount) * 100) / 100;
        h.pnlPct = h.investedAmount > 0
          ? Math.round(((h.currentValue - h.investedAmount) / h.investedAmount) * 10000) / 100
          : 0;
        h.isEligibleFor5PctExit = h.pnlPct >= 5.0;
        custInvested += h.currentValue;
        totalPositions++;
      });

      cust.investedValue = Math.round(custInvested * 100) / 100;
      cust.totalNetWorth = Math.round((cust.cashBalance + cust.investedValue) * 100) / 100;

      grandInvested += cust.investedValue;
      grandCash += cust.cashBalance;
      grandRealized += cust.realizedProfit;
    });

    this.state.totalCurrentValue = Math.round((grandCash + grandInvested) * 100) / 100;
    this.state.totalRealizedProfit = Math.round(grandRealized * 100) / 100;
    this.state.totalActivePositions = totalPositions;
  }

  /**
   * Run Morning Market Opening Delivery Buy Cycle:
   * For each customer with available cash (budget < 100 Rs):
   * Selects a random stock from the big universe.
   * If stock is 20 rs, buys 5 stocks (worth 100/-) in delivery!
   */
  public executeMorningMarketOpenCycle(): {
    buysExecuted: number;
    details: Array<{ customerName: string; symbol: string; qty: number; buyPrice: number; totalCost: number }>;
  } {
    this.recalculateHoldingsAndTotals();
    const details: Array<{ customerName: string; symbol: string; qty: number; buyPrice: number; totalCost: number }> = [];
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    const dateStr = now.toISOString().slice(0, 10);

    this.state.marketPhase = "MARKET_OPEN";
    this.state.lastRunTimestamp = now.toISOString();

    this.state.customers.forEach((cust) => {
      // Check if customer has cash to buy (minimum 2.5 Rs for cheapest stock)
      if (cust.cashBalance < 3.0) {
        return;
      }

      // Filter eligible stocks where stock price <= customer available cash
      const affordableStocks = this.state.stockUniverse.filter((s) => s.currentPrice <= cust.cashBalance);
      if (affordableStocks.length === 0) {
        return;
      }

      // Pick a stock at random from the big stock list
      const randomIndex = Math.floor(Math.random() * affordableStocks.length);
      const chosenStock = affordableStocks[randomIndex];

      // Sizing logic:
      // "also if say the stock is 20 rs it should buy 5 stocks so that its 100/- worth do this every day morning at the opening of market select stocks at random and keep the stock list as big as possible."
      const qty = Math.floor(cust.cashBalance / chosenStock.currentPrice);
      if (qty <= 0) return;

      const totalCost = Math.round(qty * chosenStock.currentPrice * 100) / 100;

      // Deduct delivery cash from customer
      cust.cashBalance = Math.round((cust.cashBalance - totalCost) * 100) / 100;

      // Target exit is > 5% profit
      const targetPrice5Pct = Math.round(chosenStock.currentPrice * 1.05 * 100) / 100;

      const newHolding: MicroCustomerHolding = {
        id: `hold-${cust.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        symbol: chosenStock.symbol,
        stockName: chosenStock.name,
        quantity: qty,
        buyPrice: chosenStock.currentPrice,
        currentPrice: chosenStock.currentPrice,
        investedAmount: totalCost,
        currentValue: totalCost,
        pnlAmount: 0,
        pnlPct: 0,
        targetPrice5Pct,
        buyDate: dateStr,
        buyTime: timeStr,
        isEligibleFor5PctExit: false
      };

      cust.activeHoldings.push(newHolding);
      details.push({
        customerName: cust.name,
        symbol: chosenStock.symbol,
        qty,
        buyPrice: chosenStock.currentPrice,
        totalCost
      });
    });

    this.recalculateHoldingsAndTotals();
    this.saveToDisk();

    return {
      buysExecuted: details.length,
      details
    };
  }

  /**
   * Evaluates profit exit rule (> 5% profit target):
   * "sell these stocks if the profit made is more than 5% of the invested amount at any point."
   */
  public evaluateAndExecute5PctProfitExits(): {
    sellsExecuted: number;
    trades: MicroCustomerTrade[];
  } {
    this.recalculateHoldingsAndTotals();
    const executedTrades: MicroCustomerTrade[] = [];
    const now = new Date();
    const sellTimestamp = now.toISOString();

    this.state.customers.forEach((cust) => {
      const remainingHoldings: MicroCustomerHolding[] = [];

      cust.activeHoldings.forEach((h) => {
        // Profit made is more than 5% of the invested amount
        if (h.pnlPct >= 5.0) {
          // Automatic Delivery SELL
          const realizedAmount = Math.round(h.quantity * h.currentPrice * 100) / 100;
          const profitAmount = Math.round((realizedAmount - h.investedAmount) * 100) / 100;
          const profitPct = h.pnlPct;

          // Credit cash back to customer
          cust.cashBalance = Math.round((cust.cashBalance + realizedAmount) * 100) / 100;
          cust.realizedProfit = Math.round((cust.realizedProfit + profitAmount) * 100) / 100;
          cust.totalTrades += 1;
          cust.winningTrades += 1;

          const trade: MicroCustomerTrade = {
            id: `trd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            customerId: cust.id,
            customerName: cust.name,
            symbol: h.symbol,
            stockName: h.stockName,
            quantity: h.quantity,
            buyPrice: h.buyPrice,
            sellPrice: h.currentPrice,
            investedAmount: h.investedAmount,
            realizedAmount,
            profitAmount,
            profitPct,
            buyTimestamp: `${h.buyDate} ${h.buyTime}`,
            sellTimestamp,
            exitReason: `Target Reached (> 5.0% profit: +${profitPct}% locked in)`
          };

          executedTrades.push(trade);
          this.state.recentTrades.unshift(trade);
        } else {
          remainingHoldings.push(h);
        }
      });

      cust.activeHoldings = remainingHoldings;
    });

    // Limit recent trades list
    if (this.state.recentTrades.length > 50) {
      this.state.recentTrades = this.state.recentTrades.slice(0, 50);
    }

    this.recalculateHoldingsAndTotals();
    this.saveToDisk();

    return {
      sellsExecuted: executedTrades.length,
      trades: executedTrades
    };
  }

  /**
   * Simulates intraday price movements across the big stock universe
   * and automatically triggers the >5% profit exit evaluation!
   */
  public tickMarketPrices(volatilityFactor: number = 1.0): {
    stocksUpdated: number;
    sellsTriggered: number;
    executedTrades: MicroCustomerTrade[];
  } {
    this.state.stockUniverse.forEach((s) => {
      // Natural price movement with intraday volatility
      // Generates occasional surges to simulate hitting the 5% target
      const surgeBonus = Math.random() < 0.15 ? (Math.random() * 3.5 + 2.0) : 0; // 15% chance of 2-5% pop
      const deltaPct = ((Math.random() - 0.46) * 1.5 * volatilityFactor) + surgeBonus;
      const newPrice = Math.max(1.0, s.currentPrice * (1 + deltaPct / 100));
      s.currentPrice = Math.round(newPrice * 100) / 100;
      s.dayChangePct = Math.round((((s.currentPrice - s.previousClose) / s.previousClose) * 100) * 100) / 100;
    });

    this.state.marketPhase = "INTRADAY";

    // Immediately evaluate the >5% profit target exit rule
    const exitResult = this.evaluateAndExecute5PctProfitExits();

    return {
      stocksUpdated: this.state.stockUniverse.length,
      sellsTriggered: exitResult.sellsExecuted,
      executedTrades: exitResult.trades
    };
  }

  /**
   * Advances day to next morning market open:
   * 1. Resets day open prices
   * 2. Increments day count
   * 3. Triggers morning delivery buys for all customers with available balance
   */
  public advanceToNextDayMorning(): {
    dayCount: number;
    buysExecuted: number;
    details: Array<{ customerName: string; symbol: string; qty: number; buyPrice: number; totalCost: number }>;
  } {
    this.state.dayCount += 1;
    const nextDate = new Date(Date.now() + (this.state.dayCount - 1) * 86400000);
    this.state.currentDate = nextDate.toISOString().slice(0, 10);

    // Reset baseline previous close to current price
    this.state.stockUniverse.forEach((s) => {
      s.previousClose = s.currentPrice;
      s.dayChangePct = 0;
    });

    const buyResult = this.executeMorningMarketOpenCycle();
    return {
      dayCount: this.state.dayCount,
      buysExecuted: buyResult.buysExecuted,
      details: buyResult.details
    };
  }

  /**
   * Reset algorithm to initial 10 customer state (< 100 Rs each, total < 1000 Rs)
   */
  public resetAlgo(): MicroDeliveryAlgoState {
    const customers = getInitialCustomers();
    const totalCapital = customers.reduce((sum, c) => sum + c.initialCapital, 0);

    this.state = {
      dayCount: 1,
      currentDate: new Date().toISOString().slice(0, 10),
      marketPhase: "MARKET_OPEN",
      targetProfitPct: 5.0,
      maxCustomerBudget: 99.0,
      customers,
      recentTrades: [],
      stockUniverse: MASTER_STOCK_UNIVERSE,
      totalAlgoCapital: totalCapital,
      totalCurrentValue: totalCapital,
      totalRealizedProfit: 0,
      totalActivePositions: 0,
      autoTickEnabled: false,
      lastRunTimestamp: new Date().toISOString()
    };

    this.saveToDisk();
    return this.state;
  }
}

export const microDeliveryAlgoStore = new MicroDeliveryAlgoStore();
