import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { RequireAuth, PageHeader } from "@/components/RequireAuth";
import { supabase, DbUser } from "@/lib/supabase";
import { useState, useEffect, useCallback } from "react";
import {
  Shield, Users, Megaphone, Plus, Trash2, Edit3, Save, X,
  Crown, User, AlertTriangle, CheckCircle, Ban, Search, RefreshCw, Image
} from "lucide-react";

export const Route = createFileRoute("/admin")({ component: () => <RequireAuth><AdminGuard /></RequireAuth> });

// Only allow admin and mayor
function AdminGuard() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role !== "admin" && user.role !== "mayor") {
    return (
      <div className="glass-strong rounded-3xl p-10 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <div className="text-2xl font-bold mb-2">Доступ запрещён</div>
        <div className="text-muted-foreground">У тебя нет прав администратора</div>
      </div>
    );
  }
  return <AdminPanel />;
}

type Banner = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  active: boolean;
  bg_color: string;
  created_at: string;
};

type AdminTab = "users" | "banners" | "promotions";

function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>("users");

  const isMayor = user?.role === "mayor";

  return (
    <div>
      <style>{`
        @keyframes adminSlide {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes adminGlow {
          0%, 100% { box-shadow: 0 0 20px oklch(0.78 0.25 145 / 0.3); }
          50% { box-shadow: 0 0 40px oklch(0.85 0.28 145 / 0.5); }
        }
        .admin-animate { animation: adminSlide 0.3s ease-out; }
      `}</style>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(135deg, oklch(0.82 0.22 150), oklch(0.68 0.2 160))", animation: "adminGlow 3s ease-in-out infinite" }}>
          <Shield className="h-5 w-5" style={{ color: "oklch(0.12 0.04 155)" }} />
        </div>
        <div>
          <div className="text-xl font-bold">Панель администратора</div>
          <div className="text-xs text-muted-foreground">
            {user?.role === "mayor" ? "👑 Мэр" : "🛡️ Администратор"} · {user?.username}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass mb-4 flex rounded-2xl p-1 gap-1">
        {([
          { key: "users" as const, label: "👥 Пользователи", icon: Users },
          { key: "banners" as const, label: "🖼 Баннеры", icon: Megaphone },
          { key: "promotions" as const, label: "🎁 Акции", icon: Megaphone },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-medium transition-all"
            style={{
              background: tab === t.key
                ? "linear-gradient(135deg, oklch(0.82 0.22 150), oklch(0.68 0.2 160))"
                : "transparent",
              color: tab === t.key ? "oklch(0.12 0.04 155)" : "oklch(0.7 0.04 155)",
              boxShadow: tab === t.key ? "0 2px 10px oklch(0.78 0.25 145 / 0.3)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-animate" key={tab}>
        {tab === "users" && <UsersTab isMayor={isMayor} currentUser={user!} />}
        {tab === "banners" && <BannersTab />}
        {tab === "promotions" && <PromotionsTab />}
      </div>
    </div>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────

function UsersTab({ isMayor, currentUser }: { isMayor: boolean; currentUser: DbUser }) {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [editNick, setEditNick] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").order("id");
    setUsers((data as DbUser[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const grantAdmin = async (username: string) => {
    const { error } = await supabase
      .from("users")
      .update({ role: "admin" })
      .eq("username", username);
    if (error) { setMsg("Ошибка: " + error.message); return; }
    setMsg(`✅ Роль admin выдана @${username}`);
    load();
  };

  const revokeAdmin = async (username: string) => {
    const { error } = await supabase
      .from("users")
      .update({ role: "player" })
      .eq("username", username);
    if (error) { setMsg("Ошибка: " + error.message); return; }
    setMsg(`✅ Роль admin снята с @${username}`);
    load();
  };

  const toggleBan = async (u: DbUser) => {
    const { error } = await supabase
      .from("users")
      .update({ is_banned: !u.is_banned })
      .eq("id", u.id);
    if (error) { setMsg("Ошибка: " + error.message); return; }
    setMsg(`✅ ${u.is_banned ? "Разбанен" : "Забанен"}: @${u.username}`);
    load();
  };

  const grantByNick = async () => {
    if (!editNick.trim()) return;
    await grantAdmin(editNick.trim());
    setEditNick("");
  };

  return (
    <div>
      {/* Quick grant by nick */}
      {isMayor && (
        <div className="glass mb-4 rounded-2xl p-4">
          <div className="mb-2 text-sm font-semibold flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" /> Выдать права администратора по нику
          </div>
          <div className="flex gap-2">
            <input
              value={editNick}
              onChange={e => setEditNick(e.target.value)}
              placeholder="Никнейм пользователя"
              className="flex-1 rounded-xl bg-input px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={grantByNick}
              className="btn-primary rounded-xl px-5 py-2.5 text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" /> Выдать
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="glass mb-4 flex items-center gap-3 rounded-2xl px-4 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по нику..."
          className="flex-1 bg-transparent text-sm outline-none"
        />
        <button onClick={load} className="text-muted-foreground hover:text-foreground transition">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {msg && (
        <div className="mb-3 rounded-xl px-4 py-2.5 text-sm font-medium"
          style={{ background: "oklch(0.22 0.05 155 / 0.8)", border: "1px solid oklch(0.78 0.21 145 / 0.3)", color: "oklch(0.85 0.22 145)" }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center text-muted-foreground">Загрузка...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <UserRow
              key={u.id}
              u={u}
              isMayor={isMayor}
              isCurrentUser={u.id === currentUser.id}
              onGrantAdmin={() => grantAdmin(u.username)}
              onRevokeAdmin={() => revokeAdmin(u.username)}
              onToggleBan={() => toggleBan(u)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="glass rounded-2xl p-6 text-center text-muted-foreground text-sm">
              Пользователи не найдены
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UserRow({ u, isMayor, isCurrentUser, onGrantAdmin, onRevokeAdmin, onToggleBan }: {
  u: DbUser;
  isMayor: boolean;
  isCurrentUser: boolean;
  onGrantAdmin: () => void;
  onRevokeAdmin: () => void;
  onToggleBan: () => void;
}) {
  const roleColor =
    u.role === "mayor" ? "oklch(0.82 0.22 75)" :
    u.role === "admin" ? "oklch(0.78 0.21 145)" :
    "oklch(0.6 0.04 155)";

  const roleIcon =
    u.role === "mayor" ? "👑" :
    u.role === "admin" ? "🛡️" :
    "🎮";

  return (
    <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ border: u.is_banned ? "1px solid oklch(0.65 0.24 25 / 0.3)" : "1px solid oklch(0.4 0.06 150 / 0.25)" }}>

      {/* Avatar */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl font-bold text-sm"
        style={{ background: `${roleColor}22`, color: roleColor }}>
        {u.username[0]?.toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold truncate">{u.username}</span>
          {isCurrentUser && <span className="text-xs text-muted-foreground">(ты)</span>}
        </div>
        <div className="text-xs flex items-center gap-2 mt-0.5">
          <span style={{ color: roleColor }}>{roleIcon} {u.role}</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-mono text-muted-foreground">{(u.balance ?? 0).toLocaleString()} CR</span>
          {u.is_banned && <span className="text-destructive font-medium">🚫 забанен</span>}
        </div>
      </div>

      {/* Actions */}
      {!isCurrentUser && isMayor && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {u.role === "player" && (
            <button onClick={onGrantAdmin} title="Выдать admin"
              className="glass rounded-lg p-1.5 hover:bg-primary/20 transition">
              <Shield className="h-3.5 w-3.5 text-primary" />
            </button>
          )}
          {u.role === "admin" && (
            <button onClick={onRevokeAdmin} title="Снять admin"
              className="glass rounded-lg p-1.5 hover:bg-warning/20 transition">
              <User className="h-3.5 w-3.5" style={{ color: "oklch(0.82 0.18 75)" }} />
            </button>
          )}
          <button onClick={onToggleBan} title={u.is_banned ? "Разбанить" : "Забанить"}
            className="glass rounded-lg p-1.5 hover:bg-destructive/20 transition">
            {u.is_banned
              ? <CheckCircle className="h-3.5 w-3.5 text-primary" />
              : <Ban className="h-3.5 w-3.5 text-destructive" />
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ─── BANNERS TAB ──────────────────────────────────────────────────────────────

const EMPTY_BANNER = (): Omit<Banner, "id" | "created_at"> => ({
  title: "",
  description: "",
  image_url: "",
  link_url: "",
  active: true,
  bg_color: "oklch(0.28 0.06 155 / 0.85)",
});

function BannersTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_BANNER());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("banners").select("*").order("created_at", { ascending: false });
    setBanners((data as Banner[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title) { setMsg("Введите заголовок"); return; }
    setSaving(true);
    const { error } = await supabase.from("banners").insert([form]);
    setSaving(false);
    if (error) { setMsg("Ошибка: " + error.message); return; }
    setMsg("✅ Баннер добавлен");
    setCreating(false);
    setForm(EMPTY_BANNER());
    load();
  };

  const toggleActive = async (b: Banner) => {
    await supabase.from("banners").update({ active: !b.active }).eq("id", b.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("banners").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Image className="h-4 w-4 text-primary" /> Баннеры на главной
        </div>
        <button onClick={() => setCreating(v => !v)}
          className="btn-primary rounded-xl px-4 py-2 text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Добавить
        </button>
      </div>

      {msg && (
        <div className="mb-3 rounded-xl px-4 py-2.5 text-sm font-medium"
          style={{ background: "oklch(0.22 0.05 155 / 0.8)", border: "1px solid oklch(0.78 0.21 145 / 0.3)", color: "oklch(0.85 0.22 145)" }}>
          {msg}
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div className="glass mb-4 rounded-2xl p-4 space-y-3"
          style={{ border: "1px solid oklch(0.78 0.21 145 / 0.3)" }}>
          <div className="font-semibold text-sm">Новый баннер</div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Заголовок *" className="w-full rounded-xl bg-input px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Описание" rows={2}
            className="w-full rounded-xl bg-input px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
          <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
            placeholder="URL картинки" className="w-full rounded-xl bg-input px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
            placeholder="URL ссылки (необязательно)" className="w-full rounded-xl bg-input px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground">Цвет фона:</label>
            <input type="color" className="h-8 w-16 rounded-lg cursor-pointer"
              onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="rounded" />
            <label htmlFor="active" className="text-sm">Активен</label>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="btn-primary rounded-xl px-5 py-2.5 text-sm flex items-center gap-2 flex-1">
              <Save className="h-4 w-4" /> {saving ? "Сохраняю..." : "Сохранить"}
            </button>
            <button onClick={() => setCreating(false)}
              className="glass rounded-xl px-4 py-2.5 text-sm">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center text-muted-foreground">Загрузка...</div>
      ) : banners.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
          <div className="text-4xl mb-3">🖼</div>
          <div>Нет баннеров. Добавьте первый!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className="glass rounded-2xl overflow-hidden"
              style={{ border: b.active ? "1px solid oklch(0.78 0.21 145 / 0.3)" : "1px solid oklch(0.4 0.06 150 / 0.2)", opacity: b.active ? 1 : 0.6 }}>
              <div className="flex items-start gap-3 p-4">
                {b.image_url && (
                  <img src={b.image_url} alt="" className="h-16 w-24 rounded-xl object-cover flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{b.title}</div>
                  {b.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{b.description}</div>}
                  {b.link_url && <div className="text-xs text-primary mt-1 truncate">{b.link_url}</div>}
                  <div className="text-xs text-muted-foreground mt-1">
                    {b.active ? "🟢 Активен" : "⚫ Неактивен"}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleActive(b)}
                    className="glass rounded-lg p-1.5 hover:bg-primary/20 transition"
                    title={b.active ? "Деактивировать" : "Активировать"}>
                    {b.active
                      ? <X className="h-3.5 w-3.5 text-muted-foreground" />
                      : <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    }
                  </button>
                  <button onClick={() => remove(b.id)}
                    className="glass rounded-lg p-1.5 hover:bg-destructive/20 transition">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROMOTIONS TAB ───────────────────────────────────────────────────────────

type Promo = {
  id: string;
  title: string;
  description: string;
  bonus_cr: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

const EMPTY_PROMO = (): Omit<Promo, "id" | "created_at"> => ({
  title: "",
  description: "",
  bonus_cr: 0,
  active: true,
  expires_at: null,
});

function PromotionsTab() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_PROMO());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
    setPromos((data as Promo[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title) { setMsg("Введите заголовок"); return; }
    setSaving(true);
    const { error } = await supabase.from("promotions").insert([form]);
    setSaving(false);
    if (error) { setMsg("Ошибка: " + error.message); return; }
    setMsg("✅ Акция добавлена");
    setCreating(false);
    setForm(EMPTY_PROMO());
    load();
  };

  const toggleActive = async (p: Promo) => {
    await supabase.from("promotions").update({ active: !p.active }).eq("id", p.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("promotions").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" /> Акции и бонусы
        </div>
        <button onClick={() => setCreating(v => !v)}
          className="btn-primary rounded-xl px-4 py-2 text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Добавить
        </button>
      </div>

      {msg && (
        <div className="mb-3 rounded-xl px-4 py-2.5 text-sm font-medium"
          style={{ background: "oklch(0.22 0.05 155 / 0.8)", border: "1px solid oklch(0.78 0.21 145 / 0.3)", color: "oklch(0.85 0.22 145)" }}>
          {msg}
        </div>
      )}

      {creating && (
        <div className="glass mb-4 rounded-2xl p-4 space-y-3"
          style={{ border: "1px solid oklch(0.78 0.21 145 / 0.3)" }}>
          <div className="font-semibold text-sm">Новая акция</div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Заголовок *" className="w-full rounded-xl bg-input px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Описание" rows={3}
            className="w-full rounded-xl bg-input px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Бонус (CR)</label>
              <input type="number" min={0} value={form.bonus_cr}
                onChange={e => setForm(f => ({ ...f, bonus_cr: Number(e.target.value) }))}
                className="w-full rounded-xl bg-input px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Дата окончания</label>
              <input type="datetime-local"
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value || null }))}
                className="w-full rounded-xl bg-input px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="promo-active" checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
            <label htmlFor="promo-active" className="text-sm">Активна</label>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="btn-primary rounded-xl px-5 py-2.5 text-sm flex items-center gap-2 flex-1">
              <Save className="h-4 w-4" /> {saving ? "Сохраняю..." : "Сохранить"}
            </button>
            <button onClick={() => setCreating(false)} className="glass rounded-xl px-4 py-2.5 text-sm">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center text-muted-foreground">Загрузка...</div>
      ) : promos.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
          <div className="text-4xl mb-3">🎁</div>
          <div>Нет акций. Добавьте первую!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map(p => (
            <div key={p.id} className="glass rounded-2xl p-4"
              style={{ border: p.active ? "1px solid oklch(0.78 0.21 145 / 0.3)" : "1px solid oklch(0.4 0.06 150 / 0.2)", opacity: p.active ? 1 : 0.6 }}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{p.title}</div>
                  {p.description && <div className="text-xs text-muted-foreground mt-1">{p.description}</div>}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {p.bonus_cr > 0 && (
                      <span className="text-xs font-mono font-bold" style={{ color: "oklch(0.78 0.21 145)" }}>
                        +{p.bonus_cr.toLocaleString()} CR
                      </span>
                    )}
                    {p.expires_at && (
                      <span className="text-xs text-muted-foreground">
                        до {new Date(p.expires_at).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                    <span className="text-xs">{p.active ? "🟢 Активна" : "⚫ Неактивна"}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleActive(p)}
                    className="glass rounded-lg p-1.5 hover:bg-primary/20 transition">
                    {p.active
                      ? <X className="h-3.5 w-3.5 text-muted-foreground" />
                      : <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    }
                  </button>
                  <button onClick={() => remove(p.id)}
                    className="glass rounded-lg p-1.5 hover:bg-destructive/20 transition">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
