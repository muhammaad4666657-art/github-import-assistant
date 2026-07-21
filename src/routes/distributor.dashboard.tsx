import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  Gem,
  Copy,
  Link as LinkIcon,
  ShoppingBag,
  Coins,
  Wallet,
  Network,
  Camera,
  Check,
  Pencil,
  Users2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  clearDistributorPassword,
  clearDistributorSession,
  getDistributorPassword,
  getDistributorSession,
  updateDistributorSession,
  type DistributorSession,
} from "@/lib/distributor-session";
import { supabase } from "@/integrations/supabase/client";
import { getLocalDistributorStats } from "@/lib/affiliate-local";
import { StatusBadge } from "@/components/site/AffiliateOrders";
import { compressImage } from "@/lib/compress-image";

export const Route = createFileRoute("/distributor/dashboard")({
  head: () => ({ meta: [{ title: "Distributor Dashboard — ALM International" }] }),
  component: DistributorDashboardPage,
});

function DistributorDashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [session, setSession] = useState<DistributorSession | null>(null);
  const [ready, setReady] = useState(false);
  const [productUrl, setProductUrl] = useState("");

  useEffect(() => {
    const s = getDistributorSession();
    if (!s) {
      navigate({ to: "/distributor/login" });
      return;
    }
    setSession(s);
    setReady(true);
  }, [navigate]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const generalLink = session ? `${origin}/?ref=${encodeURIComponent(session.username)}` : "";
  const signupLink = session
    ? `${origin}/distributor/signup?ref=${encodeURIComponent(session.username)}`
    : "";

  const productLink = useMemo(() => {
    if (!session || !productUrl.trim()) return "";
    try {
      const u = new URL(productUrl.trim(), origin || undefined);
      u.searchParams.set("ref", session.username);
      return u.toString();
    } catch {
      return "";
    }
  }, [productUrl, session, origin]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["distributor-stats", session?.username],
    queryFn: async () => {
      const fallback = () => {
        const base = getLocalDistributorStats(session!.username);
        return {
          username: session!.username,
          displayName: null as string | null,
          avatarUrl: null as string | null,
          planName: (base?.planName ?? null) as string | null,
          commissionPercent: base?.commissionPercent ?? 0,
          salesCount: base?.salesCount ?? 0,
          candidateReferrals: base?.candidateReferrals ?? 0,
          totalCommission: base?.totalCommission ?? 0,
          paidAmount: base?.paidAmount ?? 0,
          pendingAmount: base?.pendingAmount ?? 0,
        };
      };

      try {
        const { data, error } = await supabase.rpc("get_distributor_stats", {
          p_username: session!.username,
        });
        const row: any = Array.isArray(data) ? data[0] : null;
        if (error || !row) return fallback();
        // Sync fresh profile bits into session
        updateDistributorSession({
          displayName: row.display_name ?? null,
          avatarUrl: row.avatar_url ?? null,
        });
        return {
          username: row.username,
          displayName: row.display_name ?? null,
          avatarUrl: row.avatar_url ?? null,
          planName: row.plan_name,
          commissionPercent: Number(row.commission_percent) || 0,
          salesCount: Number(row.sales_count) || 0,
          candidateReferrals: Number(row.candidate_referrals) || 0,
          totalCommission: Number(row.total_commission) || 0,
          paidAmount: Number(row.paid_amount) || 0,
          pendingAmount: Number(row.pending_amount) || 0,
        };
      } catch {
        return fallback();
      }
    },
    enabled: !!session,
    staleTime: 15_000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["distributor-orders", session?.username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, subtotal, total, created_at, customer_name, order_items(product_name, product_image, quantity, unit_price)")
        .ilike("referral_code", session!.username)
        .order("created_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    },
    enabled: !!session,
    staleTime: 15_000,
  });

  const { data: team = [] } = useQuery({
    queryKey: ["distributor-team", session?.username],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc("get_distributor_team", {
          p_username: session!.username,
        });
        if (error) return [];
        return (data ?? []) as any[];
      } catch {
        return [];
      }
    },
    enabled: !!session,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel(`dist-orders-${session.username}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["distributor-orders", session.username] });
        qc.invalidateQueries({ queryKey: ["distributor-stats", session.username] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "distributors" }, () => {
        qc.invalidateQueries({ queryKey: ["distributor-team", session.username] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session, qc]);

  const copy = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };

  const logout = () => {
    clearDistributorSession();
    clearDistributorPassword();
    navigate({ to: "/distributor/login" });
  };

  if (!ready || !session) return null;

  const commissionPercent = stats?.commissionPercent ?? 0;
  const displayName = stats?.displayName ?? session.displayName ?? session.username;
  const avatarUrl = stats?.avatarUrl ?? session.avatarUrl ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        {/* Profile / hero */}
        <ProfileHero
          username={session.username}
          displayName={displayName}
          avatarUrl={avatarUrl}
          planName={stats?.planName ?? null}
          commissionPercent={commissionPercent}
          onLogout={logout}
          onUpdated={(p) => {
            updateDistributorSession(p);
            qc.invalidateQueries({ queryKey: ["distributor-stats", session.username] });
          }}
        />

        {/* Metrics */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<ShoppingBag className="size-5" />}
            label="Referred Orders"
            value={isLoading ? "—" : String(orders.length)}
            sub="Total orders via your link"
          />
          <MetricCard
            icon={<Network className="size-5" />}
            label="My Network"
            value={String(team.length)}
            sub="Sub-distributors joined"
          />
          <MetricCard
            icon={<Coins className="size-5" />}
            label="Earned Commission"
            value={isLoading ? "—" : `Rs. ${(stats?.totalCommission ?? 0).toLocaleString()}`}
            sub={`${commissionPercent}% of attributed sales`}
          />
          <MetricCard
            icon={<Wallet className="size-5" />}
            label="Balance"
            value={isLoading ? "—" : `Rs. ${(stats?.pendingAmount ?? 0).toLocaleString()}`}
            sub={stats ? `Paid out: Rs. ${(stats.paidAmount ?? 0).toLocaleString()}` : ""}
          />
        </div>

        {/* Commission summary strip */}
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <SummaryPill
            label="Total Earned"
            value={`Rs. ${(stats?.totalCommission ?? 0).toLocaleString()}`}
            tone="gold"
          />
          <SummaryPill
            label="Paid"
            value={`Rs. ${(stats?.paidAmount ?? 0).toLocaleString()}`}
            tone="emerald"
          />
          <SummaryPill
            label="Pending"
            value={`Rs. ${(stats?.pendingAmount ?? 0).toLocaleString()}`}
            tone="amber"
          />
        </div>

        {/* Referral orders */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl">My Referral Orders</h2>
            <span className="text-xs text-muted-foreground">
              Auto-syncs with admin status updates
            </span>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No orders yet. Share your referral link to start earning.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3">Order</th>
                    <th className="py-2 pr-3">Product</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Commission</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o: any) => {
                    const commission = Math.round(
                      ((Number(o.subtotal) || 0) * commissionPercent) / 100,
                    );
                    const firstItem = o.order_items?.[0];
                    const more = (o.order_items?.length ?? 0) - 1;
                    return (
                      <tr key={o.id} className="border-b border-border/50">
                        <td className="py-3 pr-3 font-mono text-xs">{o.order_number}</td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            {firstItem?.product_image && (
                              <img
                                src={firstItem.product_image}
                                alt=""
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="truncate max-w-[220px]">
                                {firstItem?.product_name ?? "—"}
                              </div>
                              {more > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  +{more} more item{more > 1 ? "s" : ""}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-3 font-medium">
                          Rs. {commission.toLocaleString()}
                        </td>
                        <td className="py-3 pr-3">
                          <StatusBadge status={o.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* My Team / downline */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users2 className="size-5 text-gold" />
              <h2 className="font-serif text-xl">My Team</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {team.length} member{team.length === 1 ? "" : "s"}
            </span>
          </div>
          {team.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No sub-distributors yet. Share your signup link to grow your network.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3">Member</th>
                    <th className="py-2 pr-3">Plan</th>
                    <th className="py-2 pr-3">Sub-team</th>
                    <th className="py-2 pr-3">Orders</th>
                    <th className="py-2 pr-3">Revenue</th>
                    <th className="py-2 pr-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((m: any) => (
                    <tr key={m.username} className="border-b border-border/50">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <Avatar url={m.avatar_url} name={m.display_name || m.username} size={32} />
                          <div>
                            <div className="font-medium">{m.display_name || m.username}</div>
                            <div className="text-xs text-muted-foreground">@{m.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3">{m.plan_name ?? "—"}</td>
                      <td className="py-3 pr-3">{m.sub_team_count ?? 0}</td>
                      <td className="py-3 pr-3">{m.orders_count ?? 0}</td>
                      <td className="py-3 pr-3 font-medium">
                        Rs. {Number(m.revenue ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Link generation */}
        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <LinkCard
            title="Your general referral link"
            desc="Share this link anywhere. Any purchase made through it is credited to you."
            value={generalLink}
            onCopy={() => copy(generalLink, "Referral link")}
          />
          <LinkCard
            title="Grow your team"
            desc="Invite new distributors — they join under you in your network."
            value={signupLink}
            onCopy={() => copy(signupLink, "Signup link")}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LinkIcon className="size-4 text-gold" /> Generate a product link
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Paste any product URL from our store to create an affiliate link.
          </p>
          <input
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder={`${origin}/product/...`}
            className="mt-4 w-full h-11 px-3 rounded-lg bg-secondary text-sm"
          />
          {productLink && (
            <div className="mt-3 flex gap-2">
              <input
                readOnly
                value={productLink}
                className="flex-1 h-11 px-3 rounded-lg bg-secondary text-sm"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                onClick={() => copy(productLink, "Product link")}
                className="h-11 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm inline-flex items-center gap-2"
              >
                <Copy className="size-4" /> Copy
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ProfileHero({
  username,
  displayName,
  avatarUrl,
  planName,
  commissionPercent,
  onLogout,
  onUpdated,
}: {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  planName: string | null;
  commissionPercent: number;
  onLogout: () => void;
  onUpdated: (p: { displayName?: string | null; avatarUrl?: string | null }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName);
  const [avatar, setAvatar] = useState<string | null>(avatarUrl);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(displayName);
    setAvatar(avatarUrl);
  }, [displayName, avatarUrl]);

  const pickAvatar = async (file: File) => {
    try {
      const small = await compressImage(file, { maxDim: 384, quality: 0.82 });
      const reader = new FileReader();
      reader.onload = () => setAvatar(String(reader.result));
      reader.readAsDataURL(small);
    } catch {
      toast.error("Could not read image");
    }
  };

  const save = async () => {
    const pw = getDistributorPassword();
    if (!pw) {
      toast.error("Please sign in again to update your profile");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("update_distributor_profile", {
        p_username: username,
        p_password: pw,
        p_display_name: name.trim(),
        p_avatar_url: avatar ?? "",
      });
      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : null;
      onUpdated({
        displayName: row?.display_name ?? null,
        avatarUrl: row?.avatar_url ?? null,
      });
      toast.success("Profile updated");
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/40 p-6 sm:p-8 shadow-soft">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="relative shrink-0">
          <Avatar url={avatar} name={name || username} size={96} ring />
          {editing && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground border-2 border-card flex items-center justify-center hover:bg-primary/90 transition"
              aria-label="Change photo"
            >
              <Camera className="h-4 w-4" />
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickAvatar(f);
              e.currentTarget.value = "";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-gold text-[10px] uppercase tracking-[0.3em]">
            <Gem className="size-3.5" /> Distributor Portal
          </div>
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="Your display name"
              className="mt-2 w-full max-w-md h-12 px-4 text-2xl font-serif bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          ) : (
            <h1 className="mt-1 text-2xl sm:text-3xl font-serif truncate">{displayName}</h1>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            @{username}
            {planName && (
              <>
                {" · "}
                <span className="text-foreground">{planName}</span>
                {" · "}
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="size-3.5" /> {commissionPercent}% commission
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 sm:self-start">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={saving}
                className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm inline-flex items-center gap-2"
              >
                <Check className="size-4" /> {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(displayName);
                  setAvatar(avatarUrl);
                }}
                className="h-10 px-4 rounded-lg border border-border hover:bg-secondary text-sm"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="h-10 px-4 rounded-lg border border-border hover:bg-secondary text-sm inline-flex items-center gap-2"
              >
                <Pencil className="size-4" /> Edit profile
              </button>
              <button
                onClick={onLogout}
                className="h-10 px-4 rounded-lg border border-border hover:bg-secondary text-sm"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({
  url,
  name,
  size = 40,
  ring = false,
}: {
  url: string | null;
  name: string;
  size?: number;
  ring?: boolean;
}) {
  const initials = (name || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const style = { width: size, height: size } as const;
  const cls = `rounded-full object-cover ${ring ? "ring-4 ring-gold/30 border-2 border-card" : "border border-border"}`;
  if (url) return <img src={url} alt={name} style={style} className={cls} />;
  return (
    <div
      style={style}
      className={`${cls} flex items-center justify-center bg-gradient-to-br from-secondary to-muted text-foreground font-semibold`}
    >
      <span style={{ fontSize: Math.max(12, size / 2.8) }}>{initials}</span>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-md transition">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span className="text-gold">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-serif">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "gold" | "emerald" | "amber";
}) {
  const map = {
    gold: "from-gold/20 to-gold/5 border-gold/30",
    emerald: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/30",
    amber: "from-amber-500/15 to-amber-500/5 border-amber-500/30",
  } as const;
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${map[tone]} px-5 py-4 flex items-center justify-between`}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-serif text-lg">{value}</span>
    </div>
  );
}

function LinkCard({
  title,
  desc,
  value,
  onCopy,
}: {
  title: string;
  desc: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-medium">
        <LinkIcon className="size-4 text-gold" /> {title}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
      <div className="mt-4 flex gap-2">
        <input
          readOnly
          value={value}
          className="flex-1 h-11 px-3 rounded-lg bg-secondary text-sm"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          onClick={onCopy}
          className="h-11 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm inline-flex items-center gap-2"
        >
          <Copy className="size-4" /> Copy
        </button>
      </div>
    </div>
  );
}
