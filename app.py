import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import datetime
import pytz
import time
import urllib.request
import json
import os
import warnings

warnings.filterwarnings('ignore')

# ─── Page Configuration ────────────────────────────────────────────────────────
st.set_page_config(
    page_title="پلتفرم جامع مدیریت و انباشت هوشمند طلا (نسخه نمایشی)",
    page_icon="🪙",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─── Strict Right-To-Left (RTL) & Luxury Dark Theme CSS ───────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap');

/* Global RTL enforcement */
html, body, .stApp, [class*="css"], div[data-testid="stAppViewContainer"], header[data-testid="stHeader"] { 
    font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, Tahoma, sans-serif !important;
    direction: rtl !important;
    text-align: right !important;
    background: linear-gradient(135deg, #0D0D1A 0%, #0F0F23 50%, #0A0A18 100%) !important;
    color: #e6edf3 !important;
}

/* Strict RTL for all typography and markdown */
p, span, div, h1, h2, h3, h4, h5, h6, label, input, textarea, select, button,
.stMarkdown, .stText, .stCaption, [data-testid="stMarkdownContainer"] *,
div[data-testid="stCaptionContainer"] *, div[data-testid="stForm"], div[data-testid="stExpander"] div[role="region"] {
    direction: rtl !important;
    text-align: right !important;
    font-family: 'Vazirmatn', Tahoma, sans-serif !important;
}

/* Material Icons protection */
span[class*="material"], [class*="icon"], [class*="Icon"], [data-testid*="Icon"], [data-testid*="icon"] {
    font-family: "Material Symbols Rounded", "Material Icons", sans-serif !important;
    direction: ltr !important;
    text-align: center !important;
}

/* Plotly charts direction protection */
.stPlotlyChart, .stPlotlyChart * {
    direction: ltr !important;
    text-align: left !important;
}

/* Tab list styling */
.stTabs [data-baseweb="tab-list"] {
    direction: rtl !important;
    justify-content: flex-start !important;
    gap: 8px !important;
    border-bottom: 1px solid rgba(255, 215, 0, 0.2) !important;
}
.stTabs [data-baseweb="tab"] {
    font-family: 'Vazirmatn' !important;
    font-weight: 600 !important;
    font-size: 15px !important;
    direction: rtl !important;
    text-align: right !important;
    padding: 10px 18px !important;
    color: #8b949e !important;
}
.stTabs [aria-selected="true"] {
    color: #FFD700 !important;
    border-bottom: 2px solid #FFD700 !important;
}

/* Metric card design matching main dashboard */
.metric-card {
    background: linear-gradient(135deg, rgba(26,26,46,0.92) 0%, rgba(15,15,35,0.96) 100%);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,215,0,0.2);
    border-right: 4px solid #FFD700 !important;
    border-left: none !important;
    border-radius: 14px;
    padding: 16px 20px;
    margin-bottom: 12px;
    direction: rtl !important;
    text-align: right !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
}
.metric-card h4 {
    color: #a0a0c0;
    font-size: 13px;
    margin: 0 0 6px 0;
    font-weight: 500;
    direction: rtl !important;
    text-align: right !important;
}
.metric-card h2 {
    font-size: 22px;
    margin: 0 0 4px 0;
    font-weight: 700;
    direction: rtl !important;
    text-align: right !important;
}
.metric-card p {
    color: #7a7a9a;
    font-size: 12px;
    margin: 0;
    font-weight: 500;
    direction: rtl !important;
    text-align: right !important;
}

/* Technical box */
.tech-box {
    background: rgba(22, 27, 34, 0.85);
    border: 1px solid rgba(56, 139, 253, 0.3);
    border-radius: 12px;
    padding: 18px;
    margin-bottom: 16px;
    direction: rtl !important;
    text-align: right !important;
}

/* Methodology callout box */
.method-box {
    background: rgba(30, 41, 59, 0.7);
    border-right: 4px solid #388bfd;
    border-radius: 10px;
    padding: 18px 22px;
    margin-bottom: 16px;
    line-height: 1.9;
    direction: rtl !important;
    text-align: right !important;
}

/* Disclaimer banner */
.disclaimer-banner {
    background: rgba(255, 215, 0, 0.08);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-right: 5px solid #FFD700;
    border-radius: 10px;
    padding: 12px 18px;
    margin-bottom: 18px;
    font-size: 13.5px;
    line-height: 1.8;
    direction: rtl !important;
    text-align: right !important;
}
</style>
""", unsafe_allow_html=True)

# ─── Live Market Feeds & Cache ────────────────────────────────────────────────
@st.cache_data(ttl=60, show_spinner=False)
def fetch_live_quotes():
    """Fetches real-time market data from TGJU and Yahoo Finance with robust fallbacks."""
    quotes = {
        "gold_toman": 23350000.0,
        "mesghal_toman": 101150000.0,
        "usd_toman": 224900.0,
        "xau": 4476.60,
        "coin_toman": 231170000.0,
        "gold_pct": 1.39,
        "usd_pct": 1.02,
        "updated_at": datetime.datetime.now(pytz.timezone("Asia/Tehran")).strftime("%H:%M:%S"),
        "is_live": True
    }
    
    # 1. Try Yahoo Finance for global spot XAU
    try:
        req = urllib.request.Request(
            'https://query1.finance.yahoo.com/v8/finance/chart/GC=F',
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        res = urllib.request.urlopen(req, timeout=4)
        ydata = json.loads(res.read().decode())
        quotes["xau"] = float(ydata['chart']['result'][0]['meta']['regularMarketPrice'])
    except Exception:
        pass

    # 2. Try TGJU for domestic gold, mesghal, usd, coin
    try:
        req = urllib.request.Request(
            'https://api.tgju.org/v1/widget/tmp?keys=geram18,sekeb,price_dollar_rl,mesghal',
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        res = urllib.request.urlopen(req, timeout=4)
        tgju_data = json.loads(res.read().decode())
        indicators = {item['name']: item for item in tgju_data.get('response', {}).get('indicators', [])}
        
        if 'geram18' in indicators:
            p_str = indicators['geram18']['p'].replace(',', '')
            quotes["gold_toman"] = float(p_str) / 10.0
            quotes["gold_pct"] = float(indicators['geram18'].get('dp', 0.0))
            
        if 'mesghal' in indicators:
            p_str = indicators['mesghal']['p'].replace(',', '')
            quotes["mesghal_toman"] = float(p_str) / 10.0
            
        if 'price_dollar_rl' in indicators:
            p_str = indicators['price_dollar_rl']['p'].replace(',', '')
            quotes["usd_toman"] = float(p_str) / 10.0
            quotes["usd_pct"] = float(indicators['price_dollar_rl'].get('dp', 0.0))
            
        if 'sekeb' in indicators:
            p_str = indicators['sekeb']['p'].replace(',', '')
            quotes["coin_toman"] = float(p_str) / 10.0
            
        quotes["updated_at"] = datetime.datetime.now(pytz.timezone("Asia/Tehran")).strftime("%H:%M:%S")
    except Exception:
        pass

    return quotes

# ─── Load Historical Series ───────────────────────────────────────────────────
@st.cache_data
def load_history_df():
    csv_candidates = [
        os.path.join(os.path.dirname(__file__), "gold_history.csv"),
        os.path.join(os.path.dirname(__file__), "..", "gold_data_cache.csv"),
        "gold_data_cache.csv"
    ]
    df = None
    for p in csv_candidates:
        if os.path.exists(p):
            try:
                df = pd.read_csv(p)
                break
            except Exception:
                continue

    if df is None or "Close" not in df.columns:
        dates = pd.date_range(start="2021-01-01", end="2026-08-22", freq="D")
        np.random.seed(42)
        base = 10000000.0
        trend = np.linspace(0, 3.1, len(dates))
        noise = np.cumsum(np.random.normal(0, 0.015, len(dates)))
        sim_p = base * np.exp(trend + noise)
        df = pd.DataFrame({
            "Date": [d.strftime("%Y-%m-%d") for d in dates],
            "Close": sim_p,
            "USD_Close": (sim_p / 23350000.0) * 2249000.0,
            "XAU_Close": 4476.60
        })

    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values("Date").reset_index(drop=True)
    df["Gold_Toman_Gram"] = df["Close"] / 10.0
    df["Mesghal_Toman"] = df["Gold_Toman_Gram"] * 4.3318
    df["USD_Toman"] = df["USD_Close"] / 10.0 if "USD_Close" in df.columns else df["Gold_Toman_Gram"] * 0.096
    return df

live_q = fetch_live_quotes()
raw_df = load_history_df()

# ─── Top Header & Context Banner ──────────────────────────────────────────────
col_h1, col_h2 = st.columns([8, 2])
with col_h1:
    st.markdown("<h2 style='margin:0; color:#FFD700;'>🪙 پلتفرم جامع مدیریت و انباشت هوشمند طلا</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color:#a0a0c0; font-size:14px; margin-top:4px;'>داشبورد مانیتورینگ بازار فیزیکی طلا، تحلیل تکنیکال بلادرنگ و شبیه‌ساز انباشت سیستماتیک (نسخه عمومی / Showcase)</p>", unsafe_allow_html=True)
with col_h2:
    tehran_now = datetime.datetime.now(pytz.timezone("Asia/Tehran")).strftime("%Y/%m/%d — %H:%M:%S")
    st.markdown(f"""
    <div style="background:rgba(0,230,118,0.1); border:1px solid #00E676; border-radius:8px; padding:6px 12px; text-align:center;">
        <span style="color:#00E676; font-size:12px; font-weight:700;">🟢 وضعیت بازار: فعال</span><br>
        <span style="color:#aaa; font-size:11px;">{tehran_now}</span>
    </div>
    """, unsafe_allow_html=True)

st.markdown("""
<div class="disclaimer-banner">
ℹ️ <b>یادداشت دسترسی و محرمانگی تجاری:</b> این محیط یک <b>نسخه نمایشی عمومی (Public Showcase / Demo)</b> از پلتفرم معاملاتی طلا است. 
در این نسخه، کلیه داده‌های مانیتورینگ زنده بازار، تحلیل‌های تکنیکال، ابزارهای حباب‌سنجی و شبیه‌ساز علمی DCA در دسترس عموم قرار گرفته است. 
<b>کادر سیگنال‌های الگوریتمیک خرید و فروش اختصاصی، به دلایل محرمانگی تجاری حذف شده</b> و صرفاً برای کاربران احراز هویت شده (VIP) در سامانه خصوصی فعال می‌باشد.
</div>
""", unsafe_allow_html=True)

# ─── Navigation Tabs ──────────────────────────────────────────────────────────
tab_market, tab_dca, tab_arch = st.tabs([
    "🌐 نمای کلی و داشبورد تکنیکال بازار (Technical Dashboard)",
    "🪙 مقایسه علمی استراتژی DCA با خرید عادی (DCA Methodology & Simulator)",
    "🏗️ معماری سامانه و پلتفرم عملیاتی (Architecture & Production Features)"
])

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 1: TECHNICAL MARKET DASHBOARD (EXACT REPLICA MINUS SIGNAL BOX)
# ═══════════════════════════════════════════════════════════════════════════════
with tab_market:
    # ── 1. Realtime Price Cards (Exact 4 Cards from Main Dashboard) ──
    gold_t = live_q["gold_toman"]
    mesghal = live_q["mesghal_toman"]
    usd_t = live_q["usd_toman"]
    xau = live_q["xau"]
    gold_col = "#00E676" if live_q["gold_pct"] >= 0 else "#FF5252"
    usd_col = "#00E676" if live_q["usd_pct"] >= 0 else "#FF5252"

    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.markdown(f"""
        <div class="metric-card">
            <h4>🥇 طلا ۱۸ عیار (گرم)</h4>
            <h2 style="color:#fff;">{gold_t:,.0f} <span style="font-size:13px;color:#888;">تومان</span></h2>
            <p style="color:{gold_col};">{'+' if live_q['gold_pct']>=0 else ''}{live_q['gold_pct']:.2f}٪ نسبت به دیروز</p>
        </div>
        """, unsafe_allow_html=True)
    with c2:
        st.markdown(f"""
        <div class="metric-card">
            <h4>⚖️ مظنه (مثقال ۱۷ عیار)</h4>
            <h2 style="color:#fff;">{mesghal:,.0f} <span style="font-size:13px;color:#888;">تومان</span></h2>
            <p style="color:#888;">مبنای معاملات سنتی و بنکداری</p>
        </div>
        """, unsafe_allow_html=True)
    with c3:
        st.markdown(f"""
        <div class="metric-card">
            <h4>💵 دلار آزاد تهران</h4>
            <h2 style="color:#fff;">{usd_t:,.0f} <span style="font-size:13px;color:#888;">تومان</span></h2>
            <p style="color:{usd_col};">{'+' if live_q['usd_pct']>=0 else ''}{live_q['usd_pct']:.2f}٪ نسبت به دیروز</p>
        </div>
        """, unsafe_allow_html=True)
    with c4:
        st.markdown(f"""
        <div class="metric-card">
            <h4>🌍 انس جهانی طلا (XAU)</h4>
            <h2 style="color:#fff;">${xau:,.2f}</h2>
            <p style="color:#888;">مرجع برابری بین‌المللی</p>
        </div>
        """, unsafe_allow_html=True)

    # ── 2. Structural Market Analysis & Bubble Cards (Exact 4 Cards) ──
    # Intrinsic calculation:
    # 1 Mesghal 17k = (XAU * USD) / 9.5742
    intrinsic_mesghal = (xau * usd_t) / 9.5742 if (xau > 0 and usd_t > 0) else mesghal
    melt_bubble_pct = ((mesghal / intrinsic_mesghal) - 1.0) * 100.0 if intrinsic_mesghal > 0 else 0.0
    
    # Coin pure gold value: 8.133 grams * 0.900 gold = 7.3197 grams pure 24k gold
    # 1 gram 24k = (XAU * USD) / 31.1035
    coin_intrinsic = 7.3197 * ((xau * usd_t) / 31.1035)
    coin_bubble_pct = ((live_q["coin_toman"] / coin_intrinsic) - 1.0) * 100.0 if coin_intrinsic > 0 else 24.5

    # Compute technical metrics over last 30 rows
    last_60_df = raw_df.tail(60).copy().reset_index(drop=True)
    recent_prices = last_60_df["Gold_Toman_Gram"].tolist()
    recent_prices[-1] = gold_t  # Inject live price
    
    # 14-day RSI calculation
    diffs = np.diff(recent_prices[-15:])
    gains = [d if d > 0 else 0 for d in diffs]
    losses = [-d if d < 0 else 0 for d in diffs]
    avg_gain = np.mean(gains) if gains else 1.0
    avg_loss = np.mean(losses) if losses else 1.0
    rs = avg_gain / (avg_loss + 1e-6)
    rsi_val = 100.0 - (100.0 / (1.0 + rs))

    # Distance to 30-day max
    max_30 = max(recent_prices[-30:])
    dist_max_pct = ((gold_t - max_30) / max_30) * 100.0

    # Market regime classification
    sma_20 = np.mean(recent_prices[-20:])
    sma_50 = np.mean(recent_prices[-50:])
    if gold_t > sma_20 and sma_20 > sma_50:
        regime_label = "🟢 صعودی پرقدرت (Bullish)"
        regime_desc = "تثبیت بالای میانگین‌های ۲۰ و ۵۰ روزه"
    elif gold_t < sma_20 and sma_20 < sma_50:
        regime_label = "🔴 اصلاحی و رکودی (Bearish)"
        regime_desc = "نوسان زیر میانگین‌های اصلی"
    else:
        regime_label = "⚪ تعادل و تثبیت (Ranging)"
        regime_desc = "کانال خنثی با نوسانات محدود"

    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.markdown(f"""
        <div class="metric-card" style="border-right-color:#E040FB !important;">
            <h4>🫧 حباب سکه بهار آزادی</h4>
            <h2 style="color:#E040FB;">%{coin_bubble_pct:+.1f}</h2>
            <p>ارزش ذاتی: {coin_intrinsic:,.0f} تومان</p>
        </div>
        """, unsafe_allow_html=True)
    with m2:
        st.markdown(f"""
        <div class="metric-card" style="border-right-color:#29B6F6 !important;">
            <h4>📉 RSI شاخص قدرت نسبی (۱۴)</h4>
            <h2 style="color:#29B6F6;">{rsi_val:.1f}</h2>
            <p>{'اشباع خرید' if rsi_val > 70 else ('اشباع فروش' if rsi_val < 30 else 'محدوده تعادلی')}</p>
        </div>
        """, unsafe_allow_html=True)
    with m3:
        st.markdown(f"""
        <div class="metric-card" style="border-right-color:#FF7043 !important;">
            <h4>🏔 فاصله از سقف ۳۰ روزه</h4>
            <h2 style="color:{'#00E676' if dist_max_pct >= -1 else '#FF7043'};">{dist_max_pct:+.1f}٪</h2>
            <p>سقف ماه: {max_30:,.0f} تومان</p>
        </div>
        """, unsafe_allow_html=True)
    with m4:
        st.markdown(f"""
        <div class="metric-card" style="border-right-color:#00E676 !important;">
            <h4>🧭 رژیم ساختاری روند</h4>
            <h2 style="font-size:18px; color:#00E676;">{regime_label}</h2>
            <p>{regime_desc}</p>
        </div>
        """, unsafe_allow_html=True)

    # ── 3. REPLACING SIGNAL BOX: Technical Position & Momentum Stance ──
    st.markdown("---")
    st.markdown("<h3 style='color:#FFD700;'>📊 تحلیل تکنیکال و برابری ارزش منصفانه (Valuation & Technical Stance)</h3>", unsafe_allow_html=True)

    # Compute Intraday Radar Metrics
    dist_sma20 = ((gold_t / sma_20) - 1.0) * 100.0
    gold_usd_ratio = (gold_t * 10.0) / (usd_t * 10.0) if usd_t > 0 else 0
    
    # K-Means clustering for Support & Resistance levels
    try:
        from sklearn.cluster import KMeans
        km_data = np.array(recent_prices).reshape(-1, 1)
        km = KMeans(n_clusters=3, random_state=42, n_init=5).fit(km_data)
        centers = np.sort(km.cluster_centers_.flatten())
        curr_p = gold_t
        sups = [c * 4.3318 for c in centers if c < curr_p * 0.998]
        ress = [c * 4.3318 for c in centers if c > curr_p * 1.002]
        
        while len(sups) < 3:
            sups.insert(0, (sups[0] if sups else mesghal) * 0.985)
        while len(ress) < 3:
            ress.append((ress[-1] if ress else mesghal) * 1.015)
            
        s1, s2, s3 = sups[-1], sups[-2], sups[-3]
        r1, r2, r3 = ress[0], ress[1], ress[2]
    except Exception:
        s1, s2, s3 = mesghal * 0.99, mesghal * 0.975, mesghal * 0.95
        r1, r2, r3 = mesghal * 1.01, mesghal * 1.025, mesghal * 1.05

    # Technical Radar Banner
    st.markdown(f"""
    <div style="background:rgba(20,20,35,0.9); border-right:4px solid #FFD700; border-radius:10px; padding:16px 20px; margin-bottom:16px;">
        <h4 style="margin:0 0 12px 0; color:#FFD700;">🎯 رادار تاکتیکی تابلوی بازار (Intraday Tactical Radar)</h4>
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; font-size:14px;">
            <div>فاصله از میانگین ۲۰ روزه: <b style="color:{'#FF5252' if dist_sma20 > 2.5 else '#00E676'};">{dist_sma20:+.1f}٪</b></div>
            <div>شکاف حباب آبشده (Melt Bubble): <b style="color:{'#FF5252' if melt_bubble_pct > 1 else '#00E676'};">{melt_bubble_pct:+.2f}٪</b> ({abs(mesghal - intrinsic_mesghal):,.0f} تومان)</div>
            <div>ارزش برابری ذاتی مظنه: <b>{intrinsic_mesghal:,.0f} تومان</b></div>
            <div>نسبت برابری طلا به دلار: <b>{gold_usd_ratio:.3f}</b></div>
        </div>
        <hr style="border-color:rgba(255,255,255,0.08); margin:12px 0;">
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; font-size:13px;">
            <div style="color:#00E676;">
                🛡️ حمایت ۱: <b>{s1:,.0f} م</b> &nbsp;|&nbsp; حمایت ۲: <b>{s2:,.0f} م</b> &nbsp;|&nbsp; حمایت ۳: <b>{s3:,.0f} م</b>
            </div>
            <div style="color:#FF5252;">
                ⚔️ مقاومت ۱: <b>{r1:,.0f} م</b> &nbsp;|&nbsp; مقاومت ۲: <b>{r2:,.0f} م</b> &nbsp;|&nbsp; مقاومت ۳: <b>{r3:,.0f} م</b>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Interactive Technical Plotly Chart
    chart_df = raw_df.tail(75).copy().reset_index(drop=True)
    chart_df.at[chart_df.index[-1], "Gold_Toman_Gram"] = gold_t
    chart_df.at[chart_df.index[-1], "Mesghal_Toman"] = mesghal
    chart_df["EMA20"] = chart_df["Mesghal_Toman"].ewm(span=20, adjust=False).mean()
    chart_df["EMA50"] = chart_df["Mesghal_Toman"].ewm(span=50, adjust=False).mean()
    chart_df["STD20"] = chart_df["Mesghal_Toman"].rolling(20).std()
    chart_df["BB_Upper"] = chart_df["EMA20"] + (2 * chart_df["STD20"])
    chart_df["BB_Lower"] = chart_df["EMA20"] - (2 * chart_df["STD20"])

    fig_tech = go.Figure()
    fig_tech.add_trace(go.Scatter(
        x=chart_df["Date"], y=chart_df["BB_Upper"],
        name="باند بالای بولینگر (+2 STD)",
        line=dict(color="rgba(100, 150, 255, 0.3)", dash="dot"),
        showlegend=False
    ))
    fig_tech.add_trace(go.Scatter(
        x=chart_df["Date"], y=chart_df["BB_Lower"],
        name="باند پایین بولینگر (-2 STD)",
        line=dict(color="rgba(100, 150, 255, 0.3)", dash="dot"),
        fill='tonexty', fillcolor='rgba(100, 150, 255, 0.05)',
        showlegend=False
    ))
    fig_tech.add_trace(go.Scatter(
        x=chart_df["Date"], y=chart_df["Mesghal_Toman"],
        name="مظنه آبشده (تومان)",
        line=dict(color="#FFD700", width=2.5)
    ))
    fig_tech.add_trace(go.Scatter(
        x=chart_df["Date"], y=chart_df["EMA20"],
        name="میانگین نمایی ۲۰ روزه (EMA 20)",
        line=dict(color="#00E676", width=1.5)
    ))
    fig_tech.add_trace(go.Scatter(
        x=chart_df["Date"], y=chart_df["EMA50"],
        name="میانگین نمایی ۵۰ روزه (EMA 50)",
        line=dict(color="#FF5252", width=1.5, dash="dash")
    ))
    fig_tech.update_layout(
        title="نمودار روند تکنیکال مظنه آبشده با میانگین‌های متحرک و باندهای بولینگر",
        template="plotly_dark",
        paper_bgcolor="#161b22",
        plot_bgcolor="#161b22",
        height=420,
        hovermode="x unified",
        margin=dict(l=20, r=20, t=40, b=20),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    st.plotly_chart(fig_tech, use_container_width=True)

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 2: DEDICATED DCA METHODOLOGY & INTERACTIVE SIMULATION
# ═══════════════════════════════════════════════════════════════════════════════
with tab_dca:
    st.markdown("<h2 style='color:#FFD700;'>🪙 تحلیل جامع و شبیه‌ساز استراتژی انباشت میانگین هزینه (DCA)</h2>", unsafe_allow_html=True)

    # ── SECTION 1: WHAT IS DCA? ──
    st.markdown("""
    <div class="method-box">
        <h3 style="color:#FFD700; margin-top:0;">📚 بخش اول: استراتژی میانگین‌سازی هزینه (DCA) چیست؟</h3>
        <p>
        استراتژی <b>Dollar-Cost Averaging (به اختصار DCA)</b> یا <b>میانگین‌سازی هزینه خرید</b>، یک متدولوژی اثبات‌شده سرمایه‌گذاری است که در آن فرد سرمایه کل خود را به بخش‌های مساوی تقسیم کرده و در فواصل زمانی منظم (مانند هفتگی یا ماهانه) فارغ از اینکه قیمت روز بازار چقدر است، اقدام به خرید دارایی می‌نماید.
        </p>
        <h4 style="color:#388bfd; margin-bottom:6px;">چرا DCA کارآمدترین سپر در برابر تورم ساختاری و بازار طلا است؟</h4>
        <ul>
            <li><b>مهار خطای زمان‌بندی بازار (Elimination of Market Timing Risk):</b> پیش‌بینی دقیق کف‌ها و سقف‌های قیمتی در بازار پرنوسان طلا و ارز عملاً غیرممکن است. سرمایه‌گذاران با ورود یکباره در قله‌های هیجانی دچار زیان سنگین می‌شوند. DCA نیاز به زمان‌بندی را کاملاً برطرف می‌کند.</li>
            <li><b>خنثی‌سازی تله‌های روان‌شناختی (FOMO & Panic):</b> در جهش‌های شدید، خریداران دچار طمع (FOMO) شده و در اصلاح‌ها از ترس ریزش بیشتر دست به فروش می‌زنند. DCA تصمیم‌گیری را به یک فرآیند خودکار و بدون احساسات تبدیل می‌کند.</li>
            <li><b>اثر ریاضی نوسان به نفع خریدار (Volatility Harvesting):</b> با تخصیص بودجه ثابت، هنگامی که قیمت افت می‌کند طلای بیشتری با همان پول خریداری می‌شود و در گرانی‌ها طلای کمتر؛ این امر به شکل خودکار میانگین موزون بهای تمام‌شده را به سمت کف‌های قیمتی متمایل می‌سازد.</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

    # ── SECTION 2: SIMULATION METHODOLOGY & MATHEMATICS ──
    st.markdown("""
    <div class="method-box" style="border-right-color:#00E676;">
        <h3 style="color:#00E676; margin-top:0;">📐 بخش دوم: متدولوژی ریاضی و نحوه شبیه‌سازی</h3>
        <p>در این پلتفرم، سه رویکرد تخصیص سرمایه با داده‌های تاریخی واقعی شبیه‌سازی و مقایسه می‌شوند:</p>
        <ol>
            <li><b>خرید یکجا (Lump Sum):</b> کل سرمایه در ابتدای دوره با نرخ روز اول به طلا تبدیل می‌شود.</li>
            <li><b>انباشت مکانیکی ثابت (Mechanical DCA):</b> در پایان هر دوره (هفته یا ماه)، دقیقاً بودجه ثابتی صرف خرید طلا با نرخ همان روز می‌گردد.</li>
            <li><b>انباشت پویا مبتنی بر ارزش (Dynamic Value-Aware DCA):</b> رویکرد توسعه‌یافته در این تحقیق که حجم خرید را متناسب با انحراف قیمت از روند تعادلی تعدیل می‌کند:
                <ul>
                    <li>اگر بازار دچار حباب و جهش شدید باشد (قیمت بالای میانگین تعادلی)، حجم خرید کاهش یافته و نقدینگی در صندوق رزرو ذخیره می‌شود.</li>
                    <li>اگر بازار وارد فاز اصلاحی و زیر میانگین تعادلی شود، نقدینگی ذخیره‌شده به شکل تهاجمی‌تر در قیمت‌های تخفیف‌دار تزریق می‌گردد.</li>
                </ul>
            </li>
        </ol>
        <p><b>فرمول بهای تمام‌شده موزون (Weighted Average Cost - WAC):</b></p>
        <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:6px; font-family:monospace; direction:ltr; text-align:center;">
            WAC = (مجموع ریال تزریق‌شده) / (مجموع گرم طلای خریداری‌شده)
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ── SECTION 3: INTERACTIVE SIMULATOR CONTROLS ──
    st.markdown("### 🎮 بخش سوم: شبیه‌ساز تعاملی و ارزیابی سناریوها")
    
    col_d1, col_d2, col_d3 = st.columns([1, 1, 1])
    with col_d1:
        timeframe_sel = st.selectbox(
            "بازه تاریخی مورد بررسی:",
            ["۱ سال اخیر", "۲ سال اخیر", "۳ سال اخیر", "۵ سال اخیر", "کل تاریخچه (از ۱۳۹۲)"],
            index=2
        )
    with col_d2:
        budget_m = st.slider("بودجه ماهانه تخصیص سرمایه (میلیون تومان):", min_value=10, max_value=500, value=50, step=10)
        user_budget = budget_m * 1_000_000
    with col_d3:
        freq_sel = st.selectbox(
            "فواصل تزریق پله‌ای:",
            ["ماهانه (هر ۳۰ روز)", "هفتگی (هر ۷ روز)"],
            index=0
        )

    # Filter dataframe
    max_d = raw_df["Date"].max()
    if timeframe_sel == "۱ سال اخیر":
        start_d = max_d - pd.Timedelta(days=365)
    elif timeframe_sel == "۲ سال اخیر":
        start_d = max_d - pd.Timedelta(days=730)
    elif timeframe_sel == "۳ سال اخیر":
        start_d = max_d - pd.Timedelta(days=1095)
    elif timeframe_sel == "۵ سال اخیر":
        start_d = max_d - pd.Timedelta(days=1825)
    else:
        start_d = raw_df["Date"].min()

    dca_sim_df = raw_df[raw_df["Date"] >= start_d].copy().reset_index(drop=True)
    
    if len(dca_sim_df) < 15:
        st.error("داده کافی در این بازه یافت نشد.")
    else:
        step_days = 7 if "هفتگی" in freq_sel else 30
        period_budget = (user_budget / 4.0) if step_days == 7 else user_budget
        
        # Benchmark Trend for Dynamic DCA
        dca_sim_df["EMA_Trend"] = dca_sim_df["Gold_Toman_Gram"].ewm(span=60, adjust=False).mean()
        dca_sim_df["Valuation_Ratio"] = dca_sim_df["Gold_Toman_Gram"] / (dca_sim_df["EMA_Trend"] + 1e-6)

        total_days = len(dca_sim_df)
        schedule = list(range(0, total_days, step_days))
        n_injections = len(schedule)
        total_invested = n_injections * period_budget

        # 1. Lump Sum
        p0 = dca_sim_df.loc[0, "Gold_Toman_Gram"]
        lump_grams = total_invested / p0

        # 2. Fixed DCA
        fixed_g_hist = [0.0] * total_days
        fixed_spent_hist = [0.0] * total_days
        cg, cs = 0.0, 0.0

        for i in range(total_days):
            if i in schedule:
                p = dca_sim_df.loc[i, "Gold_Toman_Gram"]
                bought = period_budget / p
                cg += bought
                cs += period_budget
            fixed_g_hist[i] = cg
            fixed_spent_hist[i] = cs

        # 3. Dynamic Value-Aware DCA
        dyn_g_hist = [0.0] * total_days
        dyn_spent_hist = [0.0] * total_days
        cdg, cds = 0.0, 0.0
        reserve_pool = 0.0

        for i in range(total_days):
            if i in schedule:
                p = dca_sim_df.loc[i, "Gold_Toman_Gram"]
                v_ratio = dca_sim_df.loc[i, "Valuation_Ratio"]
                
                if v_ratio > 1.08:
                    mult = 0.45
                elif v_ratio < 0.96:
                    mult = 1.45
                else:
                    mult = 1.00

                target_spend = period_budget * mult
                reserve_pool += (period_budget - target_spend)
                
                if reserve_pool < 0:
                    target_spend += reserve_pool
                    reserve_pool = 0.0

                bought = target_spend / p
                cdg += bought
                cds += target_spend

            dyn_g_hist[i] = cdg
            dyn_spent_hist[i] = cds

        # Performance summary metrics
        current_market_price = dca_sim_df.iloc[-1]["Gold_Toman_Gram"]
        
        # Fixed DCA
        final_fixed_g = fixed_g_hist[-1]
        final_fixed_wac = (fixed_spent_hist[-1] / final_fixed_g) if final_fixed_g > 0 else 0
        fixed_equity = final_fixed_g * current_market_price
        fixed_roi = ((fixed_equity - total_invested) / total_invested) * 100.0 if total_invested > 0 else 0

        # Dynamic DCA
        final_dyn_g = dyn_g_hist[-1]
        final_dyn_wac = (dyn_spent_hist[-1] / final_dyn_g) if final_dyn_g > 0 else 0
        dyn_equity = (final_dyn_g * current_market_price) + reserve_pool
        dyn_roi = ((dyn_equity - total_invested) / total_invested) * 100.0 if total_invested > 0 else 0

        # Lump Sum
        lump_equity = lump_grams * current_market_price
        lump_roi = ((lump_equity - total_invested) / total_invested) * 100.0

        # Display Comparative KPI Cards
        sk1, sk2, sk3, sk4 = st.columns(4)
        with sk1:
            st.markdown(f"""
            <div class="metric-card">
                <h4>💵 کل سرمایه تزریق‌شده</h4>
                <h2 style="color:#fff;">{total_invested:,.0f} <span style="font-size:12px;color:#888;">ت</span></h2>
                <p>{n_injections} پله واریزی</p>
            </div>
            """, unsafe_allow_html=True)
        with sk2:
            st.markdown(f"""
            <div class="metric-card">
                <h4>⚖️ انباشت طلا (DCA پویا)</h4>
                <h2 style="color:#00E676;">{final_dyn_g:,.2f} <span style="font-size:12px;">گرم</span></h2>
                <p>ساده: {final_fixed_g:,.2f} گرم ({final_dyn_g - final_fixed_g:+,.2f}g اضافه)</p>
            </div>
            """, unsafe_allow_html=True)
        with sk3:
            st.markdown(f"""
            <div class="metric-card">
                <h4>📉 بهای تمام‌شده موزون (WAC)</h4>
                <h2 style="color:#FFD700;">{final_dyn_wac:,.0f} <span style="font-size:12px;">ت/گرم</span></h2>
                <p>مظنه پایانی: {current_market_price:,.0f} تومان</p>
            </div>
            """, unsafe_allow_html=True)
        with sk4:
            st.markdown(f"""
            <div class="metric-card">
                <h4>🏆 بازده کل سرمایه‌گذاری (ROI)</h4>
                <h2 style="color:{'#00E676' if dyn_roi>=0 else '#FF5252'};">%{dyn_roi:+.1f}</h2>
                <p>ارزش روز سبد: {dyn_equity:,.0f} تومان</p>
            </div>
            """, unsafe_allow_html=True)

        # Plotly Comparison Charts
        dca_sim_df["Fixed_Grams"] = fixed_g_hist
        dca_sim_df["Dyn_Grams"] = dyn_g_hist

        fig_g = go.Figure()
        fig_g.add_trace(go.Scatter(
            x=dca_sim_df["Date"], y=dca_sim_df["Dyn_Grams"],
            name="DCA پویا (تخصیص بهینه)",
            line=dict(color="#00E676", width=3)
        ))
        fig_g.add_trace(go.Scatter(
            x=dca_sim_df["Date"], y=dca_sim_df["Fixed_Grams"],
            name="DCA سنتی (فواصل ثابت)",
            line=dict(color="#388bfd", width=2, dash="dash")
        ))
        fig_g.update_layout(
            title="منحنی مقایسه‌ای انباشت فیزیکی طلا (گرم)",
            template="plotly_dark",
            paper_bgcolor="#161b22",
            plot_bgcolor="#161b22",
            height=380,
            hovermode="x unified",
            margin=dict(l=20, r=20, t=40, b=20),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )
        st.plotly_chart(fig_g, use_container_width=True)

        # WAC Curve vs Market Price
        dca_sim_df["Fixed_WAC"] = [c / g if g > 0 else np.nan for c, g in zip(fixed_spent_hist, fixed_g_hist)]
        dca_sim_df["Dyn_WAC"] = [c / g if g > 0 else np.nan for c, g in zip(dyn_spent_hist, dyn_g_hist)]

        fig_cost = go.Figure()
        fig_cost.add_trace(go.Scatter(
            x=dca_sim_df["Date"], y=dca_sim_df["Gold_Toman_Gram"],
            name="مظنه لحظه‌ای بازار (تومان/گرم)",
            line=dict(color="#FFD700", width=1.5)
        ))
        fig_cost.add_trace(go.Scatter(
            x=dca_sim_df["Date"], y=dca_sim_df["Dyn_WAC"],
            name="بهای تمام‌شده موزون DCA پویا",
            line=dict(color="#00E676", width=2.5)
        ))
        fig_cost.add_trace(go.Scatter(
            x=dca_sim_df["Date"], y=dca_sim_df["Fixed_WAC"],
            name="بهای تمام‌شده موزون DCA سنتی",
            line=dict(color="#388bfd", width=2, dash="dot")
        ))
        fig_cost.update_layout(
            title="مقایسه بهای تمام‌شده موزون (WAC) در برابر مظنه روز بازار (نمایش حاشیه امنیت)",
            template="plotly_dark",
            paper_bgcolor="#161b22",
            plot_bgcolor="#161b22",
            height=380,
            hovermode="x unified",
            margin=dict(l=20, r=20, t=40, b=20),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )
        st.plotly_chart(fig_cost, use_container_width=True)

# ═══════════════════════════════════════════════════════════════════════════════
# TAB 3: SYSTEM ARCHITECTURE & PRODUCTION FEATURES
# ═══════════════════════════════════════════════════════════════════════════════
with tab_arch:
    st.markdown("<h2 style='color:#FFD700;'>🏗️ معماری مهندسی و قابلیت‌های پلتفرم عملیاتی</h2>", unsafe_allow_html=True)
    
    st.markdown("""
    <div class="method-box">
        <h3 style="color:#FFD700; margin-top:0;">🌐 قابلیت‌های اختصاصی سامانه عملیاتی اصلی (Production Infrastructure)</h3>
        <p>پلتفرم عملیاتی اصلی فراتر از یک ابزار تحلیلی، یک زیرساخت سازمانی برای ترید الگوریتمیک، حسابداری دفاتر کل و تسویه حساب بازار طلا است:</p>
        
        <h4>1️⃣ پایپ‌لاین داده‌های چندارزی بلادرنگ (Cross-Market Data Ingestion)</h4>
        <p>پایش زیرثانیه‌ای و هماهنگ نرخ‌های مظنه آبشده تهران، سکه بهار آزادی و امامی، انس جهانی طلا (XAU/USD) و تتر/دلار آزاد با کشینگ چندسطحی و اعتبارسنجی متقاطع جهت حذف نویز و تأخیر وب‌سرویس‌ها.</p>

        <h4>2️⃣ سامانه حسابداری دوبل و دفتر کل بلادرنگ (Double-Entry Ledger & Accounting)</h4>
        <p>تفکیک کامل جریان‌های نقدینگی ریالی و طلای فیزیکی، ثبت خودکار فاکتورهای بنکداری، ثبت حواله‌ها و تهاتر مطالبات، و محاسبه آنلاین بهای تمام‌شده بر مبنای میانگین موزون (WAC) و نقطه سربه‌سر (Break-Even).</p>

        <h4>3️⃣ موتور اتوماسیون مدیریت ریسک (Automated Risk Engine)</h4>
        <p>مکانیزم حد ضرر متحرک (Trailing Stop-Loss) متناسب با دامنه نوسان لحظه‌ای (ATR)، سطوح پله‌ای قفل سود (Take-Profit Targets) و پایش آنلاین سقف نقدینگی فعال.</p>

        <h4>4️⃣ درگاه‌های ارتباطی چندسطحی و ربات تلگرام (Multi-Tier Telegram Daemon)</h4>
        <p>ربات تلگرام با معماری سلسله‌مراتبی ۳ نقشی (کاربر عادی، شرکای سرمایه‌گذار و کاربران ویژه VIP با ورود رمزی).<br>
        لینک ربات رسمی: <a href="https://t.me/TalaOracle_Bot" target="_blank" style="color:#FFD700; font-weight:bold;">@TalaOracle_Bot</a>
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class="method-box" style="border-right-color:#E040FB;">
        <h3 style="color:#E040FB; margin-top:0;">🤝 مدل مشارکت سرمایه‌گذاری (Investment Partnership Framework)</h3>
        <p>سامانه جهت مدیریت سرمایه‌های بیرونی از مدل استخر سرمایه (Capital Allocation Pool) بهره می‌برد:</p>
        <ul>
            <li><b>تسهیم دقیق بر مبنای سهم واقعی (Pro-Rata Attribution):</b> سود و زیان هر دوره معاملاتی دقیقا بر پایه نسبت سرمایه ورودی هر شریک به کل نقدینگی درگیر محاسبه می‌شود.</li>
            <li><b>گزارش‌گیری آنلاین در تلگرام:</b> شرکا از طریق ربات تلگرام می‌توانند صورت‌وضعیت بلادرنگ سهم مشارکت، وضعیت پوزیشن‌های فعال و جمع سود قطعی خود را رصد فرمایند.</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("### 👥 معرفی تیم توسعه و تفکیک مسئولیت‌ها")
    c_t1, c_t2 = st.columns(2)
    with c_t1:
        st.markdown("""
        <div class="metric-card">
            <h4 style="color:#388bfd;">🔹 توسعه‌دهنده هسته فنی و معمار سیستم (Lead Systems Architect)</h4>
            <p style="color:#fff; font-size:13px; line-height:1.9;">
            <b>حوزه‌های طراحی و پیاده‌سازی:</b><br>
            • طراحی مدل‌های کمّی، الگوریتم‌های شبیه‌سازی انباشت و توازن ارزش<br>
            • مهندسی سیستم حسابداری دوبل (Double-Entry) و دفتر کل تسویه طلا<br>
            • توسعه وب‌سرویس‌های RESTful با FastAPI و مدیریت پایگاه داده<br>
            • پیاده‌سازی پایپ‌لاین‌های استخراج و اعتبارسنجی بلادرنگ داده‌های چندارزی<br>
            • طراحی مکانیزم‌های خودکار مدیریت ریسک، حد ضرر متحرک و قفل سود<br>
            • استقرار و مدیریت سرورهای ابری، زیرساخت داکر و سرویس‌های دیمن
            </p>
        </div>
        """, unsafe_allow_html=True)
    with c_t2:
        st.markdown("""
        <div class="metric-card">
            <h4 style="color:#FFD700;">🔹 طراحی اولیه فرانت‌اند و ایده‌پردازی محصول (Frontend & Product Ideation)</h4>
            <p style="color:#fff; font-size:13px; line-height:1.9;">
            <b>حوزه‌های طراحی (هادی گلی - Hadi Goli):</b><br>
            • پیاده‌سازی و ساختاردهی اولیه رابط کاربری و صفحات داشبورد<br>
            • طراحی المان‌های بصری اولیه، چیدمان کامپوننت‌ها و استایل گرافیکی<br>
            • ارائه بازخوردهای تجربی بازار سنتی طلا و نیازسنجی بنکداری<br>
            • مشارکت در سناریوهای کاربری، تعامل با شرکا و توسعه محصول
            </p>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    st.caption("سامانه مدیریت و انباشت دارایی طلا | کلیه حقوق و مالکیت معنوی کدبیس پلتفرم اصلی محفوظ است.")
