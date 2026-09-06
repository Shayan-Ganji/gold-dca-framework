import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from "react";
import { createChart, IChartApi, ISeriesApi, CrosshairMode, LineSeries } from "lightweight-charts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
} from "recharts";
import {
  Activity,
  Briefcase,
  PieChart as PieChartIcon,
  TrendingUp,
  BarChart2,
  AlertTriangle,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { SignalHistoryChart } from "@/components/dashboard/signal-history-chart";
import { useMarket } from "@/lib/market-engine";
import {
  getMyProfile,
  getTechnicalChartData,
  getAssetAllocation,
  getCounterpartyVolume,
  getPortfolioPerformance,
} from "@/lib/api";
import { withCommas } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

class ErrorBoundary extends Component<{children: ReactNode, name: string}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught error in ${this.props.name}:`, error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-red-950/20 text-red-400 rounded-xl overflow-auto text-sm font-mono text-left">
          <p className="font-bold mb-2">خطا در {this.props.name}:</p>
          <p className="whitespace-pre-wrap">{this.state.error?.message || String(this.state.error)}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const TITLE = "نمودارها و تحلیل تکنیکال";
const SUBTITLE = "رصد تکنیکال طلا، تخصیص دارایی و عملکرد پورتفوی شما";

export const Route = createFileRoute("/_authenticated/charts")({
  head: () => ({
    meta: [
      { title: `${TITLE} | میز طلای کوانت` },
      { name: "description", content: SUBTITLE },
    ],
  }),
  component: ChartsPage,
});

function ChartsPage() {
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
        <BreakevenGaugePanel />
        <SignalHistoryChart />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetAllocationPanel />
          <CounterpartyVolumePanel />
        </div>
        <PortfolioPerformancePanel />
        <TechnicalChartPanel />
      </div>
    </AppShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Technical Chart (Lightweight Charts)                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
function TechnicalChartPanel() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["technical-chart-data"],
    queryFn: () => getTechnicalChartData(180),
  });

  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    try {
      // Create chart instance
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: "transparent" },
          textColor: "#94a3b8", // Muted text
        },
        grid: {
          vertLines: { color: "rgba(255, 255, 255, 0.1)" },
          horzLines: { color: "rgba(255, 255, 255, 0.1)" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: "rgba(255, 255, 255, 0.1)",
        },
        timeScale: {
          borderColor: "rgba(255, 255, 255, 0.1)",
          timeVisible: true,
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });

      // Price Series
      const priceSeries = chart.addSeries(LineSeries, {
        color: "#F5D061", // Gold
        lineWidth: 2,
      });
      
      // SMA
      const smaSeries = chart.addSeries(LineSeries, {
        color: "#F2994A", // Orange
        lineWidth: 1,
        lineStyle: 1, // Dotted
      });

      // BB Upper
      const bbUpSeries = chart.addSeries(LineSeries, {
        color: "rgba(255, 255, 255, 0.3)",
        lineWidth: 1,
      });

      // BB Lower
      const bbDownSeries = chart.addSeries(LineSeries, {
        color: "rgba(255, 255, 255, 0.3)",
        lineWidth: 1,
      });

      lineSeriesRef.current = priceSeries;
      smaSeriesRef.current = smaSeries;
      bbUpperRef.current = bbUpSeries;
      bbLowerRef.current = bbDownSeries;

      // Map data
      const priceData = data.filter(d => d.value !== null && d.time !== null).map(d => ({ time: d.time as any, value: d.value }));
      const smaData = data.filter(d => d.sma20 !== null && d.time !== null).map(d => ({ time: d.time as any, value: d.sma20! }));
      const bbUpData = data.filter(d => d.bb_upper !== null && d.time !== null).map(d => ({ time: d.time as any, value: d.bb_upper! }));
      const bbDownData = data.filter(d => d.bb_lower !== null && d.time !== null).map(d => ({ time: d.time as any, value: d.bb_lower! }));

      priceSeries.setData(priceData);
      smaSeries.setData(smaData);
      bbUpSeries.setData(bbUpData);
      bbDownSeries.setData(bbDownData);

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
      };
    } catch (err: any) {
      console.error("Lightweight charts error:", err);
      setChartError(err.message || String(err));
    }
  }, [data]);

  return (
    <section className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="grid size-10 place-items-center rounded-xl border border-gold/30 bg-gold/10">
          <Activity className="size-5 text-gold" />
        </div>
        <div>
          <p className="font-bold text-foreground">تحلیل تکنیکال قیمت طلا</p>
          <p className="text-xs text-muted-foreground">
            باندهای بولینگر (Bollinger Bands) و میانگین متحرک ۲۰ روزه
          </p>
        </div>
      </div>
      
      <div className="p-5" dir="ltr">
        {isLoading ? (
          <Skeleton className="h-[400px] w-full rounded-xl" />
        ) : !data || data.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            داده‌ای برای نمایش وجود ندارد
          </div>
        ) : chartError ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-red-400 bg-red-950/20 rounded-xl p-4 overflow-auto font-mono text-sm">
            <p className="font-bold mb-2">خطا در رندر نمودار:</p>
            <p className="text-left whitespace-pre-wrap">{chartError}</p>
          </div>
        ) : (
          <div 
            ref={chartContainerRef} 
            className="w-full h-[400px]"
          />
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Breakeven Gauge                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */
function BreakevenGaugePanel() {
  const market = useMarket();
  
  if (!market) return null;

  return (
    <section className="glass-panel rounded-2xl p-5 border border-gold/20 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-xl border border-gold/30 bg-gold/10">
          <AlertTriangle className="size-6 text-gold" />
        </div>
        <div>
          <p className="font-bold text-lg text-foreground">وضعیت بازار (مظنه)</p>
          <p className="text-sm text-muted-foreground">
            مظنه زنده بازار: <span className="text-gold-soft font-bold num">{withCommas(Math.round(market.mazaneh))}</span> تومان
          </p>
        </div>
      </div>
      <div className="text-center md:text-left">
        <p className="text-[11px] text-muted-foreground mb-1">انس جهانی</p>
        <p className="text-xl font-black text-foreground num">${withCommas(market.ounce)}</p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Asset Allocation                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */
function AssetAllocationPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["asset-allocation"],
    queryFn: getAssetAllocation,
  });

  return (
    <section className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="grid size-10 place-items-center rounded-xl border border-gold/30 bg-gold/10">
          <PieChartIcon className="size-5 text-gold" />
        </div>
        <div>
          <p className="font-bold text-foreground">تخصیص دارایی</p>
          <p className="text-xs text-muted-foreground">وضعیت سبد به ارزش تومانی</p>
        </div>
      </div>
      <div className="p-5 h-[300px]" dir="ltr">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : !data || data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">داده‌ای ثبت نشده است</div>
        ) : (
          <ErrorBoundary name="Asset Allocation">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [withCommas(Math.round(value)) + " تومان", "ارزش"]}
                  contentStyle={{
                    background: "oklch(0.19 0.03 278)",
                    border: "1px solid oklch(0.79 0.14 85 / 18%)",
                    borderRadius: "12px",
                    color: "oklch(0.95 0.008 265)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ErrorBoundary>
        )}
      </div>
      {/* Legend */}
      {data && data.length > 0 && (
        <div className="px-5 pb-5 grid grid-cols-2 gap-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="size-3 rounded-full" style={{ backgroundColor: d.color }}></span>
              <span className="text-xs text-muted-foreground">{d.name}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Counterparty Volume                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */
function CounterpartyVolumePanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["counterparty-volume"],
    queryFn: getCounterpartyVolume,
  });

  return (
    <section className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="grid size-10 place-items-center rounded-xl border border-gold/30 bg-gold/10">
          <BarChart2 className="size-5 text-gold" />
        </div>
        <div>
          <p className="font-bold text-foreground">حجم معاملات اشخاص</p>
          <p className="text-xs text-muted-foreground">۱۰ شخص برتر بر اساس گردش طلا (گرم)</p>
        </div>
      </div>
      <div className="p-5 h-[300px]" dir="ltr">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : !data || data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">هیچ معامله‌ای ثبت نشده است</div>
        ) : (
          <ErrorBoundary name="Counterparty Volume">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(0.3 0.02 278 / 30%)" />
                <XAxis type="number" tick={{ fill: "oklch(0.68 0.03 268)", fontSize: 11 }} />
                <YAxis 
                  type="category" 
                  dataKey="counterparty" 
                  tick={{ fill: "oklch(0.68 0.03 268)", fontSize: 11 }}
                  width={80}
                />
                <Tooltip 
                  formatter={(value: number) => [withCommas(value.toFixed(2)) + " گرم", "حجم"]}
                  contentStyle={{
                    background: "oklch(0.19 0.03 278)",
                    border: "1px solid oklch(0.79 0.14 85 / 18%)",
                    borderRadius: "12px",
                    color: "oklch(0.95 0.008 265)",
                  }}
                />
                <Bar dataKey="volume_grams" fill="oklch(0.79 0.14 85)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ErrorBoundary>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Portfolio Performance                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
function PortfolioPerformancePanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["portfolio-performance"],
    queryFn: getPortfolioPerformance,
  });

  return (
    <section className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="grid size-10 place-items-center rounded-xl border border-gold/30 bg-gold/10">
          <TrendingUp className="size-5 text-gold" />
        </div>
        <div>
          <p className="font-bold text-foreground">روند تزریق سرمایه تومانی</p>
          <p className="text-xs text-muted-foreground">ارزش تجمعی واریزهای تومانی به صندوق</p>
        </div>
      </div>
      <div className="p-5 h-[300px]" dir="ltr">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : !data || data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">هیچ واریزی ثبت نشده است</div>
        ) : (
          <ErrorBoundary name="Portfolio Performance">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.3 0.02 278 / 30%)" />
                <XAxis dataKey="time" tick={{ fill: "oklch(0.68 0.03 268)", fontSize: 11 }} />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  tick={{ fill: "oklch(0.68 0.03 268)", fontSize: 11 }}
                  width={50}
                />
                <Tooltip 
                  formatter={(value: number) => [withCommas(value) + " تومان", "سرمایه تجمعی"]}
                  contentStyle={{
                    background: "oklch(0.19 0.03 278)",
                    border: "1px solid oklch(0.79 0.14 85 / 18%)",
                    borderRadius: "12px",
                    color: "oklch(0.95 0.008 265)",
                  }}
                />
                <Line type="stepAfter" dataKey="invested" stroke="oklch(0.65 0.2 45)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ErrorBoundary>
        )}
      </div>
    </section>
  );
}
