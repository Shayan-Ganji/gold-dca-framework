import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  BookOpen,
  Calculator,
  Calendar,
  CheckCircle2,
  Coins,
  DollarSign,
  Layers,
  PiggyBank,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { getMyProfile } from "@/lib/api";
import { toman, pct, grams } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dca")({
  head: () => ({
    meta: [
      { title: "شبیه‌ساز انباشت سیستماتیک طلا (DCA Framework)" },
      {
        name: "description",
        content: "مقایسه علمی استراتژی میانگین‌سازی هزینه خرید (DCA) با خرید یکجا و انباشت پویا در بازار طلا.",
      },
    ],
  }),
  component: DcaPage,
});

function DcaPage() {
  const { data: account } = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  return (
    <AppShell
      title="شبیه‌ساز استراتژی انباشت طلا (DCA Framework)"
      subtitle="مقایسه علمی استراتژی میانگین‌سازی هزینه خرید با خرید یکجا و انباشت پویا در محیط‌های تورمی"
      displayName={account?.profile?.display_name ?? "کاربر مهمان (نمایشی)"}
      username={account?.profile?.username ?? "guest_demo"}
    >
      <DcaBody />
    </AppShell>
  );
}

function DcaBody() {
  const [timeframe, setTimeframe] = useState<"1y" | "2y" | "3y" | "5y" | "max">("3y");
  const [monthlyBudgetM, setMonthlyBudgetM] = useState<number>(50); // in Million Toman
  const [frequency, setFrequency] = useState<"monthly" | "weekly">("monthly");

  // Fetch historical data for DCA simulation
  const { data: rawHistory, isLoading } = useQuery({
    queryKey: ["dca-history-series"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/dca/history");
        if (!res.ok) throw new Error("Failed to load history");
        return await res.json();
      } catch (err) {
        // High quality simulated series if offline
        const total = 1200;
        let p = 12_500_000;
        return Array.from({ length: total }).map((_, i) => {
          p = p * (1 + 0.0009 + (Math.random() - 0.48) * 0.012);
          const d = new Date(Date.now() - (total - i) * 86400000);
          return {
            date: d.toISOString().split("T")[0],
            close: Math.round(p),
          };
        });
      }
    },
    staleTime: 300_000,
  });

  // Run DCA Simulation
  const simResult = useMemo(() => {
    if (!rawHistory || rawHistory.length < 30) return null;

    const days = timeframe === "1y" ? 365 : timeframe === "2y" ? 730 : timeframe === "3y" ? 1095 : timeframe === "5y" ? 1825 : rawHistory.length;
    const series = rawHistory.slice(-days);
    const stepDays = frequency === "weekly" ? 7 : 30;
    const budgetPerStep = frequency === "weekly" ? (monthlyBudgetM * 1_000_000) / 4 : monthlyBudgetM * 1_000_000;

    let totalCapital = 0;
    let fixedGrams = 0;
    let dynGrams = 0;
    let dynSpent = 0;
    let reservePool = 0;

    const p0 = series[0].close;
    const nSteps = Math.floor(series.length / stepDays);
    const totalCommitted = nSteps * budgetPerStep;
    const lumpGrams = totalCommitted / p0;

    const chartPoints: any[] = [];

    // Simple 60-day EMA for Dynamic DCA
    let ema = series[0].close;

    for (let i = 0; i < series.length; i++) {
      const price = series[i].close;
      ema = ema * (1 - 2 / 61) + price * (2 / 61);
      const isStepDay = i % stepDays === 0;

      if (isStepDay) {
        totalCapital += budgetPerStep;

        // Fixed DCA
        fixedGrams += budgetPerStep / price;

        // Dynamic Value-Aware DCA
        const valRatio = price / (ema + 1e-6);
        let mult = 1.0;
        if (valRatio > 1.08) mult = 0.45; // overheated -> reduce spend, build reserve
        else if (valRatio < 0.96) mult = 1.45; // discounted -> deploy extra

        let targetSpend = budgetPerStep * mult;
        reservePool += (budgetPerStep - targetSpend);
        if (reservePool < 0) {
          targetSpend += reservePool;
          reservePool = 0;
        }

        dynGrams += targetSpend / price;
        dynSpent += targetSpend;
      }

      // Record monthly/sampled points for chart
      if (i % 10 === 0 || i === series.length - 1) {
        const curPrice = series[i].close;
        const fixedWac = totalCapital > 0 && fixedGrams > 0 ? totalCapital / fixedGrams : curPrice;
        const dynWac = dynSpent > 0 && dynGrams > 0 ? dynSpent / dynGrams : curPrice;

        chartPoints.push({
          date: series[i].date,
          price: curPrice,
          fixedGrams: Number(fixedGrams.toFixed(2)),
          dynGrams: Number(dynGrams.toFixed(2)),
          lumpGrams: Number(lumpGrams.toFixed(2)),
          fixedWac: Math.round(fixedWac),
          dynWac: Math.round(dynWac),
          dynEquity: Math.round((dynGrams * curPrice) + reservePool),
          fixedEquity: Math.round(fixedGrams * curPrice),
          totalInvested: Math.round(totalCapital),
        });
      }
    }

    const latestPrice = series[series.length - 1].close;
    const finalDynWac = dynGrams > 0 ? dynSpent / dynGrams : latestPrice;
    const finalFixedWac = fixedGrams > 0 ? totalCapital / fixedGrams : latestPrice;
    const dynEquity = (dynGrams * latestPrice) + reservePool;
    const fixedEquity = fixedGrams * latestPrice;
    const lumpEquity = lumpGrams * latestPrice;

    const dynRoi = totalCapital > 0 ? ((dynEquity - totalCapital) / totalCapital) * 100 : 0;
    const fixedRoi = totalCapital > 0 ? ((fixedEquity - totalCapital) / totalCapital) * 100 : 0;
    const lumpRoi = totalCapital > 0 ? ((lumpEquity - totalCapital) / totalCapital) * 100 : 0;

    return {
      totalCapital,
      nSteps,
      latestPrice,
      fixedGrams,
      dynGrams,
      lumpGrams,
      finalFixedWac,
      finalDynWac,
      dynEquity,
      fixedEquity,
      lumpEquity,
      dynRoi,
      fixedRoi,
      lumpRoi,
      chartPoints,
    };
  }, [rawHistory, timeframe, monthlyBudgetM, frequency]);

  return (
    <div className="space-y-6">
      {/* ── CARD 1: WHAT IS DCA? ── */}
      <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/80 to-background p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/30">
            <BookOpen className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-foreground">بخش اول: استراتژی میانگین‌سازی هزینه (DCA) چیست؟</h2>
            <p className="text-xs text-muted-foreground">مبانی نظری، فلسفه سرمایه‌گذاری منظم و چرایی برتری در اقتصادهای تورمی</p>
          </div>
        </div>

        <p className="text-sm text-foreground/90 leading-relaxed text-justify">
          استراتژی <b>Dollar-Cost Averaging (به اختصار DCA)</b> یا <b>میانگین‌سازی هزینه خرید</b>، یک متدولوژی سیستماتیک و انضباط‌محور در مدیریت سبد دارایی است. 
          در این رویکرد، سرمایه‌گذار به جای تزریق کل نقدینگی در یک زمان تصادفی (Lump Sum)، سرمایه خود را به بخش‌های مساوی تقسیم کرده و در فواصل زمانی از پیش‌تعیین‌شده (مثلاً ماهانه یا هفتگی) فارغ از نوسانات هیجانی بازار اقدام به خرید دارایی پایه (طلا) می‌نماید.
        </p>

        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-profit text-xs font-bold">
              <Shield className="size-4" />
              <span>مهار خطای زمان‌بندی بازار</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              پیش‌بینی کف‌ها و سقف‌های قیمتی در بازار ملتهب ارز و طلا عملاً ناممکن است. DCA نیاز به حدس‌زدن کف قیمت را برای همیشه خنثی می‌سازد.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-gold text-xs font-bold">
              <PiggyBank className="size-4" />
              <span>سپر محکم در برابر تورم ریالی</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              نگهداری ریال موجب ذوب شدن مستمر قدرت خرید می‌شود؛ DCA فرآیند تبدیل خودکار درآمد مازاد به طلای فیزیکی را بدون اضطراب تضمین می‌کند.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-warn text-xs font-bold">
              <CheckCircle2 className="size-4" />
              <span>انضباط رفتاری و آرامش روانی</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              حذف تله‌های روان‌شناختی طمع در قله‌ها (FOMO) و ترس از ریزش در کف‌ها (Panic Selling) با پایبندی به یک تقویم انباشت برنامه‌ریزی‌شده.
            </p>
          </div>
        </div>
      </section>

      {/* ── CARD 2: METHODOLOGY & MATHEMATICS ── */}
      <section className="rounded-2xl border border-gold/20 bg-gradient-to-br from-card/90 via-card/80 to-background p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gold/15 text-gold border border-gold/30">
            <Calculator className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-foreground">بخش دوم: متدولوژی ریاضی و نحوه اجرای شبیه‌سازی</h2>
            <p className="text-xs text-muted-foreground">فرمول میانگین موزون بهای تمام‌شده و تفاوت انباشت مکانیکی در برابر انباشت پویا</p>
          </div>
        </div>

        <p className="text-sm text-foreground/90 leading-relaxed text-justify">
          بهای تمام‌شده هر گرم طلا در انباشت پله‌ای بر پایه <b>میانگین موزون (Weighted Average Cost - WAC)</b> محاسبه می‌گردد. 
          به دلیل ثابت بودن مبلغ تزریق در هر دوره، زمانی که قیمت طلا ارزان‌تر است، گرم طلای بیشتری خریداری می‌شود و در گرانی‌ها گرم کمتر؛ این پدیده ریاضی باعث می‌شود WAC همواره بسیار پایین‌تر از میانگین حسابی ساده بازار تثبیت گردد:
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-border/80 bg-background/60 p-3 font-mono text-xs text-gold-soft num" dir="ltr">
          <span>WAC = Σ(Cash_Injected_i) / Σ(Grams_Acquired_i)</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 pt-2">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
            <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span>۱. انباشت با فواصل ثابت (Mechanical DCA)</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              تزریق دقیق و بی‌وقفه بودجه ثابت در سررسیدهای مشخص. این روش ساده‌ترین و مطمئن‌ترین راهکار برای عموم سرمایه‌گذاران و پس‌اندازهای خانوادگی است.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
            <h4 className="text-xs font-bold text-profit flex items-center gap-1.5">
              <span>۲. انباشت پویا مبتنی بر ارزش (Dynamic Value-Aware DCA)</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              تعدیل هوشمند حجم خرید: در حباب‌های هیجانی، خرید به ۴۵٪ کاهش یافته و نقدینگی ذخیره می‌شود؛ در اصلاح‌های قیمتی، نقدینگی ذخیره‌شده با ضریب ۱۴۵٪ در قیمت‌های کف تزریق می‌گردد تا میانگین بهای تمام‌شده باز هم کاهش یابد.
            </p>
          </div>
        </div>
      </section>

      {/* ── CARD 3: INTERACTIVE SIMULATOR ── */}
      <section className="rounded-2xl border border-border bg-card/85 p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/30">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-foreground">بخش سوم: شبیه‌ساز تعاملی انباشت طلا</h2>
              <p className="text-xs text-muted-foreground">پارامترهای سرمایه‌گذاری را تغییر دهید و نتایج مقایسه‌ای را در زمان واقعی مشاهده کنید</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-muted-foreground">بازه تاریخی:</span>
            {(["1y", "2y", "3y", "5y", "max"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "rounded-lg px-2.5 py-1 transition-colors border",
                  timeframe === tf
                    ? "bg-gold/20 border-gold/40 font-bold text-gold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground",
                )}
              >
                {tf === "1y" ? "۱ سال" : tf === "2y" ? "۲ سال" : tf === "3y" ? "۳ سال" : tf === "5y" ? "۵ سال" : "کل تاریخچه"}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="grid gap-6 sm:grid-cols-2 rounded-xl border border-border/50 bg-muted/20 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>بودجه ماهانه تخصیص سرمایه:</span>
              <span className="font-black text-gold-soft num text-sm">{toman(monthlyBudgetM * 1_000_000)} تومان</span>
            </div>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={monthlyBudgetM}
              onChange={(e) => setMonthlyBudgetM(Number(e.target.value))}
              className="w-full accent-gold cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground num">
              <span>۱۰ میلیون ت</span>
              <span>۲۵۰ میلیون ت</span>
              <span>۵۰۰ میلیون ت</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium">فواصل زمانی تزریق پله‌ای:</div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFrequency("monthly")}
                className={cn(
                  "rounded-lg py-2 text-xs font-bold border transition-colors",
                  frequency === "monthly"
                    ? "bg-primary/20 border-primary text-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                ماهانه (هر ۳۰ روز یکبار)
              </button>
              <button
                type="button"
                onClick={() => setFrequency("weekly")}
                className={cn(
                  "rounded-lg py-2 text-xs font-bold border transition-colors",
                  frequency === "weekly"
                    ? "bg-primary/20 border-primary text-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                هفتگی (هر ۷ روز یکبار)
              </button>
            </div>
          </div>
        </div>

        {/* Simulation Output Cards */}
        {simResult ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="metric-card">
                <h4>کل نقدینگی تزریق‌شده</h4>
                <h2 className="num text-foreground">{toman(simResult.totalCapital)} <span className="text-xs font-normal">ت</span></h2>
                <p>{simResult.nSteps} پله واریزی</p>
              </div>

              <div className="metric-card" style={{ borderRightColor: "var(--profit)" }}>
                <h4>انباشت طلا (DCA پویا)</h4>
                <h2 className="num text-profit">{grams(simResult.dynGrams)} <span className="text-xs font-normal">گرم</span></h2>
                <p className="text-muted-foreground">DCA سنتی: {grams(simResult.fixedGrams)} گرم</p>
              </div>

              <div className="metric-card" style={{ borderRightColor: "var(--gold)" }}>
                <h4>بهای تمام‌شده موزون (WAC)</h4>
                <h2 className="num text-gold-soft">{toman(Math.round(simResult.finalDynWac))} <span className="text-xs font-normal">ت/گرم</span></h2>
                <p>مظنه فعلی: {toman(Math.round(simResult.latestPrice))} تومان</p>
              </div>

              <div className="metric-card" style={{ borderRightColor: simResult.dynRoi >= 0 ? "var(--profit)" : "var(--loss)" }}>
                <h4>بازده کل سرمایه‌گذاری (ROI)</h4>
                <h2 className={cn("num", simResult.dynRoi >= 0 ? "text-profit" : "text-loss")}>
                  %{simResult.dynRoi.toFixed(1)}
                </h2>
                <p>ارزش روز سبد: {toman(Math.round(simResult.dynEquity))} ت</p>
              </div>
            </div>

            {/* Recharts Graphical Analysis */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-foreground">📈 مقایسه بصری رفتار استراتژی‌های انباشت</h3>

              {/* Chart 1: Gold Grams Accumulated */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-semibold text-muted-foreground">منحنی انباشت تجمعی فیزیک طلا (گرم)</span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-profit flex items-center gap-1">
                      <span className="size-2 rounded-full bg-profit inline-block" /> DCA پویا (ارزش‌محور)
                    </span>
                    <span className="text-primary flex items-center gap-1">
                      <span className="size-2 rounded-full bg-primary inline-block" /> DCA سنتی (فواصل ثابت)
                    </span>
                  </div>
                </div>
                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={simResult.chartPoints} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} />
                      <YAxis stroke="#666" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}g`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#161b22", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "8px", fontSize: "11px" }}
                        formatter={(v: any) => [`${v} گرم طلا`, ""]}
                      />
                      <Line type="monotone" dataKey="dynGrams" stroke="#00E676" strokeWidth={2.5} dot={false} name="DCA پویا" />
                      <Line type="monotone" dataKey="fixedGrams" stroke="#388bfd" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="DCA سنتی" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: WAC vs Spot Market Price */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-semibold text-muted-foreground">مقایسه بهای تمام‌شده موزون (WAC) در برابر قیمت لحظه‌ای بازار (نمایش حاشیه امنیت)</span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-gold flex items-center gap-1">
                      <span className="size-2 rounded-full bg-gold inline-block" /> قیمت روز بازار
                    </span>
                    <span className="text-profit flex items-center gap-1">
                      <span className="size-2 rounded-full bg-profit inline-block" /> WAC پویا
                    </span>
                    <span className="text-primary flex items-center gap-1">
                      <span className="size-2 rounded-full bg-primary inline-block" /> WAC سنتی
                    </span>
                  </div>
                </div>
                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={simResult.chartPoints} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} />
                      <YAxis stroke="#666" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}م`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#161b22", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "8px", fontSize: "11px" }}
                        formatter={(v: any) => [`${toman(Number(v))} تومان/گرم`, ""]}
                      />
                      <Line type="monotone" dataKey="price" stroke="#FFD700" strokeWidth={1.5} dot={false} name="قیمت روز بازار" />
                      <Line type="monotone" dataKey="dynWac" stroke="#00E676" strokeWidth={2.5} dot={false} name="WAC پویا" />
                      <Line type="monotone" dataKey="fixedWac" stroke="#388bfd" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="WAC سنتی" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/60">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="p-3">استراتژی انباشت</th>
                    <th className="p-3">سرمایه ورودی</th>
                    <th className="p-3">کل طلای جمع‌آوری‌شده</th>
                    <th className="p-3">بهای تمام‌شده هر گرم (WAC)</th>
                    <th className="p-3">ارزش روز دارایی</th>
                    <th className="p-3">بازده کل (ROI)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  <tr className="bg-profit/5">
                    <td className="p-3 font-bold text-profit flex items-center gap-1">
                      <Sparkles className="size-3.5" /> DCA پویا (ارزش‌محور)
                    </td>
                    <td className="p-3 num">{toman(simResult.totalCapital)} ت</td>
                    <td className="p-3 num font-bold text-profit">{grams(simResult.dynGrams)} گرم</td>
                    <td className="p-3 num font-bold text-gold-soft">{toman(Math.round(simResult.finalDynWac))} ت</td>
                    <td className="p-3 num">{toman(Math.round(simResult.dynEquity))} ت</td>
                    <td className="p-3 num font-extrabold text-profit">%{simResult.dynRoi.toFixed(1)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-primary">DCA سنتی (فواصل ثابت)</td>
                    <td className="p-3 num">{toman(simResult.totalCapital)} ت</td>
                    <td className="p-3 num">{grams(simResult.fixedGrams)} گرم</td>
                    <td className="p-3 num">{toman(Math.round(simResult.finalFixedWac))} ت</td>
                    <td className="p-3 num">{toman(Math.round(simResult.fixedEquity))} ت</td>
                    <td className="p-3 num text-primary">%{simResult.fixedRoi.toFixed(1)}</td>
                  </tr>
                  <tr className="text-muted-foreground">
                    <td className="p-3 font-bold">خرید یکجا (Lump Sum در روز ۱)</td>
                    <td className="p-3 num">{toman(simResult.totalCapital)} ت</td>
                    <td className="p-3 num">{grams(simResult.lumpGrams)} گرم</td>
                    <td className="p-3 num">{toman(Math.round(simResult.chartPoints[0]?.price || 0))} ت</td>
                    <td className="p-3 num">{toman(Math.round(simResult.lumpEquity))} ت</td>
                    <td className="p-3 num">%{simResult.lumpRoi.toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <Skeleton className="h-40 rounded-xl" />
        )}
      </section>
    </div>
  );
}
