import { Info } from "lucide-react";
import type { MarketSnapshot } from "@/lib/market-engine";
import type { PortfolioStats } from "@/lib/portfolio";
import { grams, pct, signedToman, toman } from "@/lib/format";
import { TickValue } from "@/components/tick-value";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

function Metric({
  label,
  hint,
  children,
  sub,
  accent,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  sub: React.ReactNode;
  accent?: string;
}) {
  return (
    <article className="metric-card" style={accent ? { borderRightColor: accent } : undefined}>
      <div className="flex items-center gap-1.5">
        <h3 className="text-xs font-medium text-muted-foreground">{label}</h3>
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label={`توضیح ${label}`}>
                <Info className="size-3 text-muted-foreground/70" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-xs">{hint}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="mt-2 text-xl font-extrabold lg:text-2xl">{children}</div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{sub}</p>
    </article>
  );
}

export function MetricCards({
  stats,
  market,
}: {
  stats: PortfolioStats | null;
  market: MarketSnapshot | null;
}) {
  if (!stats || !market) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const isLong = stats.openGold >= 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric
        label="موجودی طلای باز"
        hint="موقعیت معاملاتی فعال شما؛ عدد مثبت نشان‌دهنده خرید (Long) و عدد منفی نشان‌دهنده فروش تعهدی/فردایی (Short) است."
        accent={isLong ? "var(--gold)" : "var(--loss)"}
        sub={
          <>
            نقطه سربه‌سر: <span className="num">{toman(stats.breakEven)}</span> تومان/گرم
          </>
        }
      >
        <span className={cn("num", isLong ? "text-gold-soft" : "text-loss")}>
          {grams(stats.openGold)} گرم
        </span>
        <span className="mr-2 text-xs font-normal text-muted-foreground">
          {isLong ? "LONG" : "SHORT"}
        </span>
      </Metric>

      <Metric
        label="سود محقق‌شده"
        hint="سود قطعی بسته‌شده از معاملات فروش، محاسبه‌شده به روش میانگین موزون بهای تمام‌شده."
        accent={stats.realized >= 0 ? "var(--profit)" : "var(--loss)"}
        sub={
          <>
            آلفای طلا: <span className="num">{grams(stats.goldAlpha, 3)}</span> گرم طلا
          </>
        }
      >
        <span className={cn("num", stats.realized >= 0 ? "text-profit" : "text-loss")}>
          {signedToman(stats.realized)}
        </span>
      </Metric>

      <Metric
        label="سود / زیان لحظه‌ای"
        hint="سود یا زیان شناور پوزیشن باز فعلی بر اساس آخرین نرخ زنده بازار طلا."
        accent={stats.unrealized >= 0 ? "var(--profit)" : "var(--loss)"}
        sub={
          <>
            گرم ۱۸ عیار: <span className="num">{toman(market.gram18)}</span> تومان
          </>
        }
      >
        <TickValue
          value={stats.unrealized}
          format={signedToman}
          className={stats.unrealized >= 0 ? "text-profit" : "text-loss"}
        />
      </Metric>

      <Metric
        label="گردش مالی و بازدهی"
        hint="شاخص بازدهی پورتفو به همراه مجموع گردش مالی کلیه معاملات خرید و فروش."
        accent={stats.returnPct >= 0 ? "var(--profit)" : "var(--loss)"}
        sub={
          <>
            گردش مالی کل: <span className="num">{toman(stats.turnover)}</span> تومان
          </>
        }
      >
        <span className={cn("num", stats.returnPct >= 0 ? "text-profit" : "text-loss")}>
          {pct(stats.returnPct)}
        </span>
      </Metric>
    </div>
  );
}
