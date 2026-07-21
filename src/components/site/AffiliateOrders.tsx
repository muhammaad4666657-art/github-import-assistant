import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | string;

export function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<string, { label: string; cls: string; icon: string }> = {
    pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30", icon: "⏳" },
    processing: { label: "Processing", cls: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: "⚙️" },
    shipped: { label: "Shipped", cls: "bg-purple-500/15 text-purple-600 border-purple-500/30", icon: "📦" },
    delivered: { label: "Delivered", cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: "✅" },
    cancelled: { label: "Cancelled", cls: "bg-red-500/15 text-red-600 border-red-500/30", icon: "✖️" },
  };
  const s = map[status] ?? { label: String(status), cls: "bg-secondary text-foreground border-border", icon: "•" };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
    >
      <span>{s.icon}</span> {s.label}
    </span>
  );
}

export interface ReferralOrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  created_at: string;
  customer_name?: string | null;
  order_items?: Array<{
    product_name: string;
    product_image?: string | null;
    quantity: number;
    unit_price: number;
  }>;
}

export function ReferralOrdersTable({
  orders,
  commissionPercent,
  showCommission = true,
  showCustomer = false,
}: {
  orders: ReferralOrderRow[];
  commissionPercent: number;
  showCommission?: boolean;
  showCustomer?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No orders yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
            <th className="py-2 pr-3 w-6"></th>
            <th className="py-2 pr-3">Order</th>
            {showCustomer && <th className="py-2 pr-3">Customer</th>}
            <th className="py-2 pr-3">Items</th>
            <th className="py-2 pr-3">Date</th>
            {showCommission && <th className="py-2 pr-3">Commission</th>}
            <th className="py-2 pr-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const isOpen = open === o.id;
            const commission = Math.round(((Number(o.subtotal) || 0) * commissionPercent) / 100);
            const itemCount = o.order_items?.reduce((s, i) => s + (i.quantity || 0), 0) ?? 0;
            return (
              <>
                <tr
                  key={o.id}
                  className="border-b border-border/50 cursor-pointer hover:bg-secondary/40"
                  onClick={() => setOpen(isOpen ? null : o.id)}
                >
                  <td className="py-3 pr-3">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs">{o.order_number}</td>
                  {showCustomer && (
                    <td className="py-3 pr-3">{o.customer_name ?? "—"}</td>
                  )}
                  <td className="py-3 pr-3">{itemCount} item{itemCount === 1 ? "" : "s"}</td>
                  <td className="py-3 pr-3 text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  {showCommission && (
                    <td className="py-3 pr-3 font-medium">Rs. {commission.toLocaleString()}</td>
                  )}
                  <td className="py-3 pr-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-b border-border/50 bg-secondary/20">
                    <td colSpan={showCommission ? (showCustomer ? 7 : 6) : (showCustomer ? 6 : 5)} className="py-3 px-3">
                      <div className="space-y-2">
                        {(o.order_items ?? []).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            {item.product_image ? (
                              <img
                                src={item.product_image}
                                alt=""
                                className="w-10 h-10 rounded object-cover border border-border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{item.product_name}</div>
                              <div className="text-xs text-muted-foreground">
                                Qty {item.quantity} · Rs. {Number(item.unit_price).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 text-xs text-muted-foreground">
                          Order total: Rs. {Number(o.total).toLocaleString()}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
