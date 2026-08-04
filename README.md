# My Money Maker — Groww Algorithmic Trading & Machine Learning Platform

A full-stack, production-grade algorithmic trading software for **NSE India** integrated with the **Groww API**. It features a **RandomForest Machine Learning strategy engine**, real-time paper/live trading execution, risk controls, system log inspectors, and an automatic **Raspberry Pi systemd daemon** designed for 24/7 autonomous remote operation with power-loss fault tolerance.

---

## 🌟 Key Features

1. **Groww API Integration**
   - Seamless connection to **Groww Developer API** (`developer.groww.in`).
   - Supports **API Key**, **API Secret**, and **TOTP Key 2FA Auto-Login**.
   - Real-time quote fetching for NSE equities, order placement, and execution callbacks.

2. **RandomForest Machine Learning Engine**
   - **Phase 1 (Weeks 1–3):** Paper trading baseline collects 1-minute market snapshot candles with technical indicators (RSI, MACD, Bollinger Bands, Volume Spikes).
   - **Phase 2 (Week 4+):** Automatically trains a **RandomForest Classifier** on historical data to predict intraday price direction and trigger high-probability entry/exit signals.
   - Interactive retrain trigger and weekly performance historical tracking.

3. **Risk Management & Position Control Settings**
   - **Max Trade Amount (₹):** Cap maximum capital allocated per individual order.
   - **Stop Loss & Take Profit %:** Automatic order exit guards.
   - **Max Concurrent Positions:** Prevents portfolio over-exposure.
   - **Poll Interval:** Customizable market polling frequency.

4. **Data Reset Options**
   - **Reset Portfolio Capital:** Quickly reset virtual portfolio cash back to starting balance.
   - **Hard Reset & Data Wipe:** Wipes all positions, trade history, model runs, and logs, allowing you to restart with ₹0 or any custom starting balance.

5. **Raspberry Pi Remote Deployment & High Fault Tolerance**
   - **Power-Loss Resilient:** Configured with SQLite Write-Ahead Logging (`DATABASE_MODE=WAL`) so database files do not corrupt on sudden power outages or ungraceful reboots.
   - **Systemd Daemon Service:** Automatically launches on boot, restarts within 5 seconds on crash, and features system Watchdog pings.

---

## 🛠️ Groww API Setup (API Key & Secret)

You can configure your Groww credentials in **two ways**:

### Option 1: Via the Application UI (System & Config Tab)
1. Open the **System & Config** tab in the top navigation bar.
2. Locate the **Groww API Key & Live Secret Credentials** card.
3. Enter your credentials:
   - `GROWW_API_TOKEN`: Your API Key from Groww Developer Console.
   - `GROWW_API_SECRET`: Your Secret Key from Groww Developer Console.
   - `GROWW_TOTP_KEY`: Your 2FA TOTP secret key for automated morning session login.
4. Click **Save Configuration & API Credentials**.

### Option 2: Via Environment Variables (`.env`)
Create or update the `.env` file in the root directory:

```env
# GROWW API CREDENTIALS
GROWW_API_TOKEN="your_groww_api_token_here"
GROWW_API_SECRET="your_groww_api_secret_here"
GROWW_TOTP_KEY="your_groww_totp_key_here"

# FAULT-TOLERANT DATABASE & PORT
NODE_ENV="production"
PORT=3000
DATABASE_MODE="WAL"
```

---

## 🍓 Raspberry Pi Installation & Remote Setup Guide

Follow these steps to run the software 24/7 on a Raspberry Pi (Raspberry Pi OS / Ubuntu Server):

### Step 1: Clone & Install Dependencies
```bash
# Clone repository on your Raspberry Pi
git clone https://github.com/your-username/groww-trader.git /home/pi/groww-trader
cd /home/pi/groww-trader

# Install production dependencies
npm install

# Build static assets & server bundle
npm run build
```

### Step 2: Install Systemd Service File
Download or copy the generated `.service` file from the **System & Config** tab or copy the content below into `/etc/systemd/system/groww-trader.service`:

```ini
[Unit]
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
WantedBy=multi-user.target
```

### Step 3: Enable and Start Daemon
```bash
# Copy service file
sudo cp groww-trader.service /etc/systemd/system/

# Reload systemd manager
sudo systemctl daemon-reload

# Enable service to run on Raspberry Pi startup & start immediately
sudo systemctl enable --now groww-trader
```

### Step 4: Verify Status and View Streaming Logs
```bash
# Check running status
sudo systemctl status groww-trader

# Stream live real-time system logs
sudo journalctl -u groww-trader -f
```

---

## 🛡️ Fault Tolerance & Power Loss Design

1. **SQLite Write-Ahead Logging (WAL):**
   When `DATABASE_MODE=WAL` is active, SQLite writes changes to a dedicated log file before committing to disk, eliminating database corruption if the Raspberry Pi loses power without a UPS.

2. **Systemd Watchdog & Auto-Restart:**
   If the daemon crashes or hangs due to a network disconnect, `systemctl` automatically restarts the application within 5 seconds.

3. **In-Memory State Persistence:**
   All market snapshots, trades, and model checkpoints are saved to disk on every market tick.

---

## 📡 API Endpoint Overview

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/portfolio` | `GET` | Returns cash balance, open positions, P&L, closed trade logs, equity curve |
| `/api/trader/cycle` | `POST` | Triggers a single market scan & execution tick |
| `/api/trader/reset` | `POST` | Resets portfolio capital or performs hard data wipe |
| `/api/trader/train-model` | `POST` | Triggers immediate retrain of RandomForest ML model |
| `/api/watchlist` | `GET` / `POST` | Manage stock watchlist and priorities |
| `/api/config` | `GET` / `POST` | View and update risk controls & Groww API keys |
| `/api/logs` | `GET` | Inspect rotating system log files |
| `/api/systemd/download` | `GET` | Download Raspberry Pi systemd service file |

---

## 📄 License

MIT License. Designed for personal algorithmic trading and educational market research on the National Stock Exchange (NSE) India.
