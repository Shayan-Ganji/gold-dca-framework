import type { MarketSnapshot } from "@/lib/market-engine";
import { pct, toman } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Activity, Compass, Flame, ShieldAlert, Sparkles } from "lucide-react";

function radarState(market: MarketSnapshot) {
  const rsi = market.rsi ?? 50;
  const macd = market.macd ?? 0;
  const macdSignal = market.macdSignal ?? 0;
  if (rsi < 32) return { label: "🟢 زنگ خرید در اشباع فروش", tone: "profit" as const, desc: "پتانسیل بالای بازگشت به بالا" };
  if (rsi > 70) return { label: "🔴 اشباع خرید — احتیاط", tone: "loss" as const, desc: "احتمال اصلاح زمانی یا قیمتی" };
  if (macd > macdSignal) return { label: "🟡 مومنتوم صعودی فعال", tone: "gold" as const, desc: "حمایت توسط جریان پول هوشمند" };
  return { label: "⚪ در حال نوسان خنثی / رنج", tone: "neutral" as const, desc: "تعادل میان خریدار و فروشنده در کف" };
}

function getRsiInterpretation(rsi: number): { text: string; color: string } {
  if (rsi < 32) return { text: "اشباع فروش (فرصت ورود)", color: "text-profit font-extrabold" };
  if (rsi < 45) return { text: "منطقه حمایتی و کف‌سازی", color: "text-profit" };
  if (rsi <= 60) return { text: "تعادل پایدار (متمایل به صعود)", color: "text-gold-soft" };
  if (rsi <= 72) return { text: "مومنتوم قدرتمند رو به بالا", color: "text-gold" };
  return { text: "اشباع خرید (خطر اصلاح موقت)", color: "text-loss font-extrabold" };
}

const BORDER = {
  profit: "border-r-profit bg-gradient-to-l from-profit/10 via-transparent to-transparent",
  loss: "border-r-loss bg-gradient-to-l from-loss/10 via-transparent to-transparent",
  gold: "border-r-gold bg-gradient-to-l from-gold/10 via-transparent to-transparent",
  neutral: "border-r-neutral bg-gradient-to-l from-neutral/10 via-transparent to-transparent",
};

const TEXT = {
  profit: "text-profit",
  loss: "text-loss",
  gold: "text-gold-soft",
  neutral: "text-foreground",
};

