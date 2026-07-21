import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
    setOrders(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); load(); }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} order{filtered.length !== 1 && "s"}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 h-9 rounded-full text-sm border capitalize ${filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-accent"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <>
                <tr key={o.id} className="border-t border-border hover:bg-secondary/50 cursor-pointer"
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                  <td className="px-4 py-3 font-medium">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <div>{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                    {o.referral_code && (
                      <div className="mt-1 inline-block text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/10 text-accent">Ref: {o.referral_code}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">Rs. {Number(o.total).toLocaleString()}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="h-8 w-36 capitalize"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
                {expanded === o.id && (
                  <tr key={o.id + "-x"} className="bg-secondary/30">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div>
                          <h4 className="font-medium mb-2">Shipping</h4>
                          <p>{o.shipping_address}</p>
                          <p>{o.shipping_city}</p>
                          <p className="text-muted-foreground">{o.customer_email}</p>
                          {o.referral_code && (
                            <p className="mt-2"><span className="text-muted-foreground">Referral code:</span> <span className="font-mono font-medium uppercase px-2 py-0.5 rounded bg-accent/10 text-accent">{o.referral_code}</span></p>
                          )}
                          {o.notes && <p className="mt-2 text-muted-foreground">Note: {o.notes}</p>}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Items</h4>
                          <ul className="space-y-1">
                            {o.order_items.map((i: any) => (
                              <li key={i.id} className="flex justify-between">
                                <span>{i.product_name} × {i.quantity}</span>
                                <span>Rs. {(i.unit_price * i.quantity).toLocaleString()}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3 pt-2 border-t border-border flex justify-between font-medium">
                            <span>Total</span><span>Rs. {Number(o.total).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
