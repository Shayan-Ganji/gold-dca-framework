import { ArrowLeftRight, Coins, Scale, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";
import type { MarketSnapshot } from "@/lib/market-engine";
import { pct, toman } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function RotationOracle({ market }: { market: MarketSnapshot | null }) {
  if (!market) return <Skeleton className="h-72 rounded-2xl" />;

  // ── 1. Gold vs USD Macro Oracle ──────────────────────────────────────────
  const goldBubble = market.bubblePct;
  const toDollar = goldBubble > 5.0;
  const toGold = goldBubble < -2.0;

  const goldVerdict = toDollar
    ? "چرخش از طلا به دلار"
    : toGold
      ? "چرخش از دلار به طلا"
      : "حفظ ترکیب بهینه طلا و دلار";

  const goldTone = toDollar ? "loss" : toGold ? "profit" : "neutral";

  // ── 2. Coin vs Melted Gold Arbitrage Oracle ─────────────────────────────
  const coinHabab = market.coinHabab;
  const coinPrice = market.coin || 0;
  const coinIntrinsic = market.coinIntrinsic || (market.mazaneh * 2.2530);
  const coinBubbleToman = market.coinBubbleToman || (coinPrice > 0 && coinIntrinsic > 0 ? coinPrice - coinIntrinsic : 0);

  // Strategy thresholds based on Iranian historical coin bubble cycle:
  // < 5%  -> Discount zone / Zero-bubble: Buy Coin (Arbitrage In)
  // > 18% -> Hyper-bubble / Speculative: Sell Coin & Buy Melted Gold (Increase Gold Weight)
  const toCoin = coinHabab < 5.0;
  const toMelted = coinHabab > 18.0;

  const coinVerdict = toCoin
    ? "🟢 چرخش از آبشده به سکه امامی"
    : toMelted
      ? "🟠 چرخش از سکه به طلای آب‌شده"
      : "⚪ تعادل پایدار میان سکه و آبشده";

  const coinTone = toCoin ? "profit" : toMelted ? "warn" : "neutral";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="size-5 text-gold" />
          <h2 className="text-base font-extrabold text-foreground">
            اوراکل‌های هوشمند چرخش دارایی و آربیتراژ کوانت (Asset Rotation & Arbitrage Matrix)
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline-block">
          مبتنی بر ارزش ذاتی و چرخه تاریخی حباب دارایی‌ها
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── CARD 1: Gold vs USD Oracle ── */}
        <section
          className={cn(
            "glass-panel rounded-2xl p-5 flex flex-col justify-between border-2 transition-all",
            goldTone === "loss" && "border-loss/50 bg-loss/5",
            goldTone === "profit" && "border-profit/50 bg-profit/5",
            goldTone === "neutral" && "border-border/60",
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <ArrowLeftRight className="size-4 text-gold" />
                <span>اوراکل کلان: طلا ⟷ دلار آزاد</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gold/10 text-gold border border-gold/20">
                ماکرو فاندامنتال
              </span>
            </div>

            <p
              className={cn(
                "mt-3 text-xl font-black lg:text-2xl",
                goldTone === "loss" && "text-loss",
                goldTone === "profit" && "text-profit",
                goldTone === "neutral" && "text-foreground",
              )}
            >
              {goldVerdict}
            </p>

            <p className="mt-2.5 text-xs leading-6 text-foreground/85">
              حباب مظنه طلای آبشده نسبت به ارزش ذاتی (انس × دلار){" "}
              <strong className={cn("num font-black", goldBubble >= 0 ? "text-loss" : "text-profit")}>
                {pct(goldBubble)}
              </strong>{" "}
              است.{" "}
              {toDollar ? (
                <>
                  طلا نسبت به دلار در محدوده <strong className="text-loss">پرحباب</strong> معامله می‌شود؛ تبدیل پله‌ای طلا به دلار ریسک تخلیه حباب داخلی را مهار می‌کند.
                </>
              ) : toGold ? (
                <>
                  طلا نسبت به دلار <strong className="text-profit">زیر ارزش ذاتی جهانی</strong> است؛ خرید طلا از محل دلار یا نقدینگی دارای مزیت رقابتی بالاست.
                </>
              ) : (
                <>
                  نسبت برابری طلا و دلار در <strong className="text-neutral font-bold">محدوده تعادل پایدار</strong> قرار دارد و ترکیب فعلی بهینه است.
                </>
              )}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5 pt-3 border-t border-white/5">
            <div className="rounded-xl border border-border bg-background/50 px-2.5 py-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>مظنه آبشده</span>
                {market.trend2m && (
                  <span className={market.trend2m.tone === "profit" ? "text-profit" : market.trend2m.tone === "loss" ? "text-loss" : "text-muted-foreground"}>
                    {market.trend2m.arrow}
                  </span>
                )}
              </div>
              <p className="num mt-1 text-xs font-black text-gold-soft">{toman(market.mazaneh)} ت</p>
            </div>
            <Cell label="انس جهانی (XAU)" value={`$${market.ounce.toFixed(1)}`} />
            <Cell label="دلار آزاد" value={`${toman(market.usd)} ت`} />
          </div>
        </section>

        {/* ── CARD 2: Coin vs Melted Gold Arbitrage Oracle ── */}
        <section
          className={cn(
            "glass-panel rounded-2xl p-5 flex flex-col justify-between border-2 transition-all",
            coinTone === "profit" && "border-profit/50 bg-profit/5",
            coinTone === "warn" && "border-amber-500/50 bg-amber-500/5",
            coinTone === "neutral" && "border-border/60",
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <Coins className="size-4 text-amber-400" />
                <span>اوراکل آربیتراژ: سکه امامی ⟷ طلای آب‌شده</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/10 text-amber-300 border border-amber-400/20">
                افزایش گرم خالص طلا (Gold Alpha)
              </span>
            </div>

            <p
              className={cn(
                "mt-3 text-xl font-black lg:text-2xl",
                coinTone === "profit" && "text-profit",
                coinTone === "warn" && "text-amber-400",
                coinTone === "neutral" && "text-foreground",
              )}
            >
              {coinVerdict}
            </p>

            <p className="mt-2.5 text-xs leading-6 text-foreground/85">
              حباب سکه تمام امامی در بازار{" "}
              <strong className={cn("num font-black", coinHabab < 5 ? "text-profit" : coinHabab > 18 ? "text-loss" : "text-amber-400")}>
                {pct(coinHabab)}
              </strong>{" "}
              ({Math.abs(Math.round(coinBubbleToman)).toLocaleString("en-US")} تومان) است.{" "}
              {toCoin ? (
                <>
                  سکه به <strong className="text-profit font-bold">قیمت طلای خام</strong> معامله می‌شود (حباب در کف تاریخی). تبدیل طلای آبشده به سکه امامی، پتانسیل کسب سود از جهش‌های حباب بدون ریسک ریزش اضافه را فراهم می‌کند.
                </>
              ) : toMelted ? (
                <>
                  حباب سکه <strong className="text-amber-400 font-bold">به شدت متورم</strong> است. فروش سکه و خرید طلای آب‌شده باعث تثبیت سود حباب و <strong className="text-profit font-bold">افزایش مستقیم وزن طلای خالص در سبد</strong> می‌شود.
                </>
              ) : (
                <>
                  حباب سکه در <strong className="text-neutral font-bold">محدوده نرمال و تعادلی</strong> بازار قرار دارد؛ نیاز به سواپ فوری میان سکه و آبشده وجود ندارد.
                </>
              )}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5 pt-3 border-t border-white/5">
            <Cell label="قیمت بازار سکه" value={`${toman(coinPrice)} ت`} />
            <Cell label="طلای خام سکه (۲.۳۹۶۸×مظنه)" value={`${toman(Math.round(coinIntrinsic))} ت`} />
            <div className="rounded-xl border border-border bg-background/50 px-2.5 py-2 flex flex-col justify-between">
              <p className="text-[10px] text-muted-foreground">حباب سکه</p>
              <p className={cn("num mt-1 text-xs font-black", coinHabab < 5 ? "text-profit" : coinHabab > 18 ? "text-loss" : "text-amber-400")}>
                {pct(coinHabab)}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 px-2.5 py-2 flex flex-col justify-between">
      <p className="text-[10px] text-muted-foreground truncate">{label}</p>
      <p className="num mt-1 text-xs font-black text-gold-soft truncate">{value}</p>
    </div>
  );
}
