import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { RequireAuth, PageHeader } from "@/components/RequireAuth";
import { useUserNfts } from "@/lib/nft";
import { supabase } from "@/lib/supabase";
import { Wallet, Calendar, LogOut, Star, Award, Settings, Palette, Check } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/profile")({ component: () => <RequireAuth><ProfilePage /></RequireAuth> });

const THEMES: { key: string; label: string; swatch: string }[] = [
  { key: "green",  label: "Зелёная",    swatch: "linear-gradient(135deg, oklch(0.82 0.22 150), oklch(0.68 0.2 160))" },
  { key: "purple", label: "Фиолетовая", swatch: "linear-gradient(135deg, oklch(0.78 0.23 305), oklch(0.62 0.22 295))" },
  { key: "orange", label: "Оранжевая",  swatch: "linear-gradient(135deg, oklch(0.82 0.2 65), oklch(0.68 0.2 50))" },
  { key: "gold",   label: "Золотая",    swatch: "linear-gradient(135deg, oklch(0.88 0.18 95), oklch(0.74 0.16 80))" },
  { key: "red",    label: "Красная",    swatch: "linear-gradient(135deg, oklch(0.74 0.25 28), oklch(0.58 0.23 20))" },
  { key: "blue",   label: "Синяя",      swatch: "linear-gradient(135deg, oklch(0.72 0.21 265), oklch(0.55 0.2 255))" },
  { key: "cyan",   label: "Голубая",    swatch: "linear-gradient(135deg, oklch(0.83 0.16 205), oklch(0.68 0.15 195))" },
];

