import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  RefreshCcw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Vault,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { useMarket } from "@/lib/market-engine";
import {
  adjustVault,
  getAccountingSummary,
  getMyProfile,
  getPortfolio,
  getUnsettledTrades,
  getVault,
  listCounterparties,
  settleTrade,
  vaultTransfer,
  type AccountingEntry,
  type UnsettledTrade,
} from "@/lib/api";
import { toman, grams, pct, signedToman, withCommas } from "@/lib/format";
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

const TITLE = "حسابداری و تسویه";
const SUBTITLE = "کارنامه مالی اشخاص، معاملات تسویه‌نشده و مدیریت گاوصندوق";

export const Route = createFileRoute("/_authenticated/accounting")({
  head: () => ({
    meta: [
      { title: `${TITLE} | میز طلای کوانت` },
      { name: "description", content: SUBTITLE },
      { property: "og:title", content: `${TITLE} | میز طلای کوانت` },
      { property: "og:description", content: SUBTITLE },
    ],
  }),
  component: AccountingPage,
});

function AccountingPage() {
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
        <AccountingSummaryPanel />
        <UnsettledTradesPanel />
        <VaultPanel />
      </div>
    </AppShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Accounting Summary — Per-Counterparty Cards                              */
/* ═══════════════════════════════════════════════════════════════════════════ */
function AccountingSummaryPanel() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["accounting-summary"],
    queryFn: getAccountingSummary,
    refetchInterval: 60_000,
  });

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3 mb-2">
        <div className="grid size-10 place-items-center rounded-xl border border-gold/30 bg-gold/10">
          <ShieldCheck className="size-5 text-gold" />
        </div>
        <div>
          <p className="font-bold text-foreground text-lg">📒 کارنامه مالی و شاخص‌های بازدهی</p>
          <p className="text-xs text-muted-foreground">
            وضعیت بدهکاری/بستانکاری و KPI به تفکیک طرف حساب‌ها
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : !entries || entries.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">هیچ معامله‌ای ثبت نشده است.</p>
        </div>
      ) : (
        entries.map((entry) => (
          <CounterpartyCard key={entry.counterparty} entry={entry} />
        ))
      )}
    </section>
  );
}

