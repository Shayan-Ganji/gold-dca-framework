import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Edit3,
  Loader2,
  Plus,
  RefreshCcw,
  Scale,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { useMarket } from "@/lib/market-engine";
import {
  addTrade,
  deleteTrade,
  editTrade,
  getMyProfile,
  getPortfolio,
  listCounterparties,
  listTrades,
  settleTrade,
  unsettleTrade,
  type AddTradePayload,
  type TradeRecord,
} from "@/lib/api";
import { toman, grams, pct, signedToman, withCommas, dateTimeFa } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const TITLE = "دفتر معاملات";
const SUBTITLE = "ثبت معامله جدید و تاریخچه کامل خرید و فروش طلا";

export const Route = createFileRoute("/_authenticated/trades")({
  head: () => ({
    meta: [
      { title: `${TITLE} | میز طلای کوانت` },
      { name: "description", content: SUBTITLE },
      { property: "og:title", content: `${TITLE} | میز طلای کوانت` },
      { property: "og:description", content: SUBTITLE },
    ],
  }),
  component: TradesPage,
});

/* ─── Smart Price Auto-Complete ────────────────────────────────────────────── */
function autoCompletePrice(raw: string): number {
  let n = Number(raw.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(n) || n <= 0) return 0;
  // Intelligent zero-padding for Iranian gold market prices in Toman (always >= 10,000,000 Toman)
  if (n < 1_000) n *= 100_000;
  else if (n < 10_000) n *= 10_000;
  else if (n < 100_000) n *= 1_000;
  else if (n < 1_000_000) n *= 100;
  else if (n < 10_000_000) n *= 10;
  return n;
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
function TradesPage() {
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
        <TradeFormPanel />
        <TradeHistoryPanel />
      </div>
    </AppShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Trade Entry Form                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */
function TradeFormPanel() {
  const market = useMarket();
  const queryClient = useQueryClient();

  const { data: counterparties } = useQuery({
    queryKey: ["counterparties"],
    queryFn: listCounterparties,
  });

  const { data: portfolio } = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
    refetchInterval: 60_000,
  });

  // Form state
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [priceUnit, setPriceUnit] = useState<"mesghal" | "gram">("mesghal");
  const [weightUnit, setWeightUnit] = useState<"mesghal" | "gram">("gram");
  const [priceRaw, setPriceRaw] = useState("");
  const [weightRaw, setWeightRaw] = useState("");
  const [counterparty, setCounterparty] = useState("نامشخص");
  const [notes, setNotes] = useState("");
  const [isShort, setIsShort] = useState(false);
  const [isHistorical, setIsHistorical] = useState(false);
  const [shamsiDate, setShamsiDate] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  // Computed values
  const pricePerGram = useMemo(() => {
    const p = autoCompletePrice(priceRaw);
    return priceUnit === "mesghal" ? p / 4.3318 : p;
  }, [priceRaw, priceUnit]);

  const weightGrams = useMemo(() => {
    const w = Number(weightRaw.replace(/[^0-9.]/g, "")) || 0;
    return weightUnit === "mesghal" ? w * 4.608 : w;
  }, [weightRaw, weightUnit]);

  const totalValue = pricePerGram * weightGrams;

  const maxBuyable = useMemo(() => {
    if (!portfolio || pricePerGram <= 0) return 0;
    return (portfolio.fiat_balance + portfolio.total_owned_gold * (market?.gram18 || 0)) / pricePerGram;
  }, [portfolio, pricePerGram, market]);

  const maxSellable = useMemo(() => {
    if (!portfolio) return 0;
    return portfolio.total_owned_gold;
  }, [portfolio]);

  const mutation = useMutation({
    mutationFn: addTrade,
    onSuccess: () => {
      toast.success("✅ معامله با موفقیت ثبت شد");
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["all-entries"] });
      // Reset form
      setWeightRaw("");
      setNotes("");
      setIsShort(false);
      setIsHistorical(false);
      setShamsiDate("");
    },
    onError: (err: any) => {
      toast.error(err?.message || "خطا در ثبت معامله");
    },
  });

  function handleSubmit() {
    if (weightGrams <= 0) return toast.error("وزن معامله باید بزرگتر از صفر باشد.");
    if (pricePerGram <= 0) return toast.error("قیمت معامله نامعتبر است.");

    const payload: AddTradePayload = {
      trade_type: tradeType,
      weight_grams: weightGrams,
      price_per_gram: pricePerGram,
      counterparty,
      trade_notes: notes,
      is_short: isShort,
      is_historical: isHistorical,
      shamsi_date: isHistorical ? shamsiDate : undefined,
    };
    mutation.mutate(payload);
  }

  // Set default price from live market
  const liveDefaultPrice = useMemo(() => {
    if (!market) return "";
    return priceUnit === "mesghal"
      ? Math.round(market.mazaneh).toString()
      : Math.round(market.gram18).toString();
  }, [market, priceUnit]);

  return (
    <section className="glass-panel rounded-2xl overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl border border-gold/30 bg-gold/10">
            <Plus className="size-5 text-gold" />
          </div>
          <div className="text-right">
            <p className="font-bold text-foreground">ثبت معامله جدید</p>
            <p className="text-xs text-muted-foreground">
              خرید نقدی، فروش یا معامله فردایی (Short)
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="size-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-5 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          {/* Row 1: Trade Type + Price Unit + Weight Unit */}
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Buy / Sell Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">نوع معامله</label>
              <div className="flex rounded-xl border border-border overflow-hidden">
                <button
                  type="button"
                  className={cn(
                    "flex-1 py-2.5 text-sm font-bold transition-colors",
                    tradeType === "BUY"
                      ? "bg-profit/15 text-profit border-l border-profit/30"
                      : "text-muted-foreground hover:bg-white/[0.03]",
                  )}
                  onClick={() => setTradeType("BUY")}
                >
                  <ArrowDownCircle className="inline-block size-4 ml-1.5 -mt-0.5" />
                  خرید
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 py-2.5 text-sm font-bold transition-colors",
                    tradeType === "SELL"
                      ? "bg-loss/15 text-loss border-r border-loss/30"
                      : "text-muted-foreground hover:bg-white/[0.03]",
                  )}
                  onClick={() => setTradeType("SELL")}
                >
                  <ArrowUpCircle className="inline-block size-4 ml-1.5 -mt-0.5" />
                  فروش
                </button>
              </div>
            </div>

            {/* Price Unit */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">واحد قیمت</label>
              <Select value={priceUnit} onValueChange={(v) => setPriceUnit(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mesghal">مظنه (مثقال ۱۷ عیار)</SelectItem>
                  <SelectItem value="gram">گرم (۱۸ عیار)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weight Unit */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">واحد وزن</label>
              <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gram">گرم</SelectItem>
                  <SelectItem value="mesghal">مثقال</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Price + Weight + Counterparty */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                قیمت ({priceUnit === "mesghal" ? "مظنه" : "گرم"}) — تومان
              </label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder={liveDefaultPrice ? `بازار: ${withCommas(liveDefaultPrice)}` : "مثلاً ۷۷۲۶"}
                value={priceRaw}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, "");
                  setPriceRaw(raw ? withCommas(Number(raw)) : "");
                }}
                onBlur={() => {
                  const num = autoCompletePrice(priceRaw);
                  if (num > 0) setPriceRaw(withCommas(num));
                }}
                className="num text-left font-bold text-gold"
              />
              {pricePerGram > 0 && (
                <p className="text-[11px] text-muted-foreground num">
                  = {withCommas(Math.round(pricePerGram))} ت/گرم
                  {priceUnit === "gram" && ` | مظنه: ${withCommas(Math.round(pricePerGram * 4.3318))}`}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                مقدار ({weightUnit === "mesghal" ? "مثقال" : "گرم"})
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder={weightUnit === "gram" ? "مثلاً ۱۰" : "مثلاً ۲"}
                value={weightRaw}
                onChange={(e) => setWeightRaw(e.target.value)}
                className="num text-left"
              />
              {weightGrams > 0 && weightUnit === "mesghal" && (
                <p className="text-[11px] text-muted-foreground num">
                  = {grams(weightGrams)} گرم
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">طرف معامله</label>
              <Select value={counterparty} onValueChange={setCounterparty}>
                <SelectTrigger><SelectValue placeholder="انتخاب..." /></SelectTrigger>
                <SelectContent>
                  {(counterparties || []).map((cp: any) => (
                    <SelectItem key={cp.id} value={cp.name}>
                      {cp.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="نامشخص">نامشخص</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Notes + Flags */}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">یادداشت</label>
              <Input
                placeholder="توضیحات معامله (اختیاری)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-end gap-4 pb-0.5">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={isShort}
                  onCheckedChange={(v) => setIsShort(v === true)}
                />
                <span className="text-warn">⏳ فردایی (Short)</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={isHistorical}
                  onCheckedChange={(v) => setIsHistorical(v === true)}
                />
                <span>📅 تاریخی</span>
              </label>
            </div>
          </div>

          {isHistorical && (
            <div className="max-w-xs space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">تاریخ شمسی (مثلاً 1404/05/09)</label>
              <Input
                placeholder="1404/05/09"
                value={shamsiDate}
                onChange={(e) => setShamsiDate(e.target.value)}
              />
            </div>
          )}

          {/* Summary + Submit */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card/60 px-4 py-3">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                ارزش معامله: <strong className="num text-foreground">{toman(totalValue)} ت</strong>
              </span>
              <span className="text-muted-foreground">
                وزن: <strong className="num text-foreground">{grams(weightGrams)}g</strong>
              </span>
              {tradeType === "BUY" && (
                <span className="text-muted-foreground">
                  حداکثر خرید: <strong className="num text-foreground">{grams(maxBuyable)}g</strong>
                </span>
              )}
              {tradeType === "SELL" && !isShort && (
                <span className="text-muted-foreground">
                  موجودی قابل فروش: <strong className="num text-foreground">{grams(maxSellable)}g</strong>
                </span>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={mutation.isPending || weightGrams <= 0 || pricePerGram <= 0}
              className={cn(
                "min-w-[160px] font-bold text-base",
                tradeType === "BUY"
                  ? "bg-profit hover:bg-profit/80 text-background"
                  : "bg-loss hover:bg-loss/80 text-background",
              )}
            >
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin ml-2" />
              ) : tradeType === "BUY" ? (
                <ArrowDownCircle className="size-4 ml-2" />
              ) : (
                <ArrowUpCircle className="size-4 ml-2" />
              )}
              {tradeType === "BUY" ? "ثبت خرید" : "ثبت فروش"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Trade History                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */
function TradeHistoryPanel() {
  const queryClient = useQueryClient();
  const market = useMarket();

  const { data: trades, isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: listTrades,
    refetchInterval: 30_000,
  });

  const [filter, setFilter] = useState<"ALL" | "BUY" | "SELL" | "UNSETTLED">("ALL");
  const [editingId, setEditingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!trades) return [];
    switch (filter) {
      case "BUY":
        return trades.filter((t) => t.type === "BUY");
      case "SELL":
        return trades.filter((t) => t.type === "SELL");
      case "UNSETTLED":
        return trades.filter((t) => !t.is_settled);
      default:
        return trades;
    }
  }, [trades, filter]);

  const settleMutation = useMutation({
    mutationFn: ({ id, vault }: { id: number; vault: boolean }) => settleTrade(id, vault),
    onSuccess: () => {
      toast.success("معامله تسویه شد ✅");
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (err: any) => toast.error(err?.message || "خطا در تسویه"),
  });

  const unsettleMutation = useMutation({
    mutationFn: unsettleTrade,
    onSuccess: () => {
      toast.success("تسویه بازگردانی شد");
      queryClient.invalidateQueries({ queryKey: ["trades"] });
    },
    onError: (err: any) => toast.error(err?.message || "خطا"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTrade,
    onSuccess: () => {
      toast.success("معامله حذف شد 🗑️");
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (err: any) => toast.error(err?.message || "خطا در حذف"),
  });

  return (
    <section className="glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl border border-gold/30 bg-gold/10">
            <Scale className="size-5 text-gold" />
          </div>
          <div>
            <p className="font-bold text-foreground">تاریخچه معاملات</p>
            <p className="text-xs text-muted-foreground">
              {trades?.length ?? 0} معامله ثبت‌شده
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5">
          {(
            [
              { key: "ALL", label: "همه" },
              { key: "BUY", label: "خریدها" },
              { key: "SELL", label: "فروش‌ها" },
              { key: "UNSETTLED", label: "تسویه‌نشده" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-gold/15 text-gold-soft"
                  : "text-muted-foreground hover:bg-white/[0.04]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">هنوز معامله‌ای ثبت نشده است</p>
          </div>
        ) : (
          filtered.map((trade) => (
            <TradeRow
              key={trade.id}
              trade={trade}
              market={market}
              isEditing={editingId === trade.id}
              onEditToggle={() =>
                setEditingId(editingId === trade.id ? null : trade.id)
              }
              onSettle={(vault) =>
                settleMutation.mutate({ id: trade.id, vault })
              }
              onUnsettle={() => unsettleMutation.mutate(trade.id)}
              onDelete={() => deleteMutation.mutate(trade.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

/* ─── Single Trade Row ─────────────────────────────────────────────────────── */
function TradeRow({
  trade,
  market,
  isEditing,
  onEditToggle,
  onSettle,
  onUnsettle,
  onDelete,
}: {
  trade: TradeRecord;
  market: ReturnType<typeof useMarket>;
  isEditing: boolean;
  onEditToggle: () => void;
  onSettle: (vault: boolean) => void;
  onUnsettle: () => void;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const isBuy = trade.type === "BUY";
  const typeColor = isBuy ? "text-profit" : "text-loss";
  const typeLabel = isBuy ? "خرید" : "فروش";
  const shortBadge = trade.is_short;
  const pnlColor =
    trade.pnl == null ? "" : trade.pnl >= 0 ? "text-profit" : "text-loss";

  // Inline edit state
  const [editWeight, setEditWeight] = useState(String(trade.weight_grams));
  const [editPrice, setEditPrice] = useState(String(trade.price_per_gram));
  const [editCp, setEditCp] = useState(trade.counterparty);
  const [editNotes, setEditNotes] = useState(trade.trade_notes);
  const [editIsShort, setEditIsShort] = useState(trade.is_short);

  const editMutation = useMutation({
    mutationFn: (payload: any) => editTrade(trade.id, payload),
    onSuccess: () => {
      toast.success("معامله ویرایش شد ✏️");
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      onEditToggle();
    },
    onError: (err: any) => toast.error(err?.message || "خطا"),
  });

  function handleSaveEdit() {
    const wg = Number(editWeight) || 0;
    const ppg = Number(editPrice) || 0;
    if (wg <= 0 || ppg <= 0) return toast.error("مقادیر نامعتبر");
    editMutation.mutate({
      weight_grams: wg,
      price_per_gram: ppg,
      counterparty: editCp,
      trade_notes: editNotes,
      is_short: editIsShort,
      total_value: wg * ppg,
    });
  }

  return (
    <div className="px-5 py-3 hover:bg-white/[0.01] transition-colors">
      {/* Main row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Icon + Type */}
        <div className="flex items-center gap-2 min-w-[80px]">
          {isBuy ? (
            <ArrowDownCircle className={cn("size-5 shrink-0", typeColor)} />
          ) : (
            <ArrowUpCircle className={cn("size-5 shrink-0", typeColor)} />
          )}
          <span className={cn("text-sm font-bold", typeColor)}>
            {typeLabel}
            {shortBadge && (
              <span className="mr-1 inline-block rounded bg-warn/15 px-1.5 py-0.5 text-[10px] text-warn">
                فردایی
              </span>
            )}
          </span>
        </div>

        {/* Weight */}
        <div className="text-sm text-center min-w-[65px]">
          <p className="num font-semibold text-foreground">{grams(trade.weight_grams)}g</p>
          <p className="num text-[10px] text-muted-foreground">{trade.weight_mesghal} مثقال</p>
        </div>

        {/* Price */}
        <div className="text-sm text-center min-w-[100px]">
          <p className="num font-semibold text-foreground">{withCommas(trade.price_mesghal)}</p>
          <p className="num text-[10px] text-muted-foreground">{withCommas(Math.round(trade.price_per_gram))} ت/گرم</p>
        </div>

        {/* Total Value */}
        <div className="text-sm text-center min-w-[100px]">
          <p className="num font-semibold text-foreground">{toman(trade.total_value)} ت</p>
        </div>

        {/* PnL (if available) */}
        {trade.pnl != null && (
          <div className="text-sm text-center min-w-[90px]">
            <p className={cn("num font-bold", pnlColor)}>{signedToman(trade.pnl)} ت</p>
            <p className="text-[10px] text-muted-foreground">سود لحظه‌ای</p>
          </div>
        )}

        {/* Counterparty + Date */}
        <div className="flex-1 min-w-[120px] text-sm">
          <p className="text-foreground">
            <CircleDollarSign className="inline-block size-3.5 ml-1 text-gold-soft" />
            {trade.counterparty || "—"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {trade.shamsi_date || dateTimeFa(trade.date_time)}
          </p>
        </div>

        {/* Settlement Badge */}
        <div className="min-w-[70px] text-center">
          {trade.is_settled ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-profit/10 px-2 py-0.5 text-[11px] text-profit">
              <CheckCircle2 className="size-3" /> تسویه‌شده
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-warn/10 px-2 py-0.5 text-[11px] text-warn">
              <RefreshCcw className="size-3" /> باز
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={onEditToggle}
            title="ویرایش"
          >
            <Edit3 className="size-3.5" />
          </Button>

          {!trade.is_settled ? (
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0 text-profit hover:text-profit/80"
              onClick={() => onSettle(false)}
              title="تسویه"
            >
              <CheckCircle2 className="size-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0 text-warn hover:text-warn/80"
              onClick={onUnsettle}
              title="بازگردانی تسویه"
            >
              <XCircle className="size-3.5" />
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 text-loss hover:text-loss/80"
                title="حذف"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>حذف معامله</AlertDialogTitle>
                <AlertDialogDescription>
                  آیا از حذف این معامله مطمئن هستید؟ این عمل غیرقابل بازگشت است.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>انصراف</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-loss hover:bg-loss/80"
                  onClick={onDelete}
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Inline Edit Panel */}
      {isEditing && (
        <div className="mt-3 rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <p className="text-xs font-bold text-gold-soft">✏️ ویرایش معامله #{trade.id}</p>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">وزن (گرم)</label>
              <Input
                className="num text-left"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">فی (ت/گرم)</label>
              <Input
                className="num text-left"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">طرف معامله</label>
              <Input value={editCp} onChange={(e) => setEditCp(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">یادداشت</label>
              <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={editIsShort}
                onCheckedChange={(v) => setEditIsShort(v === true)}
              />
              <span className="text-warn text-xs">فردایی</span>
            </label>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={onEditToggle}>
              انصراف
            </Button>
            <Button
              size="sm"
              disabled={editMutation.isPending}
              onClick={handleSaveEdit}
              className="bg-gold text-gold-foreground hover:bg-gold/80"
            >
              {editMutation.isPending && <Loader2 className="size-3 animate-spin ml-1" />}
              ذخیره تغییرات
            </Button>
          </div>
        </div>
      )}

      {/* Notes */}
      {trade.trade_notes && !isEditing && (
        <p className="mt-1 text-[11px] text-muted-foreground pr-7">
          💬 {trade.trade_notes}
        </p>
      )}
    </div>
  );
}
