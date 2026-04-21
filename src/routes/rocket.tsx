import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { RequireAuth, PageHeader } from "@/components/RequireAuth";

export const Route = createFileRoute("/rocket")({ component: () => <RequireAuth><RocketGame /></RequireAuth> });

type Phase = "idle" | "flying" | "crashed" | "cashed";

// SVG Rocket component with animated flame
function RocketSVG({ phase }: { phase: Phase }) {
  const flying = phase === "flying";
  const crashed = phase === "crashed";

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        filter: crashed ? "hue-rotate(120deg) saturate(0.5)" : "none",
        transition: "filter 0.5s",
        transform: crashed ? "rotate(60deg)" : "rotate(0deg)",
        transformOrigin: "center",
      }}
    >
      <style>{`
        @keyframes rocketFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-12px) rotate(-2deg); }
          75% { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes rocketCrash {
          0% { transform: rotate(0deg) translateY(0); }
          100% { transform: rotate(60deg) translateY(60px); opacity: 0.3; }
        }
        @keyframes flameMain {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.95; }
          33% { transform: scaleY(1.25) scaleX(0.85); opacity: 1; }
          66% { transform: scaleY(0.85) scaleX(1.15); opacity: 0.9; }
        }
        @keyframes flameInner {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          50% { transform: scaleY(1.4) scaleX(0.8); }
        }
        @keyframes flameTip {
          0%, 100% { transform: scaleY(1); opacity: 0.9; }
          50% { transform: scaleY(1.6); opacity: 1; }
        }
        @keyframes spark {
          0% { transform: translateX(0) translateY(0) scale(1); opacity: 1; }
          100% { transform: translateX(var(--sx)) translateY(var(--sy)) scale(0); opacity: 0; }
        }
        @keyframes rocketGlow {
          0%, 100% { filter: drop-shadow(0 0 20px oklch(0.78 0.25 145 / 0.7)) drop-shadow(0 0 40px oklch(0.78 0.25 145 / 0.4)); }
          50% { filter: drop-shadow(0 0 30px oklch(0.85 0.28 145 / 0.9)) drop-shadow(0 0 60px oklch(0.85 0.28 145 / 0.5)); }
        }
        @keyframes exhaustTrail {
          0% { transform: scaleX(1); opacity: 0.7; }
          100% { transform: scaleX(0); opacity: 0; }
        }
        .rocket-svg-wrap {
          animation: ${flying ? "rocketFloat 2s ease-in-out infinite, rocketGlow 1.5s ease-in-out infinite" : crashed ? "rocketCrash 0.6s ease-out forwards" : "none"};
        }
        .flame-main { animation: ${flying ? "flameMain 0.12s ease-in-out infinite" : "none"}; transform-origin: top center; }
        .flame-inner { animation: ${flying ? "flameInner 0.08s ease-in-out infinite" : "none"}; transform-origin: top center; }
        .flame-tip { animation: ${flying ? "flameTip 0.07s ease-in-out infinite" : "none"}; transform-origin: top center; }
      `}</style>

      <div className="rocket-svg-wrap" style={{ width: 120, height: 200 }}>
        <svg viewBox="0 0 120 200" width="120" height="200" xmlns="http://www.w3.org/2000/svg">
          {/* Stars/particles behind */}
          {flying && [0,1,2,3,4,5].map(i => (
            <circle key={i}
              cx={20 + i * 18}
              cy={30 + (i % 3) * 20}
              r="1.5"
              fill="white"
              opacity={0.3 + (i % 3) * 0.2}
            />
          ))}

          {/* Rocket body */}
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="oklch(0.35 0.06 155)" />
              <stop offset="40%" stopColor="oklch(0.85 0.05 155)" />
              <stop offset="70%" stopColor="oklch(0.7 0.04 155)" />
              <stop offset="100%" stopColor="oklch(0.3 0.05 155)" />
            </linearGradient>
            <linearGradient id="noseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.85 0.22 145)" />
              <stop offset="100%" stopColor="oklch(0.55 0.15 145)" />
            </linearGradient>
            <linearGradient id="finGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.6 0.18 145)" />
              <stop offset="100%" stopColor="oklch(0.3 0.08 145)" />
            </linearGradient>
            <linearGradient id="flameOuter" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff6600" stopOpacity="1" />
              <stop offset="50%" stopColor="#ff3300" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="flameInnerG" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffff00" stopOpacity="1" />
              <stop offset="60%" stopColor="#ffaa00" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ff6600" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="flameTipG" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffff00" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="windowGrad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="oklch(0.9 0.15 220)" />
              <stop offset="100%" stopColor="oklch(0.4 0.1 220)" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Left fin */}
          <path d="M42 130 L22 155 L42 150 Z" fill="url(#finGrad)" opacity="0.9" />
          {/* Right fin */}
          <path d="M78 130 L98 155 L78 150 Z" fill="url(#finGrad)" opacity="0.9" />

          {/* Main body */}
          <path
            d="M42 140 L42 75 Q42 30 60 15 Q78 30 78 75 L78 140 Z"
            fill="url(#bodyGrad)"
          />

          {/* Body highlight stripe */}
          <path
            d="M56 20 Q58 17 60 15 Q62 17 64 20 L64 140 L56 140 Z"
            fill="oklch(0.9 0.05 155 / 0.3)"
          />

          {/* Nose cone */}
          <path
            d="M46 80 Q46 35 60 15 Q74 35 74 80 Z"
            fill="url(#noseGrad)"
            filter="url(#glow)"
          />

          {/* Cockpit window */}
          <circle cx="60" cy="72" r="11" fill="url(#windowGrad)" />
          <circle cx="60" cy="72" r="11" fill="none" stroke="oklch(0.8 0.1 155 / 0.6)" strokeWidth="1.5" />
          {/* Window glare */}
          <ellipse cx="56" cy="68" rx="4" ry="2.5" fill="white" opacity="0.4" transform="rotate(-20, 56, 68)" />

          {/* Body stripes */}
          <line x1="42" y1="105" x2="78" y2="105" stroke="oklch(0.78 0.21 145 / 0.4)" strokeWidth="1.5" />
          <line x1="42" y1="120" x2="78" y2="120" stroke="oklch(0.78 0.21 145 / 0.3)" strokeWidth="1" />

          {/* Nozzle */}
          <rect x="50" y="138" width="20" height="8" rx="3" fill="oklch(0.3 0.05 155)" />
          <rect x="53" y="144" width="14" height="5" rx="2" fill="oklch(0.2 0.04 155)" />

          {/* FLAMES */}
          {(flying || phase === "idle") && (
            <g transform="translate(60, 149)">
              {/* Outer flame */}
              <g className="flame-main">
                <ellipse cx="0" cy="0" rx="12" ry={flying ? 28 : 10} fill="url(#flameOuter)" opacity={flying ? 0.9 : 0.4} />
              </g>
              {/* Inner flame */}
              <g className="flame-inner">
                <ellipse cx="0" cy="0" rx="7" ry={flying ? 20 : 7} fill="url(#flameInnerG)" opacity={flying ? 0.95 : 0.5} />
              </g>
              {/* Tip */}
              <g className="flame-tip">
                <ellipse cx="0" cy="0" rx="3.5" ry={flying ? 12 : 4} fill="url(#flameTipG)" opacity={flying ? 1 : 0.6} />
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

// Space background with animated stars
function SpaceBackground({ phase }: { phase: Phase }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl" style={{ zIndex: 0 }}>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes nebula {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.3; }
          50% { transform: scale(1.05) rotate(2deg); opacity: 0.5; }
        }
        @keyframes shootingStar {
          0% { transform: translateX(0) translateY(0); opacity: 1; }
          100% { transform: translateX(200px) translateY(60px); opacity: 0; }
        }
      `}</style>

      {/* Deep space gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 30% 40%, oklch(0.25 0.08 260 / 0.6) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, oklch(0.2 0.06 300 / 0.4) 0%, transparent 50%), oklch(0.1 0.03 240)",
      }} />

      {/* Nebula glow */}
      <div style={{
        position: "absolute", top: "20%", left: "10%", width: "60%", height: "40%",
        background: "radial-gradient(ellipse, oklch(0.5 0.12 270 / 0.2), transparent 70%)",
        animation: "nebula 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", top: "50%", right: "5%", width: "40%", height: "30%",
        background: "radial-gradient(ellipse, oklch(0.5 0.15 320 / 0.15), transparent 70%)",
        animation: "nebula 10s ease-in-out infinite reverse",
      }} />

      {/* Stars */}
      {Array.from({ length: 60 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 0.5 + Math.random() * 2,
        delay: Math.random() * 5,
        dur: 2 + Math.random() * 4,
      })).map((star, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${star.x}%`,
          top: `${star.y}%`,
          width: star.size,
          height: star.size,
          borderRadius: "50%",
          background: "white",
          animation: `twinkle ${star.dur}s ease-in-out ${star.delay}s infinite`,
        }} />
      ))}

      {/* Shooting stars */}
      {phase === "flying" && (
        <>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: "absolute",
              top: `${15 + i * 20}%`,
              left: `${5 + i * 15}%`,
              width: 2,
              height: 2,
              background: "linear-gradient(to right, white, transparent)",
              borderRadius: "50%",
              animation: `shootingStar ${2 + i}s linear ${i * 1.5}s infinite`,
              boxShadow: "0 0 6px 2px white",
            }} />
          ))}
        </>
      )}

      {/* Ground glow at bottom */}
      {phase === "flying" && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "30%",
          background: "linear-gradient(to top, oklch(0.78 0.25 145 / 0.3), transparent)",
        }} />
      )}
    </div>
  );
}

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

  const reset = () => {
    setPhase("idle");
    setMult(1);
    setMsg("");
  };

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  const multColor = phase === "crashed" ? "oklch(0.65 0.24 25)" : phase === "cashed" ? "oklch(0.78 0.21 145)" : `oklch(${Math.min(0.85, 0.78 + mult * 0.002)} 0.21 145)`;

  return (
    <div>
      <style>{`
        @keyframes multPop {
          0% { transform: scale(1); }
          30% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}</style>

      <PageHeader title="Ракета 🚀" subtitle="Забери куш до краша" />

      {/* Main game area */}
      <div className="glass-strong relative mb-4 overflow-hidden rounded-3xl" style={{ minHeight: 340 }}>
        <SpaceBackground phase={phase} />

        <div className="relative flex flex-col items-center justify-center py-10" style={{ zIndex: 1 }}>
          <RocketSVG phase={phase} />

          {/* Multiplier display */}
          <div className="mt-4">
            <div
              className="font-mono text-6xl font-bold tabular-nums sm:text-7xl"
              style={{
                color: multColor,
                textShadow: `0 0 30px ${multColor}, 0 0 60px ${multColor}66`,
                animation: phase === "flying" ? "multPop 0.1s ease-out" : "none",
              }}
            >
              x{mult.toFixed(2)}
            </div>
          </div>

          {phase === "crashed" && (
            <div className="mt-2 text-sm font-semibold" style={{ color: "oklch(0.65 0.24 25)" }}>
              CRASH @ x{crashAt}
            </div>
          )}
          {phase === "cashed" && (
            <div className="mt-2 text-sm font-semibold" style={{ color: "oklch(0.78 0.21 145)" }}>
              ВЫВЕДЕНО @ x{mult.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="glass mb-4 flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase text-muted-foreground">Ставка</span>
          <input
            type="number" min={1} max={balance} value={bet}
            disabled={phase === "flying"}
            onChange={(e) => setBet(Math.max(1, Number(e.target.value) || 0))}
            className="w-28 rounded-xl bg-input px-3 py-2 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {[10, 50, 100, 500].map((v) => (
          <button key={v} onClick={() => setBet(Math.min(v, balance))} disabled={phase === "flying"}
            className="glass rounded-lg px-3 py-1.5 text-xs hover:bg-primary/10 disabled:opacity-40">{v}</button>
        ))}
        <button onClick={() => setBet(Math.floor(balance / 2))} disabled={phase === "flying"}
          className="glass rounded-lg px-3 py-1.5 text-xs hover:bg-primary/10 disabled:opacity-40">½</button>
        <button onClick={() => setBet(balance)} disabled={phase === "flying"}
          className="glass rounded-lg px-3 py-1.5 text-xs hover:bg-primary/10 disabled:opacity-40">MAX</button>
      </div>

      <div className="flex gap-3">
        {phase === "flying" ? (
          <button onClick={cashout}
            className="btn-primary flex-1 rounded-2xl py-4 text-base font-bold"
            style={{ animation: "winPulse 0.8s ease-in-out infinite" }}>
            🤑 Забрать {Math.floor(bet * mult).toLocaleString()} CR
          </button>
        ) : (phase === "crashed" || phase === "cashed") ? (
          <button onClick={reset} className="btn-primary flex-1 rounded-2xl py-4 text-base">
            🔄 Новая игра
          </button>
        ) : (
          <button onClick={launch} disabled={bet > balance || bet <= 0}
            className="btn-primary flex-1 rounded-2xl py-4 text-base font-bold">
            🚀 Запустить ({bet.toLocaleString()} CR)
          </button>
        )}
      </div>

      {msg && (
        <div className="glass mt-4 rounded-xl p-3 text-center text-sm font-semibold"
          style={{ color: phase === "crashed" ? "oklch(0.65 0.24 25)" : "oklch(0.78 0.21 145)" }}>
          {msg}
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-2 px-1 text-xs uppercase tracking-widest text-muted-foreground">История</h3>
        <div className="flex flex-wrap gap-2">
          {history.length === 0 && <span className="text-xs text-muted-foreground">Пока пусто</span>}
          {history.map((h, i) => (
            <span key={i}
              className="glass rounded-lg px-3 py-1 font-mono text-xs"
              style={{ color: h >= 2 ? "oklch(0.78 0.21 145)" : "oklch(0.7 0.04 155)" }}>
              x{h.toFixed(2)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
