import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getLivePrices, getAISignal, type LivePricesResponse, type AISignalResponse } from "@/lib/api";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Signal = "STRONG_BUY" | "STEP_BUY" | "BUY" | "HOLD" | "STEP_SELL" | "PARTIAL_SELL" | "STRONG_SELL" | "SELL";

export type MarketSnapshot = {
  ready: boolean;
  online: boolean;
  marketOpen: boolean;
  marketReason: string;
  lastTickAt: Date;
  priceChangedAtStr: string;
  polledAtStr: string;
  /** مظنه ۱۷ عیار (تومان) */
  mazaneh: number;
  prevMazaneh: number;
  /** گرم طلای ۱۸ عیار (تومان) */
  gram18: number;
  /** انس جهانی (دلار) */
  ounce: number;
  /** دلار آزاد (تومان) */
  usd: number;
  /** سکه امامی (تومان) */
  coin: number;
  /** حباب سکه/مظنه نسبت به ارزش ذاتی */
  bubblePct: number;
  changePct: number;
  sma20: number;
  macd: number;
  macdSignal: number;
  rsi: number;
  goldUsdRatio: number;
  coinHabab: number;
  coinIntrinsic: number;
  coinBubbleToman: number;
  coinMazanehRatio: number;
  meltHabab: number;
  distToMax30: number;
  marketRegime: string;
  trend2m: { label: string; tone: "profit" | "loss" | "neutral"; arrow: string };
  trend10m: { label: string; tone: "profit" | "loss" | "neutral"; arrow: string };
  probabilities: { buy: number; hold: number; sell: number };
  personalAdvice: string;
  strategicStance?: string;
  intradayPhase?: string;
  trailingRisk?: {
    trailing_sl_toman?: number;
    step_1_tp_toman?: number;
    step_2_tp_toman?: number;
    protection_note?: string;
  };
  entropyConfidence?: number;
  aiCouncil?: import("./api").AICouncilData;
  topDrivers?: Array<{ Feature: string; Importance: number }>;
  supports?: number[];
  resistances?: number[];
  srLevels?: { supports_mesghal?: number[]; resistances_mesghal?: number[] };
  signal?: Signal;
  source?: string;
};

export const SIGNAL_LABEL: Record<Signal, string> = {
  STRONG_BUY: "خرید قوی (STRONG BUY)",
  STEP_BUY: "خرید پله‌ای (ACCUMULATE)",
  BUY: "خرید (BUY)",
  HOLD: "نگهداری (HOLD)",
  STEP_SELL: "فروش پله‌ای (STEP SELL)",
  PARTIAL_SELL: "فروش پله‌ای (PARTIAL SELL)",
  STRONG_SELL: "فروش قوی (STRONG SELL)",
  SELL: "فروش (SELL)",
};

export const SIGNAL_TONE: Record<Signal, string> = {
  STRONG_BUY: "profit",
  STEP_BUY: "profit",
  BUY: "profit",
  HOLD: "neutral",
  STEP_SELL: "warn",
  PARTIAL_SELL: "warn",
  STRONG_SELL: "loss",
  SELL: "loss",
};

const MarketContext = createContext<MarketSnapshot | null>(null);

const TICK_HISTORY: { time: number; val: number }[] = [];

