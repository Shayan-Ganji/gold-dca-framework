import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { useMarket } from "@/lib/market-engine";
import { getMyProfile, listAllEntries } from "@/lib/api";
import {
  addCounterparty,
  ensureWorkspace,
  listCounterparties,
  listEntries,
  resetCarryOver,
  saveEntries,
  wipeLedger,
  type LedgerEntryInput,
} from "@/lib/api";
import { mazanehToGram, withRunningBalances, type LedgerRow } from "@/lib/portfolio";
import { grams, parseNumberInput, toLocalInputValue, toman, withCommas } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCards } from "@/components/ledger/KpiCards";
import { AiBanner } from "@/components/ledger/AiBanner";
import { RiskMatrix } from "@/components/ledger/RiskMatrix";
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

export const Route = createFileRoute("/_authenticated/ledger")({
  head: () => ({
    meta: [
      { title: "دفتر کل پیشرفته | حسابداری طلا و تومان" },
      {
        name: "description",
        content:
          "دفتر کل ۱۲ ستونی با تکمیل هوشمند، مانده جاری طلا و تومان، پوزیشن فردایی و انتقال مانده.",
      },
      { property: "og:title", content: "دفتر کل پیشرفته | حسابداری طلا و تومان" },
      {
        property: "og:description",
        content: "دفتر کل ۱۲ ستونی با تکمیل هوشمند، مانده جاری طلا و تومان و انتقال مانده.",
      },
    ],
  }),
  component: LedgerPage,
});

function emptyRow(mazaneh: number): LedgerEntryInput {
  return {
    id: null,
    entry_at: new Date().toISOString(),
    entry_type: "trade",
    notes: "",
    mazaneh: Math.round(mazaneh),
    gold_in: 0,
    gold_out: 0,
    fiat_debtor: 0,
    fiat_creditor: 0,
    is_short: false,
    is_settled: false,
  };
}

function LedgerPage() {
  const fetchProfile = useServerFn(getMyProfile);
  const { data: account } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  return (
    <AppShell
      title="دفتر کل پیشرفته"
      subtitle="ثبت معاملات طلا و تومان با تکمیل هوشمند و مانده جاری"
      displayName={account?.profile?.display_name ?? undefined}
      username={account?.profile?.username ?? undefined}
    >
      <LedgerGrid />
    </AppShell>
  );
}