export function TacticalRadar({ market }: { market: MarketSnapshot | null }) {
  if (!market) return <Skeleton className="h-80 rounded-2xl" />;
  const state = radarState(market);
  
  const sma20 = market.sma20 || market.mazaneh || 1;
  const distToSma = sma20 > 0 ? (((market.mazaneh || 0) - sma20) / sma20) * 100 : 0;
  
  const momentum = (market.macd ?? 0) - (market.macdSignal ?? 0);
  const rsi = market.rsi ?? 50;
  const rsiInfo = getRsiInterpretation(rsi);

  // Fundamental ratio based on authentic parity (0.75 baseline)
  let ratio = market.goldUsdRatio || 0.75;
  if (ratio > 10) {
    // If legacy calculations pushed 20.88, recover exact 0.75 parity scale
    const pureGoldVal = ((market.ounce || 4000) / 31.1035) * (market.usd || 1_937_000);
    ratio = pureGoldVal > 0 ? (market.gram18 / pureGoldVal) : 0.75;
  }

  const meltBubble = market.meltHabab ?? market.bubblePct ?? 0;
  const coinBubble = market.coinHabab ?? 0;
  const distMax30 = (market.distToMax30 ?? 0) * 100;

  return (
    <section className={cn("glass-panel rounded-2xl border-r-4 p-5 shadow-lg relative overflow-hidden transition-all", BORDER[state.tone])}>
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Compass className="size-5 text-gold animate-pulse" />
          <h2 className="text-sm font-bold text-foreground">رادار تاکتیکی درون‌روز (v2.7 Proactive Oracle)</h2>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground">
          رصد لحظه‌ای
        </span>
      </div>

      <div className="mb-4 bg-background/40 p-3 rounded-xl border border-border/40">
        <p className={cn("text-base font-black tracking-tight flex items-center gap-1.5", TEXT[state.tone])}>
          {state.label}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {state.desc}
        </p>
      </div>

      <dl className="space-y-2.5 text-xs">
        <Row label="رژیم هوشمند بازار">
          <span className="font-bold text-xs bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded">
            {market.marketRegime || "🟢 صعودی با نوسان ملایم (Bull Calm)"}
          </span>
        </Row>

        <Row label="فاصله تا میانگین ۲۰ روزه (SMA20)">
          <span className={cn("num font-extrabold", distToSma >= 0 ? "text-profit" : "text-loss")}>
            {pct(distToSma)}
          </span>
        </Row>

        <Row label="شتاب و مومنتوم MACD">
          <div className="flex flex-col items-end">
            <span className={cn("num font-extrabold flex items-center gap-1", momentum >= 0 ? "text-profit" : "text-loss")}>
              {momentum >= 0 ? `+${(momentum * 10000).toFixed(2)}` : `${(momentum * 10000).toFixed(2)}`}
            </span>
            <span className={cn("text-[10px] mt-0.5", momentum >= 0 ? "text-profit" : "text-loss")}>
              {momentum >= 0 ? "📈 شتاب صعودی" : "📉 شتاب نزولی"}
            </span>
          </div>
        </Row>

        <Row label="شاخص RSI (۱۴)">
          <div className="text-left flex flex-col items-end">
            <span className="num font-black text-sm text-foreground">{rsi.toFixed(1)}</span>
            <span className={cn("text-[10px]", rsiInfo.color)}>{rsiInfo.text}</span>
          </div>
        </Row>

        <Row label="نسبت بنیادی طلا/دلار">
          <div className="flex flex-col items-end text-left">
            <span className="num font-extrabold text-gold-soft text-sm">
              {ratio.toFixed(3)}
            </span>
            <span className="text-[10px] text-muted-foreground">مبنای ارزش ذاتی: ۰.۷۵۰</span>
          </div>
        </Row>

        <Row label="حباب طلای آب‌شده">
          <span className={cn("num font-bold", meltBubble > 2 ? "text-loss" : meltBubble < -1 ? "text-profit" : "text-foreground")}>
            {pct(meltBubble)}
            <span className="text-[10px] ml-1 opacity-80">
              {meltBubble < -0.5 ? " (حباب منفی / زیر ذاتی)" : meltBubble > 2 ? " (پرحباب)" : " (تعادل)"}
            </span>
          </span>
        </Row>

        <Row label="قیمت سکه امامی (زنده)">
          <span className="num font-black text-amber-400 text-sm">
            {toman(market.coin || 0)}
          </span>
        </Row>

        <Row label="حباب سکه امامی">
          <span className="num font-bold text-foreground">
            {pct(coinBubble)}
          </span>
        </Row>

        <Row label="فاصله از سقف ۳۰ روز گذشته">
          <span className={cn("num font-bold", distMax30 < -5 ? "text-profit" : "text-neutral")}>
            {pct(distMax30)}
          </span>
        </Row>

        <Row label="انس جهانی طلا">
          <span className="num text-foreground font-black">${(market.ounce || 0).toFixed(1)}</span>
        </Row>

        <Row label="دلار آزاد">
          <span className="num text-foreground font-black">{toman(market.usd || 0)}</span>
        </Row>
      </dl>

      <div className="mt-5 rounded-xl bg-gradient-to-l from-gold/15 via-background/60 to-transparent border border-gold/40 p-3.5 shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gold flex items-center gap-1.5">
            <ShieldAlert className="size-4 text-gold" />
            استراتژی محافظتی و سود پلکانی (Staircase Hedging)
          </span>
          <span className="text-[10px] bg-gold/20 text-gold-soft font-semibold px-2 py-0.5 rounded-full border border-gold/30">
            {rsi > 68 ? "⚠️ فعال: خروج پله‌ای جهش" : "🛡️ آماده‌باش دفاعی"}
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-foreground/85">
          {rsi > 68 ? (
            <>
              شاخص تاکتیکی اشباع خرید را در سقف مقطعی نشان می‌دهد؛ پیشنهاد سیستم <strong>شناسایی سود پله اول (۲۵٪)</strong> و در صورت ادامه جهش <strong>پله دوم (۵۰٪)</strong> جهت خرید در کف حمایتی است.
            </>
          ) : (
            <>
              بازار در وضعیت امن قرار دارد؛ نیاز به خروج پلکانی فوری نیست. در صورت شکست اولین حمایت (<strong>{market.supports && market.supports.length > 0 ? toman(market.supports[0]) : "-"} تومان</strong>)، حد ضرر پلکانی فعال می‌شود.
            </>
          )}
        </p>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 py-2 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
      <dt className="text-muted-foreground font-medium">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
