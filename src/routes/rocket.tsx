import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { RequireAuth, PageHeader } from "@/components/RequireAuth";
import { Rocket } from "lucide-react";

export const Route = createFileRoute("/rocket")({ component: () => <RequireAuth><RocketGame /></RequireAuth> });

type Phase = "idle" | "flying" | "crashed" | "cashed";

function RocketGame() {
  const { user, updateBalance } = useAuth();
  const [bet, setBet] = useState(50);
  const [phase, setPhase] = useState<Phase>("idle");
  const [mult, setMult] = useState(1);
  const [crashAt, setCrashAt] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [msg, setMsg] = useState("");
  const raf = useRef<number | null>(null);
  const start = useRef(0);

  const balance = user?.balance ?? 0;

  const launch = async () => {
    if (bet <= 0 || bet > balance || phase === "flying") return;
    setMsg("");
    try {
      await updateBalance(-bet);
    } catch (e: any) { setMsg(e.message); return; }

    // crash point: heavy tail
    const r = Math.random();
    const target = Math.max(1.0, +(0.99 / (1 - r)).toFixed(2));
    setCrashAt(target);
    setPhase("flying");
    setMult(1);
    start.current = performance.now();

    const tick = (t: number) => {
      const elapsed = (t - start.current) / 1000;
      const m = +(Math.pow(1.07, elapsed * 4)).toFixed(2);
      if (m >= target) {
        setMult(target);
        setPhase("crashed");
        setHistory((h) => [target, ...h].slice(0, 10));
        setMsg(`💥 Краш на x${target}`);
        return;
      }
      setMult(m);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const cashout = async () => {
    if (phase !== "flying") return;
    if (raf.current) cancelAnimationFrame(raf.current);
    const m = mult;
    setPhase("cashed");
    const win = Math.floor(bet * m);
    try {
      await updateBalance(win);
      setMsg(`✅ Выигрыш: ${win} CR (x${m})`);
      setHistory((h) => [m, ...h].slice(0, 10));
    } catch (e: any) { setMsg(e.message); }
  };

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  return (
    <div>
      <PageHeader title="Ракета 🚀" subtitle="Забери куш до краша" />

      <div className="glass-strong relative mb-4 overflow-hidden rounded-3xl p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_oklch(0.78_0.25_145/0.15),_transparent_70%)]" />
        <div className="relative flex flex-col items-center justify-center py-12">
          <Rocket
            className={`mb-4 h-16 w-16 text-primary transition-transform duration-300 ${
              phase === "flying" ? "animate-bounce" : phase === "crashed" ? "rotate-180 text-destructive" : ""
            }`}
          />
          <div className={`font-mono text-7xl font-bold tabular-nums glow-text ${phase === "crashed" ? "text-destructive" : "text-primary"}`}>
            x{mult.toFixed(2)}
          </div>
          {phase === "crashed" && <div className="mt-2 text-sm text-destructive">CRASH @ x{crashAt}</div>}
        </div>
      </div>

      <div className="glass mb-4 flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase text-muted-foreground">Ставка</span>
          <input
            type="number" min={1} max={balance} value={bet}
            onChange={(e) => setBet(Math.max(1, Number(e.target.value) || 0))}
            className="w-28 rounded-lg bg-input px-3 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {[10, 50, 100, 500].map((v) => (
          <button key={v} onClick={() => setBet(Math.min(v, balance))} className="glass rounded-lg px-3 py-1.5 text-xs hover:bg-primary/10">{v}</button>
        ))}
        <button onClick={() => setBet(Math.floor(balance / 2))} className="glass rounded-lg px-3 py-1.5 text-xs hover:bg-primary/10">½</button>
        <button onClick={() => setBet(balance)} className="glass rounded-lg px-3 py-1.5 text-xs hover:bg-primary/10">MAX</button>
      </div>

      <div className="flex gap-3">
        {phase !== "flying" ? (
          <button onClick={launch} disabled={bet > balance || bet <= 0} className="btn-primary flex-1 rounded-xl py-3 text-base">Запустить ({bet} CR)</button>
        ) : (
          <button onClick={cashout} className="btn-primary flex-1 rounded-xl py-3 text-base">Забрать {Math.floor(bet * mult)} CR</button>
        )}
      </div>

      {msg && <div className="glass mt-4 rounded-xl p-3 text-center text-sm">{msg}</div>}

      <div className="mt-6">
        <h3 className="mb-2 px-1 text-xs uppercase tracking-widest text-muted-foreground">История</h3>
        <div className="flex flex-wrap gap-2">
          {history.length === 0 && <span className="text-xs text-muted-foreground">Пока пусто</span>}
          {history.map((h, i) => (
            <span key={i} className={`glass rounded-lg px-3 py-1 font-mono text-xs ${h >= 2 ? "text-primary" : "text-muted-foreground"}`}>x{h.toFixed(2)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
