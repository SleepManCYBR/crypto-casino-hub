import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { RequireAuth, PageHeader } from "@/components/RequireAuth";
import { useNftPool, useUserNfts, giveNftToUser, removeOwnedNft } from "@/lib/nft";
import { Sparkles, ArrowRight, Target, Package } from "lucide-react";
import type { NftGift } from "@/lib/supabase";

export const Route = createFileRoute("/upgrader")({ component: () => <RequireAuth><UpgraderPage /></RequireAuth> });

function UpgraderPage() {
  const { user } = useAuth();
  const { pool } = useNftPool();
  const { items, reload } = useUserNfts(user?.username);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ won: boolean; nft?: NftGift } | null>(null);
  const [msg, setMsg] = useState("");

  const selected = useMemo(() => items.find((i) => i.ownerRowId === selectedRow), [items, selectedRow]);
  const target = useMemo(() => pool.find((p) => p.id === targetId), [pool, targetId]);

  // House edge 0.9: chance = selected.price / target.price * 0.9, capped
  const chance = useMemo(() => {
    if (!selected || !target) return 0;
    if (target.price <= selected.price) return 0.95;
    return Math.min(0.95, (selected.price / target.price) * 0.9);
  }, [selected, target]);

  const mult = useMemo(() => {
    if (!selected || !target || selected.price === 0) return 0;
    return +(target.price / selected.price).toFixed(2);
  }, [selected, target]);

  // Only show pool NFTs more expensive than selected (true "upgrade")
  const poolFiltered = useMemo(() => {
    if (!selected) return pool;
    return pool.filter((p) => p.price > selected.price).sort((a, b) => a.price - b.price);
  }, [pool, selected]);

  const upgrade = async () => {
    if (!user || !selected || !target || spinning) return;
    setMsg(""); setResult(null); setSpinning(true);

    const won = Math.random() < chance;
    // Rotate pointer: success stops in green arc, fail in red
    const winArc = chance * 360;
    const landing = won ? Math.random() * winArc : winArc + Math.random() * (360 - winArc);
    const final = 360 * 6 + landing;
    setRotation(final);

    setTimeout(async () => {
      try {
        // try to remove old NFT (may fail if RLS blocks DELETE)
        try {
          await removeOwnedNft(selected.ownerRowId);
        } catch (e: any) {
          console.warn("nft_owners delete blocked by RLS:", e?.message);
        }
        if (won) {
          try { await giveNftToUser(user.username, target.id); } catch (e: any) {
            console.warn("give nft failed:", e?.message);
          }
          setResult({ won: true, nft: target });
          setMsg(`🎉 Успех! Получен: ${target.name}`);
        } else {
          setResult({ won: false });
          setMsg("💥 Не повезло — NFT сгорел");
        }
        setSelectedRow(null);
        setTargetId(null);
        await reload();
      } finally {
        setSpinning(false);
      }
    }, 3200);
  };

  const winArcDeg = chance * 360;

  return (
    <div>
      <PageHeader title="NFT Upgrader ✨" subtitle="Выбери свой NFT и цель — прокачай в более дорогой" />

      <style>{`
        @keyframes ringPulse {
          0%, 100% { filter: drop-shadow(0 0 8px var(--primary)); }
          50% { filter: drop-shadow(0 0 20px var(--primary)); }
        }
        .ring-pulse { animation: ringPulse 2s ease-in-out infinite; }
      `}</style>

      {/* Main arena */}
      <div className="glass-strong rounded-3xl p-6">
        <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          {/* Your NFT */}
          <div className="glass rounded-2xl p-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-1 text-xs uppercase text-muted-foreground">
              <Package className="h-3 w-3" /> Твой NFT
            </div>
            {selected ? (
              <>
                <img src={selected.image_url} alt={selected.name} className="mx-auto h-28 w-28 rounded-xl object-cover ring-2 ring-primary/60" />
                <div className="mt-2 truncate text-sm font-semibold">{selected.name}</div>
                <div className="font-mono text-xs text-primary">{selected.price} CR</div>
              </>
            ) : (
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                ↓ Выбери снизу
              </div>
            )}
          </div>

          {/* Wheel */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative h-36 w-36">
              {/* Chance ring */}
              <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90 ring-pulse">
                <circle cx="60" cy="60" r="54" fill="none" stroke="oklch(0.3 0.05 155 / 0.5)" strokeWidth="10" />
                {chance > 0 && (
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke="var(--primary)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(winArcDeg / 360) * 339.29} 339.29`}
                  />
                )}
              </svg>
              {/* Pointer */}
              <div
                className="absolute left-1/2 top-0 h-1/2 w-0.5 origin-bottom"
                style={{
                  transform: `translateX(-50%) rotate(${rotation}deg)`,
                  transition: spinning ? "transform 3s cubic-bezier(0.2, 0.85, 0.25, 1)" : "none",
                }}
              >
                <div className="mx-auto h-3 w-3 -translate-y-1 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
              </div>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-mono text-2xl font-bold text-primary glow-text">
                  {(chance * 100).toFixed(1)}%
                </div>
                {mult > 0 && (
                  <div className="font-mono text-[10px] text-muted-foreground">x{mult}</div>
                )}
              </div>
            </div>
          </div>

          {/* Target NFT */}
          <div className="glass rounded-2xl p-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-1 text-xs uppercase text-muted-foreground">
              <Target className="h-3 w-3" /> Цель
            </div>
            {result?.nft ? (
              <>
                <img src={result.nft.image_url} alt={result.nft.name} className="mx-auto h-28 w-28 rounded-xl object-cover ring-2 ring-primary" />
                <div className="mt-2 truncate text-sm font-semibold">{result.nft.name}</div>
                <div className="font-mono text-xs text-primary">{result.nft.price} CR</div>
              </>
            ) : target ? (
              <>
                <img src={target.image_url} alt={target.name} className="mx-auto h-28 w-28 rounded-xl object-cover ring-2 ring-primary/40" />
                <div className="mt-2 truncate text-sm font-semibold">{target.name}</div>
                <div className="font-mono text-xs text-primary">{target.price} CR</div>
              </>
            ) : (
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                ↓ Выбери справа
              </div>
            )}
          </div>
        </div>

        <button
          onClick={upgrade}
          disabled={!selected || !target || spinning}
          className="btn-primary mt-6 w-full rounded-xl py-3 text-sm"
        >
          <Sparkles className="mr-1 inline h-4 w-4" />
          {spinning ? "Прокачиваем..." : !selected ? "Выбери свой NFT" : !target ? "Выбери целевой NFT" : `Апгрейд → ${target.name}`}
        </button>

        {msg && (
          <div className={`mt-3 rounded-lg px-3 py-2 text-center text-sm ${
            result?.won ? "bg-primary/15 text-primary" : result && !result.won ? "bg-destructive/15 text-destructive" : "bg-secondary/40"
          }`}>{msg}</div>
        )}
      </div>

      {/* Two-panel selection */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* MY NFTs */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Мои NFT ({items.length})</h3>
            <div className="text-[10px] text-muted-foreground">кликни чтобы выбрать</div>
          </div>
          {items.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
              Пусто. Открой кейсы, чтобы получить NFT
            </div>
          ) : (
            <div className="grid max-h-[520px] grid-cols-3 gap-2 overflow-y-auto rounded-2xl pr-1">
              {items.map((n) => (
                <button
                  key={n.ownerRowId}
                  onClick={() => setSelectedRow(n.ownerRowId)}
                  className={`glass rounded-xl p-2 text-center transition hover:scale-[1.04] ${
                    selectedRow === n.ownerRowId ? "ring-2 ring-primary shadow-[var(--shadow-glow)]" : ""
                  }`}
                >
                  <img src={n.image_url} alt={n.name} className="mx-auto h-14 w-14 rounded-lg object-cover" loading="lazy" />
                  <div className="mt-1 truncate text-[11px]">{n.name}</div>
                  <div className="font-mono text-[10px] text-primary">{n.price} CR</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* POOL NFTs */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
              Цель апгрейда {selected && `(${poolFiltered.length})`}
            </h3>
            <div className="text-[10px] text-muted-foreground">
              {selected ? "дороже твоего" : "сначала выбери свой"}
            </div>
          </div>
          {!selected ? (
            <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
              ← Сначала выбери свой NFT
            </div>
          ) : poolFiltered.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
              Нет NFT дороже твоего 🎉
            </div>
          ) : (
            <div className="grid max-h-[520px] grid-cols-3 gap-2 overflow-y-auto rounded-2xl pr-1">
              {poolFiltered.map((n) => {
                const m = +(n.price / selected.price).toFixed(2);
                return (
                  <button
                    key={n.id}
                    onClick={() => setTargetId(n.id)}
                    className={`glass rounded-xl p-2 text-center transition hover:scale-[1.04] ${
                      targetId === n.id ? "ring-2 ring-primary shadow-[var(--shadow-glow)]" : ""
                    }`}
                  >
                    <img src={n.image_url} alt={n.name} className="mx-auto h-14 w-14 rounded-lg object-cover" loading="lazy" />
                    <div className="mt-1 truncate text-[11px]">{n.name}</div>
                    <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                      <span className="text-primary">{n.price}</span>
                      <span className="text-muted-foreground">· x{m}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
