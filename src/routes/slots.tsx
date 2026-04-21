import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { RequireAuth, PageHeader } from "@/components/RequireAuth";

export const Route = createFileRoute("/slots")({ component: () => <RequireAuth><SlotsGame /></RequireAuth> });

const SYMBOLS = [
  { emoji: "🍒", name: "cherry", payout: 3, color: "#ef4444" },
  { emoji: "🍋", name: "lemon", payout: 4, color: "#eab308" },
  { emoji: "🔔", name: "bell", payout: 6, color: "#f97316" },
  { emoji: "💎", name: "diamond", payout: 12, color: "#38bdf8" },
  { emoji: "7️⃣", name: "seven", payout: 25, color: "#a855f7" },
  { emoji: "⭐", name: "star", payout: 8, color: "#fbbf24" },
  { emoji: "🎰", name: "jackpot", payout: 50, color: "#22c55e" },
];

const PAYOUT: Record<string, number> = Object.fromEntries(SYMBOLS.map(s => [s.emoji, s.payout]));

function getColor(emoji: string) {
  return SYMBOLS.find(s => s.emoji === emoji)?.color ?? "#22c55e";
}

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].emoji;
}

function spinReel(): string[] {
  return Array.from({ length: 3 }).map(() => randomSymbol());
}

// Reel strip — long list of symbols for scroll animation
function generateStrip(final: string, length = 30): string[] {
  const strip: string[] = [];
  for (let i = 0; i < length - 1; i++) {
    strip.push(randomSymbol());
  }
  strip.push(final);
  return strip;
}

interface ReelProps {
  symbols: string[];
  isSpinning: boolean;
  finalSymbol: string;
  delay: number;
  won: boolean;
  highlight: boolean;
}

function SlotReel({ symbols, isSpinning, finalSymbol, delay, won, highlight }: ReelProps) {
  const reelRef = useRef<HTMLDivElement>(null);
  const [displaySymbols, setDisplaySymbols] = useState(symbols);
  const [settled, setSettled] = useState(true);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSpinning) return;
    setSettled(false);
    const strip = generateStrip(finalSymbol, 25);
    let idx = 0;
    const speed = 40;

    const tick = () => {
      setDisplaySymbols([strip[idx % strip.length], strip[(idx + 1) % strip.length], strip[(idx + 2) % strip.length]]);
      idx++;
    };

    const interval = setInterval(tick, speed);

    animRef.current = setTimeout(() => {
      clearInterval(interval);
      setDisplaySymbols([randomSymbol(), finalSymbol, randomSymbol()]);
      setTimeout(() => {
        setDisplaySymbols(symbols);
        setSettled(true);
      }, 120);
    }, 600 + delay);

    return () => {
      clearInterval(interval);
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, [isSpinning]);

  const middleColor = getColor(displaySymbols[1]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(180deg, oklch(0.18 0.04 155 / 0.9) 0%, oklch(0.22 0.05 155 / 0.95) 50%, oklch(0.18 0.04 155 / 0.9) 100%)",
        border: highlight
          ? `2px solid ${middleColor}`
          : "1px solid oklch(0.4 0.06 150 / 0.25)",
        boxShadow: highlight
          ? `0 0 20px ${middleColor}66, inset 0 0 30px ${middleColor}22`
          : "var(--shadow-card)",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-10 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, oklch(0.18 0.04 155 / 0.9), transparent)" }} />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-10 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, oklch(0.18 0.04 155 / 0.9), transparent)" }} />

      {/* Middle line highlight */}
      <div className="absolute left-0 right-0 z-20 pointer-events-none"
        style={{
          top: "calc(33.33% - 1px)",
          height: "33.34%",
          background: highlight
            ? `${middleColor}18`
            : "oklch(0.78 0.21 145 / 0.06)",
          borderTop: `1px solid ${highlight ? middleColor + "66" : "oklch(0.78 0.21 145 / 0.2)"}`,
          borderBottom: `1px solid ${highlight ? middleColor + "66" : "oklch(0.78 0.21 145 / 0.2)"}`,
          transition: "background 0.3s, border-color 0.3s",
        }}
      />

      <div ref={reelRef} style={{ transition: settled ? "none" : undefined }}>
        {displaySymbols.map((s, j) => (
          <div
            key={j}
            className="flex items-center justify-center"
            style={{
              height: "6rem",
              fontSize: j === 1 ? "3.5rem" : "2.5rem",
              filter: j === 1
                ? (isSpinning ? "none" : (won ? `drop-shadow(0 0 12px ${middleColor})` : "none"))
                : "opacity(0.5)",
              opacity: j === 1 ? 1 : 0.45,
              transform: j === 1 && won && !isSpinning ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.3s, filter 0.3s",
            }}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// Coin particle effect
function CoinBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const coins = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
      {coins.map((i) => {
        const angle = (i / 18) * 360;
        const dist = 80 + Math.random() * 80;
        const delay = Math.random() * 0.3;
        const size = 16 + Math.random() * 12;
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              width: size,
              height: size,
              fontSize: size,
              animation: `coinBurst 1s ease-out ${delay}s forwards`,
              "--angle": `${angle}deg`,
              "--dist": `${dist}px`,
            } as React.CSSProperties}
          >
            🪙
          </div>
        );
      })}
    </div>
  );
}

