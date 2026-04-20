import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Rocket, Dices, CircleDot, Package, Sparkles, Wallet, ArrowRight } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/")({ component: Index });

const TILES = [
  { to: "/rocket", title: "Ракета", desc: "Crash до x100", icon: Rocket, color: "from-emerald-400/30 to-transparent" },
  { to: "/slots", title: "Слоты", desc: "Классика 3×3", icon: Dices, color: "from-lime-400/30 to-transparent" },
  { to: "/roulette", title: "Рулетка", desc: "Red / Black / Zero", icon: CircleDot, color: "from-green-400/30 to-transparent" },
  { to: "/cases", title: "NFT Кейсы", desc: "500 CR за дроп", icon: Package, color: "from-emerald-300/30 to-transparent" },
  { to: "/upgrader", title: "NFT Upgrader", desc: "Прокачай свой NFT", icon: Sparkles, color: "from-teal-300/30 to-transparent" },
  { to: "/inventory", title: "Инвентарь", desc: "Твоя коллекция", icon: Wallet, color: "from-emerald-500/30 to-transparent" },
];

function Index() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) return null;

  return (
    <div className="space-y-8">
      <section className="glass-strong relative overflow-hidden rounded-3xl p-8 sm:p-10">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <p className="text-sm uppercase tracking-widest text-primary">Привет, {user.username}</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl glow-text">Твой крипто-кошелёк</h1>
        <div className="mt-6 flex items-end gap-3">
          <span className="font-mono text-5xl font-bold tabular-nums sm:text-6xl">{(user.balance ?? 0).toLocaleString()}</span>
          <span className="mb-2 text-lg font-semibold text-primary">CR</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Доступный баланс</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/cases" className="btn-primary rounded-xl px-5 py-2.5 text-sm">Открыть кейс <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
          <Link to="/rocket" className="glass rounded-xl px-5 py-2.5 text-sm font-medium transition hover:scale-105">Запустить ракету</Link>
        </div>
      </section>

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
