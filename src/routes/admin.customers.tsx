import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      // Profiles + their order count + total spent
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: orders } = await supabase.from("orders").select("user_id, total");
      const agg = new Map<string, { count: number; total: number }>();
      for (const o of orders ?? []) {
        if (!o.user_id) continue;
        const cur = agg.get(o.user_id) ?? { count: 0, total: 0 };
        cur.count += 1; cur.total += Number(o.total);
        agg.set(o.user_id, cur);
      }
      setRows((profiles ?? []).map((p) => ({ ...p, ...(agg.get(p.id) ?? { count: 0, total: 0 }) })));
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const s = q.toLowerCase();
    return !s || r.full_name?.toLowerCase().includes(s) || r.phone?.includes(s) || r.city?.toLowerCase().includes(s);
  });

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} customer{filtered.length !== 1 && "s"}</p>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, city..."
          className="h-10 px-4 w-72 bg-secondary rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <Stat icon={Users} label="Total customers" value={rows.length.toString()} />
        <Stat icon={ShoppingBag} label="With orders" value={rows.filter((r) => r.count > 0).length.toString()} />
        <Stat icon={ShoppingBag} label="Total spent" value={`Rs. ${rows.reduce((s, r) => s + r.total, 0).toLocaleString()}`} />
      </div>

      <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Total spent</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium">{r.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.phone ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.city ?? "—"}</td>
                <td className="px-4 py-3">{r.count}</td>
                <td className="px-4 py-3">Rs. {r.total.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center"><Icon className="h-5 w-5 text-accent" /></div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-xl font-medium mt-0.5">{value}</div>
      </div>
    </div>
  );
}
