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

## 🛠️ Groww API Setup & Credentials Breakdown

On the Groww Developer Console / Account Security settings, you will see two separate options: **Access Token (API Key)** and **2FA / TOTP Key**. You need **BOTH** to enable fully automated trading without manual daily logins:

### 1. Access Token & API Secret (`GROWW_API_TOKEN` & `GROWW_API_SECRET`)
- **What it is:** Select **"Access Token / Create API App"** in `developer.groww.in`.
- **GROWW_API_TOKEN:** Paste the generated **Access Token** (or API Key) here. This identifies your trading app and grants API authorization to read market data and place orders.
- **GROWW_API_SECRET:** Paste the **App Secret** (or API Secret) generated alongside your token. Used for header signature verification.

---

### 2. 2FA TOTP Key (`GROWW_TOTP_KEY`)
- **What it is:** Go to Groww Mobile App or Web &rarr; **Account & Security Settings &rarr; 2FA / TOTP for API**.
- **How to set it up:** When enabling 2FA, Groww will display a QR code along with a **16-character alphanumeric Secret Key** beneath or beside the QR code (e.g. `JBSWY3DPEHPK3PXP`).
- **GROWW_TOTP_KEY:** Copy that **16-character secret key string** into `GROWW_TOTP_KEY`.
- **Why this is needed:** Instead of requiring you to open Google Authenticator and manually type a 6-digit code every morning, the Raspberry Pi daemon uses this key to mathematically compute valid 6-digit TOTP codes automatically at market open!

---

### Quick Summary Table:

| Field | Where to generate in Groww | What value to copy |
| :--- | :--- | :--- |
| **`GROWW_API_TOKEN`** | Developer Console (`developer.groww.in`) &rarr; **Access Token / API Key** | The generated **Access Token** / API Key string |
| **`GROWW_API_SECRET`** | Developer Console (`developer.groww.in`) &rarr; **Access Token / API Key** | The generated **App Secret** key string |
| **`GROWW_TOTP_KEY`** | Account & Security &rarr; **2FA / TOTP Setup** | The **16-character secret key** (shown under the QR code) |

---

### Option 1: Configure via Application UI (System & Config Tab)
1. Open the **System & Config** tab in the app UI.
2. Fill in the three fields in the **Groww API Key & Live Secret Credentials** box.
3. Click **Save Configuration & API Credentials**.

### Option 2: Configure via Environment Variables (`.env`)
Create or update your `.env` file on your server / Raspberry Pi:

```env
# GROWW API CREDENTIALS
GROWW_API_TOKEN="grw_live_token_your_access_token_here"
GROWW_API_SECRET="sec_groww_your_app_secret_here"
GROWW_TOTP_KEY="JBSWY3DPEHPK3PXP" # 16-character TOTP secret key string

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
