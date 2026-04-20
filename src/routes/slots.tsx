import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { RequireAuth, PageHeader } from "@/components/RequireAuth";

export const Route = createFileRoute("/slots")({ component: () => <RequireAuth><SlotsGame /></RequireAuth> });

const SYMBOLS = ["🍒", "🍋", "🔔", "💎", "7️⃣", "⭐"];
const PAYOUT: Record<string, number> = { "🍒": 3, "🍋": 4, "🔔": 6, "💎": 12, "7️⃣": 25, "⭐": 8 };

function spinReel(): string[] {
  return Array.from({ length: 3 }).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
}

function SlotsGame() {
  const { user, updateBalance } = useAuth();
  const [bet, setBet] = useState(20);
  const [reels, setReels] = useState<string[][]>([spinReel(), spinReel(), spinReel()]);
  const [spinning, setSpinning] = useState(false);
  const [msg, setMsg] = useState("");

  const balance = user?.balance ?? 0;

  const spin = async () => {
    if (spinning || bet <= 0 || bet > balance) return;
    setMsg("");
    try { await updateBalance(-bet); } catch (e: any) { setMsg(e.message); return; }
    setSpinning(true);

    const finals: string[][] = [spinReel(), spinReel(), spinReel()];

    // animate
    let n = 0;
    const id = setInterval(() => {
      setReels([spinReel(), spinReel(), spinReel()]);
      n++;
      if (n > 12) {
        clearInterval(id);
        setReels(finals);
        // payout: middle row
        const line = [finals[0][1], finals[1][1], finals[2][1]];
        let win = 0;
        if (line[0] === line[1] && line[1] === line[2]) win = bet * (PAYOUT[line[0]] ?? 5);
        else if (line[0] === line[1] || line[1] === line[2]) win = Math.floor(bet * 1.5);
        if (win > 0) {
          updateBalance(win).then(() => setMsg(`🎉 Выигрыш ${win} CR (${line.join(" ")})`));
        } else setMsg(`Без выигрыша (${line.join(" ")})`);
        setSpinning(false);
      }
    }, 70);
  };

  return (
    <div>
      <PageHeader title="Слоты 🎰" subtitle="Совпадение по средней линии" />

      <div className="glass-strong rounded-3xl p-6">
        <div className="grid grid-cols-3 gap-3">
          {reels.map((reel, i) => (
            <div key={i} className="glass overflow-hidden rounded-2xl">
              {reel.map((s, j) => (
                <div key={j} className={`flex h-20 items-center justify-center text-5xl ${j === 1 ? "bg-primary/10" : ""}`}>
                  {s}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <input type="number" min={1} max={balance} value={bet}
            onChange={(e) => setBet(Math.max(1, Number(e.target.value) || 0))}
            className="w-28 rounded-lg bg-input px-3 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-ring" />
          {[10, 50, 100].map((v) => (
            <button key={v} onClick={() => setBet(Math.min(v, balance))} className="glass rounded-lg px-3 py-1.5 text-xs">{v}</button>
          ))}
          <button onClick={spin} disabled={spinning || bet > balance} className="btn-primary ml-auto rounded-xl px-6 py-2.5 text-sm">
            {spinning ? "..." : `Крутить ${bet} CR`}
          </button>
        </div>

        {msg && <div className="mt-4 rounded-lg bg-secondary/40 px-3 py-2 text-center text-sm">{msg}</div>}
      </div>

      <div className="glass mt-4 rounded-2xl p-4 text-xs text-muted-foreground">
        <div className="mb-2 font-semibold text-foreground">Выплаты (x ставки)</div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(PAYOUT).map(([s, m]) => (
            <div key={s} className="flex items-center gap-2"><span className="text-lg">{s}{s}{s}</span> <span className="font-mono text-primary">x{m}</span></div>
          ))}
          <div className="col-span-3">2 одинаковых рядом → x1.5</div>
        </div>
      </div>
    </div>
  );
}
