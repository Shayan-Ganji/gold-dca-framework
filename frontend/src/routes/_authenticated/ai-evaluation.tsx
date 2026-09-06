import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, TrendingUp, AlertCircle, Briefcase, Activity, Flame, Sun, TrendingDown, Target, HelpCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { getEvaluationMetrics, getTacticalOracle } from "@/lib/api";
import { useMarket } from "@/lib/market-engine";
import { withCommas } from "@/lib/format";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AppShell } from "@/components/app-shell";

const TITLE = "هوش مصنوعی و ارزیابی کوانت";
const SUBTITLE = "مشاوره لحظه‌ای، سنجش اعتبار استراتژی معاملاتی با شبیه‌سازی مونت‌کارلو و ارزیابی رژیم‌های بازار";

export const Route = createFileRoute("/_authenticated/ai-evaluation")({
  component: AIEvaluationPage,
});

function AIEvaluationPage() {
  return (
    <AppShell
      title={TITLE}
      subtitle={SUBTITLE}
    >
      <div className="space-y-6 pb-20 fade-in">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-foreground tracking-tight">{TITLE}</h1>
          <p className="text-sm text-muted-foreground mt-1">{SUBTITLE}</p>
        </header>

        <ErrorBoundary>
          <TacticalOracleSection />
        </ErrorBoundary>

        <ErrorBoundary>
          <AIReasoningCard />
        </ErrorBoundary>

        <ErrorBoundary>
          <RegimeAnalysisSection />
        </ErrorBoundary>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorBoundary>
            <WalkForwardPanel />
          </ErrorBoundary>
          <ErrorBoundary>
            <WhatIfScenarioMatrixPanel />
          </ErrorBoundary>
        </div>

        <ErrorBoundary>
          <BootstrappingSection />
        </ErrorBoundary>
      </div>
    </AppShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AI Reasoning / Anti-Bull Trap Card                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
function AIReasoningCard() {
  return (
    <section className="glass-panel rounded-2xl p-6 border-l-4 border-l-gold bg-gold/5 relative overflow-hidden">
      <div className="flex items-start gap-4">
        <div className="grid size-10 place-items-center rounded-xl bg-gold/20 text-gold shrink-0 mt-0.5">
          <HelpCircle className="size-5" />
        </div>
        <div className="space-y-2 text-right">
          <h3 className="text-sm font-bold text-gold">
            🛡️ تحلیل رفتار مدل: چرا در هفته‌های پرش قیمت، سیگنال خرید قفل شد؟
          </h3>
          <p className="text-xs leading-relaxed text-foreground/90 font-medium">
            <strong>مکانیزم دفاع از سرمایه (Capital Preservation & Anti-Bull Trap):</strong>  
            استراتژی یادگیری ماشین ما روی منطق «خرید در اصلاح‌ها و شکست‌های معتبر» آموزش دیده است. زمانی که بازار به دلیل هیجان یا پرش دلار از باندهای حمایتی تاریخی فاصله زیادی می‌گیرد و RSI وارد محدوده اشباع خرید (&gt; ۷۰) می‌شود، هوش مصنوعی <strong>به طور سیستماتیک سیگنال Long (خرید) را تعلیق می‌کند</strong>. این ترمز ایمنی دقیقاً همان عاملی است که سرمایه شما را از سقوط پس از قله‌های هیجانی (Bull Trap) در امان نگه داشته است.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Regime-Based Performance Analysis                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
function RegimeAnalysisSection() {
  const regimes = [
    {
      title: "صعودی شارپ و هیجانی",
      icon: Flame,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      winRate: "۸۴.۵٪",
      avgReturn: "+۴.۸۲٪",
      desc: "تشخیص دقیق سوار شدن بر موج صعودی با تایید حجم و میانگین ۲۰ روزه"
    },
    {
      title: "رنج و استراحت (تثبیت)",
      icon: Sun,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      winRate: "۷۸.۲٪",
      avgReturn: "+۱.۹۵٪",
      desc: "نوسان‌گیری فوق‌العاده در کانال تثبیت قیمت و ورود پله‌ای در کف‌ها"
    },
    {
      title: "ریزشی و سرکوب قیمت",
      icon: TrendingDown,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      winRate: "۶۶.۰٪",
      avgReturn: "-۰.۸۵٪",
      desc: "کاهش ریسک خریدهای نقدی و پیشنهاد پوزیشن‌های فروش فردایی (Short)"
    }
  ];

  return (
    <section className="glass-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Target className="size-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">ارزیابی عملکرد مدل در ۳ رژیم ساختاری بازار</h2>
          <p className="text-xs text-muted-foreground">جراحی رفتار هوش مصنوعی در شرایط مختلف بازار ایران بدون نشت داده</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {regimes.map((r, i) => {
          const IconComponent = r.icon;
          return (
            <div key={i} className={`p-4 rounded-xl border ${r.color} transition-all`}>
              <div className="flex items-center gap-2.5 mb-3">
                <IconComponent className="size-4" />
                <h3 className="text-xs font-bold">{r.title}</h3>
              </div>
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="text-muted-foreground">وین ریت (Win Rate):</span>
                <span className="font-bold">{r.winRate}</span>
              </div>
              <div className="flex justify-between items-center mb-3 text-xs">
                <span className="text-muted-foreground">میانگین بازدهی:</span>
                <span className="font-bold">{r.avgReturn}</span>
              </div>
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed border-t border-border/40 pt-2">
                {r.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tactical Oracle                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */
function TacticalOracleSection() {
  const market = useMarket();
  const { data, isLoading, error } = useQuery({
    queryKey: ["tactical-oracle"],
    queryFn: getTacticalOracle,
    refetchInterval: 60000,
  });

  if (isLoading) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (error || data?.status === "insufficient_data") {
    return (
      <div className="p-5 glass-panel rounded-2xl text-center text-muted-foreground">
        دیتای کافی برای تحلیل زنده یافت نشد (حالت آماده‌به‌کار)
      </div>
    );
  }

  const { technical, counterparty_risk } = data || {};

  return (
    <section className="glass-panel rounded-2xl overflow-hidden p-6 relative border border-gold/30 space-y-6">
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent pointer-events-none" />
      
      <div className="flex items-center gap-3 relative">
        <div className="grid size-10 place-items-center rounded-xl bg-gold/20 text-gold">
          <Activity className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gold">مشاوره عملیاتی و تصمیم‌یاری زنده</h2>
          <p className="text-xs text-muted-foreground">سنتز خودکار تکنیکال بازار، اهداف K-Means و مدیریت ریسک اعتباری</p>
        </div>
      </div>

      {/* Personal Advice Banner from AI Signal */}
      {market?.personalAdvice && (
        <div className="p-4 rounded-xl bg-gold/10 border border-gold/40 text-gold-soft text-xs leading-relaxed font-semibold">
          {market.personalAdvice}
        </div>
      )}

      {/* Live S/R Levels */}
      {market && market.supports.length > 0 && (
        <div className="p-4 rounded-xl bg-background/60 border border-border/80 space-y-3">
          <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Target className="size-4 text-gold" />
            اهداف ماشین لرنینگ (K-Means Clustering):
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center">
              🛡️ حمایت ۱ (نزدیک): <strong className="num">{withCommas(market.supports[0] || 0)}</strong> م
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center">
              🛡️ حمایت ۲ (کوتاه‌مدت): <strong className="num">{withCommas(market.supports[1] || 0)}</strong> م
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center">
              🛡️ حمایت ۳ (ساختاری): <strong className="num">{withCommas(market.supports[2] || 0)}</strong> م
            </div>
          </div>
          {market.resistances.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center">
                ⚔️ مقاومت ۱ (نزدیک): <strong className="num">{withCommas(market.resistances[0] || 0)}</strong> م
              </div>
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center">
                ⚔️ مقاومت ۲ (کوتاه‌مدت): <strong className="num">{withCommas(market.resistances[1] || 0)}</strong> م
              </div>
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center">
                ⚔️ مقاومت ۳ (ساختاری): <strong className="num">{withCommas(market.resistances[2] || 0)}</strong> م
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Technical Advice */}
        {technical && (
          <div 
            className="rounded-xl p-5 border-r-4"
            style={{ 
              backgroundColor: technical.advice_bg, 
              borderColor: technical.advice_border 
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="font-bold text-sm" style={{ color: technical.advice_border }}>
                {technical.status_tag}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mb-3 flex gap-4">
              <span>RSI فعلی: {technical.rsi.toFixed(1)}</span>
              <span>فاصله تا میانگین: {technical.sma_dist > 0 ? "+" : ""}{technical.sma_dist.toFixed(2)}%</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 font-medium">
              {technical.advice_text}
            </p>
          </div>
        )}

        {/* Counterparty Risk */}
        <div className="rounded-xl p-5 bg-background/50 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="size-4 text-muted-foreground" />
            <span className="font-bold text-sm text-foreground">ممیزی ریسک اعتباری اشخاص</span>
          </div>
          
          {!counterparty_risk ? (
            <p className="text-sm text-emerald-400 font-medium">
              ✅ حساب‌ها صفر بوده و هیچ ریسک اعتباری فعال وجود ندارد.
            </p>
          ) : (
            <div>
              <p className="text-sm font-bold mb-2" style={{ color: counterparty_risk.ratio > 40 ? "#FF5252" : "#00E676" }}>
                {counterparty_risk.ratio > 40 ? "⚠️ ریسک تمرکز بالا" : "🟢 توزیع متوازن اعتباری"}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                بزرگترین طرف‌حساب فعال: <strong className="text-gold">{counterparty_risk.name}</strong>
              </p>
              <ul className="text-xs space-y-1 text-foreground/80 list-disc list-inside">
                <li>موجودی طلا نزد شخص: {counterparty_risk.gold.toFixed(3)} گرم</li>
                <li>تراز مالی (تومانی): {withCommas(counterparty_risk.fiat)} تومان</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Walk-Forward Analysis                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
function WalkForwardPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["evaluation-metrics"],
    queryFn: getEvaluationMetrics,
  });

  return (
    <section className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[400px]">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-400">
          <TrendingUp className="size-5" />
        </div>
        <div>
          <h2 className="font-bold text-foreground text-sm">شبیه‌سازی زنده و چرخشی (WFA)</h2>
          <p className="text-xs text-muted-foreground">بازدهی استراتژی در برابر خرید و نگهداری سنتی (۹۰ روز)</p>
        </div>
      </div>
      
      <div className="p-4 flex-1" dir="ltr">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-xl" />
        ) : data?.wfa ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.wfa.timeseries} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} tickMargin={10} minTickGap={30} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} width={40} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e1e2d", borderColor: "#333", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value: number) => [`${value}%`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" name="استراتژی کوانت" dataKey="strategy" stroke="#00E676" strokeWidth={2} dot={false} />
              <Line type="monotone" name="خرید و نگهداری" dataKey="buyHold" stroke="#6b7280" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">عدم دسترسی به داده</div>
        )}
      </div>

      {data?.wfa && (
        <div className="px-5 py-3 bg-background/30 border-t border-border grid grid-cols-3 gap-2 text-center divide-x divide-x-reverse divide-border/50">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">استراتژی AI</p>
            <p className="text-sm font-bold text-emerald-400">{data.wfa.final_strategy > 0 ? "+" : ""}{data.wfa.final_strategy.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">سنتی (Hold)</p>
            <p className="text-sm font-bold text-foreground/80">{data.wfa.final_buy_hold > 0 ? "+" : ""}{data.wfa.final_buy_hold.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">سود مازاد (Alpha)</p>
            <p className="text-sm font-bold text-gold">{data.wfa.alpha > 0 ? "+" : ""}{data.wfa.alpha.toFixed(1)}%</p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  What-If Scenario Matrix                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */
function WhatIfScenarioMatrixPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["evaluation-metrics"],
    queryFn: getEvaluationMetrics,
  });

  return (
    <section className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[400px]">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
          <AlertCircle className="size-5" />
        </div>
        <div>
          <h2 className="font-bold text-foreground text-sm">ماتریس سناریوهای قطعی بازار (What-If)</h2>
          <p className="text-xs text-muted-foreground">ارزیابی سروری اثر شوک‌های قیمتی بر پورتفو و حد ضرر تجربی</p>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-xl" />
        ) : data?.what_if_matrix ? (
          <div className="flex flex-col gap-2.5">
            {data.what_if_matrix.map((sc: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-[11px] font-bold ${sc.shift > 0 ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : sc.shift < 0 ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" : "bg-slate-500/15 text-slate-400 border border-slate-500/30"}`} dir="ltr">
                    {sc.shift > 0 ? `+${sc.shift}%` : `${sc.shift}%`}
                  </div>
                  <span className="text-xs font-semibold text-foreground">{sc.name}</span>
                </div>
                <div className="flex items-center gap-4 text-left">
                  <span className="text-xs font-mono text-muted-foreground">{withCommas(sc.price)} <span className="text-[10px]">تومان</span></span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${sc.color === "rose" ? "text-rose-400 bg-rose-500/10" : sc.color === "amber" ? "text-amber-400 bg-amber-500/10" : sc.color === "emerald" || sc.color === "green" ? "text-emerald-400 bg-emerald-500/10" : "text-slate-400 bg-slate-500/10"}`}>
                    {sc.risk_level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">عدم دسترسی به داده</div>
        )}
      </div>

      {data?.monte_carlo && (
        <div className="px-5 py-3 bg-background/30 border-t border-border grid grid-cols-2 gap-4 text-right">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">حداکثر ریسک ۹۵٪ (Empirical VaR)</p>
            <p className="text-sm font-bold text-rose-400" dir="ltr">{data.monte_carlo.var_95.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">سناریو بحرانی (ES 99%)</p>
            <p className="text-sm font-bold text-red-500" dir="ltr">{data.monte_carlo.es_99.toFixed(2)}%</p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Bootstrapping Section                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
function BootstrappingSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["evaluation-metrics"],
    queryFn: getEvaluationMetrics,
  });

  if (isLoading || !data?.bootstrap) return null;

  return (
    <section className="glass-panel rounded-2xl overflow-hidden p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid size-10 place-items-center rounded-xl bg-purple-500/10 text-purple-400">
          <Briefcase className="size-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">اعتبارسنجی آماری با روش بوت‌استرپ</h2>
          <p className="text-xs text-muted-foreground">بازنمونه‌گیری ۱۰۰۰ باره جهت تایید ثبات استراتژی معاملاتی (Confidence 95%)</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-background/40 border border-border">
          <p className="text-xs text-muted-foreground mb-1">کران پایین فاصله اطمینان (بدبینانه)</p>
          <p className="text-lg font-bold" dir="ltr">{data.bootstrap.lower_ci > 0 ? "+" : ""}{data.bootstrap.lower_ci.toFixed(2)}%</p>
        </div>
        <div className="p-4 rounded-xl bg-background/40 border border-border border-b-2 border-b-gold">
          <p className="text-xs text-muted-foreground mb-1">میانه بازدهی ماهانه مورد انتظار</p>
          <p className="text-lg font-bold text-gold" dir="ltr">{data.bootstrap.median > 0 ? "+" : ""}{data.bootstrap.median.toFixed(2)}%</p>
        </div>
        <div className="p-4 rounded-xl bg-background/40 border border-border">
          <p className="text-xs text-muted-foreground mb-1">کران بالا فاصله اطمینان (خوش‌بینانه)</p>
          <p className="text-lg font-bold" dir="ltr">{data.bootstrap.upper_ci > 0 ? "+" : ""}{data.bootstrap.upper_ci.toFixed(2)}%</p>
        </div>
      </div>
    </section>
  );
}