function ProfilePage() {
  const { user, logout, refresh } = useAuth();
  const { items } = useUserNfts(user?.username);
  const [activeTab, setActiveTab] = useState<"stats" | "nfts" | "themes" | "account">("stats");
  const [savingTheme, setSavingTheme] = useState<string | null>(null);

  if (!user) return null;

  const totalValue = items.reduce((s, i) => s + i.price, 0);
  const avatarLetter = user.username[0]?.toUpperCase() ?? "?";

  const roleColor = user.role === "admin" || user.role === "mayor"
    ? "oklch(0.78 0.21 145)"
    : "oklch(0.7 0.04 155)";

  const roleLabel =
    user.role === "mayor" ? "👑 Мэр" :
    user.role === "admin" ? "🛡️ Администратор" :
    "🎮 Игрок";

  const joinDate = new Date(user.registered_at);
  const daysAgo = Math.floor((Date.now() - joinDate.getTime()) / 86400000);

  return (
    <div>
      <style>{`
        @keyframes avatarGlow {
          0%, 100% { box-shadow: 0 0 20px oklch(0.78 0.25 145 / 0.4), 0 0 40px oklch(0.78 0.25 145 / 0.2); }
          50% { box-shadow: 0 0 30px oklch(0.85 0.28 145 / 0.6), 0 0 60px oklch(0.85 0.28 145 / 0.3); }
        }
        @keyframes profileSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes statCount {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .profile-animate { animation: profileSlideIn 0.4s ease-out; }
        .stat-animate { animation: statCount 0.5s ease-out; }
      `}</style>

      <PageHeader title="Личный кабинет" subtitle="Твоя статистика и аккаунт" />

      {/* Hero card */}
      <div className="glass-strong mb-4 rounded-3xl p-6 profile-animate" style={{
        background: "linear-gradient(145deg, oklch(0.28 0.06 155 / 0.85), oklch(0.2 0.04 155 / 0.7))",
        border: "1px solid oklch(0.78 0.21 145 / 0.2)",
      }}>
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold overflow-hidden"
              style={{
                background: "linear-gradient(135deg, oklch(0.82 0.22 150), oklch(0.68 0.2 160))",
                color: "oklch(0.12 0.04 155)",
                animation: "avatarGlow 3s ease-in-out infinite",
              }}
            >
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" className="h-20 w-20 object-cover" />
                : avatarLetter
              }
            </div>
            {/* Online badge */}
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 flex items-center justify-center"
              style={{ background: "oklch(0.78 0.21 145)", borderColor: "oklch(0.2 0.04 155)" }}>
              <div className="h-2 w-2 rounded-full" style={{ background: "oklch(0.12 0.04 155)" }} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold truncate">{user.username}</div>
            <div className="mt-1 text-sm font-semibold" style={{ color: roleColor }}>{roleLabel}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {user.is_banned ? "🚫 Заблокирован" : "✅ Активный"}
              {" · "}
              тема: {user.theme}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              С нами {daysAgo} дней
            </div>
          </div>

          <button
            onClick={logout}
            className="glass flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition hover:bg-destructive/20 hover:border-destructive/40 flex-shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" /> Выйти
          </button>
        </div>

        {/* Balance bar */}
        <div className="mt-5 rounded-2xl p-4" style={{
          background: "oklch(0.18 0.04 155 / 0.6)",
          border: "1px solid oklch(0.78 0.21 145 / 0.15)",
        }}>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-1">
                <Wallet className="h-3 w-3" /> Баланс
              </div>
              <div className="font-mono text-3xl font-bold tabular-nums" style={{
                color: "oklch(0.85 0.22 145)",
                textShadow: "0 0 20px oklch(0.78 0.25 145 / 0.5)",
              }}>
                {(user.balance ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">CR</div>
              <div className="text-xs text-muted-foreground">Crypto Credits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass mb-4 flex rounded-2xl p-1 gap-1">
        {([
          { key: "stats", label: "📊 Статистика" },
          { key: "nfts", label: "🎨 NFT" },
          { key: "account", label: "⚙️ Аккаунт" },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.key
                ? "linear-gradient(135deg, oklch(0.82 0.22 150), oklch(0.68 0.2 160))"
                : "transparent",
              color: activeTab === tab.key ? "oklch(0.12 0.04 155)" : "oklch(0.7 0.04 155)",
              boxShadow: activeTab === tab.key ? "0 2px 10px oklch(0.78 0.25 145 / 0.3)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "stats" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            icon={<Wallet className="h-5 w-5" />}
            label="Баланс"
            value={`${(user.balance ?? 0).toLocaleString()} CR`}
            color="oklch(0.78 0.21 145)"
          />
          <StatCard
            icon={<Award className="h-5 w-5" />}
            label="NFT в коллекции"
            value={String(items.length)}
            sub={`Ценность: ${totalValue.toLocaleString()} CR`}
            color="oklch(0.7 0.2 270)"
          />
          <StatCard
            icon={<Calendar className="h-5 w-5" />}
            label="Дата регистрации"
            value={joinDate.toLocaleDateString("ru-RU")}
            sub={`${daysAgo} дней назад`}
            color="oklch(0.7 0.15 200)"
          />
          <StatCard
            icon={<Star className="h-5 w-5" />}
            label="Тем разблокировано"
            value={String((user.owned_themes ?? []).length || 1)}
            sub={(user.owned_themes ?? []).join(", ") || user.theme}
            color="oklch(0.82 0.18 75)"
          />
        </div>
      )}

      {activeTab === "nfts" && (
        <div>
          {items.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
              <div className="text-4xl mb-3">🎨</div>
              <div className="font-medium">NFT коллекция пуста</div>
              <div className="text-sm mt-1">Открывай кейсы чтобы получить NFT</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="glass rounded-2xl overflow-hidden">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-transparent">
                    {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-sm truncate">{item.name}</div>
                    <div className="font-mono text-xs mt-1" style={{ color: "oklch(0.78 0.21 145)" }}>
                      {item.price.toLocaleString()} CR
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "account" && (
        <div className="glass rounded-2xl p-4 text-sm">
          <div className="mb-3 font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" /> Данные аккаунта
          </div>
          <div className="space-y-2">
            <Row k="ID" v={String(user.id)} />
            <Row k="Никнейм" v={user.username} />
            <Row k="Telegram ID" v={user.telegram_id ?? "—"} />
            <Row k="Роль" v={roleLabel} highlight={user.role !== "player"} />
            <Row k="Заблокирован" v={user.is_banned ? "🚫 Да" : "✅ Нет"} />
            <Row k="Активная тема" v={user.theme} />
            <Row k="Все темы" v={(user.owned_themes ?? []).join(", ") || "—"} />
            <Row k="Дата регистрации" v={joinDate.toLocaleString("ru-RU")} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 stat-animate" style={{
      border: `1px solid ${color}33`,
      boxShadow: `0 0 20px ${color}11`,
    }}>
      <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground mb-3"
        style={{ color: color }}>
        {icon} {label}
      </div>
      <div className="font-mono text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-2 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono font-semibold" style={{ color: highlight ? "oklch(0.78 0.21 145)" : "oklch(0.9 0.02 155)" }}>
        {v}
      </span>
    </div>
  );
}
