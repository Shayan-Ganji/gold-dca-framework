import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLedgerKpi } from "@/lib/api";
import { toman, withCommas, grams } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Scale, Target, Crown, TrendingUp, TrendingDown } from "lucide-react";

export function KpiCards({ partyId }: { partyId: string | null }) {
  const fetchKpi = useServerFn(getLedgerKpi);
  const { data: kpi, isLoading } = useQuery({
    queryKey: ["kpi", partyId],
    queryFn: () => fetchKpi({ data: { counterpartyId: partyId } }),
    enabled: Boolean(partyId),
  });

  if (isLoading || !kpi) {
    return <Skeleton className="h-32 w-full rounded-2xl" />;
  }

  const isLong = kpi.pos_type === "LONG";
  const isShort = kpi.pos_type === "SHORT";

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {/* 1. Total Asset */}
      <div className="glass-panel rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Scale className="size-4" />
          <span>ارزش کل دارایی</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-profit">{toman(kpi.total_val).replace(' تومان', '')}</span>
          <span className="text-xs text-muted-foreground">تومان</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          تراز تومانی: {toman(kpi.fiat_balance || 0)}
        </div>
      </div>

      {/* 2. Open Position */}
      <div className="glass-panel rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Target className="size-4" />
          <span>{isShort ? "موقعیت فردایی (Short)" : "موجودی باز (Long)"}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={cn("text-2xl font-bold", isShort ? "text-loss" : "text-gold")}>
            {grams(kpi.trading_gold, 3).replace(' گرم', '')}
          </span>
          <span className="text-xs text-muted-foreground">گرم</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          سربسر: {withCommas(isShort ? kpi.avg_short_mazaneh : kpi.avg_entry_mazaneh)} م
        </div>
      </div>

      {/* 3. Realized PnL */}
      <div className="glass-panel rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Crown className="size-4" />
          <span>سود محقق‌شده</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={cn("text-2xl font-bold", kpi.realized_pnl >= 0 ? "text-profit" : "text-loss")}>
            {kpi.realized_pnl > 0 ? '+' : ''}{toman(kpi.realized_pnl).replace(' تومان', '')}
          </span>
          <span className="text-xs text-muted-foreground">تومان</span>
        </div>
        <div className="mt-1 text-xs text-gold">
          +{grams(kpi.gold_alpha_grams, 3)} آلفا
        </div>
      </div>

      {/* 4. Unrealized PnL */}
      <div className="glass-panel rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          {kpi.unrealized_pnl >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          <span>سود لحظه‌ای</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={cn("text-2xl font-bold", kpi.unrealized_pnl >= 0 ? "text-profit" : "text-loss")}>
            {kpi.unrealized_pnl > 0 ? '+' : ''}{toman(kpi.unrealized_pnl).replace(' تومان', '')}
          </span>
          <span className="text-xs text-muted-foreground">تومان</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          (روی نوسان فعلی)
        </div>
      </div>

      {/* 5. ROI % */}
      <div className="glass-panel rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <TrendingUp className="size-4" />
          <span>شاخص بازدهی</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={cn("text-2xl font-bold", kpi.roi_percent >= 0 ? "text-profit" : "text-loss")}>
            {kpi.roi_percent > 0 ? '+' : ''}{kpi.roi_percent.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">%</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          رشد نسبت به سرمایه
        </div>
      </div>
    </div>
  );
}
