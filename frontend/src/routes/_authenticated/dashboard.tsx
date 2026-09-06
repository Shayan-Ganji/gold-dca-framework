import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { TechnicalOverviewPanel } from "@/components/dashboard/technical-overview";
import { TacticalRadar } from "@/components/dashboard/tactical-radar";
import { RotationOracle } from "@/components/dashboard/rotation-oracle";
import { SignalHistoryChart } from "@/components/dashboard/signal-history-chart";
import { useMarket } from "@/lib/market-engine";
import { getMyProfile, getLedgerPortfolioSummary } from "@/lib/api";
import { computePortfolio, type LedgerRow } from "@/lib/portfolio";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "داشبورد کوانت طلا | نسخه نمایشی پلتفرم (Showcase)" },
      {
        name: "description",
        content: "پایش لحظه‌ای مظنه، تحلیل تکنیکال بلادرنگ، رادار درون‌روزی و اوراکل چرخش دارایی طلا و دلار.",
      },
      { property: "og:title", content: "داشبورد کوانت طلا | نسخه نمایشی" },
      {
        name: "og:description",
        content: "پایش لحظه‌ای مظنه، تحلیل تکنیکال و اوراکل چرخش دارایی طلا و دلار.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: account } = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  return (
    <AppShell
      title="داشبورد تحلیلی و معاملاتی"
      subtitle="پایش لحظه‌ای بازار فیزیکی طلا، تحلیل تکنیکال و وضعیت شاخص‌ها"
      displayName={account?.profile?.display_name ?? "کاربر مهمان (نمایشی)"}
      username={account?.profile?.username ?? "guest_demo"}
    >
      <DashboardBody initialCapital={Number(account?.profile?.initial_capital ?? 100_000_000)} />
    </AppShell>
  );
}

function DashboardBody({ initialCapital }: { initialCapital: number }) {
  const market = useMarket();
  const { data: summaryData } = useQuery({
    queryKey: ["ledger-portfolio-summary"],
    queryFn: getLedgerPortfolioSummary,
  });
  const rows = summaryData?.transactions || [];

  const stats =
    market && summaryData
      ? computePortfolio(rows as LedgerRow[], market.gram18, initialCapital, summaryData.portfolio_stats)
      : null;

  return (
    <div className="space-y-5">
      <MetricCards stats={stats} market={market} />

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <TechnicalOverviewPanel market={market} />
        <TacticalRadar market={market} />
      </div>

      <SignalHistoryChart />

      <RotationOracle market={market} />
    </div>
  );
}
