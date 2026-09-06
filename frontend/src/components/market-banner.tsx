import { Activity, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { useMarket } from "@/lib/market-engine";
import { pct, toman } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TickValue } from "@/components/tick-value";
import { Skeleton } from "@/components/ui/skeleton";

export function MarketBanner() {
  const market = useMarket();

  if (!market) {
    return <Skeleton className="h-11 w-full rounded-none" />;
  }

  const up = market.changePct >= 0;

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-x-5 gap-y-1.5 border-b px-4 py-2 text-xs backdrop-blur-md transition-colors",
        market.marketOpen
          ? "border-profit/35 bg-profit/8 text-profit"
          : "border-warn/35 bg-warn/8 text-warn",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 font-bold">
          <span
            className={cn(
              "size-2 rounded-full",
              market.marketOpen ? "bg-profit animate-pulse" : "bg-warn",
            )}
          />
          {market.marketReason || (market.marketOpen ? "بازار باز است" : "بازار بسته است")}
        </span>

        <span className="flex items-center gap-1.5 text-foreground/80">
          <Activity className="size-3.5" />
          {market.online ? "✅ سرویس آنلاین" : "⚠️ سرویس آفلاین"}
        </span>

        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="size-3.5" />
          آخرین تغییر قیمت:{" "}
          <span className="font-semibold text-gold-soft num">{market.priceChangedAtStr || "نامشخص"}</span>
        </span>

        {market.polledAtStr && (
          <span className="hidden md:inline-block text-[11px] text-muted-foreground/80 bg-muted/30 px-2 py-0.5 rounded-full border border-border/40">
            {market.source ? `منبع: ${market.source} | ` : ""}poll سرور: {market.polledAtStr}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {market.usd > 0 && (
          <span className="hidden sm:flex items-center gap-1 text-muted-foreground">
            دلار: <span className="font-bold text-foreground num">{toman(market.usd)}</span>
          </span>
        )}

        {market.gram18 > 0 && (
          <span className="hidden sm:flex items-center gap-1 text-muted-foreground">
            گرم ۱۸: <span className="font-bold text-foreground num">{toman(market.gram18)}</span>
          </span>
        )}

        {market.coin > 0 && (
          <span className="hidden sm:flex items-center gap-1.5 text-muted-foreground bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 shadow-sm">
            🥇 سکه امامی: <span className="font-bold text-amber-400 num">{toman(market.coin)}</span>
            {market.coinHabab ? (
              <span className="text-[10px] font-medium text-amber-400/80 pl-1.5 ml-1 border-l border-amber-400/20 num">
                حباب {pct(market.coinHabab)}
              </span>
            ) : null}
          </span>
        )}

        <div className="flex items-center gap-3 border-r border-border/50 pr-4">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-semibold">مظنه:</span>
            <TickValue
              value={market.mazaneh}
              format={toman}
              className="font-black text-sm text-gold-soft"
            />
            {market.changePct !== 0 && (
              <span className={cn("flex items-center gap-0.5 num text-xs font-bold", up ? "text-profit" : "text-loss")}>
                {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {pct(market.changePct)}
              </span>
            )}
          </div>

          {market.trend2m && (
            <div className="hidden md:flex items-center gap-2 border-r border-white/10 pr-2.5 text-[11px] font-bold">
              <span className={cn("flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10", market.trend2m.tone === "profit" ? "text-profit border-profit/30" : market.trend2m.tone === "loss" ? "text-loss border-loss/30" : "text-muted-foreground")}>
                <span>۲دقیقه:</span>
                <span>{market.trend2m.arrow}</span>
              </span>
              <span className={cn("flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10", market.trend10m?.tone === "profit" ? "text-profit border-profit/30" : market.trend10m?.tone === "loss" ? "text-loss border-loss/30" : "text-muted-foreground")}>
                <span>۱۰دقیقه:</span>
                <span>{market.trend10m?.arrow}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

