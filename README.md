# 🪙 Systematic Gold DCA Framework & Quantitative Analytics Platform
### Interactive Showcase & Research Demonstration for Systemic Asset Accumulation

---

<div align="center">

[![Persian Documentation](https://img.shields.io/badge/🇮🇷%20مطالعه%20مستندات%20به%20زبان%20فارسی-Persian%20Readme-FFD700?style=for-the-badge&logoColor=black)](README_FA.md)

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Hosted%20on%20Server-brightgreen?style=for-the-badge&logo=google-chrome)](http://204.11.2.236:8501)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Shayan-Ganji/gold-dca-framework)

<p><em>To read this documentation in Persian, click the badge above.</em></p>

</div>

---

## 🌐 Live Interactive Demo Access

A live, interactive instance of this platform is deployed and publicly accessible directly in the browser—no local setup, Python dependencies, or Docker builds required:

🔗 **Live Platform URL:** [http://204.11.2.236:8501](http://204.11.2.236:8501)

> **Infrastructure Note:** The showcase runs on an ultra-lightweight containerized architecture (FastAPI backend + Nginx static server + optimized React client). It consumes minimal server memory (<150MB RAM) and CPU, ensuring seamless 24/7 availability for evaluators and researchers without impacting host system workloads.

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

## 🔒 Showcase Scope & Proprietary Platform Separation

This repository serves strictly as an **educational showcase, visualization layer, and Proof-of-Concept (PoC)**.

> [!IMPORTANT]
> **The Core Proprietary Production Engine** is developed and operated privately to safeguard intellectual property and trading strategy confidentiality. Key distinctions of the full private platform include:
> - **Ingestion of Over 60 Telemetry Variables:** High-frequency data feeds from domestic reference platforms (such as TGJU and tala.live) combined with global macro series, tracking currency divergence, velocity, and liquidity flows.
> - **Proprietary Predictive Models & Regime Classifiers:** Mathematical multi-horizon algorithms detecting accumulation phases and market fatigue.
> - **Automated Risk Management:** Multi-tiered capital protection, dynamic trailing stops, and systematic profit-locking parameters.
> - **Transaction Accounting & Ledger Core:** Full execution pipelines integrated with private persistence databases.
>
> In this public showcase, live signals remain securely locked (`VIP Only`) to protect proprietary execution strategies, while verified historical backtests and real-time technical indicators remain fully accessible.

---

## 📊 Showcase Platform Features

1. **Real-time Market & Technical Dashboard (`/dashboard`):**
   - Live rates for 17K Melted Gold (Mesghal), 18K Gold, Global Ounce, and Emami Coin with nominal bubble calculations.
   - Quantitative Tactical Radar: Tracking RSI(14), MACD momentum divergence, Gold/USD ratio, and active market regime.
   - S/R Depth Ladder: Visual channel range gauge showing exact real-time price position between multi-horizon KMeans support and resistance clusters.
   - Quantitative Arbitrage & Rotation Matrix: Evaluating divergence between physical gold, free USD, and minted coinage.
   - Historical Signal Track-Record Chart: Auditing past model predictions against long-term price series.

2. **Interactive DCA Simulation Lab (`/dca`):**
   - Interactive backtesting engine comparing DCA accumulation vs. Lump-Sum investments across 3M, 6M, 1Y, 3Y, and historical horizons.
   - Detailed breakdown of total invested capital, acquired gold weight, weighted average cost per gram, and net profit.

---

## 🛠️ Architecture & Technology Stack

```
showcase/
├── backend/
│   ├── main.py                 # FastAPI service serving clean market quotes & technical indicators
│   ├── gold_history.csv        # Multi-year historical series for DCA backtester
│   ├── gold_data_cache.csv     # Recent series for KMeans multi-horizon S/R calculations
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

## 🤝 Contact & Inquiries

This framework illustrates quantitative research and software engineering methodologies applied to gold market analysis. For institutional inquiries, quantitative investment partnerships, or research discussions:

- **GitHub:** [Shayan-Ganji](https://github.com/Shayan-Ganji)
- **Live Showcase URL:** [http://204.11.2.236:8501](http://204.11.2.236:8501)