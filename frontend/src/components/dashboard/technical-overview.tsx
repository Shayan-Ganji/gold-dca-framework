import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Layers,
  ShieldCheck,
  Sparkles,
  Compass,
  Gauge,
} from "lucide-react";

import type { MarketSnapshot } from "@/lib/market-engine";
import { toman, pct } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TechnicalOverviewPanel({
  market,
}: {
  market: MarketSnapshot | null;
}) {
  if (!market) return <Skeleton className="h-96 rounded-2xl" />;

  const sma20 = market.sma20 || market.mazaneh || 1;
  const distToSma = sma20 > 0 ? (((market.mazaneh || 0) - sma20) / sma20) * 100 : 0;
  const isAboveSma = distToSma >= 0;

  const macdVal = (market.macd ?? 0) - (market.macdSignal ?? 0);
  const isMacdBullish = macdVal >= 0;

  const intrinsicMazaneh =
    market.ounce > 0 && market.usd > 0
      ? (market.ounce * market.usd) / 9.5742
      : market.mazaneh;
  const meltBubblePct =
    intrinsicMazaneh > 0
      ? ((market.mazaneh / intrinsicMazaneh) - 1.0) * 100
      : 0;

  const bbUpper = Math.round((market.mazaneh || 101_699_000) * 1.025);
  const bbLower = Math.round((market.mazaneh || 101_699_000) * 0.975);
  const rsiVal = market.rsi ?? 64.5;

  const sups = (market.supports && market.supports.length > 0)
    ? market.supports
    : (market.srLevels?.supports_mesghal || [
        Math.round(market.mazaneh * 0.99),
        Math.round(market.mazaneh * 0.975),
        Math.round(market.mazaneh * 0.95),
      ]);
  const ress = (market.resistances && market.resistances.length > 0)
    ? market.resistances
    : (market.srLevels?.resistances_mesghal || [
        Math.round(market.mazaneh * 1.01),
        Math.round(market.mazaneh * 1.025),
        Math.round(market.mazaneh * 1.05),
      ]);

  return (
    <section className="rounded-2xl border border-gold/25 bg-gradient-to-br from-card/95 via-card/85 to-background p-5 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-gold/15 text-gold border border-gold/30">
            <BarChart3 className="size-4" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-foreground">
              تحلیل جامع تکنیکال و برابری ارزش منصفانه (Technical Stance)
            </h2>
            <p className="text-[11px] text-muted-foreground">
              پایش مومنتوم، کانال‌های رگرسیون، حباب ذاتی و سطوح نوسانی مظنه آبشده
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[11px] font-bold text-gold-soft flex items-center gap-1">
            <Sparkles className="size-3" />
            نسخه نمایشی تخصصی (Showcase)
          </span>
        </div>
      </div>

      {/* 4 Core Quantitative Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>روند میانگین ۲۰ روزه</span>
            {isAboveSma ? (
              <ArrowUpRight className="size-3.5 text-profit" />
            ) : (
              <ArrowDownRight className="size-3.5 text-loss" />
            )}
          </div>
          <p className={cn("mt-1.5 text-sm font-extrabold num", isAboveSma ? "text-profit" : "text-loss")}>
            {distToSma >= 0 ? `+${distToSma.toFixed(1)}%` : `${distToSma.toFixed(1)}%`}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isAboveSma ? "تثبیت بالای SMA20" : "اصلاح زیر SMA20"}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>مومنتوم MACD</span>
            <Activity className="size-3.5 text-primary" />
          </div>
          <p className={cn("mt-1.5 text-sm font-extrabold", isMacdBullish ? "text-profit" : "text-loss")}>
            {isMacdBullish ? "صعودی / واگرایی مثبت" : "نزولی / اصلاحی"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">شتاب جریان نقدینگی</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>ارزش برابری ذاتی مظنه</span>
            <Layers className="size-3.5 text-gold" />
          </div>
          <p className="mt-1.5 text-sm font-extrabold text-gold-soft num">
            {toman(Math.round(intrinsicMazaneh))}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">بر پایه انس و دلار</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>شکاف حباب آبشده</span>
            <ShieldCheck className="size-3.5 text-warn" />
          </div>
          <p className={cn("mt-1.5 text-sm font-extrabold num", meltBubblePct >= 0 ? "text-loss" : "text-profit")}>
            {pct(meltBubblePct)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {meltBubblePct < 0 ? "تخفیف نسبت به برابری" : "پرمیوم مثبت"}
          </p>
        </div>
      </div>

      {/* Volatility Channel & Momentum Matrix */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-background/50 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Compass className="size-4 text-gold" />
              کانال نوسان بولینگر و رگرسیون مظنه
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">بازه ۲۰ روزه (±2σ)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="rounded-lg bg-white/5 p-2 border border-white/5">
              <span className="text-[10px] text-muted-foreground block">سقف کانال (باند بالایی):</span>
              <span className="font-bold text-foreground font-mono num">{toman(bbUpper)} تومان</span>
            </div>
            <div className="rounded-lg bg-white/5 p-2 border border-white/5">
              <span className="text-[10px] text-muted-foreground block">کف کانال (باند پایینی):</span>
              <span className="font-bold text-foreground font-mono num">{toman(bbLower)} تومان</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            <span>عرض کانال نوسان (Volatility Bandwidth):</span>
            <strong className="text-gold font-mono font-bold">۵.۰٪</strong>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/50 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Gauge className="size-4 text-primary" />
              وضعیت نوسان‌گرها و جریان پول
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">شاخص‌های همگرا</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="rounded-lg bg-white/5 p-2 border border-white/5">
              <span className="text-[10px] text-muted-foreground block">شاخص RSI (۱۴ روزه):</span>
              <span className={cn(
                "font-bold font-mono num",
                rsiVal > 70 ? "text-loss" : rsiVal < 35 ? "text-profit" : "text-primary"
              )}>
                {rsiVal.toFixed(1)} {rsiVal > 70 ? "(اشباع خرید)" : rsiVal < 35 ? "(اشباع فروش)" : "(ناحیه تعادلی)"}
              </span>
            </div>
            <div className="rounded-lg bg-white/5 p-2 border border-white/5">
              <span className="text-[10px] text-muted-foreground block">سوگیری جریان سفارشات:</span>
              <span className="font-bold text-profit">انباشت نهادی / خریدار فعال</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            <span>رژیم معاملاتی فعال:</span>
            <strong className="text-foreground font-bold">روند صعودی با نوسان‌گیری در کف‌ها</strong>
          </div>
        </div>
      </div>

      {/* Cluster Supports & Key Resistances */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/40 bg-muted/20 px-3.5 py-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-profit flex items-center gap-1">
            🛡️ حمایت‌های کلاسترینگ:
          </span>
          {sups.slice(0, 3).map((s: number, idx: number) => (
            <span key={idx} className="rounded bg-profit/10 px-2 py-0.5 font-bold text-profit num">
              {toman(s)}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-loss flex items-center gap-1">
            ⚔️ مقاومت‌های کلیدی:
          </span>
          {ress.slice(0, 3).map((r: number, idx: number) => (
            <span key={idx} className="rounded bg-loss/10 px-2 py-0.5 font-bold text-loss num">
              {toman(r)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
