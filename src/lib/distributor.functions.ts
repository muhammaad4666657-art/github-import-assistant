import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function assertAffiliateBackendEnv() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("AFFILIATE_BACKEND_UNAVAILABLE");
  }
}

export const listDistributorPlans = createServerFn({ method: "GET" }).handler(async () => {
  assertAffiliateBackendEnv();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("distributor_plans")
    .select("id, name, price, commission_percent")
    .order("price", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const loginDistributor = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        username: z.string().trim().min(1).max(64),
        password: z.string().min(1).max(128),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    assertAffiliateBackendEnv();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("distributors")
      .select("id, username, password, plan_id, candidate_referrals, paid_amount, pending_amount")
      .eq("username", data.username)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || row.password !== data.password) {
      throw new Error("Invalid username or password");
    }
    return {
      id: row.id,
      username: row.username,
      plan_id: row.plan_id,
      candidate_referrals: row.candidate_referrals,
      paid_amount: row.paid_amount,
      pending_amount: row.pending_amount,
    };
  });

export const getDistributorStats = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ username: z.string().trim().min(1).max(64) }).parse(input))
  .handler(async ({ data }) => {
    assertAffiliateBackendEnv();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const username = data.username;

    const { data: dist, error: dErr } = await supabaseAdmin
      .from("distributors")
      .select("id, username, plan_id, candidate_referrals, paid_amount, pending_amount")
      .eq("username", username)
      .maybeSingle();
    if (dErr) throw new Error(dErr.message);
    if (!dist) throw new Error("Distributor not found");

    let commissionPercent = 0;
    let planName: string | null = null;
    if (dist.plan_id) {
      const { data: plan } = await supabaseAdmin
        .from("distributor_plans")
        .select("name, commission_percent")
        .eq("id", dist.plan_id)
        .maybeSingle();
      if (plan) {
        commissionPercent = Number(plan.commission_percent) || 0;
        planName = plan.name;
      }
    }

    // Pull orders attributed to this referral code (case-insensitive)
    const { data: orders, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("id, subtotal, status")
      .ilike("referral_code", username);
    if (oErr) throw new Error(oErr.message);

    const validOrders = (orders ?? []).filter((o) => (o.status as string) !== "cancelled");

    let salesCount = 0;
    let totalRevenue = 0;
    if (validOrders.length > 0) {
      const ids = validOrders.map((o) => o.id);
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("order_id, quantity")
        .in("order_id", ids);
      salesCount = (items ?? []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
      totalRevenue = validOrders.reduce((s, o) => s + (Number(o.subtotal) || 0), 0);
    }

    const totalCommission = Math.round((totalRevenue * commissionPercent) / 100);

    return {
      username: dist.username,
      planName,
      commissionPercent,
      salesCount,
      candidateReferrals: dist.candidate_referrals,
      totalCommission,
      paidAmount: Number(dist.paid_amount) || 0,
      pendingAmount: Number(dist.pending_amount) || 0,
    };
  });
