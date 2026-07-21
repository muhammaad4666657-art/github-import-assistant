import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import { toast } from "sonner";

export interface CartItem {
  product_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => Promise<void>;
  update: (productId: string, qty: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const LS_KEY = "alm_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart on mount / auth change
  useEffect(() => {
    (async () => {
      if (user) {
        // Fetch DB cart
        const { data } = await supabase
          .from("cart_items")
          .select("product_id, quantity, products!inner(name, slug, image_url, price, sale_price)")
          .eq("user_id", user.id);
        const dbItems: CartItem[] = (data ?? []).map((r: any) => ({
          product_id: r.product_id,
          name: r.products.name,
          slug: r.products.slug,
          image_url: r.products.image_url,
          unit_price: Number(r.products.sale_price ?? r.products.price),
          quantity: r.quantity,
        }));

        // Merge any guest cart from localStorage
        const guest = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
        if (guest) {
          const guestItems: CartItem[] = JSON.parse(guest);
          for (const gi of guestItems) {
            const existing = dbItems.find((d) => d.product_id === gi.product_id);
            const qty = (existing?.quantity ?? 0) + gi.quantity;
            await supabase.from("cart_items").upsert(
              { user_id: user.id, product_id: gi.product_id, quantity: qty },
              { onConflict: "user_id,product_id" }
            );
            if (existing) existing.quantity = qty;
            else dbItems.push({ ...gi, quantity: qty });
          }
          localStorage.removeItem(LS_KEY);
        }
        setItems(dbItems);
      } else if (typeof window !== "undefined") {
        const raw = localStorage.getItem(LS_KEY);
        setItems(raw ? JSON.parse(raw) : []);
      }
    })();
  }, [user]);

  // Persist guest cart
  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    }
  }, [items, user]);

  const add = useCallback(async (item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.product_id === item.product_id);
      if (existing) {
        return prev.map((p) =>
          p.product_id === item.product_id ? { ...p, quantity: p.quantity + qty } : p
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
    if (user) {
      const { data: existing } = await supabase
        .from("cart_items").select("quantity")
        .eq("user_id", user.id).eq("product_id", item.product_id).maybeSingle();
      const newQty = (existing?.quantity ?? 0) + qty;
      await supabase.from("cart_items").upsert(
        { user_id: user.id, product_id: item.product_id, quantity: newQty },
        { onConflict: "user_id,product_id" }
      );
    }
    toast.success(`${item.name} added to cart`);
  }, [user]);

  const update = useCallback(async (productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((p) => p.product_id !== productId));
      if (user) await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId);
      return;
    }
    setItems((prev) => prev.map((p) => (p.product_id === productId ? { ...p, quantity: qty } : p)));
    if (user) {
      await supabase.from("cart_items").update({ quantity: qty })
        .eq("user_id", user.id).eq("product_id", productId);
    }
  }, [user]);

  const remove = useCallback(async (productId: string) => {
    setItems((prev) => prev.filter((p) => p.product_id !== productId));
    if (user) await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId);
  }, [user]);

  const clear = useCallback(async () => {
    setItems([]);
    if (user) await supabase.from("cart_items").delete().eq("user_id", user.id);
    else if (typeof window !== "undefined") localStorage.removeItem(LS_KEY);
  }, [user]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, add, update, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
