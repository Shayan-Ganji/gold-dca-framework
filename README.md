# 🪙 Systematic Gold DCA Framework & Quantitative Analytics Platform
### Interactive Showcase & Research Demonstration for Systemic Asset Accumulation

---

<div align="center">

[![Persian Documentation](https://img.shields.io/badge/🇮🇷%20مطالعه%20مستندات%20به%20زبان%20فارسی-Persian%20Readme-FFD700?style=for-the-badge&logoColor=black)](README_FA.md)

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Hosted%20on%20Server-brightgreen?style=for-the-badge&logo=google-chrome)](http://204.11.2.236:8501)
[![Telegram Bot](https://img.shields.io/badge/Telegram%20Bot-%40TalaOracle__Bot-blue?style=for-the-badge&logo=telegram)](https://t.me/TalaOracle_Bot)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Shayan-Ganji/gold-dca-framework)

<p><em>To read this documentation in Persian, click the badge above.</em></p>

</div>

---

## 🌐 Live Interactive Demo Access

A live, interactive instance of this platform is deployed and accessible directly in the browser—no local setup or Docker builds required:

🔗 **Live Platform URL:** [http://204.11.2.236:8501](http://204.11.2.236:8501)

---

## 💡 Research Motivation: Asset Accumulation in Inflationary Markets

In economies characterized by structural currency depreciation, gold functions as a primary monetary hedge and store of purchasing power. However, standard Lump-Sum capital allocations during market exuberance often expose investors to severe drawdown risk during subsequent consolidations.

This framework demonstrates the principles of **Dynamic Dollar-Cost Averaging (DCA)**:
1. **Weighted Average Cost (WAC) Optimization:** Periodic, disciplined entries dampen volatility and reduce average acquisition costs per gram relative to market peaks:
   $$\bar{P} = \frac{\sum_{i=1}^n P_i \cdot Q_i}{\sum_{i=1}^n Q_i}$$
2. **Behavioral Bias Mitigation:** Eliminates FOMO (fear of missing out) and decision paralysis during sharp market rallies.
3. **Intrinsic Parity & Bubble Tracking:** Real-time valuation comparing domestic melted gold and standard coinage against international spot parity (XAU/USD):
   $$\text{Mazaneh}_{\text{intrinsic}} = \frac{\text{XAU} \times \text{USD}}{9.5742}$$

---

## 🖥️ 1. Showcase Platform Features

The public showcase is designed to demonstrate platform capabilities, data visualization, and empirical DCA performance:

1. **Real-time Market & Technical Dashboard (`/dashboard`):**
   - **Live Rates Board:** Real-time quotes for 17K Melted Gold (Mesghal), 18K Gold, Global Spot Gold (XAU), and Emami Minted Coin with nominal bubble calculations.
   - **Tactical Quantitative Radar:** Continuous monitoring of RSI(14), MACD momentum divergence, Gold/USD parity ratio, and market volatility regimes.
   - **S/R Depth Ladder (K-Means Clustering):** Visual channel range gauge indicating current price positioning relative to nearest support ($S_1$) and resistance ($R_1$) clusters, daily pivot, and channel depth percentage.
   - **Asset Rotation & Arbitrage Matrix:** Empirical divergence analysis between physical gold, free USD, and minted coinage to identify mispriced accumulation opportunities.
   - **Historical Signal Track-Record:** Comprehensive audit of historical model classifications mapped against actual market price progression.

2. **Interactive DCA Simulation Lab (`/dca`):**
   - Interactive backtesting laboratory comparing systematic DCA strategies against Lump-Sum entries across multiple time horizons (3M, 6M, 1Y, 3Y, and historical series).
   - Detailed metrics on acquired gold weight, capital deployment efficiency, and Weighted Average Cost (WAC).

---

## 🚀 2. Production System Capabilities

> [!IMPORTANT]
> **The Core Proprietary Production Engine** is developed and operated in a private production environment to safeguard intellectual property, trading strategy confidentiality, and capital safety. Key capabilities of the operational system include:

1. **Real-Time Telemetry Pipeline (Over 60 Macro Variables):**
   - Sub-second data ingestion from domestic reference sources (such as TGJU and tala.live) combined with global macro series (XAU spot, crude oil, DXY, and interest rates).
   - Automated Cross-Validation and anomaly detection engine protecting execution against malicious or erroneous quote spikes.

2. **Hybrid Machine Learning Ensemble System:**
   - Multi-horizon predictive architecture leveraging ensemble classifiers to capture non-linear supply/demand patterns.
   - Identification of institutional accumulation phases, equilibrium ranges, and secular expansion cycles.
   - **Quant Advisor Engine:** Automated prescriptive decision guidance for claims offsetting, collateral redemption, and optimal staged exits.

3. **Dynamic Capital Preservation & Risk Controls:**
   - Volatility-adjusted trailing stop-loss logic (Chandelier Exit / ATR-based) with dynamic invalidation thresholds.
   - Multi-tier progressive profit-locking boundaries (TP1 and TP2).

4. **Double-Entry Accounting & Real-Time Ledger:**
   - Real-time journal entries, automated settlement accounting, weighted inventory tracking, and breakeven point calculation.
   - Investor partner accounting module with mathematically exact profit-sharing proportional to active liquidity deployment.

---

## 📱 3. Production Access & Project Inquiries

Operational access to algorithmic signals, advisor reports, and system management is provisioned through the **Official Telegram Bot**:

👉 **Official Telegram Bot & Admin Contact:** [@TalaOracle_Bot](https://t.me/TalaOracle_Bot)

### Bot Access Tiers:
- 👤 **Guest / Public Tier:** Free access to live market rates, intrinsic valuation, bubble metrics, and system overview.
- 📩 **Contact Project Lead:** By selecting **"📩 ارتباط با ادمین" (Contact Admin)** in the bot, employers, researchers, and partners can send inquiries or collaboration proposals directly to the project lead (**Shayan Ganji**).
- 🤝 **Investor Partners Pool:** Dedicated authenticated portal with PIN security for registered capital partners to monitor active capital, closed settlements, and net realized profit.
- 👑 **Institutional / VIP Access:** Real-time algorithmic machine learning signals, risk management parameters, and Quant Advisor tactical guidance.

---

## 🛠️ Showcase Repository Structure

```
showcase/
├── backend/
│   ├── main.py                 # FastAPI service serving market rates, clustering, and technical metrics
│   ├── gold_history.csv        # Multi-year historical series for DCA backtester
│   ├── gold_data_cache.csv     # Recent quotes for KMeans multi-horizon S/R calculations
│   ├── historical_signals.json # Verified historical model signals for performance audit
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/dashboard/ # Tactical Radar, S/R Depth Ladder, Signal History Chart
│   │   ├── routes/_authenticated/dashboard.tsx # Main analytical dashboard
│   │   ├── routes/_authenticated/dca.tsx       # Interactive DCA backtesting laboratory
│   │   └── lib/market-engine.tsx # Real-time state management client
│   ├── package.json
│   └── vite.config.ts
├── nginx/
│   └── default.conf            # Nginx reverse proxy configuration
└── docker-compose.yml
```

---

<div align="center">
<strong>Architected & Developed by Shayan Ganji</strong><br/>
<em>Quantitative Finance & Algorithmic Systems Engineering</em>
</div>
