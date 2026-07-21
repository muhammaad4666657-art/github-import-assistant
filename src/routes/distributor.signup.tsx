import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Gem, Sparkles } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { getLocalDistributorPlans } from "@/lib/affiliate-local";

export const Route = createFileRoute("/distributor/signup")({
  head: () => ({ meta: [{ title: "Become a Distributor — ALM International" }] }),
  component: DistributorSignupPage,
});

interface Plan {
  id: string;
  name: string;
  price: number;
  commission_percent: number;
}

function DistributorSignupPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("distributor_plans")
        .select("id, name, price, commission_percent")
        .order("price", { ascending: true });
      if (cancelled) return;
      if (error || !data) {
        setPlans(getLocalDistributorPlans() as Plan[]);
      } else {
        const mapped = data.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          commission_percent: Number(p.commission_percent) || 0,
        }));
        setPlans(mapped);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-luxe">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-16 sm:py-24 w-full">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mx-auto h-12 w-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
            <Gem className="h-5 w-5 text-gold" />
          </div>
          <p className="mt-4 text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Affiliate Program
          </p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-serif">Become a Distributor</h1>
          <div className="mx-auto mt-4 w-24 gold-divider" />
          <p className="text-muted-foreground mt-5 leading-relaxed">
            Partner with ALM International and earn premium commissions on every referral. Choose a
            plan below and contact our team to begin your journey.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && (
            <p className="col-span-full text-center text-muted-foreground">Loading plans...</p>
          )}
          {!loading && plans.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">
              No plans available right now. Please check back soon.
            </p>
          )}
          {plans.map((plan, idx) => {
            const featured = idx === 1 && plans.length >= 3;
            return (
              <div
                key={plan.id}
                className={`relative bg-card border rounded-2xl p-8 flex flex-col transition hover-lift ${
                  featured ? "border-gold shadow-gold" : "border-border shadow-soft"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-gold text-primary-foreground text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Most Popular
                  </span>
                )}
                <h3 className="text-xl font-serif">{plan.name}</h3>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Rs
                  </span>
                  <span className="text-4xl font-semibold">
                    {Number(plan.price).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">One-time enrollment</p>

                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                    <span>
                      <strong>{Number(plan.commission_percent)}%</strong> commission per sale
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                    <span>Personal distributor dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                    <span>Dedicated partner support</span>
                  </li>
                </ul>

                <Link
                  to="/contact"
                  className={`mt-8 h-11 inline-flex items-center justify-center rounded-lg transition ${
                    featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-gold/60 hover:bg-gold/10 hover:border-gold"
                  }`}
                >
                  Contact to Enroll
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-14 text-center text-sm text-muted-foreground">
          Already a distributor?{" "}
          <Link to="/distributor/login" className="text-gold hover:underline font-medium">
            Sign in here
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
