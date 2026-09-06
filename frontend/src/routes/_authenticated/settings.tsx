import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Vault, 
  Wallet, 
  Trash2, 
  ShieldAlert, 
  UserPlus, 
  KeyRound, 
  UserX, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { 
  getSettingsProfile, 
  transferVault, 
  adjustFiat, 
  resetHistory, 
  adminListUsers, 
  adminCreateUser, 
  adminResetPassword, 
  adminDeleteUser 
} from "@/lib/api";
import { withCommas } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarket } from "@/lib/market-engine";

const TITLE = "تنظیمات پروفایل و مدیریت گاوصندوق";
const SUBTITLE = "مدیریت موجودی فیزیکی گاوصندوق، تراز تومانی و پنل ارشد کاربران";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: `${TITLE} | میز طلای کوانت` },
      { name: "description", content: SUBTITLE },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const market = useMarket();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["settings-profile"],
    queryFn: getSettingsProfile,
  });

  const { data: adminUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminListUsers,
    enabled: !!profile?.is_root,
  });

  // Local form states
  const [vaultDirection, setVaultDirection] = useState<"trade_to_vault" | "vault_to_trade">("trade_to_vault");
  const [vaultGrams, setVaultGrams] = useState("");
  const [vaultCounterparty, setVaultCounterparty] = useState("گاوصندوق شخص");
  const [fiatBalanceInput, setFiatBalanceInput] = useState("");

  // Admin form states
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newInitialFiat, setNewInitialFiat] = useState("");

  const [resetTargetUid, setResetTargetUid] = useState<number | null>(null);
  const [targetNewPass, setTargetNewPass] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mutations
  const vaultMutation = useMutation({
    mutationFn: transferVault,
    onSuccess: (res) => {
      setMessage({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["settings-profile"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] });
      setVaultGrams("");
    },
    onError: (err: any) => setMessage({ type: "error", text: err.message }),
  });

  const fiatMutation = useMutation({
    mutationFn: (val: number) => adjustFiat(val),
    onSuccess: (res) => {
      setMessage({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["settings-profile"] });
      setFiatBalanceInput("");
    },
    onError: (err: any) => setMessage({ type: "error", text: err.message }),
  });

  const resetHistoryMutation = useMutation({
    mutationFn: resetHistory,
    onSuccess: (res) => {
      setMessage({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["settings-profile"] });
    },
    onError: (err: any) => setMessage({ type: "error", text: err.message }),
  });

  const createUserMutation = useMutation({
    mutationFn: adminCreateUser,
    onSuccess: (res) => {
      setMessage({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setNewUsername("");
      setNewPassword("");
      setNewDisplayName("");
      setNewInitialFiat("");
    },
    onError: (err: any) => setMessage({ type: "error", text: err.message }),
  });

  const resetPassMutation = useMutation({
    mutationFn: ({ uid, pass }: { uid: number; pass: string }) => adminResetPassword(uid, pass),
    onSuccess: (res) => {
      setMessage({ type: "success", text: res.message });
      setResetTargetUid(null);
      setTargetNewPass("");
    },
    onError: (err: any) => setMessage({ type: "error", text: err.message }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: adminDeleteUser,
    onSuccess: (res) => {
      setMessage({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => setMessage({ type: "error", text: err.message }),
  });

  if (isLoading) {
    return (
      <AppShell title={TITLE} subtitle={SUBTITLE}>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </AppShell>
    );
  }

  const defaultPricePerGram = market?.gram18 || 4_500_000;

  return (
    <AppShell
      title={TITLE}
      subtitle={SUBTITLE}
      displayName={profile?.display_name}
      username={profile?.username}
    >
      <div className="space-y-6 pb-20 fade-in">
        <header className="mb-6">
          <h1 className="text-2xl font-black text-foreground tracking-tight">{TITLE}</h1>
          <p className="text-sm text-muted-foreground mt-1">{SUBTITLE}</p>
        </header>

        {/* Feedback Message */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
        )}

        {/* User Summary Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-gold">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Vault className="size-4 text-gold" />
              <span>طلای گاوصندوق (فیزیکی):</span>
            </div>
            <p className="text-xl font-black text-gold num">
              {profile?.vault_gold.toFixed(3)} <span className="text-xs font-normal text-muted-foreground">گرم</span>
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-emerald-400">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ArrowLeftRight className="size-4 text-emerald-400" />
              <span>طلای معاملات باز:</span>
            </div>
            <p className="text-xl font-black text-emerald-400 num">
              {profile?.trading_gold.toFixed(3)} <span className="text-xs font-normal text-muted-foreground">گرم</span>
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-blue-400">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Wallet className="size-4 text-blue-400" />
              <span>تراز نقدینگی (تومان):</span>
            </div>
            <p className="text-xl font-black text-foreground num">
              {withCommas(profile?.fiat_balance || 0)} <span className="text-xs font-normal text-muted-foreground">تومان</span>
            </p>
          </div>
        </section>

        {/* Physical Vault Management Card */}
        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gold/20 text-gold">
              <Vault className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">مدیریت طلای گاوصندوق فیزیکی (Vault Management)</h2>
              <p className="text-xs text-muted-foreground">انتقال طلا بین گاوصندوق شخصی و حساب معاملات باز</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const g = parseFloat(vaultGrams);
              if (!g || g <= 0) return;
              vaultMutation.mutate({
                direction: vaultDirection,
                weight_grams: g,
                price_per_gram: defaultPricePerGram,
                counterparty: vaultCounterparty,
              });
            }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2"
          >
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">جهت انتقال:</label>
              <select
                value={vaultDirection}
                onChange={(e) => setVaultDirection(e.target.value as any)}
                className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-xs font-medium"
              >
                <option value="trade_to_vault">📥 ذخیره‌سازی در گاوصندوق (از معاملات باز)</option>
                <option value="vault_to_trade">📤 انتقال به معاملات باز (از گاوصندوق)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">وزن طلا (گرم):</label>
              <input
                type="number"
                step="0.001"
                placeholder="مثال: ۱۰.۵"
                value={vaultGrams}
                onChange={(e) => setVaultGrams(e.target.value)}
                className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-xs font-medium num"
                required
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">عنوان/طرف‌حساب:</label>
              <input
                type="text"
                value={vaultCounterparty}
                onChange={(e) => setVaultCounterparty(e.target.value)}
                className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-xs font-medium"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={vaultMutation.isPending}
                className="w-full bg-gold hover:bg-gold/90 text-black font-bold py-2.5 rounded-xl text-xs transition-all"
              >
                {vaultMutation.isPending ? "در حال ثبت..." : "🚀 ثبت انتقال گاوصندوق"}
              </button>
            </div>
          </form>
        </section>

        {/* Adjust Fiat Liquidity Card */}
        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-400">
              <Wallet className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">تنظیم صندوق نقدینگی تومان</h2>
              <p className="text-xs text-muted-foreground">تغییر مستقیم تراز نقدینگی تومانی حساب</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = parseFloat(fiatBalanceInput);
              if (isNaN(val)) return;
              fiatMutation.mutate(val);
            }}
            className="flex flex-col sm:flex-row gap-4 pt-2"
          >
            <div className="flex-1">
              <input
                type="number"
                placeholder={`موجودی جدید به تومان (فعلی: ${withCommas(profile?.fiat_balance || 0)})`}
                value={fiatBalanceInput}
                onChange={(e) => setFiatBalanceInput(e.target.value)}
                className="w-full bg-background/60 border border-border rounded-xl px-3 py-2 text-xs font-medium num"
                required
              />
            </div>
            <button
              type="submit"
              disabled={fiatMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl text-xs transition-all"
            >
              {fiatMutation.isPending ? "در حال ثبت..." : "تغییر تراز نقدینگی"}
            </button>
          </form>
        </section>

        {/* Danger Zone: Reset Trade History */}
        <section className="glass-panel rounded-2xl p-6 border-l-4 border-l-rose-500 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-rose-500/10 text-rose-400">
              <Trash2 className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-400">منطقه حساس: پاک‌سازی تاریخچه معاملات</h2>
              <p className="text-xs text-muted-foreground">حذف کامل معاملات، تراکنش‌ها و تاریخچه گاوصندوق این حساب</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-muted-foreground">
              ⚠️ توجه: این عمل قابل بازگشت نیست و تمامی سوابق معاملاتی شما صفر خواهد شد.
            </p>
            <button
              onClick={() => {
                if (window.confirm("آیا از پاک‌سازی کامل تاریخچه معاملات خود اطمینان دارید؟")) {
                  resetHistoryMutation.mutate();
                }
              }}
              disabled={resetHistoryMutation.isPending}
              className="bg-rose-600/20 hover:bg-rose-600 border border-rose-500 text-rose-300 hover:text-white font-bold px-5 py-2 rounded-xl text-xs transition-all"
            >
              {resetHistoryMutation.isPending ? "در حال پاک‌سازی..." : "🗑️ پاک‌سازی کامل تاریخچه"}
            </button>
          </div>
        </section>

        {/* Root Admin Management Section */}
        {profile?.is_root && (
          <section className="glass-panel rounded-2xl p-6 space-y-6 border border-gold/30">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="grid size-10 place-items-center rounded-xl bg-gold/20 text-gold">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gold">پنل مدیریت ارشد کاربران (Root Admin)</h2>
                <p className="text-xs text-muted-foreground">تعریف حساب جدید، تغییر رمز عبور و نظارت بر تراز اشخاص</p>
              </div>
            </div>

            {/* Create New User Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newUsername || !newPassword) return;
                createUserMutation.mutate({
                  username: newUsername,
                  password: newPassword,
                  display_name: newDisplayName || newUsername,
                  initial_fiat: parseFloat(newInitialFiat) || 0,
                });
              }}
              className="space-y-3 p-4 rounded-xl bg-background/50 border border-border"
            >
              <h3 className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                <UserPlus className="size-4 text-gold" />
                تعریف کاربر جدید:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  placeholder="نام کاربری (لاتین)"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="bg-background/60 border border-border rounded-xl px-3 py-2"
                  required
                />
                <input
                  type="password"
                  placeholder="رمز عبور"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-background/60 border border-border rounded-xl px-3 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="نام نمایشی (فارسی)"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="bg-background/60 border border-border rounded-xl px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="سرمایه اولیه (تومان)"
                  value={newInitialFiat}
                  onChange={(e) => setNewInitialFiat(e.target.value)}
                  className="bg-background/60 border border-border rounded-xl px-3 py-2 num"
                />
              </div>

              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className="bg-gold hover:bg-gold/90 text-black font-bold px-5 py-2 rounded-xl text-xs transition-all"
              >
                {createUserMutation.isPending ? "در حال ساخت..." : "➕ ساخت حساب کاربر جدید"}
              </button>
            </form>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground">
                    <th className="py-2.5 px-3">شناسه</th>
                    <th className="py-2.5 px-3">نام کاربری</th>
                    <th className="py-2.5 px-3">نام نمایشی</th>
                    <th className="py-2.5 px-3">موجودی تومانی</th>
                    <th className="py-2.5 px-3">طلای معاملاتی</th>
                    <th className="py-2.5 px-3">طلای گاوصندوق</th>
                    <th className="py-2.5 px-3 text-center">عملیات مدیریت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {adminUsers?.map((u) => (
                    <tr key={u.id} className="hover:bg-background/30 transition-colors">
                      <td className="py-3 px-3 num">{u.id}</td>
                      <td className="py-3 px-3 font-semibold text-foreground">{u.username}</td>
                      <td className="py-3 px-3 text-muted-foreground">{u.display_name}</td>
                      <td className="py-3 px-3 num">{withCommas(u.fiat_balance)} تومان</td>
                      <td className="py-3 px-3 num">{u.trading_gold.toFixed(3)} گرم</td>
                      <td className="py-3 px-3 num">{u.vault_gold.toFixed(3)} گرم</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              const pass = prompt(`رمز عبور جدید برای ${u.username} را وارد کنید:`);
                              if (pass) resetPassMutation.mutate({ uid: u.id, pass });
                            }}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                            title="تغییر رمز عبور"
                          >
                            <KeyRound className="size-4" />
                          </button>

                          {!u.is_root && (
                            <button
                              onClick={() => {
                                if (window.confirm(`آیا از حذف حساب ${u.username} اطمینان دارید؟`)) {
                                  deleteUserMutation.mutate(u.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                              title="حذف کاربر"
                            >
                              <UserX className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

