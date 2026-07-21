import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { Package, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/track-order")({
  head: () => ({ meta: [{ title: "Track your order — ALM International" }] }),
  component: TrackOrder,
});

const STEPS = [
  { key: "pending", label: "Order placed", icon: Clock },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    const { data, error } = await supabase.rpc("track_order", {
      _order_number: orderNumber.trim().toUpperCase(),
      _phone: phone.trim(),
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setResult(data?.[0] ?? null);
  };

  const currentStep = result ? STEPS.findIndex((s) => s.key === result.status) : -1;
  const cancelled = result?.status === "cancelled";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 px-4 py-16 max-w-3xl mx-auto w-full">
        <div className="text-center">
          <h1 className="text-4xl font-serif">Track your order</h1>
          <p className="mt-2 text-muted-foreground">Enter your order number and phone number to see live status.</p>
        </div>

        <form onSubmit={submit} className="mt-8 bg-card border border-border rounded-2xl p-6 space-y-4 shadow-soft">
          <div>
            <label className="text-sm font-medium">Order number</label>
            <input required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ALM-123456"
              className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
          </div>
          <div>
            <label className="text-sm font-medium">Phone number</label>
            <input required value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="03001234567"
              className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
          </div>
          <button disabled={loading} className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {loading ? "Searching..." : "Track order"}
          </button>
        </form>

        {searched && !loading && !result && (
          <div className="mt-8 text-center text-muted-foreground bg-card border border-border rounded-2xl p-8">
            <XCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
            No order found. Please check the order number and phone number.
          </div>
        )}

        {result && (
          <div className="mt-8 bg-card border border-border rounded-2xl p-6 shadow-soft">
            <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-border">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Order</div>
                <div className="text-xl font-serif">{result.order_number}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
                <div className="text-xl font-medium">Rs. {Number(result.total).toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-6 text-sm space-y-1">
              <div><span className="text-muted-foreground">Customer:</span> {result.customer_name}</div>
              <div><span className="text-muted-foreground">Shipping to:</span> {result.shipping_address}, {result.shipping_city}</div>
              <div><span className="text-muted-foreground">Placed:</span> {new Date(result.created_at).toLocaleString()}</div>
            </div>

            {cancelled ? (
              <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
                <XCircle className="h-5 w-5" /> This order was cancelled.
              </div>
            ) : (
              <div className="mt-8">
                <div className="flex justify-between items-center relative">
                  <div className="absolute left-0 right-0 top-5 h-0.5 bg-border" />
                  <div className="absolute left-0 top-5 h-0.5 bg-accent transition-all"
                    style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }} />
                  {STEPS.map((s, i) => {
                    const done = i <= currentStep;
                    const Icon = s.icon;
                    return (
                      <div key={s.key} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${done ? "bg-accent text-accent-foreground border-accent" : "bg-card text-muted-foreground border-border"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className={`text-xs text-center ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
