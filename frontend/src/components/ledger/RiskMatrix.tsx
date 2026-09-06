import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRiskMatrix } from "@/lib/api";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ZAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { toman, grams } from "@/lib/format";

export function RiskMatrix() {
  const fetchMatrix = useServerFn(getRiskMatrix);
  const { data, isLoading } = useQuery({
    queryKey: ["riskMatrix"],
    queryFn: () => fetchMatrix(),
  });

  if (isLoading || !data) {
    return <Skeleton className="h-72 w-full rounded-2xl" />;
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel flex flex-col gap-4 rounded-xl p-4">
      <h3 className="font-bold text-muted-foreground">ماتریس تمرکز ریسک اشخاص</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              type="number" 
              dataKey="fiat_balance" 
              name="تراز تومانی" 
              unit=" تومان" 
              tickFormatter={(val) => (val / 1000000).toFixed(0) + "M"}
              stroke="#666"
            />
            <YAxis 
              type="number" 
              dataKey="trading_gold" 
              name="مانده طلا" 
              unit=" گرم" 
              stroke="#666"
            />
            <ZAxis 
              type="number" 
              dataKey="turnover" 
              range={[50, 400]} 
              name="گردش مالی" 
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-card p-3 shadow-sm text-xs">
                      <p className="font-bold mb-2">{data.name}</p>
                      <p className="text-muted-foreground">تراز تومانی: <span className="font-bold text-foreground">{toman(data.fiat_balance)}</span></p>
                      <p className="text-muted-foreground">مانده طلا: <span className="font-bold text-foreground">{grams(data.trading_gold, 2)}</span></p>
                      <p className="text-muted-foreground">گردش: <span className="font-bold text-foreground">{toman(data.turnover)}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="#666" strokeOpacity={0.5} />
            <ReferenceLine x={0} stroke="#666" strokeOpacity={0.5} />
            <Scatter name="اشخاص" data={data} fill="#D4AF37" fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
