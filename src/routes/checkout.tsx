import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useSiteSettings } from "@/lib/site-settings";
import { getStoredRefCode, clearStoredRefCode } from "@/lib/referral";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — ALM International" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const settings = useSiteSettings();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    const stored = getStoredRefCode();
    if (stored) setReferralCode(stored);
  }, []);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setName(data.full_name ?? "");
          setPhone(data.phone ?? "");
          setAddress(data.address ?? "");
          setCity(data.city ?? "");
        }
      });
    }
  }, [user]);

  const shippingFee = useMemo(() => {
    const isLahore = city.trim().toLowerCase() === "lahore";
    const lahoreFee = Number(settings?.shipping_fee_lahore);
    const otherFee = Number(settings?.shipping_fee_other);
    const fallback = Number(settings?.shipping_fee) || 250;
    if (isLahore) return Number.isFinite(lahoreFee) && lahoreFee >= 0 ? lahoreFee : fallback;
    if (city.trim()) return Number.isFinite(otherFee) && otherFee >= 0 ? otherFee : fallback;
    return fallback;
  }, [city, settings]);
  const total = subtotal + shippingFee;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) return;
    setSubmitting(true);

    const { data: order, error: oerr } = await supabase.from("orders").insert({
      user_id: user.id,
      customer_name: name,
      customer_phone: phone,
      customer_email: user.email,
      shipping_address: address,
      shipping_city: city,
      notes,
      referral_code: referralCode.trim() || null,
      subtotal,
      shipping_fee: shippingFee,
      total,
      payment_method: "cod",
    }).select().single();

    if (oerr || !order) {
      toast.error(oerr?.message ?? "Failed to place order");
      setSubmitting(false);
      return;
    }

    const { error: ierr } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        product_name: i.name,
        product_image: i.image_url,
        unit_price: i.unit_price,
        quantity: i.quantity,
      }))
    );

    if (ierr) {
      toast.error(ierr.message);
      setSubmitting(false);
      return;
    }

    // Save address to profile
    await supabase.from("profiles").update({ full_name: name, phone, address, city }).eq("id", user.id);
    await clear();
    clearStoredRefCode();
    toast.success(`Order ${order.order_number} placed! We'll contact you soon.`);
    navigate({ to: "/account" });
  };

  if (loading || !user) return null;
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link to="/products" className="inline-block mt-4 text-accent hover:underline">Shop now →</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-serif">Checkout</h1>
        <form onSubmit={submit} className="mt-10 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-serif text-2xl">Shipping details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Full name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg" />
              </div>
              <div>
                <label className="text-sm">Phone</label>
                <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg" />
              </div>
            </div>
            <div>
              <label className="text-sm">Address</label>
              <textarea required value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 w-full min-h-20 p-3 bg-secondary rounded-lg" />
            </div>
            <div>
              <label className="text-sm">City</label>
              <input required value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg" />
            </div>
            <div>
              <label className="text-sm">Order notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full min-h-16 p-3 bg-secondary rounded-lg" />
            </div>
            <div>
              <label className="text-sm">Referral code (optional)</label>
              <input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter referral code if you have one"
                className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg uppercase tracking-wider"
              />
              <p className="mt-1 text-xs text-muted-foreground">Have a referral code? Enter it here. Leave blank if not.</p>
            </div>

            <div className="mt-6 p-4 bg-secondary rounded-lg text-sm">
              <strong>Payment method:</strong> Cash on Delivery (COD)
            </div>
          </div>

          <aside className="bg-card border border-border rounded-xl p-6 h-fit">
            <h2 className="font-serif text-xl">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              {items.map((i) => (
                <div key={i.product_id} className="flex justify-between gap-3">
                  <span className="truncate">{i.name} × {i.quantity}</span>
                  <span>Rs. {(i.unit_price * i.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-border pt-3 flex justify-between"><span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Delivery {city.trim() ? `(${city.trim().toLowerCase() === "lahore" ? "Lahore" : "Outside Lahore"})` : ""}</span><span>Rs. {shippingFee.toLocaleString()}</span></div>
              <div className="border-t border-border pt-3 flex justify-between font-medium text-base">
                <span>Total</span><span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-secondary/60 border border-border text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-gold">🚚</span>
              <span>Delivery within <strong className="text-foreground">4 days</strong> — often sooner. Pakistan bhar mein.</span>
            </div>
            <button disabled={submitting} className="mt-6 w-full h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {submitting ? "Placing order..." : "Place order"}
            </button>
          </aside>
        </form>
      </main>
      <Footer />
    </div>
  );
}
