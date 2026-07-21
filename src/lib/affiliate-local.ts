export type LocalDistributorPlan = {
  id: string;
  name: string;
  price: number;
  commission_percent: number;
};

export type LocalDistributor = {
  id: string;
  username: string;
  password: string;
  plan_id: string | null;
  candidate_referrals: number;
  paid_amount: number;
  pending_amount: number;
};

const PLANS_KEY = "alm_distributor_plans";
const DISTRIBUTORS_KEY = "alm_distributors";

const fallbackPlans: LocalDistributorPlan[] = [
  { id: "local-plan-starter", name: "Starter", price: 5000, commission_percent: 5 },
  { id: "local-plan-premium", name: "Premium", price: 15000, commission_percent: 10 },
];

const isBrowser = () => typeof window !== "undefined" && !!window.localStorage;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("alm-affiliate-storage-change"));
}

export function getLocalDistributorPlans() {
  const plans = readJson<LocalDistributorPlan[] | null>(PLANS_KEY, null);
  if (plans) return plans;
  writeJson(PLANS_KEY, fallbackPlans);
  return fallbackPlans;
}

export function setLocalDistributorPlans(plans: LocalDistributorPlan[]) {
  writeJson(PLANS_KEY, plans);
}

export function addLocalDistributorPlan(input: Omit<LocalDistributorPlan, "id">) {
  const plan = { ...input, id: uid("local-plan") };
  setLocalDistributorPlans([...getLocalDistributorPlans(), plan]);
  return plan;
}

export function updateLocalDistributorPlan(plan: LocalDistributorPlan) {
  setLocalDistributorPlans(getLocalDistributorPlans().map((p) => (p.id === plan.id ? plan : p)));
}

export function deleteLocalDistributorPlan(id: string) {
  setLocalDistributorPlans(getLocalDistributorPlans().filter((p) => p.id !== id));
  setLocalDistributors(
    getLocalDistributors().map((d) => (d.plan_id === id ? { ...d, plan_id: null } : d)),
  );
}

export function getLocalDistributors() {
  return readJson<LocalDistributor[]>(DISTRIBUTORS_KEY, []);
}

export function setLocalDistributors(distributors: LocalDistributor[]) {
  writeJson(DISTRIBUTORS_KEY, distributors);
}

export function addLocalDistributor(
  input: Omit<LocalDistributor, "id" | "candidate_referrals" | "paid_amount" | "pending_amount">,
) {
  const distributor: LocalDistributor = {
    ...input,
    id: uid("local-distributor"),
    candidate_referrals: 0,
    paid_amount: 0,
    pending_amount: 0,
  };
  setLocalDistributors([distributor, ...getLocalDistributors()]);
  return distributor;
}

export function updateLocalDistributor(distributor: LocalDistributor) {
  setLocalDistributors(
    getLocalDistributors().map((d) => (d.id === distributor.id ? distributor : d)),
  );
}

export function deleteLocalDistributor(id: string) {
  setLocalDistributors(getLocalDistributors().filter((d) => d.id !== id));
}

export function loginLocalDistributor(username: string, password: string) {
  const normalized = username.trim().toLowerCase();
  return getLocalDistributors().find(
    (d) => d.username.trim().toLowerCase() === normalized && d.password === password,
  );
}

export function getLocalDistributorStats(username: string) {
  const distributor = getLocalDistributors().find(
    (d) => d.username.trim().toLowerCase() === username.trim().toLowerCase(),
  );
  if (!distributor) return null;
  const plan = getLocalDistributorPlans().find((p) => p.id === distributor.plan_id);
  return {
    username: distributor.username,
    planName: plan?.name ?? null,
    commissionPercent: Number(plan?.commission_percent) || 0,
    salesCount: 0,
    candidateReferrals: Number(distributor.candidate_referrals) || 0,
    totalCommission: 0,
    paidAmount: Number(distributor.paid_amount) || 0,
    pendingAmount: Number(distributor.pending_amount) || 0,
  };
}
