import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { createChart, createSeriesMarkers, CrosshairMode, LineSeries, IChartApi, ISeriesApi } from "lightweight-charts";
import { getSignalChartData, getIntradaySignalChartData, getAvailableIntradayDates, type SignalChartData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Activity, ShieldCheck, TrendingUp, Cpu, Sparkles, Filter } from "lucide-react";

type Horizon = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

const HORIZON_LABELS: Record<Horizon, string> = {
  "1D": "۱ روز (1D - لحظه‌ای)",
  "1W": "۷ روز (1W)",
  "1M": "۱ ماه (1M)",
  "3M": "۳ ماه (3M)",
  "1Y": "۱ سال (1Y)",
  "ALL": "کل تاریخ (ALL)",
};

const HORIZON_DAYS: Record<Horizon, number> = {
  "1D": 1, // Intraday mode utilizes dedicated real-time telemetry array
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
  "ALL": 1500,
};

export function SignalHistoryChart({ className }: { className?: string }) {
  const [horizon, setHorizon] = useState<Horizon>("1D");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [hoveredPoint, setHoveredPoint] = useState<SignalChartData | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const { data: availableDates } = useQuery({
    queryKey: ["available-intraday-dates"],
    queryFn: () => getAvailableIntradayDates(),
    staleTime: 60000,
  });

  // Set the latest date as default if nothing is selected yet
  useEffect(() => {
    if (availableDates && availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ["signal-chart-data", "daily"],
    queryFn: () => getSignalChartData(1500),
    staleTime: 60000,
  });

  const { data: intradayData, isLoading: intradayLoading } = useQuery({
    queryKey: ["signal-chart-data", "intraday", selectedDate],
    queryFn: () => getIntradaySignalChartData(selectedDate),
    staleTime: 20000,
    enabled: !!selectedDate || !availableDates, // Only wait for selectedDate if dates are available
  });

  const isIntraday = horizon === "1D";
  const rawData = isIntraday ? intradayData : dailyData;
  const isLoading = isIntraday ? intradayLoading && !intradayData : dailyLoading && !dailyData;

  useEffect(() => {
    if (!chartContainerRef.current || !rawData || rawData.length === 0) return;

    // Clean up previous chart instance on horizon change or reload
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const days = HORIZON_DAYS[horizon];
    const slicedData = isIntraday ? rawData : rawData.slice(-days);
    if (slicedData.length === 0) return;

    // Initialize hoveredPoint to the most recent candle in view
    setHoveredPoint(slicedData[slicedData.length - 1]);

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.06)" },
        horzLines: { color: "rgba(255, 255, 255, 0.06)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.15)",
        autoScale: true, // Crucial: scale Y axis dynamically to highlight local oscillations in short horizons
        scaleMargins: {
          top: 0.15,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.15)",
        timeVisible: isIntraday, // Enable time display on X axis for intraday mode
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;

    // Price Line Series
    const priceSeries = chart.addSeries(LineSeries, {
      color: "#FFD700",
      lineWidth: 2,
      title: "قیمت مظنه (تومان)",
    });

    // SMA20 Series
    const smaSeries = chart.addSeries(LineSeries, {
      color: "#00B0FF",
      lineWidth: 1,
      lineStyle: 2, // Dashed
      title: "SMA 20",
    });

    const formattedPrices: { time: any; value: number }[] = [];
    const formattedSma: { time: any; value: number }[] = [];
    const markers: any[] = [];

    let prevAction: number | null = null;
    for (let i = 0; i < slicedData.length; i++) {
      const row = slicedData[i];
      if ((row.time === undefined || row.time === null) || !row.value) continue;

      formattedPrices.push({ time: row.time, value: row.value });
      if (row.sma20 && row.sma20 > 0) {
        formattedSma.push({ time: row.time, value: row.sma20 });
      }

      const currentAction = row.action ?? 1;

      // 1. Initial active position marker at the beginning of the viewed session
      const isInitialActive = i === 0 && currentAction !== 1;

      // 2. Genuine position transition during the session
      const isTransition = prevAction !== null && currentAction !== prevAction;

      if (isInitialActive || isTransition) {
        if (currentAction === 2) {
          const isStep = row.action_text === "STEP BUY" || row.action_text === "PARTIAL BUY" || row.action_text === "خرید پله‌ای";
          const markerText = isInitialActive
            ? (isStep ? "🟢 پوزیشن فعال: خرید پله‌ای" : "🟢 پوزیشن فعال: خرید قاطع")
            : (isStep ? "🟢 ورود پله‌ای (Buy)" : "🟢 ورود قاطع (Strong Buy)");
          markers.push({
            time: row.time,
            position: "belowBar",
            shape: "arrowUp",
            color: isStep ? "#10b981" : "#00E676",
            text: markerText,
            size: 2,
          });
        } else if (currentAction === 0) {
          const isStep = row.action_text === "STEP SELL" || row.action_text === "PARTIAL SELL" || row.action_text === "فروش پله‌ای";
          const markerText = isInitialActive
            ? (isStep ? "🟠 پوزیشن فعال: فروش / سیو سود" : "🔴 پوزیشن فعال: خروج / فروش")
            : (isStep ? "🟠 سیو سود / خروج پله‌ای" : "🔴 خروج فوری / فروش قاطع");
          markers.push({
            time: row.time,
            position: "aboveBar",
            shape: "arrowDown",
            color: isStep ? "#f59e0b" : "#FF5252",
            text: markerText,
            size: 2,
          });
        } else if (currentAction === 1 && isTransition) {
          markers.push({
            time: row.time,
            position: "aboveBar",
            shape: "circle",
            color: "#64748b",
            text: "⚪ خروج به حالت خنثی (HOLD)",
            size: 1,
          });
        }
      }
      prevAction = currentAction;
    }

    priceSeries.setData(formattedPrices);
    smaSeries.setData(formattedSma);
    if (markers.length > 0) {
      try {
        if (typeof (priceSeries as any).setMarkers === "function") {
          (priceSeries as any).setMarkers(markers);
        } else if (typeof createSeriesMarkers === "function") {
          createSeriesMarkers(priceSeries as any, markers);
        }
      } catch (err) {
        console.warn("Could not set series markers:", err);
      }
    }

    // Robust time parser to handle TradingView BusinessDay objects ({year, month, day}), UNIX timestamps, or strings
    const parseParamTime = (t: any): string | number => {
      if (!t && t !== 0) return "";
      if (typeof t === "number") return t;
      if (typeof t === "string") return t;
      if (typeof t === "object" && t.year && t.month && t.day) {
        return `${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`;
      }
      return String(t);
    };

    // Subscribe to crosshair movement for interactive touch/hover signal inspection
    chart.subscribeCrosshairMove((param) => {
      if (param.time !== undefined && param.time !== null) {
        const targetTime = parseParamTime(param.time);
        const row = slicedData.find((d) => {
          if (d.time === undefined || d.time === null) return false;
          if (d.time === targetTime) return true;
          if (typeof d.time === "string" && typeof targetTime === "string") {
            return d.time.startsWith(targetTime);
          }
          return false;
        });
        if (row) {
          setHoveredPoint(row);
          return;
        }
      }
      if (!param.time && slicedData.length > 0) {
        // When crosshair leaves chart area, revert to latest candle point
        setHoveredPoint(slicedData[slicedData.length - 1]);
      }
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [dailyData, intradayData, horizon, rawData]);

  if (isLoading) {
    return <Skeleton className="w-full h-[460px] rounded-2xl" />;
  }

  return (
    <section className={cn("glass-panel rounded-2xl p-5 border border-border/60 shadow-xl relative overflow-hidden", className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <Cpu className="size-6 text-gold animate-pulse" />
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              نمودار جامع سیگنال‌های هوش مصنوعی (v2.7 Proactive Oracle)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              رصد نقاط اکسترمم لوکال و گلوبال بر اساس قیمت مظنه (تومان) همراه با کالیبراسیون هوشمند
            </p>
          </div>
        </div>

        {/* Horizon Selector */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 bg-black/20 p-1.5 rounded-xl border border-white/5">
          <Filter className="size-3.5 text-muted-foreground ml-1 hidden sm:block" />
          
          {isIntraday && availableDates && availableDates.length > 0 && (
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 text-xs text-white border border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-gold ml-2"
            >
              {availableDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          )}

          {(Object.keys(HORIZON_LABELS) as Horizon[]).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                horizon === h
                  ? "bg-gold text-black shadow-md font-black scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {HORIZON_LABELS[h]}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Interactive Signal Blotter on Hover/Touch */}
      {hoveredPoint && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-background/95 via-slate-900/90 to-background/95 border border-gold/30 shadow-inner flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-muted-foreground flex items-center gap-1.5">
              <span>📅 تاریخ و ساعت (شمسی):</span>
              <strong className="text-foreground font-bold">
                {hoveredPoint.shamsi_date || (typeof hoveredPoint.time === "number" ? new Date(hoveredPoint.time * 1000).toLocaleTimeString("fa-IR") : String(hoveredPoint.time))}
              </strong>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-gold/10 border border-gold/20 flex items-center gap-1.5">
              <span>🪙 قیمت مظنه طلا:</span>
              <strong className="text-gold font-black text-sm font-mono">
                {Math.round(hoveredPoint.value ?? 0).toLocaleString("en-US")} تومان
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">شاخص RSI (۱۴):</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded font-black font-mono text-xs shadow-sm",
                (hoveredPoint.rsi ?? 50) < 35
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : (hoveredPoint.rsi ?? 50) > 68
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-white/10 text-white border border-white/15"
              )}
            >
              {(hoveredPoint.rsi ?? 50).toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold">سیگنال هوش مصنوعی در این نقطه:</span>
            {hoveredPoint.action === 2 ? (
              hoveredPoint.action_text === "STEP BUY" || hoveredPoint.action_text === "PARTIAL BUY" || hoveredPoint.action_text === "خرید پله‌ای" ? (
                <span className="px-3 py-1 rounded-lg bg-emerald-400 text-black font-black flex items-center gap-1.5 shadow-lg shadow-emerald-400/20 border border-emerald-300">
                  🟢 خرید پله‌ای (STEP BUY - ورود تدریجی و مدیریت استراتژیک نقدینگی)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-black flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 border border-emerald-400">
                  🚀 خرید قاطع (STRONG BUY - شکار قاطع کف حمایتی با اطمینان بالا)
                </span>
              )
            ) : hoveredPoint.action === 0 ? (
              hoveredPoint.action_text === "STEP SELL" || hoveredPoint.action_text === "PARTIAL SELL" || hoveredPoint.action_text === "فروش پله‌ای" ? (
                <span className="px-3 py-1 rounded-lg bg-amber-500 text-black font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 border border-amber-300">
                  🟠 فروش پله‌ای (STEP SELL - تثبیت سود و کاهش حجم در نواحی مقاومتی)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg bg-rose-600 text-white font-black flex items-center gap-1.5 shadow-lg shadow-rose-600/30 border border-rose-400">
                  🔴 خروج فوری / فروش قاطع (STRONG SELL - سیو سود کامل و محافظت سرمایه)
                </span>
              )
            ) : (
              <span className="px-3 py-1 rounded-lg bg-slate-500/20 text-slate-200 border border-slate-500/30 font-bold flex items-center gap-1.5">
                🟡 نگهداری / تعقیب روند (HOLD - حفظ استقرار و جلوگیری از Overtrading)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Interactive Chart Area */}
      <div className="w-full h-[340px] relative mt-2 rounded-xl bg-gradient-to-b from-black/40 to-transparent p-2 border border-white/5">
        <div ref={chartContainerRef} className="w-full h-full" />
        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border text-[11px] font-medium flex items-center gap-3 z-10 pointer-events-none">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-gold inline-block" />
            قیمت مظنه طلا (تومان)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#00B0FF] inline-block" />
            میانگین متحرک ۲۰ (SMA20)
          </span>
          <span className="flex items-center gap-1 text-profit font-bold">
            🟢 سیگنال خرید
          </span>
          <span className="flex items-center gap-1 text-loss font-bold">
            🔴 سیگنال خروج / فروش
          </span>
        </div>
      </div>

      {/* Quant Trading Philosophy Footer */}
      <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-gold/10 via-background/40 to-transparent border border-gold/20 flex items-start gap-3">
        <Sparkles className="size-5 text-gold shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-muted-foreground space-y-1">
          <p className="font-bold text-foreground">
            فلسفه هوش مصنوعی کوانت و جلوگیری از Overtrading در بازه‌های زمانی مختلف:
          </p>
          <p>
            یک سیستم حرفه‌ای و بلوغ‌یافته هوش مصنوعی نباید در تمامی نوسانات جزئی و نویزهای درون‌روزی سیگنال صعود یا ریزش صادر کند (چرا که منجر به استهلاک سرمایه، اسپرد بالا و Whip-saw می‌شود). مدل <strong>v2.7 Proactive Oracle</strong> با بهره‌گیری از فیلتر پسماند (Hysteresis Deadband) و وزن‌دهی حباب ذاتی، تنها در اکسترمم‌های پایدار لوکال و گلوبال سیگنال تغییر وضعیت می‌دهد و در سایر نواحی با صدور وضعیت «نگهداری (HOLD)» از معاملات هیجانی جلوگیری می‌کند.
          </p>
        </div>
      </div>
    </section>
  );
}
