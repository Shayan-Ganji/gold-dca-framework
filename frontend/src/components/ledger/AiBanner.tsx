import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLedgerKpi } from "@/lib/api";
import { AlertTriangle, Crown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiBanner({ partyId }: { partyId: string | null }) {
  const fetchKpi = useServerFn(getLedgerKpi);
  const { data: kpi, isLoading } = useQuery({
    queryKey: ["kpi", partyId],
    queryFn: () => fetchKpi({ data: { counterpartyId: partyId } }),
    enabled: Boolean(partyId),
  });

  if (isLoading || !kpi || !kpi.ai_advice) {
    return null;
  }

  const advice = kpi.ai_advice as string;
  let Icon = Info;
  let styleClass = "bg-card text-muted-foreground border-border";

  if (advice.includes("هشدار حیاتی")) {
    Icon = AlertTriangle;
    styleClass = "bg-loss/10 text-loss border-loss/20";
  } else if (advice.includes("تاییدیه مدل")) {
    Icon = Crown;
    styleClass = "bg-profit/10 text-profit border-profit/20";
  } else if (advice.includes("حساب طلایی با این شخص صفر است")) {
    styleClass = "bg-card text-muted-foreground border-border";
  } else {
    styleClass = "bg-gold/10 text-gold border-gold/20";
  }

  return (
    <div className={cn("glass-panel flex items-start gap-3 rounded-xl border p-4 text-sm", styleClass)}>
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div className="leading-relaxed whitespace-pre-wrap">
        {/* Replace bold markdown with span */}
        {advice.split("**").map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part))}
      </div>
    </div>
  );
}
