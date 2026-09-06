import { Info } from "lucide-react";
import type { MarketSnapshot } from "@/lib/market-engine";
import { pct, toman } from "@/lib/format";
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
  market,
}: {
  market: MarketSnapshot | null;
}) {
  if (!market || !market.ready) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const sma20 = market.sma20 || market.mazaneh || 1;
  const distSma = sma20 > 0 ? (((market.mazaneh - sma20) / sma20) * 100) : 0;
  const isAboveSma = distSma >= 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Mazaneh (17 Karat Gold) */}
      <Metric
        label="مظنه آبشده ۱۷ عیار"
        hint="نرخ مبادلات طلای آبشده بر مبنای یک مثقال طلای ۱۷ عیار (۴.۳۳۱۸ گرم) استخراج‌شده از پایگاه‌های مرجع بازار (TGJU و tala.live)."
        accent="var(--gold)"
        sub={
          <>
            فاصله تا میانگین ۲۰ روزه:{" "}
            <span className={cn("num font-bold", isAboveSma ? "text-profit" : "text-loss")}>
              {distSma >= 0 ? `+${distSma.toFixed(1)}%` : `${distSma.toFixed(1)}%`}
            </span>
          </>
        }
      >
        <span className="num text-gold font-black">
          {toman(market.mazaneh)} تومان
        </span>
      </Metric>

      {/* 2. 18 Karat Gram */}
      <Metric
        label="هر گرم طلای ۱۸ عیار"
        hint="نرخ پایه یک گرم طلای ۷۵۰ استاندارد، محاسبه‌شده با نسبت دقیق برابری ۴.۳۳۱۸."
        accent="var(--profit)"
        sub={
          <>
            ارزش برابری به مظنه: <span className="num font-bold">۴.۳۳۱۸</span>
          </>
        }
      >
        <span className="num text-profit font-black">
          {toman(market.gram18)} تومان
        </span>
      </Metric>

      {/* 3. Global Ounce & USD */}
      <Metric
        label="انس جهانی طلا (XAU/USD)"
        hint="نرخ زنده طلای جهانی در بازارهای بین‌المللی نیویورک و لندن به همراه نرخ دلار آزاد تهران."
        accent="var(--primary)"
        sub={
          <>
            دلار آزاد تهران: <span className="num font-bold text-foreground">{toman(market.usd)} تومان</span>
          </>
        }
      >
        <span className="num text-primary font-black font-mono">
          ${market.ounce ? market.ounce.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "4,476.6"}
        </span>
      </Metric>

      {/* 4. Emami Coin & Bubble */}
      <Metric
        label="سکه تمام بهار آزادی (امامی)"
        hint="نرخ سکه طرح جدید ضرب بانک مرکزی به همراه درصد و مبلغ حباب نسبت به ارزش طلای خالص مسکوک."
        accent={market.coinHabab >= 0 ? "var(--warn)" : "var(--profit)"}
        sub={
          <>
            حباب اسمی سکه:{" "}
            <span className={cn("num font-bold", market.coinHabab >= 0 ? "text-warn" : "text-profit")}>
              {pct(market.coinHabab)} ({toman(market.coinBubbleToman)} ت)
            </span>
          </>
        }
      >
        <span className="num text-foreground font-black">
          {toman(market.coin)} تومان
        </span>
      </Metric>
    </div>
  );
}
