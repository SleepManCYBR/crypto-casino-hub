import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { RequireAuth, PageHeader } from "@/components/RequireAuth";
import { useUserNfts } from "@/lib/nft";
import { User, Wallet, Shield, Calendar, LogOut } from "lucide-react";

export const Route = createFileRoute("/profile")({ component: () => <RequireAuth><ProfilePage /></RequireAuth> });

function ProfilePage() {
  const { user, logout } = useAuth();
  const { items } = useUserNfts(user?.username);
  if (!user) return null;
  const totalValue = items.reduce((s, i) => s + i.price, 0);

  return (
    <div>
      <PageHeader title="Личный кабинет" subtitle="Твоя статистика и аккаунт" />

      <div className="glass-strong mb-4 flex items-center gap-4 rounded-3xl p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-2xl font-bold text-primary-foreground shadow-[var(--shadow-glow)]">
          {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : user.username[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-xl font-bold">{user.username}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" /> {user.role} · тема: {user.theme}
          </div>
        </div>
        <button onClick={logout} className="glass flex items-center gap-1 rounded-xl px-3 py-2 text-xs hover:bg-destructive/20">
          <LogOut className="h-4 w-4" /> Выйти
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card icon={<Wallet className="h-5 w-5 text-primary" />} label="Баланс" value={`${(user.balance ?? 0).toLocaleString()} CR`} />
        <Card icon={<User className="h-5 w-5 text-primary" />} label="NFT" value={String(items.length)} sub={`${totalValue.toLocaleString()} CR общая стоимость`} />
        <Card icon={<Calendar className="h-5 w-5 text-primary" />} label="С нами с" value={new Date(user.registered_at).toLocaleDateString("ru-RU")} />
      </div>

      <div className="glass mt-4 rounded-2xl p-4 text-xs text-muted-foreground">
        <div className="mb-2 font-semibold text-foreground">Аккаунт</div>
        <Row k="ID" v={String(user.id)} />
        <Row k="Telegram ID" v={user.telegram_id ?? "—"} />
        <Row k="Заблокирован" v={user.is_banned ? "Да" : "Нет"} />
        <Row k="Темы" v={(user.owned_themes ?? []).join(", ") || "—"} />
      </div>
    </div>
  );
}

function Card({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">{icon} {label}</div>
      <div className="mt-2 font-mono text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between py-1 border-b border-border/40 last:border-0"><span>{k}</span><span className="font-mono text-foreground">{v}</span></div>;
}
