import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav({ to: "/" }); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (mode === "login") await login(username.trim(), password);
      else await register(username.trim(), password);
      nav({ to: "/" });
    } catch (e: any) {
      setErr(e.message || "Ошибка");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form onSubmit={submit} className="glass-strong w-full max-w-sm rounded-3xl p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-xl font-bold glow-text">CRYPTO.CASINO</div>
            <div className="text-xs text-muted-foreground">{mode === "login" ? "Вход в аккаунт" : "Регистрация"}</div>
          </div>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Никнейм</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required minLength={2} maxLength={32}
            className="w-full rounded-xl border border-border bg-input px-4 py-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Пароль</span>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            required minLength={3}
            className="w-full rounded-xl border border-border bg-input px-4 py-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
          />
        </label>

        {err && <div className="mb-3 rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{err}</div>}

        <button type="submit" disabled={busy} className="btn-primary w-full rounded-xl py-2.5 text-sm">
          {busy ? "..." : mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>

        <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
          {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </button>
      </form>
    </div>
  );
}
