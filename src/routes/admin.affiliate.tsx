import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Share2, ChevronDown, ChevronRight, Users, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StatusBadge } from "@/components/site/AffiliateOrders";
import {
  addLocalDistributor,
  addLocalDistributorPlan,
  deleteLocalDistributor,
  deleteLocalDistributorPlan,
  getLocalDistributorPlans,
  getLocalDistributors,
  setLocalDistributorPlans,
  setLocalDistributors,
  updateLocalDistributor,
  updateLocalDistributorPlan,
  type LocalDistributor,
  type LocalDistributorPlan,
} from "@/lib/affiliate-local";

export const Route = createFileRoute("/admin/affiliate")({
  head: () => ({ meta: [{ title: "Affiliate System — Admin" }] }),
  component: AdminAffiliate,
});

type Plan = LocalDistributorPlan;

type Distributor = LocalDistributor & {
  referred_by?: string | null;
  distributor_plans?: { name: string; commission_percent?: number } | null;
};

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  total: number;
  created_at: string;
  referral_code: string | null;
  customer_name: string | null;
  order_items: Array<{
    product_name: string;
    product_image: string | null;
    quantity: number;
    unit_price: number;
  }>;
};

function AdminAffiliate() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [newPlan, setNewPlan] = useState({ name: "", price: "", commission_percent: "" });
  const [newDist, setNewDist] = useState({ username: "", password: "", plan_id: "", referred_by: "" });

  const load = async () => {
    setLoading(true);
    setPlans(getLocalDistributorPlans());
    setDistributors(getLocalDistributors());
    try {
      const [{ data: p }, { data: d }, { data: o }] = await Promise.all([
        supabase.from("distributor_plans").select("*").order("created_at", { ascending: true }),
        supabase
          .from("distributors")
          .select("*, distributor_plans(name, commission_percent)")
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id, order_number, status, subtotal, total, created_at, referral_code, customer_name, order_items(product_name, product_image, quantity, unit_price)")
          .not("referral_code", "is", null)
          .order("created_at", { ascending: false }),
      ]);
      const remotePlans = ((p as Plan[]) ?? []).map(({ id, name, price, commission_percent }) => ({
        id,
        name,
        price: Number(price) || 0,
        commission_percent: Number(commission_percent) || 0,
      }));
      const remoteDistributors = ((d as Distributor[]) ?? []).map((item) => ({
        ...item,
        candidate_referrals: Number(item.candidate_referrals) || 0,
        paid_amount: Number(item.paid_amount) || 0,
        pending_amount: Number(item.pending_amount) || 0,
      }));
      setPlans(remotePlans);
      setDistributors(remoteDistributors);
      setOrders((o as OrderRow[]) ?? []);
      setLocalDistributorPlans(remotePlans);
      setLocalDistributors(remoteDistributors);
    } catch {
      // keep local fallback
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-affiliate-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "distributors" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group orders and downlines per distributor username (case-insensitive)
  const { ordersByUser, downlinesByUser } = useMemo(() => {
    const ordersByUser: Record<string, OrderRow[]> = {};
    for (const o of orders) {
      const key = (o.referral_code || "").trim().toLowerCase();
      if (!key) continue;
      (ordersByUser[key] ||= []).push(o);
    }
    const downlinesByUser: Record<string, number> = {};
    for (const d of distributors) {
      const parent = (d.referred_by || "").trim().toLowerCase();
      if (!parent) continue;
      downlinesByUser[parent] = (downlinesByUser[parent] || 0) + 1;
    }
    return { ordersByUser, downlinesByUser };
  }, [orders, distributors]);

  // PLAN actions
  const addPlan = async () => {
    if (!newPlan.name.trim()) return toast.error("Plan name is required");
    const localPlan = addLocalDistributorPlan({
      name: newPlan.name.trim(),
      price: Number(newPlan.price) || 0,
      commission_percent: Number(newPlan.commission_percent) || 0,
    });
    setPlans((prev) => [...prev, localPlan]);
    try {
      const { error } = await supabase.from("distributor_plans").insert({
        name: localPlan.name,
        price: localPlan.price,
        commission_percent: localPlan.commission_percent,
      });
      if (!error) load();
    } catch {}
    toast.success("Plan added");
    setNewPlan({ name: "", price: "", commission_percent: "" });
  };

  const savePlan = async (plan: Plan) => {
    updateLocalDistributorPlan(plan);
    try {
      const { error } = await supabase
        .from("distributor_plans")
        .update({
          name: plan.name,
          price: Number(plan.price) || 0,
          commission_percent: Number(plan.commission_percent) || 0,
        })
        .eq("id", plan.id);
      if (!error) load();
    } catch {}
    toast.success("Plan updated");
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Delete this plan? Distributors using it will be unassigned.")) return;
    deleteLocalDistributorPlan(id);
    setPlans(getLocalDistributorPlans());
    setDistributors(getLocalDistributors());
    try {
      const { error } = await supabase.from("distributor_plans").delete().eq("id", id);
      if (!error) load();
    } catch {}
    toast.success("Plan deleted");
  };

  // DISTRIBUTOR actions
  const addDistributor = async () => {
    if (!newDist.username.trim() || !newDist.password.trim())
      return toast.error("Username and password required");
    const localDistributor = addLocalDistributor({
      username: newDist.username.trim(),
      password: newDist.password,
      plan_id: newDist.plan_id || null,
    });
    setDistributors((prev) => [localDistributor, ...prev]);
    try {
      const { error } = await supabase.from("distributors").insert({
        username: localDistributor.username,
        password: localDistributor.password,
        plan_id: localDistributor.plan_id,
        referred_by: newDist.referred_by.trim() || null,
      });
      if (!error) load();
    } catch {}
    toast.success("Distributor registered");
    setNewDist({ username: "", password: "", plan_id: "", referred_by: "" });
  };

  const saveDistributor = async (d: Distributor) => {
    updateLocalDistributor({
      id: d.id,
      username: d.username,
      password: d.password,
      plan_id: d.plan_id || null,
      candidate_referrals: Number(d.candidate_referrals) || 0,
      paid_amount: Number(d.paid_amount) || 0,
      pending_amount: Number(d.pending_amount) || 0,
    });
    try {
      const { error } = await supabase
        .from("distributors")
        .update({
          candidate_referrals: Number(d.candidate_referrals) || 0,
          paid_amount: Number(d.paid_amount) || 0,
          pending_amount: Number(d.pending_amount) || 0,
          plan_id: d.plan_id || null,
          referred_by: d.referred_by || null,
        })
        .eq("id", d.id);
      if (!error) load();
    } catch {}
    toast.success("Distributor updated");
  };

  const deleteDistributor = async (id: string) => {
    if (!confirm("Delete this distributor?")) return;
    deleteLocalDistributor(id);
    setDistributors(getLocalDistributors());
    try {
      const { error } = await supabase.from("distributors").delete().eq("id", id);
      if (!error) load();
    } catch {}
    toast.success("Distributor removed");
  };

  const updateDistLocal = (id: string, patch: Partial<Distributor>) => {
    setDistributors((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const updatePlanLocal = (id: string, patch: Partial<Plan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <Share2 className="h-3.5 w-3.5" /> Affiliate System
        </div>
        <h1 className="font-serif text-3xl mt-2">Distributors & Plans</h1>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <>
          {/* PLANS */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-serif text-xl mb-4">Distributor Plans</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3">Plan Name</th>
                    <th className="py-2 pr-3">Price (Rs.)</th>
                    <th className="py-2 pr-3">Commission %</th>
                    <th className="py-2 pr-3 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-2 pr-3">
                        <input
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={p.name}
                          onChange={(e) => updatePlanLocal(p.id, { name: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          className="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm"
                          value={p.price}
                          onChange={(e) => updatePlanLocal(p.id, { price: Number(e.target.value) })}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          className="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm"
                          value={p.commission_percent}
                          onChange={(e) =>
                            updatePlanLocal(p.id, { commission_percent: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td className="py-2 pr-3 flex gap-2">
                        <button
                          onClick={() => savePlan(p)}
                          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs inline-flex items-center gap-1 hover:bg-primary/90"
                        >
                          <Save className="h-3 w-3" /> Save
                        </button>
                        <button
                          onClick={() => deletePlan(p.id)}
                          className="h-8 px-2 rounded-md border border-border text-xs hover:bg-secondary"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {plans.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground text-sm">
                        No plans yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Add new plan
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  placeholder="Plan name (e.g. Silver)"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Price"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Commission %"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={newPlan.commission_percent}
                  onChange={(e) => setNewPlan({ ...newPlan, commission_percent: e.target.value })}
                />
                <button
                  onClick={addPlan}
                  className="h-10 rounded-md bg-primary text-primary-foreground text-sm inline-flex items-center justify-center gap-1 hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" /> Add Plan
                </button>
              </div>
            </div>
          </section>

          {/* REGISTER DISTRIBUTOR */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-serif text-xl mb-4">Register Distributor</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                placeholder="Username"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={newDist.username}
                onChange={(e) => setNewDist({ ...newDist, username: e.target.value })}
              />
              <input
                placeholder="Password"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={newDist.password}
                onChange={(e) => setNewDist({ ...newDist, password: e.target.value })}
              />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={newDist.plan_id}
                onChange={(e) => setNewDist({ ...newDist, plan_id: e.target.value })}
              >
                <option value="">— Select plan —</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.commission_percent}%)
                  </option>
                ))}
              </select>
              <input
                placeholder="Referred by (upline username, optional)"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={newDist.referred_by}
                onChange={(e) => setNewDist({ ...newDist, referred_by: e.target.value })}
              />
              <button
                onClick={addDistributor}
                className="h-10 rounded-md bg-primary text-primary-foreground text-sm inline-flex items-center justify-center gap-1 hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Register
              </button>
            </div>
          </section>

          {/* DISTRIBUTORS TABLE */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl">All Distributors</h2>
              <span className="text-xs text-muted-foreground">
                Live-synced with orders & network
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3 w-6"></th>
                    <th className="py-2 pr-3">Username</th>
                    <th className="py-2 pr-3">Plan</th>
                    <th className="py-2 pr-3">Upline</th>
                    <th className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1">
                        <ShoppingBag className="h-3.5 w-3.5" /> Orders
                      </span>
                    </th>
                    <th className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Network
                      </span>
                    </th>
                    <th className="py-2 pr-3">Paid (Rs.)</th>
                    <th className="py-2 pr-3">Pending (Rs.)</th>
                    <th className="py-2 pr-3 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {distributors.map((d) => {
                    const key = d.username.trim().toLowerCase();
                    const distOrders = ordersByUser[key] ?? [];
                    const downlines = downlinesByUser[key] ?? 0;
                    const isOpen = expanded === d.id;
                    const commissionPercent =
                      Number(d.distributor_plans?.commission_percent) ||
                      Number(plans.find((p) => p.id === d.plan_id)?.commission_percent) ||
                      0;
                    return (
                      <>
                        <tr key={d.id} className="border-b border-border/50">
                          <td className="py-2 pr-3">
                            <button
                              onClick={() => setExpanded(isOpen ? null : d.id)}
                              className="p-1 hover:bg-secondary rounded"
                            >
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-2 pr-3 font-medium">{d.username}</td>
                          <td className="py-2 pr-3">
                            <select
                              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                              value={d.plan_id ?? ""}
                              onChange={(e) =>
                                updateDistLocal(d.id, { plan_id: e.target.value || null })
                              }
                            >
                              <option value="">—</option>
                              {plans.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              className="h-9 w-32 rounded-md border border-input bg-background px-2 text-sm"
                              placeholder="—"
                              value={d.referred_by ?? ""}
                              onChange={(e) =>
                                updateDistLocal(d.id, { referred_by: e.target.value })
                              }
                            />
                          </td>
                          <td className="py-2 pr-3 font-semibold">{distOrders.length}</td>
                          <td className="py-2 pr-3 font-semibold">{downlines}</td>
                          <td className="py-2 pr-3">
                            <input
                              type="number"
                              className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm"
                              value={d.paid_amount}
                              onChange={(e) =>
                                updateDistLocal(d.id, { paid_amount: Number(e.target.value) })
                              }
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              type="number"
                              className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm"
                              value={d.pending_amount}
                              onChange={(e) =>
                                updateDistLocal(d.id, { pending_amount: Number(e.target.value) })
                              }
                            />
                          </td>
                          <td className="py-2 pr-3 flex gap-2">
                            <button
                              onClick={() => saveDistributor(d)}
                              className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs inline-flex items-center gap-1 hover:bg-primary/90"
                            >
                              <Save className="h-3 w-3" /> Save
                            </button>
                            <button
                              onClick={() => deleteDistributor(d.id)}
                              className="h-8 px-2 rounded-md border border-border text-xs hover:bg-secondary"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="border-b border-border/50 bg-secondary/20">
                            <td colSpan={9} className="py-4 px-4">
                              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                                Referred orders ({distOrders.length}) · Commission rate {commissionPercent}%
                              </div>
                              {distOrders.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  No referred orders yet.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {distOrders.map((o) => {
                                    const commission = Math.round(
                                      ((Number(o.subtotal) || 0) * commissionPercent) / 100,
                                    );
                                    return (
                                      <div
                                        key={o.id}
                                        className="rounded-lg border border-border bg-card p-3"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                          <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs">
                                              {o.order_number}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              {new Date(o.created_at).toLocaleString()}
                                            </span>
                                            {o.customer_name && (
                                              <span className="text-xs text-muted-foreground">
                                                · {o.customer_name}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span className="text-xs">
                                              Commission:{" "}
                                              <span className="font-semibold">
                                                Rs. {commission.toLocaleString()}
                                              </span>
                                            </span>
                                            <StatusBadge status={o.status} />
                                          </div>
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-2">
                                          {(o.order_items ?? []).map((it, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-2 text-sm"
                                            >
                                              {it.product_image ? (
                                                <img
                                                  src={it.product_image}
                                                  alt=""
                                                  className="w-10 h-10 rounded object-cover border border-border"
                                                />
                                              ) : (
                                                <div className="w-10 h-10 rounded bg-muted" />
                                              )}
                                              <div className="flex-1 min-w-0">
                                                <div className="truncate">{it.product_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                  Qty {it.quantity} · Rs.{" "}
                                                  {Number(it.unit_price).toLocaleString()}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                  {distributors.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-4 text-center text-muted-foreground text-sm">
                        No distributors yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
