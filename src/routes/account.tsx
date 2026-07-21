import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — ALM International" }] }),
  component: AccountPage,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function AccountPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("orders").select("*, order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false })
        .then(({ data }) => setOrders(data ?? []));
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-serif">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">{user.email}</p>

        {orders.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
            <Link to="/products" className="inline-block mt-4 text-accent hover:underline">Start shopping →</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="bg-card border border-border rounded-xl p-6">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <div className="font-medium">{o.order_number}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  {o.order_items.map((i: any) => (
                    <div key={i.id} className="flex justify-between">
                      <span>{i.product_name} × {i.quantity}</span>
                      <span>Rs. {(i.unit_price * i.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border flex justify-between font-medium">
                  <span>Total</span><span>Rs. {Number(o.total).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
