import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Rocket, Dices, CircleDot, Package, Sparkles, Wallet, ArrowRight, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({ component: Index });

const TILES = [
  { to: "/rocket", title: "Ракета", desc: "Crash до x100", icon: Rocket, color: "from-emerald-400/30 to-transparent" },
  { to: "/slots", title: "Слоты", desc: "Классика 3×3", icon: Dices, color: "from-lime-400/30 to-transparent" },
  { to: "/roulette", title: "Рулетка", desc: "Red / Black / Zero", icon: CircleDot, color: "from-green-400/30 to-transparent" },
  { to: "/cases", title: "NFT Кейсы", desc: "500 CR за дроп", icon: Package, color: "from-emerald-300/30 to-transparent" },
  { to: "/upgrader", title: "NFT Upgrader", desc: "Прокачай свой NFT", icon: Sparkles, color: "from-teal-300/30 to-transparent" },
  { to: "/inventory", title: "Инвентарь", desc: "Твоя коллекция", icon: Wallet, color: "from-emerald-500/30 to-transparent" },
];

type Banner = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  active: boolean;
  bg_color: string;
};

type Promo = {
  id: string;
  title: string;
  description: string;
  bonus_cr: number;
  active: boolean;
  expires_at: string | null;
};

function BannerSlider({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => setCurrent(i => (i + 1) % banners.length), 4000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const b = banners[current];

  const wrap = (children: React.ReactNode) =>
    b.link_url
      ? <a href={b.link_url} target="_blank" rel="noopener noreferrer">{children}</a>
      : <div>{children}</div>;

  return (
    <div className="mb-4 relative">
      <style>{`
        @keyframes bannerFade {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
        .banner-slide { animation: bannerFade 0.5s ease-out; }
      `}</style>

      {wrap(
        <div
          key={b.id}
          className="banner-slide relative overflow-hidden rounded-3xl cursor-pointer"
          style={{
            minHeight: 140,
            background: b.image_url
              ? `linear-gradient(90deg, oklch(0.2 0.06 155 / 0.95) 0%, oklch(0.2 0.06 155 / 0.6) 60%, transparent 100%), url(${b.image_url}) center/cover`
              : "linear-gradient(135deg, oklch(0.28 0.06 155 / 0.85), oklch(0.22 0.05 155 / 0.9))",
            border: "1px solid oklch(0.78 0.21 145 / 0.25)",
          }}
        >
          <div className="relative z-10 p-6">
            <div className="text-xl font-bold glow-text">{b.title}</div>
            {b.description && (
              <div className="mt-1 text-sm text-muted-foreground max-w-xs">{b.description}</div>
            )}
            {b.link_url && (
              <div className="mt-3 text-xs font-medium text-primary flex items-center gap-1">
                Подробнее <ArrowRight className="h-3 w-3" />
              </div>
            )}
          </div>
        </div>
      )}

      {banners.length > 1 && (
        <div className="flex items-center justify-between mt-2 px-1">
          <button
            onClick={() => setCurrent(i => (i - 1 + banners.length) % banners.length)}
            className="glass rounded-lg p-1.5 hover:bg-primary/20 transition"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex gap-1.5">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === current ? 24 : 6, background: i === current ? "oklch(0.78 0.21 145)" : "oklch(0.4 0.06 150 / 0.5)" }}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrent(i => (i + 1) % banners.length)}
            className="glass rounded-lg p-1.5 hover:bg-primary/20 transition"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function PromoCard({ promo }: { promo: Promo }) {
  return (
    <div
      className="glass rounded-2xl p-4 flex items-start gap-3"
      style={{ border: "1px solid oklch(0.78 0.21 145 / 0.25)" }}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
        style={{ background: "oklch(0.78 0.21 145 / 0.15)" }}>
        🎁
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{promo.title}</div>
        {promo.description && (
          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{promo.description}</div>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {promo.bonus_cr > 0 && (
            <span className="text-xs font-mono font-bold" style={{ color: "oklch(0.78 0.21 145)" }}>
              +{promo.bonus_cr.toLocaleString()} CR
            </span>
          )}
          {promo.expires_at && (
            <span className="text-xs text-muted-foreground">
              до {new Date(promo.expires_at).toLocaleDateString("ru-RU")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Index() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  const loadBanners = useCallback(async () => {
    const { data } = await supabase.from("banners").select("*").eq("active", true).order("created_at", { ascending: false });
    setBanners((data as Banner[]) ?? []);
  }, []);

  const loadPromos = useCallback(async () => {
    const { data } = await supabase.from("promotions").select("*").eq("active", true).order("created_at", { ascending: false });
    setPromos((data as Promo[]) ?? []);
  }, []);

  useEffect(() => {
    loadBanners();
    loadPromos();
  }, [loadBanners, loadPromos]);

  if (loading || !user) return null;

  const isAdmin = user.role === "admin" || user.role === "mayor";

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="glass-strong relative overflow-hidden rounded-3xl p-8 sm:p-10">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <p className="text-sm uppercase tracking-widest text-primary">Привет, {user.username}</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl glow-text">Твой крипто-кошелёк</h1>
        <div className="mt-6 flex items-end gap-3">
          <span className="font-mono text-5xl font-bold tabular-nums sm:text-6xl">
            {(user.balance ?? 0).toLocaleString()}
          </span>
          <span className="mb-2 text-lg font-semibold text-primary">CR</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Доступный баланс</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/cases" className="btn-primary rounded-xl px-5 py-2.5 text-sm">
            Открыть кейс <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
          <Link to="/rocket" className="glass rounded-xl px-5 py-2.5 text-sm font-medium transition hover:scale-105">
            Запустить ракету
          </Link>
          {isAdmin && (
            <Link to="/admin"
              className="glass rounded-xl px-5 py-2.5 text-sm font-medium transition hover:scale-105 flex items-center gap-2"
              style={{ border: "1px solid oklch(0.78 0.21 145 / 0.4)", color: "oklch(0.78 0.21 145)" }}>
              <Shield className="h-4 w-4" /> Админ
            </Link>
          )}
        </div>
      </section>

      {/* Banners */}
      {banners.length > 0 && <BannerSlider banners={banners} />}

      {/* Promotions */}
      {promos.length > 0 && (
        <section>
          <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            🎁 Акции
          </h2>
          <div className="space-y-2">
            {promos.map(p => <PromoCard key={p.id} promo={p} />)}
          </div>
        </section>
      )}

      {/* Games */}
      <section>
        <h2 className="mb-4 px-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Игры</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TILES.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="glass group relative overflow-hidden rounded-2xl p-5 transition hover:scale-[1.02] hover:border-primary/40"
              >
                <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${t.color} blur-2xl transition group-hover:scale-125`} />
                <Icon className="relative h-7 w-7 text-primary" />
                <div className="relative mt-4">
                  <div className="text-base font-semibold">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
