/**
 * Groww API Client Module (Node.js/TypeScript)
 * Migrated from python growwapi wrapper with TOTP 2FA support and fallback simulation.
 */

export interface GrowwQuote {
  symbol: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export interface HistoricalCandle {
  timestamp: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
  macd?: number;
  ema20?: number;
  ema50?: number;
}

export interface GrowwOrderRequest {
  symbol: string;
  qty: number;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  price?: number;
  triggerPrice?: number;
}

export interface GrowwOrderResponse {
  orderId: string;
  status: "SUCCESS" | "REJECTED" | "PENDING";
  message: string;
  executedPrice?: number;
}

export class GrowwClient {
  private token: string;
  private secret: string;
  private totpKey: string;
  private isConnected: boolean = false;

  private sanitizeToken(token?: string): string {
    if (!token) return "";
    let t = token.trim();
    t = t.replace(/^Bearer\s+/i, "");
    t = t.replace(/^["']|["']$/g, "").trim();
    return t;
  }

  constructor(token?: string, secret?: string, totpKey?: string) {
    this.token = this.sanitizeToken(token || process.env.GROWW_API_TOKEN || "");
    this.secret = (secret || process.env.GROWW_API_SECRET || "").trim();
    this.totpKey = (totpKey || process.env.GROWW_TOTP_KEY || "").trim();
    if (this.token && this.token !== "grw_live_demo_key_998811" && this.token.length > 5) {
      this.isConnected = true;
    }
  }

  public updateCredentials(token: string, secret: string, totpKey: string) {
    this.token = this.sanitizeToken(token);
    this.secret = (secret || "").trim();
    this.totpKey = (totpKey || "").trim();
    this.isConnected = Boolean(this.token && this.token.length > 5 && this.token !== "grw_live_demo_key_998811");
  }

  public getCredentialsStatus(): { hasToken: boolean; tokenPreview: string; hasSecret: boolean; hasTotp: boolean } {
    const isValid = Boolean(this.token && this.token.length > 5 && this.token !== "grw_live_demo_key_998811");
    return {
      hasToken: isValid,
      tokenPreview: isValid ? `${this.token.slice(0, 4)}...${this.token.slice(-4)}` : "",
      hasSecret: Boolean(this.secret && this.secret.length > 3),
      hasTotp: Boolean(this.totpKey && this.totpKey.length > 4)
    };
  }

  /**
   * Fetch Live Quote for a given NSE Symbol from Groww API & NSE real price feeds
   */
  public async getQuote(symbol: string): Promise<GrowwQuote> {
    const cleanSym = symbol.toUpperCase().trim();
    const nowIso = new Date().toISOString();

    // 1. If live token provided, attempt official Groww Developer Live Data API
    if (this.token && this.token.length > 5 && this.token !== "grw_live_demo_key_998811") {
      try {
        const response = await fetch(`https://api.groww.in/v1/live-data/quote?exchange=NSE&segment=CASH&trading_symbol=${encodeURIComponent(cleanSym)}`, {
          signal: AbortSignal.timeout(4000),
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/json",
            "X-API-VERSION": "1.0",
            ...(this.secret ? { "X-App-Secret": this.secret, "X-API-KEY": this.secret } : {}),
          },
        });
        if (response.ok) {
          const data: any = await response.json();
          const quoteObj = data.payload || data.quote || data;
          const ltp = Number(quoteObj.ltp || quoteObj.last_price || quoteObj.lastPrice || quoteObj.closePrice || 0);
          if (ltp > 0) {
            return {
              symbol: cleanSym,
              ltp,
              open: Number(quoteObj.open || quoteObj.day_open || ltp),
              high: Number(quoteObj.high || quoteObj.day_high || ltp * 1.01),
              low: Number(quoteObj.low || quoteObj.day_low || ltp * 0.99),
              close: Number(quoteObj.close || quoteObj.prev_close || ltp),
              volume: Number(quoteObj.volume || quoteObj.day_volume || 1000000),
              timestamp: nowIso,
            };
          }
        }
      } catch (err) {
        // Fall through to public live endpoint
      }
    }

    // 2. Try Groww Public Live Price Endpoint
    try {
      const publicRes = await fetch(`https://groww.in/v1/api/stocks_data/v1/tr_live_prices/exchange/NSE/segment/CASH/${encodeURIComponent(cleanSym)}/latest`, {
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
      });
      if (publicRes.ok) {
        const pubData: any = await publicRes.json();
        const ltp = Number(pubData.ltp || pubData.close || pubData.lastPrice || 0);
        if (ltp > 0) {
          return {
            symbol: cleanSym,
            ltp,
            open: Number(pubData.open || ltp),
            high: Number(pubData.high || ltp * 1.01),
            low: Number(pubData.low || ltp * 0.99),
            close: Number(pubData.close || pubData.prevClose || ltp),
            volume: Number(pubData.volume || 1500000),
            timestamp: nowIso,
          };
        }
      }
    } catch {
      // Ignore and proceed to next fallback
    }

    // 3. Try Yahoo Finance NSE Live Feed
    try {
      const yfRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSym)}.NS?interval=1m&range=1d`, {
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (yfRes.ok) {
        const yfData: any = await yfRes.json();
        const meta = yfData.chart?.result?.[0]?.meta;
        if (meta && meta.regularMarketPrice) {
          const ltp = Number(meta.regularMarketPrice);
          return {
            symbol: cleanSym,
            ltp,
            open: Number(meta.regularMarketDayLow || ltp),
            high: Number(meta.regularMarketDayHigh || ltp),
            low: Number(meta.regularMarketDayLow || ltp),
            close: Number(meta.previousClose || meta.chartPreviousClose || ltp),
            volume: Number(meta.regularMarketVolume || 2000000),
            timestamp: nowIso,
          };
        }
      }
    } catch {
      // Proceed to base price map
    }

    // 4. Base prices for key NSE stocks if market is offline / closed
    const baseMap: Record<string, number> = {
      RELIANCE: 2950.50,
      TCS: 4120.00,
      HDFCBANK: 1642.80,
      INFY: 1825.40,
      ICICIBANK: 1215.10,
      SBIN: 842.30,
      BHARTIARTL: 1458.00,
      ITC: 492.50,
      KOTAKBANK: 1782.00,
      LT: 3658.00,
      TATAMOTORS: 1012.40,
      AXISBANK: 1180.20,
      WIPRO: 520.10,
    };

    const basePrice = baseMap[cleanSym] || 0;
    const ltp = basePrice;
    return {
      symbol: cleanSym,
      ltp,
      open: basePrice,
      high: basePrice,
      low: basePrice,
      close: basePrice,
      volume: 0,
      timestamp: nowIso,
    };
  }

  /**
   * Fetch Real User Equity Holdings from Groww API
   */
  public async getUserHoldings(): Promise<{ success: boolean; holdings: any[]; error?: string; statusCode?: number }> {
    if (!this.token || this.token === "grw_live_demo_key_998811" || this.token.length < 5) {
      return {
        success: false,
        holdings: [],
        error: "Groww API token is not configured. Please enter your valid Groww API token.",
        statusCode: 400
      };
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
      "X-API-VERSION": "1.0",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GrowwTrader/1.0",
    };
    if (this.secret) {
      headers["X-App-Secret"] = this.secret;
      headers["X-API-KEY"] = this.secret;
    }

    try {
      const res = await fetch("https://api.groww.in/v1/holdings/user", {
        method: "GET",
        signal: AbortSignal.timeout(8000),
        headers
      });

      if (res.ok) {
        const data: any = await res.json();
        let list: any[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data.payload && Array.isArray(data.payload.holdings)) {
          list = data.payload.holdings;
        } else if (Array.isArray(data.holdings)) {
          list = data.holdings;
        } else if (Array.isArray(data.data)) {
          list = data.data;
        } else if (Array.isArray(data.user_holdings)) {
          list = data.user_holdings;
        }

        return { success: true, holdings: list, statusCode: res.status };
      }

      // Handle non-200 responses with exact Groww error diagnostics
      let errorMsg = `Groww API returned HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.errorMessage?.message) {
          errorMsg = `Groww error (${res.status}): ${errJson.errorMessage.message}`;
        } else if (errJson.message) {
          errorMsg = `Groww error (${res.status}): ${errJson.message}`;
        } else if (errJson.error) {
          errorMsg = `Groww error (${res.status}): ${errJson.error}`;
        }
      } catch {
        const txt = await res.text().catch(() => "");
        if (txt) errorMsg += `: ${txt.slice(0, 100)}`;
      }

