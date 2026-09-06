import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  BellRing,
  BookOpenCheck,
  BrainCircuit,
  CandlestickChart,
  LayoutDashboard,
  LogOut,
  PanelRightClose,
  PanelRightOpen,
  Scale,
  Settings2,
  Wallet,
  Sparkles,
} from "lucide-react";

import { logout } from "@/lib/api";
import { MarketProvider } from "@/lib/market-engine";
import { MarketBanner } from "@/components/market-banner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { to: "/dca", label: "شبیه‌ساز DCA", icon: Sparkles },
  { to: "/trades", label: "دفتر معاملات", icon: Scale },
  { to: "/accounting", label: "حسابداری و تسویه", icon: Wallet },
  { to: "/ledger", label: "دفتر کل پیشرفته", icon: BookOpenCheck },
  { to: "/alerts", label: "آلارم‌های قیمتی", icon: BellRing },
  { to: "/charts", label: "نمودارها و تکنیکال", icon: CandlestickChart },
  { to: "/ai-evaluation", label: "ارزیابی هوش مصنوعی", icon: BrainCircuit },
  { to: "/settings", label: "تنظیمات پروفایل", icon: Settings2 },
] as const;

export function AppShell({
  title,
  subtitle,
  displayName,
  username,
  children,
}: {
  title: string;
  subtitle: string;
  displayName?: string;
  username?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    logout();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <MarketProvider>
      <div className="flex min-h-screen w-full">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 flex-col border-l border-sidebar-border bg-sidebar/80 backdrop-blur-xl transition-[width] duration-200 md:flex",
            collapsed ? "w-[4.5rem]" : "w-64",
          )}
        >
          <div className="flex items-center gap-2 px-4 py-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-gold/35 bg-gold/10 text-lg">
              🪙
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-foreground">میز طلای کوانت</p>
                <p className="truncate text-[11px] text-muted-foreground">Live &amp; AI Trading</p>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-1 px-2">
            {NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-gold/12 font-bold text-gold-soft"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )}
                  title={item.label}
                >
                  <item.icon className="size-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 border-t border-sidebar-border p-3">
            {!collapsed && (
              <div className="rounded-lg bg-sidebar-accent/60 px-3 py-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  {displayName || "کاربر"}
                </p>
                <p className="num truncate text-[11px] text-muted-foreground">@{username ?? "—"}</p>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={() => setCollapsed((v) => !v)}
              className="w-full justify-start text-muted-foreground"
            >
              {collapsed ? (
                <PanelRightOpen className="size-4" />
              ) : (
                <PanelRightClose className="size-4" />
              )}
              {!collapsed && <span>جمع کردن منو</span>}
            </Button>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start text-loss hover:bg-loss/10 hover:text-loss"
            >
              <LogOut className="size-4" />
              {!collapsed && <span>خروج از حساب</span>}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30">
            <MarketBanner />
          </div>

          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card/50 px-3 py-2 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap",
                  pathname === item.to
                    ? "bg-gold/15 font-bold text-gold-soft"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <main className="flex-1 px-4 py-6 lg:px-8">
            <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold text-foreground lg:text-2xl">
                  {title}
                </h1>
                <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="shrink-0 text-loss md:hidden"
              >
                <LogOut className="size-4" />
              </Button>
            </header>
            {children}
          </main>
        </div>
      </div>
    </MarketProvider>
  );
}
