import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, Users, TrendingUp, Truck, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0, totalRevenue: 0, pending: 0, processing: 0,
    shipped: 0, delivered: 0, products: 0, customers: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: orders }, { count: prodCount }, { count: userCount }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      const arr = orders ?? [];
      setStats({
        totalOrders: arr.length,
        totalRevenue: arr.filter((o: any) => o.status !== "cancelled").reduce((s, o: any) => s + Number(o.total), 0),
        pending: arr.filter((o: any) => o.status === "pending").length,
        processing: arr.filter((o: any) => o.status === "processing").length,
        shipped: arr.filter((o: any) => o.status === "shipped").length,
        delivered: arr.filter((o: any) => o.status === "delivered").length,
        products: prodCount ?? 0,
        customers: userCount ?? 0,
      });
      setRecent(arr.slice(0, 5));
    })();
  }, []);

  const cards = [
    { label: "Total Revenue", value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, accent: true },
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart },
    { label: "Products", value: stats.products, icon: Package },
    { label: "Customers", value: stats.customers, icon: Users },
  ];
  const status = [
    { label: "New / Pending", value: stats.pending, icon: ShoppingCart, color: "text-yellow-600 bg-yellow-50" },
    { label: "Processing", value: stats.processing, icon: Package, color: "text-blue-600 bg-blue-50" },
    { label: "Shipped", value: stats.shipped, icon: Truck, color: "text-indigo-600 bg-indigo-50" },
    { label: "Delivered", value: stats.delivered, icon: CheckCircle, color: "text-green-600 bg-green-50" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-serif">Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-1">Overview of your store performance</p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`p-6 rounded-xl border ${c.accent ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
            <c.icon className={`h-5 w-5 ${c.accent ? "text-gold" : "text-muted-foreground"}`} />
            <div className="mt-4 text-2xl font-serif">{c.value}</div>
            <div className={`text-xs mt-1 ${c.accent ? "opacity-80" : "text-muted-foreground"}`}>{c.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-12 font-serif text-2xl">Orders by status</h2>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {status.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-medium">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-card border border-border rounded-xl p-6">
        <div className="flex justify-between items-center">
          <h2 className="font-serif text-xl">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-accent hover:underline">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {recent.map((o) => (
              <div key={o.id} className="py-3 flex justify-between text-sm">
                <div>
                  <div className="font-medium">{o.order_number}</div>
                  <div className="text-xs text-muted-foreground">{o.customer_name} · {new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">Rs. {Number(o.total).toLocaleString()}</div>
                  <div className="text-xs uppercase text-muted-foreground">{o.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
