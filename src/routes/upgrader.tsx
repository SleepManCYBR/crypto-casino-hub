import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { RequireAuth, PageHeader } from "@/components/RequireAuth";
import { useNftPool, useUserNfts, giveNftToUser, removeOwnedNft } from "@/lib/nft";
import { Sparkles, ArrowRight } from "lucide-react";
import type { NftGift } from "@/lib/supabase";

export const Route = createFileRoute("/upgrader")({ component: () => <RequireAuth><UpgraderPage /></RequireAuth> });

function UpgraderPage() {
  const { user } = useAuth();
  const { pool } = useNftPool();
  const { items, reload } = useUserNfts(user?.username);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [targetMult, setTargetMult] = useState(2);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ won: boolean; nft?: NftGift } | null>(null);
  const [msg, setMsg] = useState("");

  const selected = useMemo(() => items.find((i) => i.ownerRowId === selectedRow), [items, selectedRow]);
  // chance ~ 0.92 / multiplier (house edge)
  const chance = +(0.92 / targetMult).toFixed(3);
  const targetPrice = selected ? Math.floor(selected.price * targetMult) : 0;
  const candidates = useMemo(
    () => pool.filter((p) => p.price >= targetPrice * 0.8 && p.price <= targetPrice * 1.4),
    [pool, targetPrice]
  );

  const upgrade = async () => {
    if (!user || !selected || spinning) return;
    if (candidates.length === 0) { setMsg("Нет подходящих NFT в пуле"); return; }
    setMsg(""); setResult(null); setSpinning(true);

    setTimeout(async () => {
      const won = Math.random() < chance;
      try {
        // remove old
        await removeOwnedNft(selected.ownerRowId);
        if (won) {
          const newNft = candidates[Math.floor(Math.random() * candidates.length)];
          await giveNftToUser(user.username, newNft.id);
          setResult({ won: true, nft: newNft });
          setMsg(`🎉 Апгрейд успешен: ${newNft.name}`);
        } else {
          setResult({ won: false });
          setMsg("💥 Не повезло — NFT сгорел");
        }
        setSelectedRow(null);
        await reload();
      } catch (e: any) { setMsg(e.message); }
      finally { setSpinning(false); }
    }, 2200);
  };

  return (
    <div>
      <PageHeader title="NFT Upgrader ✨" subtitle="Прокачай NFT в более дорогой — но рискни" />

      <div className="glass-strong rounded-3xl p-6">
        <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div className="glass rounded-2xl p-4 text-center">
            <div className="mb-2 text-xs uppercase text-muted-foreground">Твой NFT</div>
            {selected ? (
              <>
                <img src={selected.image_url} alt={selected.name} className="mx-auto h-24 w-24 rounded-xl object-cover ring-2 ring-primary/40" />
                <div className="mt-2 text-sm font-semibold">{selected.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{selected.price} CR</div>
              </>
            ) : (
              <div className="py-6 text-sm text-muted-foreground">Выбери NFT из инвентаря ниже</div>
            )}
          </div>

          <div className="flex items-center justify-center">
            <div className={`relative h-24 w-24 rounded-full border-4 ${spinning ? "animate-spin border-primary border-t-transparent" : "border-border"}`}>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-lg font-bold text-primary">
                {(chance * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-4 text-center">
            <div className="mb-2 text-xs uppercase text-muted-foreground">Цель ≈ {targetPrice} CR</div>
            {result?.nft ? (
              <>
                <img src={result.nft.image_url} alt={result.nft.name} className="mx-auto h-24 w-24 rounded-xl object-cover ring-2 ring-primary" />
                <div className="mt-2 text-sm font-semibold">{result.nft.name}</div>
              </>
            ) : (
              <div className="py-6 text-xs text-muted-foreground">{candidates.length} вариантов</div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Множитель: <span className="font-mono text-primary">x{targetMult}</span></span>
            <span className="text-muted-foreground">Шанс: <span className="font-mono text-primary">{(chance * 100).toFixed(1)}%</span></span>
          </div>
          <input type="range" min={1.5} max={10} step={0.5} value={targetMult}
            onChange={(e) => setTargetMult(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
        </div>

        <button onClick={upgrade} disabled={!selected || spinning || candidates.length === 0}
          className="btn-primary mt-5 w-full rounded-xl py-3 text-sm">
          <Sparkles className="mr-1 inline h-4 w-4" /> {spinning ? "Прокачиваем..." : "Прокачать"}
        </button>

        {msg && <div className="mt-3 rounded-lg bg-secondary/40 px-3 py-2 text-center text-sm">{msg}</div>}
      </div>

      <div className="mt-6">
        <h3 className="mb-3 px-1 text-xs uppercase tracking-widest text-muted-foreground">Твой инвентарь</h3>
        {items.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">Пусто. Открой кейсы, чтобы получить NFT</div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {items.map((n) => (
              <button key={n.ownerRowId} onClick={() => setSelectedRow(n.ownerRowId)}
                className={`glass rounded-2xl p-2 text-center transition hover:scale-[1.04] ${
                  selectedRow === n.ownerRowId ? "ring-2 ring-primary" : ""
                }`}>
                <img src={n.image_url} alt={n.name} className="mx-auto h-16 w-16 rounded-lg object-cover" loading="lazy" />
                <div className="mt-1 truncate text-xs">{n.name}</div>
                <div className="font-mono text-[10px] text-primary">{n.price} CR</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
