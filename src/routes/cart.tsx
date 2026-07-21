import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { resolveImage } from "@/lib/product-image";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — ALM International" }] }),
  component: CartPage,
});

const SHIPPING_FEE = 250;

function CartPage() {
  const { items, update, remove, subtotal } = useCart();
  const total = subtotal + (items.length ? SHIPPING_FEE : 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        <h1 className="text-4xl font-serif">Your Cart</h1>

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Your cart is empty</p>
            <Link to="/products" className="inline-block mt-6 h-11 px-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 leading-[44px]">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-4">
              {items.map((it) => (
                <div key={it.product_id} className="flex gap-4 p-4 bg-card border border-border rounded-xl">
                  <img src={resolveImage(it.image_url)} alt={it.name} className="h-24 w-24 rounded-lg object-cover" />
                  <div className="flex-1">
                    <Link to="/product/$slug" params={{ slug: it.slug }} className="font-serif text-lg hover:text-accent">
                      {it.name}
                    </Link>
                    <div className="text-sm text-muted-foreground mt-1">Rs. {it.unit_price.toLocaleString()}</div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center border border-border rounded-full">
                        <button onClick={() => update(it.product_id, it.quantity - 1)} className="h-8 w-8 flex items-center justify-center">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{it.quantity}</span>
                        <button onClick={() => update(it.product_id, it.quantity + 1)} className="h-8 w-8 flex items-center justify-center">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button onClick={() => remove(it.product_id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="font-medium">Rs. {(it.unit_price * it.quantity).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <aside className="bg-card border border-border rounded-xl p-6 h-fit sticky top-24">
              <h2 className="font-serif text-xl">Order Summary</h2>
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>Rs. {SHIPPING_FEE.toLocaleString()}</span></div>
                <div className="border-t border-border pt-3 flex justify-between font-medium text-base">
                  <span>Total</span><span>Rs. {total.toLocaleString()}</span>
                </div>
              </div>
              <Link to="/checkout" className="mt-6 w-full h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center">
                Proceed to checkout
              </Link>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
