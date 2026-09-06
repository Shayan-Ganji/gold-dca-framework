import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  BellPlus,
  BellRing,
  Bot,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { useMarket } from "@/lib/market-engine";
import {
  addAlert,
  deleteAlert,
  getAiSignal,
  getMyProfile,
  getSignalHistory,
  listAlerts,
  type AiSignal,
  type PriceAlert,
  type SignalHistoryEntry,
} from "@/lib/api";
import { toman, withCommas, pct } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TITLE = "آلارم‌های قیمتی";
const SUBTITLE = "تعریف هشدار قیمتی و مانیتور سیگنال هوش مصنوعی";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: `${TITLE} | میز طلای کوانت` },
      { name: "description", content: SUBTITLE },
      { property: "og:title", content: `${TITLE} | میز طلای کوانت` },
      { property: "og:description", content: SUBTITLE },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { data: account } = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  return (
    <AppShell
      title={TITLE}
      subtitle={SUBTITLE}
      displayName={account?.profile?.display_name ?? undefined}
      username={account?.profile?.username ?? undefined}
    >
      <div className="space-y-6">
        <AiSignalPanel />
        <AddAlertPanel />
        <ActiveAlertsPanel />
        <SignalHistoryPanel />
      </div>
    </AppShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AI Signal Panel                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */
function AiSignalPanel() {
  const { data: signal, isLoading } = useQuery({
    queryKey: ["ai-signal"],
    queryFn: getAiSignal,
    refetchInterval: 60_000,
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (!signal) return null;

  const actionColors: Record<string, string> = {
    "STRONG BUY": "text-profit",
    BUY: "text-profit",
    HOLD: "text-warn",
    "PARTIAL SELL": "text-loss",
    "STRONG SELL": "text-loss",
    SELL: "text-loss",
  };

  const actionBgs: Record<string, string> = {
    "STRONG BUY": "bg-profit/10 border-profit/30",
    BUY: "bg-profit/10 border-profit/30",
    HOLD: "bg-warn/10 border-warn/30",
    "PARTIAL SELL": "bg-loss/10 border-loss/30",
    "STRONG SELL": "bg-loss/10 border-loss/30",
    SELL: "bg-loss/10 border-loss/30",
  };

  const actionIcons: Record<string, typeof TrendingUp> = {
    "STRONG BUY": TrendingUp,
    BUY: TrendingUp,
    HOLD: Zap,
    "PARTIAL SELL": TrendingDown,
    "STRONG SELL": TrendingDown,
    SELL: TrendingDown,
  };

  const Icon = actionIcons[signal.action] || Zap;
  const color = actionColors[signal.action] || "text-muted-foreground";
  const bg = actionBgs[signal.action] || "bg-card/50 border-border";

  const freshLabel = signal.is_fresh
    ? "🟢 بروز (کمتر از ۱۰ دقیقه)"
    : signal.age_seconds != null
      ? `🟡 ${Math.round(signal.age_seconds / 60)} دقیقه پیش`
      : "⚪ نامشخص";

  return (
    <section className={cn("glass-panel rounded-2xl overflow-hidden border", bg)}>
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("grid size-12 place-items-center rounded-xl border", bg)}>
            <Icon className={cn("size-6", color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-gold" />
              <p className="font-bold text-foreground">سیگنال هوش مصنوعی XGBoost</p>
            </div>
            <p className={cn("text-2xl font-extrabold mt-1", color)}>
              {signal.action}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{freshLabel}</p>
          </div>
        </div>

        {/* Probability Bars */}
        <div className="flex gap-4">
          <ProbBar label="صعود" value={signal.prob_buy} color="bg-profit" />
          <ProbBar label="خنثی" value={signal.prob_hold} color="bg-warn" />
          <ProbBar label="نزول" value={signal.prob_sell} color="bg-loss" />
        </div>
      </div>

      {/* Top Drivers */}
      {signal.top_drivers && signal.top_drivers.length > 0 && (
        <div className="border-t border-border px-5 py-3 bg-card/20">
          <p className="text-[11px] text-muted-foreground mb-2">
            <Sparkles className="inline size-3 ml-1 text-gold" />
            عوامل کلیدی تصمیم مدل:
          </p>
          <div className="flex flex-wrap gap-2">
            {signal.top_drivers.slice(0, 6).map((d, i) => (
              <span
                key={i}
                className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs text-gold-soft"
              >
                {d.Feature}
                <span className="num mr-1 text-[10px] text-muted-foreground">
                  ({(d.Importance * 100).toFixed(0)}%)
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pctVal = Math.round(value * 100);
  return (
    <div className="text-center min-w-[60px]">
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <div className="h-16 w-6 mx-auto rounded-full bg-card/60 border border-border overflow-hidden flex flex-col-reverse">
        <div className={cn("w-full rounded-full transition-all", color)} style={{ height: `${pctVal}%` }} />
      </div>
      <p className="num text-xs font-bold mt-1">{pctVal}%</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Add Alert Form                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */
function AddAlertPanel() {
  const queryClient = useQueryClient();
  const market = useMarket();

  const [unit, setUnit] = useState<"mesghal" | "gram">("mesghal");
  const [priceRaw, setPriceRaw] = useState("");
  const [condition, setCondition] = useState<string>(">=");
  const [isOpen, setIsOpen] = useState(true);

  const defaultPrice = useMemo(() => {
    if (!market) return "";
    return unit === "mesghal"
      ? Math.round(market.mazaneh).toString()
      : Math.round(market.gram18).toString();
  }, [market, unit]);

  const mutation = useMutation({
    mutationFn: addAlert,
    onSuccess: () => {
      toast.success("هشدار قیمتی ثبت شد ✅");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setPriceRaw("");
    },
    onError: (err: any) => toast.error(err?.message || "خطا"),
  });

  function handleSubmit() {
    const p = Number(priceRaw.replace(/[^0-9.]/g, ""));
    if (!p || p <= 0) return toast.error("قیمت هدف نامعتبر.");
    mutation.mutate({ target_price_toman: p, condition: condition as ">=" | "<=", unit });
  }

  return (
    <section className="glass-panel rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl border border-gold/30 bg-gold/10">
            <BellPlus className="size-5 text-gold" />
          </div>
          <div className="text-right">
            <p className="font-bold text-foreground">➕ ثبت هشدار جدید</p>
            <p className="text-xs text-muted-foreground">
              وقتی مظنه یا قیمت گرم به حد مشخصی رسید، اطلاع بده
            </p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
      </button>

      {isOpen && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          <div className="grid gap-3 sm:grid-cols-4">
            {/* Unit */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">واحد قیمت</label>
              <Select value={unit} onValueChange={(v) => setUnit(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mesghal">مظنه (مثقال ۱۷ عیار)</SelectItem>
                  <SelectItem value="gram">گرم (۱۸ عیار)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">قیمت هدف (تومان)</label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder={defaultPrice ? `بازار: ${withCommas(defaultPrice)}` : "مثلاً 80,000,000"}
                value={priceRaw}
                onChange={(e) => setPriceRaw(e.target.value)}
                className="num text-left"
              />
            </div>

            {/* Condition */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">شرط</label>
              <Select value={condition} onValueChange={(v) => setCondition(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=">=">📈 بزرگتر مساوی (≥)</SelectItem>
                  <SelectItem value="<=">📉 کوچکتر مساوی (≤)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <div className="flex items-end">
              <Button
                className="w-full bg-gold text-gold-foreground hover:bg-gold/80 font-bold"
                onClick={handleSubmit}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <Loader2 className="size-4 animate-spin ml-1" />
                ) : (
                  <BellPlus className="size-4 ml-1" />
                )}
                ثبت هشدار
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Active Alerts List                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */
function ActiveAlertsPanel() {
  const queryClient = useQueryClient();
  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: listAlerts,
    refetchInterval: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      toast.success("هشدار حذف شد 🗑️");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (err: any) => toast.error(err?.message || "خطا"),
  });

  return (
    <section className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="grid size-10 place-items-center rounded-xl border border-gold/30 bg-gold/10">
          <BellRing className="size-5 text-gold" />
        </div>
        <div>
          <p className="font-bold text-foreground">🔔 هشدارهای فعال</p>
          <p className="text-xs text-muted-foreground">
            {alerts?.length ?? 0} هشدار فعال — بررسی هر ۶۰ ثانیه توسط alert_daemon
          </p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : !alerts || alerts.length === 0 ? (
          <div className="py-10 text-center">
            <BellRing className="mx-auto size-8 text-muted-foreground mb-2 opacity-40" />
            <p className="text-muted-foreground">هیچ هشدار فعالی ندارید.</p>
            <p className="text-xs text-muted-foreground mt-1">از فرم بالا یک هشدار جدید اضافه کنید.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.01] transition-colors"
            >
              <span className="text-xl shrink-0">{alert.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{alert.description}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  هدف: <span className="num">{withCommas(alert.target_price_toman)} ت/گرم</span>
                  {" | "}
                  <span className="num">{withCommas(alert.target_mazaneh)} مظنه</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-loss hover:text-loss/80 shrink-0"
                onClick={() => deleteMutation.mutate(alert.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="size-3.5 ml-1" />
                لغو
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Signal History Chart (Recharts)                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */
function SignalHistoryPanel() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["signal-history"],
    queryFn: () => getSignalHistory(30),
    refetchInterval: 300_000,
  });

  const chartData = useMemo(() => {
    if (!history) return [];
    return [...history].reverse().map((entry, i) => ({
      idx: i,
      time: entry.logged_at?.slice(11, 16) || String(i),
      buy: Math.round(entry.prob_buy * 100),
      hold: Math.round(entry.prob_hold * 100),
      sell: Math.round(entry.prob_sell * 100),
      signal: entry.signal,
    }));
  }, [history]);

  return (
    <section className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="grid size-10 place-items-center rounded-xl border border-gold/30 bg-gold/10">
          <Sparkles className="size-5 text-gold" />
        </div>
        <div>
          <p className="font-bold text-foreground">📊 تاریخچه سیگنال‌ها</p>
          <p className="text-xs text-muted-foreground">
            آخرین ۳۰ سیگنال هوش مصنوعی — احتمالات خرید، خنثی و فروش
          </p>
        </div>
      </div>

      <div className="p-5">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : chartData.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            هنوز تاریخچه سیگنالی ثبت نشده است.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barGap={0} barCategoryGap="12%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.3 0.02 278 / 30%)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fill: "oklch(0.68 0.03 268)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "oklch(0.68 0.03 268)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.19 0.03 278)",
                  border: "1px solid oklch(0.79 0.14 85 / 18%)",
                  borderRadius: "12px",
                  color: "oklch(0.95 0.008 265)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "oklch(0.68 0.03 268)" }}
              />
              <Bar dataKey="buy" name="صعود %" stackId="stack" radius={[0, 0, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill="oklch(0.766 0.166 158)" />
                ))}
              </Bar>
              <Bar dataKey="hold" name="خنثی %" stackId="stack" radius={[0, 0, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill="oklch(0.78 0.15 62)" />
                ))}
              </Bar>
              <Bar dataKey="sell" name="نزول %" stackId="stack" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill="oklch(0.653 0.2 22)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