function LedgerGrid() {
  const market = useMarket();
  const queryClient = useQueryClient();

  const init = useServerFn(ensureWorkspace);
  const fetchParties = useServerFn(listCounterparties);
  const fetchEntries = useServerFn(listEntries);
  const persist = useServerFn(saveEntries);
  const addParty = useServerFn(addCounterparty);
  const wipe = useServerFn(wipeLedger);
  const carryOver = useServerFn(resetCarryOver);

  const [partyId, setPartyId] = useState<string | null>(null);
  const [rows, setRows] = useState<LedgerEntryInput[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [newParty, setNewParty] = useState("");

  const { data: parties, isLoading: partiesLoading } = useQuery({
    queryKey: ["counterparties"],
    queryFn: async () => {
      await init();
      return fetchParties();
    },
  });

  useEffect(() => {
    if (!partyId && parties?.length) setPartyId(parties[0].id);
  }, [parties, partyId]);

  const { data: serverRows, isFetching } = useQuery({
    queryKey: ["entries", partyId],
    queryFn: () => fetchEntries({ data: { counterpartyId: partyId } }),
    enabled: Boolean(partyId),
  });

  useEffect(() => {
    if (serverRows) {
      setRows(serverRows as LedgerEntryInput[]);
      setDeletedIds([]);
      setDirty(false);
    }
  }, [serverRows]);

  const computed = useMemo(() => withRunningBalances(rows as LedgerRow[]), [rows]);
  const last = computed.at(-1);

  const saveMutation = useMutation({
    mutationFn: () =>
      persist({ data: { counterpartyId: partyId!, entries: rows, deletedIds } }),
    onSuccess: async () => {
      toast.success("دفتر کل ذخیره شد");
      setDirty(false);
      await queryClient.invalidateQueries({ queryKey: ["entries", partyId] });
      await queryClient.invalidateQueries({ queryKey: ["all-entries"] });
    },
    onError: (error: Error) => toast.error(error.message || "ذخیره ناموفق بود"),
  });

  function patch(index: number, changes: Partial<LedgerEntryInput>) {
    setDirty(true);
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  }

  /**
   * Smart-fill: entering grams + mazaneh derives the matching fiat leg, so the
   * clerk only ever types two numbers per trade.
   */
  function smartFill(index: number, field: "gold_in" | "gold_out", value: number) {
    const row = rows[index];
    const gramPrice = mazanehToGram(row.mazaneh || market?.mazaneh || 0);
    const amount = Math.round(value * gramPrice);
    patch(index, {
      [field]: value,
      ...(field === "gold_in"
        ? { gold_out: 0, fiat_creditor: amount, fiat_debtor: 0 }
        : { gold_in: 0, fiat_debtor: amount, fiat_creditor: 0 }),
    } as Partial<LedgerEntryInput>);
  }

  function addRow() {
    setDirty(true);
    setRows((prev) => [...prev, emptyRow(market?.mazaneh ?? 0)]);
  }

  function removeRow(index: number) {
    const row = rows[index];
    if (row.id) setDeletedIds((prev) => [...prev, row.id!]);
    setRows((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  if (partiesLoading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div className="space-y-4">
      <AiBanner partyId={partyId} />
      <KpiCards partyId={partyId} />
      
      <div className="glass-panel grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-4 sm:flex sm:flex-wrap">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-xs text-muted-foreground">طرف حساب</span>
          <Select value={partyId ?? ""} onValueChange={setPartyId}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="انتخاب" />
            </SelectTrigger>
            <SelectContent>
              {(parties ?? []).map((party: { id: string; name: string }) => (
                <SelectItem key={party.id} value={party.id}>
                  {party.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={newParty}
            onChange={(e) => setNewParty(e.target.value)}
            placeholder="طرف حساب جدید"
            className="w-40"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (!newParty.trim()) return;
              const created = await addParty({ data: { name: newParty.trim() } });
              setNewParty("");
              await queryClient.invalidateQueries({ queryKey: ["counterparties"] });
              setPartyId(created.id);
            }}
          >
            افزودن
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:mr-auto">
          <Button size="sm" onClick={addRow} variant="secondary">
            <Plus className="size-4" /> ردیف جدید
          </Button>
          <Button
            size="sm"
            disabled={!dirty || saveMutation.isPending || !partyId}
            onClick={() => saveMutation.mutate()}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            ذخیره
          </Button>

          <ConfirmButton
            label="انتقال مانده"
            icon={<RotateCcw className="size-4" />}
            title="انتقال مانده به دوره جدید؟"
            description="تمام ردیف‌های این طرف حساب حذف می‌شود و تنها یک ردیف افتتاحیه با مانده فعلی طلا و تومان باقی می‌ماند."
            onConfirm={async () => {
              await carryOver({
                data: {
                  counterpartyId: partyId!,
                  goldBalance: last?.goldBalance ?? 0,
                  fiatBalance: last?.fiatBalance ?? 0,
                },
              });
              await queryClient.invalidateQueries({ queryKey: ["entries", partyId] });
              await queryClient.invalidateQueries({ queryKey: ["all-entries"] });
              toast.success("مانده منتقل شد");
            }}
          />

          <ConfirmButton
            destructive
            label="پاک‌سازی کامل"
            icon={<Trash2 className="size-4" />}
            title="حذف کل دفتر این طرف حساب؟"
            description="این عملیات برگشت‌پذیر نیست و تمام ردیف‌های ثبت‌شده حذف خواهند شد."
            onConfirm={async () => {
              await wipe({ data: { counterpartyId: partyId! } });
              await queryClient.invalidateQueries({ queryKey: ["entries", partyId] });
              await queryClient.invalidateQueries({ queryKey: ["all-entries"] });
              toast.success("دفتر پاک شد");
            }}
          />
        </div>
      </div>

      <div className="glass-panel overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[1180px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-card/60 text-muted-foreground">
              {[
                "#",
                "تاریخ و ساعت",
                "شرح",
                "مظنه",
                "طلای ورودی (گرم)",
                "طلای خروجی (گرم)",
                "بدهکار (تومان)",
                "بستانکار (تومان)",
                "مانده طلا",
                "مانده تومانی",
                "فردایی",
                "تسویه",
                "",
              ].map((head) => (
                <th key={head} className="px-2 py-2.5 text-right font-bold whitespace-nowrap">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isFetching && !rows.length && (
              <tr>
                <td colSpan={13} className="px-3 py-10 text-center text-muted-foreground">
                  در حال بارگذاری…
                </td>
              </tr>
            )}
            {!isFetching && !rows.length && (
              <tr>
                <td colSpan={13} className="px-3 py-10 text-center text-muted-foreground">
                  ردیفی ثبت نشده است. با «ردیف جدید» شروع کنید.
                </td>
              </tr>
            )}
            {computed.map((row, index) => (
              <tr
                key={row.id ?? `new-${index}`}
                className={cn(
                  "border-b border-border/60 transition-colors hover:bg-card/40",
                  row.is_settled && "opacity-60",
                  row.is_short && "bg-warn/5",
                )}
              >
                <td className="px-2 py-1.5 num text-muted-foreground">{index + 1}</td>
                <td className="px-2 py-1.5">
                  <Input
                    type="datetime-local"
                    dir="ltr"
                    value={toLocalInputValue(row.entry_at)}
                    onChange={(e) =>
                      patch(index, { entry_at: new Date(e.target.value).toISOString() })
                    }
                    className="h-8 w-44 text-xs"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.notes}
                    onChange={(e) => patch(index, { notes: e.target.value })}
                    placeholder="شرح معامله"
                    className="h-8 w-40 text-xs"
                  />
                </td>
                <NumCell
                  value={row.mazaneh}
                  width="w-32"
                  isMazaneh
                  onChange={(v) => patch(index, { mazaneh: v })}
                />
                <NumCell
                  value={row.gold_in}
                  width="w-24"
                  decimals
                  tone="text-profit"
                  onChange={(v) => smartFill(index, "gold_in", v)}
                />
                <NumCell
                  value={row.gold_out}
                  width="w-24"
                  decimals
                  tone="text-loss"
                  onChange={(v) => smartFill(index, "gold_out", v)}
                />
                <NumCell
                  value={row.fiat_debtor}
                  width="w-32"
                  onChange={(v) => patch(index, { fiat_debtor: v })}
                />
                <NumCell
                  value={row.fiat_creditor}
                  width="w-32"
                  onChange={(v) => patch(index, { fiat_creditor: v })}
                />
                <td
                  className={cn(
                    "num px-2 py-1.5 font-bold whitespace-nowrap",
                    row.goldBalance >= 0 ? "text-profit" : "text-loss",
                  )}
                >
                  {grams(row.goldBalance, 2)}
                </td>
                <td
                  className={cn(
                    "num px-2 py-1.5 font-bold whitespace-nowrap",
                    row.fiatBalance <= 0 ? "text-profit" : "text-loss",
                  )}
                >
                  {toman(row.fiatBalance)}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <Checkbox
                    checked={row.is_short}
                    onCheckedChange={(v) => patch(index, { is_short: Boolean(v) })}
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <Checkbox
                    checked={row.is_settled}
                    onCheckedChange={(v) => patch(index, { is_settled: Boolean(v) })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    aria-label={`حذف ردیف ${index + 1}`}
                    className="text-muted-foreground transition-colors hover:text-loss"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {computed.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gold/40 bg-card/70 font-bold">
                <td colSpan={8} className="px-3 py-3 text-left text-muted-foreground">
                  مانده نهایی طرف حساب
                </td>
                <td
                  className={cn(
                    "num px-2 py-3",
                    (last?.goldBalance ?? 0) >= 0 ? "text-profit" : "text-loss",
                  )}
                >
                  {grams(last?.goldBalance ?? 0, 2)} گرم
                </td>
                <td
                  className={cn(
                    "num px-2 py-3",
                    (last?.fiatBalance ?? 0) <= 0 ? "text-profit" : "text-loss",
                  )}
                >
                  {toman(last?.fiatBalance ?? 0)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {dirty && (
        <p className="text-xs text-warn">تغییرات ذخیره نشده دارید — دکمه «ذخیره» را بزنید.</p>
      )}

      <RiskMatrix />
    </div>
  );
}

function NumCell({
  value,
  onChange,
  width,
  decimals,
  tone,
  isMazaneh,
}: {
  value: number;
  onChange: (value: number) => void;
  width: string;
  decimals?: boolean;
  tone?: string;
  isMazaneh?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown =
    draft ?? (value ? (decimals ? String(value) : withCommas(value)) : "");

  return (
    <td className="px-2 py-1.5">
      <Input
        dir="ltr"
        inputMode="decimal"
        value={shown}
        onChange={(e) => {
          const val = e.target.value;
          if (decimals) {
            setDraft(val);
          } else {
            const raw = val.replace(/[^\d.-]/g, "");
            if (!raw || raw === "-" || raw === ".") setDraft(val);
            else {
              const num = Number(raw);
              setDraft(!isNaN(num) ? withCommas(num) : val);
            }
          }
        }}
        onBlur={() => {
          if (draft !== null) {
            let num = parseNumberInput(draft);
            if (isMazaneh && num > 0) {
              if (num < 1_000) num *= 100_000;
              else if (num < 10_000) num *= 10_000;
              else if (num < 100_000) num *= 1_000;
              else if (num < 1_000_000) num *= 100;
              else if (num < 10_000_000) num *= 10;
            }
            onChange(num);
          }
          setDraft(null);
        }}
        className={cn("num h-8 text-xs", width, tone)}
      />
    </td>
  );
}

function ConfirmButton({
  label,
  icon,
  title,
  description,
  onConfirm,
  destructive,
}: {
  label: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  destructive?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant={destructive ? "destructive" : "outline"}>
          {icon}
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>انصراف</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onConfirm()}>تأیید</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