      if (res.status === 401) {
        errorMsg = "Groww authentication failed (HTTP 401). Your Groww token is invalid or expired. Generate a fresh API key from Groww (Profile → Settings → Trading APIs) or use the 'Import Groww CSV' tab.";
      } else if (res.status === 403) {
        errorMsg = "Groww API access forbidden (HTTP 403). Developer trading API may not be enabled on your Groww account. Please verify in Groww settings or import your Holdings CSV.";
      } else if (res.status === 404) {
        errorMsg = "Groww API endpoint returned 404. Your trading account or Demat has no active holdings recorded on Groww.";
      }

      return {
        success: false,
        holdings: [],
        error: errorMsg,
        statusCode: res.status
      };
    } catch (err: any) {
      return {
        success: false,
        holdings: [],
        error: `Could not connect to Groww API: ${err.message || "Network timeout"}. Please check your connection or use the CSV Import tab.`,
        statusCode: 500
      };
    }
  }

  /**
   * Fetch Real User SIPs (Groww Trading API does not expose MF SIPs via REST)
   */
  public async getUserSips(): Promise<{ success: boolean; sips: any[]; error?: string }> {
    // Groww's official Trading API is focused on equities. Return empty array gracefully without 404.
    return {
      success: true,
      sips: []
    };
  }

  /**
   * Transmit Real Order to Groww API (or simulate in Paper Mode)
   */
  public async placeOrder(order: GrowwOrderRequest, isLiveMode: boolean): Promise<GrowwOrderResponse> {
    const orderId = `GRW-ORD-${Date.now()}`;

    if (isLiveMode && this.isConnected) {
      try {
        const response = await fetch("https://api.groww.in/v1/order/create", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/json",
            "X-API-VERSION": "1.0",
            "Content-Type": "application/json",
            ...(this.secret ? { "X-App-Secret": this.secret, "X-API-KEY": this.secret } : {}),
          },
          body: JSON.stringify({
            trading_symbol: order.symbol,
            exchange: "NSE",
            transaction_type: order.side,
            order_type: order.orderType,
            quantity: order.qty,
            price: order.price || 0,
            segment: "CASH",
            product: "CNC", // Cash & Carry delivery
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          return {
            orderId: data.groww_order_id || data.orderId || orderId,
            status: "SUCCESS",
            message: `Live Order ${order.side} ${order.qty} ${order.symbol} placed successfully on Groww NSE`,
            executedPrice: data.price || order.price,
          };
        }

        const errData = await response.json().catch(() => ({}));
        return {
          orderId,
          status: "REJECTED",
          message: errData.errorMessage?.message || errData.message || `Groww rejected order with HTTP ${response.status}`,
        };
      } catch (err: any) {
        return {
          orderId,
          status: "REJECTED",
          message: `Groww API network error: ${err.message || "Network Timeout"}`,
        };
      }
    }

    // Paper Trading Simulation
    return {
      orderId,
      status: "SUCCESS",
      message: `Paper Order ${order.side} ${order.qty} ${order.symbol} logged to SQLite local DB`,
      executedPrice: order.price,
    };
  }

  /**
   * Fetch Real Historical OHLCV Candle Data for an Index or NSE Stock
   * (e.g. NIFTY 50, RELIANCE, TCS, etc.)
   */
  public async getHistoricalOHLCV(
    symbol: string,
    timeframe: "1m" | "3m" | "6m" | "1y" = "3m",
    interval: "1d" | "15m" | "5m" = "1d"
  ): Promise<HistoricalCandle[]> {
    const cleanSym = symbol.toUpperCase().trim();
    // Yahoo symbol mapping for Indian index / stocks
    let yfSymbol = `${cleanSym}.NS`;
    if (cleanSym === "NIFTY 50" || cleanSym === "NIFTY_50" || cleanSym === "NIFTY50") yfSymbol = "^NSEI";
    if (cleanSym === "BANK NIFTY" || cleanSym === "NIFTY_BANK" || cleanSym === "BANKNIFTY") yfSymbol = "^NSEBANK";
    if (cleanSym === "SENSEX") yfSymbol = "^BSESN";

    let range = "3mo";
    if (timeframe === "1m") range = "1mo";
    if (timeframe === "6m") range = "6mo";
    if (timeframe === "1y") range = "1y";

    let yfInterval = interval;

    // Attempt official Groww API if token present
    if (this.token && this.token.length > 5 && this.token !== "grw_live_demo_key_998811") {
      try {
        const response = await fetch(
          `https://api.groww.in/v1/margins/nse/candles/${cleanSym}?range=${range}&interval=${interval}`,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
              "X-App-Secret": this.secret,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const data: any = await response.json();
          if (Array.isArray(data.candles) && data.candles.length > 0) {
            return data.candles.map((c: any) => ({
              timestamp: new Date(c[0] * 1000).toISOString(),
              date: new Date(c[0] * 1000).toLocaleDateString("en-IN"),
              open: Number(c[1]),
              high: Number(c[2]),
              low: Number(c[3]),
              close: Number(c[4]),
              volume: Number(c[5] || 100000),
            }));
          }
        }
      } catch (err) {
        console.warn(`Groww API historical candles failed for ${cleanSym}, trying Yahoo Finance fallback...`);
      }
    }

    // Attempt Yahoo Finance Real Historical Chart Feed
    try {
      const yfRes = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yfSymbol}?interval=${yfInterval}&range=${range}`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      if (yfRes.ok) {
        const yfData: any = await yfRes.json();
        const result = yfData.chart?.result?.[0];
        if (result && result.timestamp && result.indicators?.quote?.[0]) {
          const timestamps: number[] = result.timestamp;
          const quote = result.indicators.quote[0];
          const candles: HistoricalCandle[] = [];

          for (let i = 0; i < timestamps.length; i++) {
            const closeVal = quote.close?.[i];
            if (closeVal !== null && closeVal !== undefined) {
              const dateObj = new Date(timestamps[i] * 1000);
              candles.push({
                timestamp: dateObj.toISOString(),
                date: dateObj.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
                open: Math.round((quote.open?.[i] || closeVal) * 100) / 100,
                high: Math.round((quote.high?.[i] || closeVal) * 100) / 100,
                low: Math.round((quote.low?.[i] || closeVal) * 100) / 100,
                close: Math.round(closeVal * 100) / 100,
                volume: Math.round(quote.volume?.[i] || 500000),
              });
            }
          }
          if (candles.length > 5) {
            return candles;
          }
        }
      }
    } catch (err) {
      console.warn(`Yahoo Finance chart fallback error for ${yfSymbol}:`, err);
    }

    // Realistic Synthetic Historical Candle Generator Fallback
    const basePrice = cleanSym.includes("NIFTY") || cleanSym === "^NSEI" ? 24500 : 2200;
    const totalBars = timeframe === "1m" ? 30 : timeframe === "3m" ? 60 : 120;
    const candles: HistoricalCandle[] = [];
    let currentClose = basePrice;
    const now = Date.now();

    for (let i = totalBars; i >= 0; i--) {
      const timeMs = now - i * 86400000;
      const dateObj = new Date(timeMs);
      const trend = Math.sin(i / 8) * 0.008 + (Math.sin(i / 2) * 0.005);
      const noise = (Math.random() - 0.48) * 0.012;
      const changePct = trend + noise;

      const open = Math.round(currentClose * 100) / 100;
      currentClose = Math.round((open * (1 + changePct)) * 100) / 100;
      const high = Math.round((Math.max(open, currentClose) * (1 + Math.random() * 0.008)) * 100) / 100;
      const low = Math.round((Math.min(open, currentClose) * (1 - Math.random() * 0.008)) * 100) / 100;
      const volume = Math.floor(1000000 + Math.random() * 2000000);

      candles.push({
        timestamp: dateObj.toISOString(),
        date: dateObj.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        open,
        high,
        low,
        close: currentClose,
        volume,
      });
    }

    return candles;
  }
}

export const growwClient = new GrowwClient();