function CounterpartyCard({ entry }: { entry: AccountingEntry }) {
  const statusColor =
    entry.status === "settled"
      ? "text-profit"
      : entry.status === "debtor"
        ? "text-loss"
        : "text-profit";
  const borderColor =
    entry.status === "settled"
      ? "border-profit/30"
      : entry.status === "debtor"
        ? "border-loss/30"
        : "border-profit/30";

  const goldIsLong = entry.trading_gold >= -0.0001;
  const goldLabel = goldIsLong ? "⚖️ موجودی طلای باز (Long)" : "⏳ موقعیت فردایی (Short)";
  const goldColor = goldIsLong ? "text-gold" : "text-loss";

  const beVal = goldIsLong ? entry.avg_entry_mazaneh : entry.avg_short_mazaneh;
  const beText = beVal > 0 ? `سربسر: ${withCommas(Math.round(beVal))} م` : "بدون موقعیت باز";

  const rColor = entry.realized_pnl >= 0 ? "text-profit" : "text-loss";
  const uColor = entry.unrealized_pnl >= 0 ? "text-profit" : "text-loss";
  const roiColor = entry.roi_percent >= 0 ? "text-profit" : "text-loss";

  return (
    <div className={cn("glass-panel rounded-2xl p-5 space-y-4", `border-r-[3px] ${borderColor}`)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="font-bold text-gold text-lg">👤 {entry.counterparty}</p>
          <p className={cn("text-sm", statusColor)}>{entry.status_text}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            ({entry.pending_trades} معامله تسویه‌نشده)
          </p>
        </div>
        <div className="rounded-full border border-border bg-card/50 px-4 py-2 text-center">
          <p className="text-[10px] text-muted-foreground">🏆 شاخص بازدهی</p>
          <p className={cn("num text-lg font-bold", roiColor)}>
            {pct(entry.roi_percent)}
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Gold Balance */}
        <div className="rounded-xl bg-card/60 p-3 border-r-[3px] border-gold/40">
          <p className="text-[11px] text-muted-foreground">{goldLabel}</p>
          <p className={cn("num text-lg font-bold mt-1", goldColor)}>
            {grams(entry.trading_gold)}g
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{beText}</p>
        </div>

        {/* Realized PnL */}
        <div className={cn("rounded-xl bg-card/60 p-3 border-r-[3px]", entry.realized_pnl >= 0 ? "border-profit/40" : "border-loss/40")}>
          <p className="text-[11px] text-muted-foreground">💵 سود محقق‌شده</p>
          <p className={cn("num text-lg font-bold mt-1", rColor)}>
            {signedToman(entry.realized_pnl)} ت
          </p>
          <p className="text-[10px] text-gold mt-0.5">
            +{grams(entry.gold_alpha_grams)}g آلفا
          </p>
        </div>

        {/* Unrealized PnL */}
        <div className={cn("rounded-xl bg-card/60 p-3 border-r-[3px]", entry.unrealized_pnl >= 0 ? "border-profit/40" : "border-loss/40")}>
          <p className="text-[11px] text-muted-foreground">📈 سود لحظه‌ای</p>
          <p className={cn("num text-lg font-bold mt-1", uColor)}>
            {signedToman(entry.unrealized_pnl)} ت
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            روی نوسان موجودی باز
          </p>
        </div>

        {/* Turnover */}
        <div className="rounded-xl bg-card/60 p-3 border-r-[3px] border-neutral/40">
          <p className="text-[11px] text-muted-foreground">🔄 گردش مالی</p>
          <p className="num text-lg font-bold mt-1 text-neutral">
            {toman(entry.total_turnover)} ت
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            مجموع حجم معاملات
          </p>
        </div>
      </div>

      {/* AI Advice (if present) */}
      {entry.ai_advice && (
        <div className="rounded-xl border border-profit/20 bg-profit/[0.04] p-3 text-sm text-foreground/90 leading-relaxed">
          <p className="text-xs font-bold text-profit mb-1">🤖 مشاوره تخصصی سیستم:</p>
          <p className="text-[12px] text-muted-foreground">{entry.ai_advice}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Unsettled Trades Panel                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
function UnsettledTradesPanel() {
  const queryClient = useQueryClient();
  const { data: trades, isLoading } = useQuery({
    queryKey: ["unsettled-trades"],
    queryFn: getUnsettledTrades,
    refetchInterval: 30_000,
  });

  const settleMutation = useMutation({
    mutationFn: (id: number) => settleTrade(id, false),
    onSuccess: () => {
      toast.success("تسویه انجام شد ✅");
      queryClient.invalidateQueries({ queryKey: ["unsettled-trades"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-summary"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
    },
    onError: (err: any) => toast.error(err?.message || "خطا"),
  });

  return (
    <section className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="grid size-10 place-items-center rounded-xl border border-warn/30 bg-warn/10">
          <RefreshCcw className="size-5 text-warn" />
        </div>
        <div>
          <p className="font-bold text-foreground">⏳ معاملات در انتظار تسویه</p>
          <p className="text-xs text-muted-foreground">
            {trades?.length ?? 0} معامله باز
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
        ) : !trades || trades.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto size-8 text-profit mb-2" />
            <p className="text-profit font-medium">تمام معاملات تسویه شده‌اند ✅</p>
          </div>
        ) : (
          trades.map((trade) => (
            <div
              key={trade.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 hover:bg-white/[0.01] transition-colors"
            >
              {trade.type === "BUY" ? (
                <ArrowDownCircle className="size-4 text-profit shrink-0" />
              ) : (
                <ArrowUpCircle className="size-4 text-loss shrink-0" />
              )}
              <span className="text-sm font-bold min-w-[120px]">
                {trade.type_label}
              </span>
              <span className="num text-sm min-w-[70px]">{grams(trade.weight_grams)}g</span>
              <span className="num text-sm min-w-[100px]">{toman(trade.total_value)} ت</span>
              <span className="text-sm text-muted-foreground flex-1">{trade.counterparty}</span>
              <span className="text-xs text-muted-foreground min-w-[100px]">{trade.shamsi_date}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-profit hover:text-profit/80"
                disabled={settleMutation.isPending}
                onClick={() => settleMutation.mutate(trade.id)}
              >
                <CheckCircle2 className="size-3.5 ml-1" />
                تسویه
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Gold Vault Panel                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */
function VaultPanel() {
  const queryClient = useQueryClient();
  const market = useMarket();

  const { data: vault, isLoading } = useQuery({
    queryKey: ["vault"],
    queryFn: getVault,
    refetchInterval: 60_000,
  });

  const { data: counterparties } = useQuery({
    queryKey: ["counterparties"],
    queryFn: listCounterparties,
  });

  const [showAdjust, setShowAdjust] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  // Vault Adjust form
  const [adjOp, setAdjOp] = useState<"increase" | "decrease">("increase");
  const [adjWeight, setAdjWeight] = useState("");
  const [adjNotes, setAdjNotes] = useState("");

  // Transfer form
  const [xferDir, setXferDir] = useState<"vault_to_trade" | "trade_to_vault">("vault_to_trade");
  const [xferWeight, setXferWeight] = useState("");
  const [xferPrice, setXferPrice] = useState("");
  const [xferCp, setXferCp] = useState("نامشخص");

  const adjustMutation = useMutation({
    mutationFn: adjustVault,
    onSuccess: (data: any) => {
      toast.success(data?.message || "عملیات انجام شد ✅");
      queryClient.invalidateQueries({ queryKey: ["vault"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      setAdjWeight("");
      setAdjNotes("");
      setShowAdjust(false);
    },
    onError: (err: any) => toast.error(err?.message || "خطا"),
  });

  const transferMutation = useMutation({
    mutationFn: vaultTransfer,
    onSuccess: (data: any) => {
      toast.success(data?.message || "انتقال انجام شد ✅");
      queryClient.invalidateQueries({ queryKey: ["vault"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      setXferWeight("");
      setXferPrice("");
      setShowTransfer(false);
    },
    onError: (err: any) => toast.error(err?.message || "خطا"),
  });

  return (
    <section className="glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl border border-gold/30 bg-gold/10">
            <Lock className="size-5 text-gold" />
          </div>
          <div>
            <p className="font-bold text-foreground text-lg">🔒 گاوصندوق (طلای فیزیکی)</p>
            {vault && (
              <p className="text-xs text-muted-foreground">
                <span className="num font-semibold text-gold">{grams(vault.total_weight)}g</span>
                {" | "}
                <span className="num">{toman(vault.current_value)} تومان</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setShowAdjust(!showAdjust); setShowTransfer(false); }}
          >
            <Vault className="size-3.5 ml-1" />
            تنظیم موجودی
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setShowTransfer(!showTransfer); setShowAdjust(false); }}
          >
            <ArrowLeftRight className="size-3.5 ml-1" />
            چرخش دارایی
          </Button>
        </div>
      </div>

      {/* Vault Adjust Form */}
      {showAdjust && (
        <div className="border-b border-border bg-card/30 px-5 py-4 space-y-3">
          <p className="text-sm font-bold text-gold-soft">🥇 افزایش یا کاهش موجودی گاوصندوق</p>
          <div className="grid gap-3 sm:grid-cols-4">
            <Select value={adjOp} onValueChange={(v) => setAdjOp(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">افزایش موجودی (تزریق طلا)</SelectItem>
                <SelectItem value="decrease">کاهش موجودی (برداشت)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="مقدار (گرم)"
              value={adjWeight}
              onChange={(e) => setAdjWeight(e.target.value)}
              className="num text-left"
            />
            <Input
              placeholder="توضیحات"
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
            />
            <Button
              className="bg-gold text-gold-foreground hover:bg-gold/80"
              disabled={adjustMutation.isPending || !adjWeight}
              onClick={() => {
                const w = Number(adjWeight) || 0;
                if (w <= 0) return toast.error("مقدار باید بزرگتر از صفر باشد.");
                adjustMutation.mutate({ weight_grams: w, operation: adjOp, notes: adjNotes });
              }}
            >
              {adjustMutation.isPending && <Loader2 className="size-3 animate-spin ml-1" />}
              اعمال
            </Button>
          </div>
        </div>
      )}

      {/* Vault Transfer Form */}
      {showTransfer && (
        <div className="border-b border-border bg-card/30 px-5 py-4 space-y-3">
          <p className="text-sm font-bold text-gold-soft">
            ⚖️ چرخش دارایی (انتقال فوری بین گاوصندوق و حساب معاملاتی)
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Select value={xferDir} onValueChange={(v) => setXferDir(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vault_to_trade">📤 گاوصندوق → حساب باز</SelectItem>
                <SelectItem value="trade_to_vault">📥 حساب باز → گاوصندوق</SelectItem>
              </SelectContent>
            </Select>

            <Select value={xferCp} onValueChange={setXferCp}>
              <SelectTrigger><SelectValue placeholder="طرف حساب" /></SelectTrigger>
              <SelectContent>
                {(counterparties || []).map((cp: any) => (
                  <SelectItem key={cp.id} value={cp.name}>{cp.name}</SelectItem>
                ))}
                <SelectItem value="نامشخص">نامشخص</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="text"
              inputMode="decimal"
              placeholder="مقدار (گرم)"
              value={xferWeight}
              onChange={(e) => setXferWeight(e.target.value)}
              className="num text-left"
            />

            <Input
              type="text"
              inputMode="numeric"
              placeholder={market ? `مظنه: ${withCommas(Math.round(market.gram18))}` : "قیمت (ت/گرم)"}
              value={xferPrice}
              onChange={(e) => setXferPrice(e.target.value)}
              className="num text-left"
            />

            <Button
              className="bg-gold text-gold-foreground hover:bg-gold/80"
              disabled={transferMutation.isPending || !xferWeight || !xferPrice}
              onClick={() => {
                const w = Number(xferWeight) || 0;
                const p = Number(xferPrice.replace(/[^0-9.]/g, "")) || 0;
                if (w <= 0 || p <= 0) return toast.error("مقادیر نامعتبر");
                transferMutation.mutate({
                  weight_grams: w,
                  price_per_gram: p,
                  counterparty: xferCp,
                  direction: xferDir,
                });
              }}
            >
              {transferMutation.isPending && <Loader2 className="size-3 animate-spin ml-1" />}
              ✅ انتقال
            </Button>
          </div>
        </div>
      )}

      {/* Vault Entries Table */}
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : !vault || vault.entries.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">هنوز طلایی به گاوصندوق اضافه نشده.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-2 px-5 py-2 text-[11px] text-muted-foreground font-medium bg-card/30">
              <span>وزن (گرم)</span>
              <span>قیمت ورود (ت/گرم)</span>
              <span>توضیح</span>
              <span>تاریخ</span>
            </div>
            {vault.entries.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-4 gap-2 px-5 py-2.5 text-sm hover:bg-white/[0.01] transition-colors"
              >
                <span className={cn("num font-semibold", e.weight_grams >= 0 ? "text-profit" : "text-loss")}>
                  {e.weight_grams >= 0 ? "+" : ""}{grams(e.weight_grams)}g
                </span>
                <span className="num text-muted-foreground">
                  {e.entry_price > 0 ? withCommas(Math.round(e.entry_price)) : "—"}
                </span>
                <span className="text-muted-foreground truncate">{e.notes || "—"}</span>
                <span className="text-xs text-muted-foreground">{e.date_time?.slice(0, 16) || "—"}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