function calcTrend(diffPct: number) {
  if (diffPct > 0.02) return { label: "صعودی", tone: "profit" as const, arrow: "↗" };
  if (diffPct < -0.02) return { label: "نزولی", tone: "loss" as const, arrow: "↘" };
  return { label: "ثبات / رنج", tone: "neutral" as const, arrow: "↔" };
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);

  useEffect(() => {
    let mounted = true;
    let prevMazanehVal = 0;

    async function update() {
      try {
        const [liveData, sigData]: [LivePricesResponse, AISignalResponse] = await Promise.all([
          getLivePrices(),
          getAISignal().catch(() => ({
            action: "HOLD",
            prob_buy: 0,
            prob_sell: 0,
            prob_hold: 1,
            top_drivers: [],
            updated_at: null,
            age_seconds: null,
            is_fresh: false,
            personal_advice: "",
          })),
        ]);

        if (!mounted) return;

        const mazaneh = liveData.mesghal_toman || 0;
        const currentPrev = prevMazanehVal > 0 ? prevMazanehVal : mazaneh;
        if (prevMazanehVal === 0 && mazaneh > 0) {
          prevMazanehVal = mazaneh;
        }

        const changePct = currentPrev > 0 ? ((mazaneh - currentPrev) / currentPrev) * 100 : 0;
        
        // Track history for trend arrows
        const now = Date.now();
        if (mazaneh > 0) {
          TICK_HISTORY.push({ time: now, val: mazaneh });
          while (TICK_HISTORY.length > 0 && now - TICK_HISTORY[0].time > 30 * 60 * 1000) {
            TICK_HISTORY.shift();
          }
        }

        let t2mVal = mazaneh;
        let t10mVal = mazaneh;
        for (const tk of TICK_HISTORY) {
          if (now - tk.time <= 150000 && now - tk.time >= 90000) t2mVal = tk.val;
          if (now - tk.time <= 650000 && now - tk.time >= 450000) t10mVal = tk.val;
        }
        if (t2mVal === mazaneh && TICK_HISTORY.length > 1) t2mVal = TICK_HISTORY[Math.max(0, TICK_HISTORY.length - 3)].val;
        if (t10mVal === mazaneh && TICK_HISTORY.length > 1) t10mVal = TICK_HISTORY[0].val;

        let diff2m = t2mVal > 0 ? ((mazaneh - t2mVal) / t2mVal) * 100 : 0;
        let diff10m = t10mVal > 0 ? ((mazaneh - t10mVal) / t10mVal) * 100 : 0;

        const smaVal = sigData.sma20 && sigData.sma20 > 0 ? (sigData.sma20 * (mazaneh > 20_000_000 ? 4.3318 : 1)) : mazaneh;
        if (Math.abs(diff2m) < 0.005 && smaVal > 0 && mazaneh !== smaVal) {
          diff2m = ((mazaneh - smaVal) / smaVal) * 10;
        }
        if (Math.abs(diff10m) < 0.005 && smaVal > 0 && mazaneh !== smaVal) {
          diff10m = ((mazaneh - smaVal) / smaVal) * 20;
        }

        let signalAction: Signal = "HOLD";
        const rawAction = (sigData.action || "HOLD").toUpperCase();
        if (rawAction === "STRONG BUY" || rawAction === "STRONG_BUY") signalAction = "STRONG_BUY";
        else if (rawAction === "STEP BUY" || rawAction === "STEP_BUY") signalAction = "STEP_BUY";
        else if (rawAction === "BUY") signalAction = "BUY";
        else if (rawAction === "STRONG SELL" || rawAction === "STRONG_SELL") signalAction = "STRONG_SELL";
        else if (rawAction === "STEP SELL" || rawAction === "STEP_SELL" || rawAction === "PARTIAL SELL" || rawAction === "PARTIAL_SELL") signalAction = "STEP_SELL";
        else if (rawAction === "SELL") signalAction = "SELL";
        else signalAction = "HOLD";

        const supports = liveData.sr_levels?.supports_mesghal || [];
        const resistances = liveData.sr_levels?.resistances_mesghal || [];

        // Ensure SMA is scaled to Mazaneh (Mesghal Toman)
        let sma20Mazaneh = sigData.sma20 || mazaneh;
        if (sma20Mazaneh > 120_000_000) {
          // If in Rials per gram (e.g. 186,748,913), convert to Toman per Mesghal
          sma20Mazaneh = (sma20Mazaneh / 10) * 4.3318;
        } else if (sma20Mazaneh > 1_000_000 && sma20Mazaneh < 30_000_000) {
          // If in Toman per gram (e.g. 18,674,891), multiply by 4.3318
          sma20Mazaneh = sma20Mazaneh * 4.3318;
        }

        const coinToman = liveData.coin_toman || 0;
        const calculatedCoinIntrinsic = liveData.intrinsic_coin_toman || (
          mazaneh > 0 ? (mazaneh * 2.2530) : 0
        );
        const calculatedCoinHabab = liveData.coin_bubble_pct ?? (
          calculatedCoinIntrinsic > 0 && coinToman > 0
            ? (((coinToman - calculatedCoinIntrinsic) / calculatedCoinIntrinsic) * 100)
            : (sigData.coin_habab || 0)
        );
        const calculatedCoinBubbleToman = liveData.coin_bubble_toman ?? (
          calculatedCoinIntrinsic > 0 && coinToman > 0 ? (coinToman - calculatedCoinIntrinsic) : 0
        );
        const calculatedCoinMazanehRatio = liveData.coin_mazaneh_ratio || (
          mazaneh > 0 && coinToman > 0 ? (coinToman / mazaneh) : 2.2530
        );

        setSnapshot({
          ready: true,
          online: liveData.daemon_ok ?? true,
          marketOpen: liveData.market_status?.is_open ?? true,
          marketReason: liveData.market_status?.reason || "بازار باز است",
          lastTickAt: new Date(),
          priceChangedAtStr: liveData.price_changed_at_str || "نامشخص",
          polledAtStr: liveData.polled_at_str || "نامشخص",
          source: liveData.source || "TGJU Main Table (Live)",
          mazaneh,
          prevMazaneh: currentPrev,
          gram18: liveData.gram18_toman || 0,
          ounce: liveData.xau || 0,
          usd: liveData.usd_toman || 0,
          coin: coinToman,
          bubblePct: liveData.bubble_pct || 0,
          coinHabab: calculatedCoinHabab,
          coinIntrinsic: calculatedCoinIntrinsic,
          coinBubbleToman: calculatedCoinBubbleToman,
          coinMazanehRatio: calculatedCoinMazanehRatio,
          changePct,
          sma20: sma20Mazaneh,
          macd: sigData.macd || 0,
          macdSignal: sigData.macd_signal || 0,
          rsi: sigData.rsi || 50,
          goldUsdRatio: sigData.gold_usd_ratio || 0.75,
          meltHabab: sigData.melt_habab || (liveData.bubble_pct || 0),
          distToMax30: sigData.dist_to_max30 || 0,
          marketRegime: sigData.market_regime || "🟢 صعودی با نوسان ملایم (Bull Calm)",
          trend2m: calcTrend(diff2m),
          trend10m: calcTrend(diff10m),
          supports,
          resistances,
          srLevels: liveData.sr_levels,
          signal: signalAction,
          probabilities: {
            buy: Math.round((sigData.prob_buy || 0) * 100),
            hold: Math.round((sigData.prob_hold || 1) * 100),
            sell: Math.round((sigData.prob_sell || 0) * 100),
          },
          personalAdvice: sigData.ai_advice || sigData.personal_advice || "بازار در فاز تعادل است؛ حفظ انضباط استراتژیک و پیروی از سیگنال‌های آماری توصیه می‌شود.",
          strategicStance: sigData.strategic_stance || "🟢 روند استراتژیک (۳ تا ۵ روزه): صعودی",
          intradayPhase: sigData.intraday_phase || "⏸️ فاز تابلوی روز: تعادل و اصلاح میان‌روزی",
          trailingRisk: sigData.trailing_risk,
          aiCouncil: sigData.ai_council,
          entropyConfidence: sigData.entropy_confidence ?? 0.75,
          topDrivers: sigData.top_drivers || [],
        });
      } catch (err) {
        console.error("Failed to fetch live market snapshot:", err);
      }
    }

    update();
    const interval = window.setInterval(update, 15000); // Poll every 15s

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const value = useMemo(() => snapshot, [snapshot]);
  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket(): MarketSnapshot | null {
  return useContext(MarketContext);
}

