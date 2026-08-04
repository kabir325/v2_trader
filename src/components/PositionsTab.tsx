import React from "react";
import { Position, Trade } from "../types";
import { ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, XCircle, FileSpreadsheet } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

interface PositionsTabProps {
  positions: Position[];
  closedTrades: Trade[];
  onRunCycle: () => void;
}

export const PositionsTab: React.FC<PositionsTabProps> = ({
  positions,
  closedTrades,
  onRunCycle,
}) => {
  return (
    <div className="space-y-6">
      {/* Active Open Positions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Active Open Positions ({positions.length})
            </h3>
            <p className="text-xs text-slate-400">
              Live tracked open trades with real-time mark-to-market P&L calculation
            </p>
          </div>
        </div>

        {positions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No active open positions. Run a trading cycle to evaluate strategies.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Mode</th>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Side</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">
                    <span className="inline-flex items-center justify-end">
                      Avg Entry Price
                      <InfoTooltip title="Avg Entry Price" text="The average cost per share at which you bought this stock." />
                    </span>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <span className="inline-flex items-center justify-end">
                      LTP (Current)
                      <InfoTooltip title="Last Traded Price (LTP)" text="The latest live price per share on the National Stock Exchange (NSE)." />
                    </span>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <span className="inline-flex items-center justify-end">
                      Position Value
                      <InfoTooltip title="Position Value" text="Total current market value of your shares (Quantity × LTP)." />
                    </span>
                  </th>
                  <th className="py-3 px-4 text-right rounded-r-lg">
                    <span className="inline-flex items-center justify-end">
                      Unrealized P&L
                      <InfoTooltip title="Unrealized P&L" text="Live paper profit or loss if you were to sell all shares right now." />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {positions.map((pos) => {
                  const isPos = pos.pnl >= 0;
                  const totalVal = Math.round(pos.qty * pos.currentPrice * 100) / 100;
                  return (
                    <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                            pos.mode === "LIVE"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {pos.mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{pos.symbol}</td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-semibold">{pos.side}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{pos.qty}</td>
                      <td className="py-3 px-4 text-right font-medium">₹{pos.avgPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-white">
                        ₹{pos.currentPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-300">
                        ₹{totalVal.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span
                          className={`inline-flex items-center ${
                            isPos ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isPos ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                          {isPos ? "+" : ""}₹{pos.pnl.toFixed(2)} ({pos.pnlPct}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Closed Positions & Realized Trade Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              Closed Trades & Realized P&L History ({closedTrades.length})
            </h3>
            <p className="text-xs text-slate-400">
              Completed buy/sell transactions with exit reasons and realized returns
            </p>
          </div>
        </div>

        {closedTrades.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No closed trades logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Time</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Side</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Execution Price</th>
                  <th className="py-3 px-4 text-right">Total Trade Value</th>
                  <th className="py-3 px-4 text-right">
                    <span className="inline-flex items-center justify-end">
                      Realized P&L
                      <InfoTooltip title="Realized P&L" text="The actual net profit or loss permanently booked after selling this stock." />
                    </span>
                  </th>
                  <th className="py-3 px-4 rounded-r-lg">
                    <span className="inline-flex items-center">
                      Strategy Reason
                      <InfoTooltip title="Exit Strategy Reason" text="Why the bot executed this sell order (e.g. Stop Loss hit, Take Profit target reached, or ML signal)." />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {closedTrades.map((tr) => {
                  const isPos = (tr.pnl || 0) >= 0;
                  return (
                    <tr key={tr.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(tr.timestamp).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-medium">
                          {tr.mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{tr.symbol}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            tr.side === "BUY" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {tr.side}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{tr.qty}</td>
                      <td className="py-3 px-4 text-right font-medium">₹{tr.price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-300">
                        ₹{tr.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        {tr.pnl !== undefined ? (
                          <span
                            className={`inline-flex items-center ${
                              isPos ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {isPos ? "+" : ""}₹{tr.pnl.toFixed(2)} ({tr.pnlPct}%)
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                        {tr.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
