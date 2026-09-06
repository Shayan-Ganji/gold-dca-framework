import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

import { login, getSession } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (getSession()) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      await login(username, password);
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ورود ناموفق بود");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45rem_30rem_at_50%_0%,oklch(0.792_0.139_85.5/0.12),transparent_70%)]" />
      <section className="glass-panel relative w-full max-w-md rounded-3xl border-gold/35 p-8 shadow-[0_30px_80px_-40px_oklch(0.792_0.139_85.5/0.6)]">
        <div className="flex flex-col items-center text-center">
          <div className="grid size-16 place-items-center rounded-full border border-gold/40 bg-gold/10 text-4xl">
            🪙
          </div>
          <h1 className="mt-5 text-2xl leading-9 font-extrabold text-foreground">
            پلتفرم ترید لایو و هوش مصنوعی طلا
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            میز معاملاتی کوانت حرفه‌ای — دسترسی فقط برای اعضای تأییدشده
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username">نام کاربری</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="نام کاربری مدیر"
              autoComplete="username"
              dir="ltr"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">رمز عبور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              dir="ltr"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={pending || !username || !password}
            className="h-12 w-full bg-gradient-to-l from-gold to-gold-soft text-base font-bold text-gold-foreground hover:opacity-90"
          >
            {pending && <Loader2 className="ml-2 size-4 animate-spin" />}
            ورود به داشبورد معاملاتی
          </Button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-gold" />
          ثبت‌نام عمومی غیرفعال است. حساب‌ها توسط مدیر پلتفرم ساخته می‌شوند.
        </p>
      </section>
    </main>
  );
}
