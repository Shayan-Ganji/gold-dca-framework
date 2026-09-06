import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Layers,
  ShieldCheck,
  Sparkles,
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
  const [activeRange, setActiveRange] = useState<"30d" | "60d" | "90d">("60d");

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["technical-overview-candles", activeRange],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/charts/candles?range=${activeRange}`);
        if (!res.ok) throw new Error("Failed to load candles");
        return await res.json();
      } catch (err) {
        const days = activeRange === "30d" ? 30 : activeRange === "60d" ? 60 : 90;
        const base = market?.mazaneh || 101_150_000;
        return Array.from({ length: days }).map((_, i) => {
          const factor = 1 + Math.sin(i / 5) * 0.02 + (i / days) * 0.035;
          const p = Math.round(base * factor);
          return {
            date: `روز ${i + 1}`,
            price: p,
            ema20: Math.round(p * 0.992),
            ema50: Math.round(p * 0.985),
            bbUpper: Math.round(p * 1.025),
            bbLower: Math.round(p * 0.975),
          };
        });
      }
    },
    staleTime: 60_000,
  });

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

  const sups = market.srLevels?.supports_mesghal || [
    Math.round(market.mazaneh * 0.99),
    Math.round(market.mazaneh * 0.975),
    Math.round(market.mazaneh * 0.95),
  ];
  const ress = market.srLevels?.resistances_mesghal || [
    Math.round(market.mazaneh * 1.01),
    Math.round(market.mazaneh * 1.025),
    Math.round(market.mazaneh * 1.05),
  ];

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
              پایش مومنتوم، کانال‌های رگرسیون و سطوح نوسانی مظنه آبشده
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[11px] font-bold text-gold-soft flex items-center gap-1">
            <Sparkles className="size-3" />
            نسخه نمایشی تخصصی (Showcase)
          </span>
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-medium">
            {(["30d", "60d", "90d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setActiveRange(r)}
                className={cn(
                  "rounded-md px-2 py-0.5 transition-colors",
                  activeRange === r
                    ? "bg-gold/20 font-bold text-gold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r === "30d" ? "۳۰ روز" : r === "60d" ? "۶۰ روز" : "۹۰ روز"}
              </button>
            ))}
          </div>
        </div>
      </div>

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

      <div className="rounded-xl border border-border/70 bg-background/50 p-3">
        <div className="flex items-center justify-between mb-2 px-1 text-xs">
          <span className="font-semibold text-muted-foreground">
            نمودار روند مظنه به همراه میانگین‌های نمایی و باندهای بولینگر
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-gold">
              <span className="size-2 rounded-full bg-gold inline-block" /> مظنه
            </span>
            <span className="flex items-center gap-1 text-profit">
              <span className="size-2 rounded-full bg-profit inline-block" /> EMA 20
            </span>
            <span className="flex items-center gap-1 text-loss">
              <span className="size-2 rounded-full bg-loss inline-block" /> EMA 50
            </span>
          </div>
        </div>

        <div className="h-56 w-full" dir="ltr">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#666"
                  fontSize={10}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}م`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161b22",
                    border: "1px solid rgba(255,215,0,0.3)",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                  formatter={(val: any) => [toman(Number(val)) + " تومان", ""]}
                />
                <Line
                  type="monotone"
                  dataKey="bbUpper"
                  stroke="rgba(100, 150, 255, 0.25)"
                  strokeDasharray="3 3"
                  dot={false}
                  name="باند بالا"
                />
                <Line
                  type="monotone"
                  dataKey="bbLower"
                  stroke="rgba(100, 150, 255, 0.25)"
                  strokeDasharray="3 3"
                  dot={false}
                  name="باند پایین"
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#FFD700"
                  strokeWidth={2.5}
                  dot={false}
                  name="مظنه آبشده"
                />
                <Line
                  type="monotone"
                  dataKey="ema20"
                  stroke="#00E676"
                  strokeWidth={1.5}
                  dot={false}
                  name="EMA 20"
                />
                <Line
                  type="monotone"
                  dataKey="ema50"
                  stroke="#FF5252"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="EMA 50"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

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