function SlotsGame() {
  const { user, updateBalance } = useAuth();
  const [bet, setBet] = useState(20);
  const [reels, setReels] = useState<string[][]>([spinReel(), spinReel(), spinReel()]);
  const [finalReels, setFinalReels] = useState<string[][]>([["🍒", "🍒", "🍒"], ["🍒", "🍒", "🍒"], ["🍒", "🍒", "🍒"]]);
  const [spinning, setSpinning] = useState(false);
  const [msg, setMsg] = useState("");
  const [won, setWon] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [burstActive, setBurstActive] = useState(false);
  const [history, setHistory] = useState<{ line: string[], win: number }[]>([]);
  const [pullAnim, setPullAnim] = useState(false);

  const balance = user?.balance ?? 0;

  const spin = async () => {
    if (spinning || bet <= 0 || bet > balance) return;
    setMsg("");
    setWon(false);
    setWinAmount(0);

    try {
      await updateBalance(-bet);
    } catch (e: any) {
      setMsg(e.message);
      return;
    }

    setPullAnim(true);
    setTimeout(() => setPullAnim(false), 300);

    const finals: string[][] = [spinReel(), spinReel(), spinReel()];
    setFinalReels(finals);
    setSpinning(true);

    setTimeout(() => {
      setReels(finals);
      setSpinning(false);

      const line = [finals[0][1], finals[1][1], finals[2][1]];
      let win = 0;

      if (line[0] === line[1] && line[1] === line[2]) {
        win = bet * (PAYOUT[line[0]] ?? 5);
      } else if (line[0] === line[1] || line[1] === line[2]) {
        win = Math.floor(bet * 1.5);
      }

      if (win > 0) {
        setWon(true);
        setWinAmount(win);
        setBurstActive(true);
        setTimeout(() => setBurstActive(false), 1200);
        updateBalance(win).then(() => {
          setMsg(`🎉 Выигрыш ${win} CR!`);
        });
      } else {
        setMsg(`Нет выигрыша — ${line.join(" ")}`);
      }

      setHistory(h => [{ line, win }, ...h].slice(0, 8));
    }, 1200);
  };

  const line = [reels[0][1], reels[1][1], reels[2][1]];
  const allSame = !spinning && won;
  const isHighlight = (i: number) => !spinning && won && reels[i][1] === reels[0][1];

  return (
    <div>
      <style>{`
        @keyframes coinBurst {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(calc(var(--angle))) translateX(var(--dist)); opacity: 0; }
        }
        @keyframes leverPull {
          0% { transform: translateY(0); }
          50% { transform: translateY(20px); }
          100% { transform: translateY(0); }
        }
        @keyframes winPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes winText {
          0% { transform: scale(0.5) translateY(20px); opacity: 0; }
          60% { transform: scale(1.15) translateY(-5px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .slot-machine-frame {
          background: linear-gradient(145deg, oklch(0.25 0.05 155 / 0.8), oklch(0.18 0.04 155 / 0.9));
          border: 2px solid oklch(0.78 0.21 145 / 0.3);
          box-shadow: 
            0 0 60px oklch(0.78 0.25 145 / 0.2),
            inset 0 2px 0 oklch(1 0 0 / 0.1),
            0 20px 60px oklch(0 0 0 / 0.5);
        }
        .win-shine {
          background: linear-gradient(90deg, transparent, oklch(0.78 0.25 145 / 0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      <PageHeader title="Слоты 🎰" subtitle="Совпадение по средней линии" />

      <div className="slot-machine-frame rounded-3xl p-6 relative">
        {/* Machine top decoration */}
        <div className="flex items-center justify-center mb-4 gap-2">
          <div className="h-1 flex-1 rounded-full" style={{ background: "linear-gradient(to right, transparent, oklch(0.78 0.21 145 / 0.5), transparent)" }} />
          <div className="text-2xl font-bold tracking-widest text-primary px-4" style={{ textShadow: "0 0 20px oklch(0.85 0.25 145 / 0.8)" }}>SLOTS</div>
          <div className="h-1 flex-1 rounded-full" style={{ background: "linear-gradient(to left, transparent, oklch(0.78 0.21 145 / 0.5), transparent)" }} />
        </div>

        {/* Win banner */}
        {won && (
          <div className="absolute inset-x-6 top-20 z-40 flex justify-center">
            <div
              className="rounded-2xl px-8 py-3 font-bold text-2xl"
              style={{
                background: "linear-gradient(135deg, oklch(0.82 0.22 150), oklch(0.68 0.2 160))",
                color: "oklch(0.12 0.04 155)",
                animation: "winText 0.4s ease-out forwards",
                boxShadow: "0 0 40px oklch(0.78 0.25 145 / 0.6)",
              }}
            >
              +{winAmount} CR 🎉
            </div>
          </div>
        )}

        {/* Reels */}
        <div className="relative grid grid-cols-3 gap-3" style={{ animation: won && !spinning ? "winPulse 0.6s ease-in-out" : "none" }}>
          <CoinBurst active={burstActive} />
          {reels.map((reel, i) => (
            <SlotReel
              key={i}
              symbols={reel}
              isSpinning={spinning}
              finalSymbol={finalReels[i][1]}
              delay={i * 200}
              won={won}
              highlight={isHighlight(i)}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <input
            type="number"
            min={1}
            max={balance}
            value={bet}
            onChange={(e) => setBet(Math.max(1, Number(e.target.value) || 0))}
            className="w-28 rounded-xl px-3 py-2 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
            style={{ background: "oklch(0.2 0.04 155 / 0.8)", border: "1px solid oklch(0.78 0.21 145 / 0.3)" }}
          />
          {[10, 50, 100, 500].map((v) => (
            <button
              key={v}
              onClick={() => setBet(Math.min(v, balance))}
              className="glass rounded-xl px-3 py-2 text-xs hover:bg-primary/10 transition"
            >
              {v}
            </button>
          ))}
          <button onClick={() => setBet(Math.floor(balance / 2))} className="glass rounded-xl px-3 py-2 text-xs hover:bg-primary/10 transition">½</button>
          <button onClick={() => setBet(balance)} className="glass rounded-xl px-3 py-2 text-xs hover:bg-primary/10 transition">MAX</button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          {/* Lever button */}
          <button
            onClick={spin}
            disabled={spinning || bet > balance || bet <= 0}
            className="relative flex-1 rounded-2xl py-4 text-base font-bold transition-all overflow-hidden"
            style={{
              background: spinning ? "oklch(0.3 0.05 155 / 0.5)" : "linear-gradient(135deg, oklch(0.82 0.22 150), oklch(0.68 0.2 160))",
              color: "oklch(0.12 0.04 155)",
              boxShadow: spinning ? "none" : "0 4px 20px oklch(0.78 0.25 145 / 0.4)",
              animation: pullAnim ? "leverPull 0.3s ease-out" : "none",
            }}
          >
            {spinning ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin">🎰</span> Крутится...
              </span>
            ) : (
              `🎰 Крутить — ${bet} CR`
            )}
          </button>
        </div>

        {msg && (
          <div
            className="mt-4 rounded-xl px-4 py-3 text-center text-sm font-semibold"
            style={{
              background: won ? "oklch(0.22 0.05 155 / 0.8)" : "oklch(0.2 0.03 155 / 0.5)",
              border: won ? "1px solid oklch(0.78 0.21 145 / 0.4)" : "1px solid oklch(0.4 0.06 150 / 0.2)",
              color: won ? "oklch(0.85 0.22 145)" : "oklch(0.7 0.04 155)",
            }}
          >
            {msg}
          </div>
        )}
      </div>

      {/* Payout table */}
      <div className="glass mt-4 rounded-2xl p-4">
        <div className="mb-3 font-semibold text-sm text-foreground">Таблица выплат</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SYMBOLS.map((s) => (
            <div
              key={s.emoji}
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "oklch(0.18 0.04 155 / 0.6)", border: `1px solid ${s.color}33` }}
            >
              <span className="text-xl">{s.emoji}{s.emoji}{s.emoji}</span>
              <span className="font-mono font-bold ml-auto" style={{ color: s.color }}>x{s.payout}</span>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-3 rounded-xl px-3 py-2 text-xs text-muted-foreground"
            style={{ background: "oklch(0.18 0.04 155 / 0.4)" }}>
            2 одинаковых рядом → x1.5 от ставки
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="glass mt-4 rounded-2xl p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">История</div>
          <div className="flex flex-col gap-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2"
                style={{ background: "oklch(0.18 0.04 155 / 0.5)", border: `1px solid ${h.win > 0 ? "oklch(0.78 0.21 145 / 0.3)" : "oklch(0.4 0.06 150 / 0.15)"}` }}>
                <span className="font-mono text-sm">{h.line.join(" ")}</span>
                {h.win > 0
                  ? <span className="font-mono text-sm font-bold" style={{ color: "oklch(0.78 0.21 145)" }}>+{h.win} CR</span>
                  : <span className="text-xs text-muted-foreground">Нет выигрыша</span>
                }
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
