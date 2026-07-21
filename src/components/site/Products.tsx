import { Heart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/product-image";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";

type Product = {
  id: string; slug: string; name: string;
  short_description: string | null;
  price: number; sale_price: number | null;
  image_url: string | null; tag: string | null;
  featured: boolean; is_new: boolean;
  category_id: string | null;
};

export function Products({
  title = "Featured Products",
  eyebrow = "Curated for you",
  filter = "all",
  limit = 4,
}: {
  title?: string;
  eyebrow?: string;
  filter?: "all" | "featured" | "new";
  limit?: number;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const { add } = useCart();

  useEffect(() => {
    let q = supabase.from("products").select("*").eq("status", "active");
    if (filter === "featured") q = q.eq("featured", true);
    if (filter === "new") q = q.eq("is_new", true);
    q.order("created_at", { ascending: false }).limit(limit).then(({ data }) => {
      setProducts((data ?? []) as Product[]);
    });
  }, [filter, limit]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
        <div>
          <div className="text-xs tracking-[0.3em] text-gold uppercase">{eyebrow}</div>
          <h2 className="mt-3 text-4xl md:text-5xl font-serif">{title}</h2>
        </div>
        <Link to="/products" className="text-sm tracking-wider hover:text-accent transition-colors">View all →</Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} onAdd={() => add({
            product_id: p.id, name: p.name, slug: p.slug,
            image_url: p.image_url, unit_price: Number(p.sale_price ?? p.price),
          })} />
        ))}
      </div>
    </section>
  );
}

export function ProductCard({ p, onAdd }: { p: Product; onAdd: () => void }) {
  const discount = p.sale_price && p.price
    ? Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100)
    : 0;
  const wishlist = useWishlist();
  const fav = wishlist.has(p.id);
  return (
    <article className="product-card group relative bg-card rounded-2xl overflow-hidden border border-border fade-up">
      <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
        <div className="relative aspect-square bg-secondary overflow-hidden">
          <img src={resolveImage(p.image_url)} alt={p.name} loading="lazy" width={800} height={800}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          {p.tag && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/90 text-[10px] tracking-widest uppercase text-gold border border-gold/30 font-semibold">
              {p.tag}
            </span>
          )}
          {discount > 0 && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-[10px] tracking-widest uppercase font-semibold shadow-soft">
              -{discount}% OFF
            </span>
          )}
          <button
            className={`absolute top-3 right-3 h-9 w-9 rounded-full backdrop-blur bg-background/90 border flex items-center justify-center transition-all hover:scale-110 ${fav ? "border-destructive text-destructive" : "border-transparent hover:border-accent"}`}
            aria-label="Wishlist"
            onClick={(e) => {
              e.preventDefault();
              wishlist.toggle(p.id);
              toast.success(fav ? "Removed from wishlist" : "Added to wishlist");
            }}
          >
            <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onAdd(); }}
            className="quick-add h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold tracking-wider shadow-soft hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            + Add to Cart
          </button>
        </div>
      </Link>
      <div className="p-5">
        <Link to="/product/$slug" params={{ slug: p.slug }}>
          <h3 className="font-serif text-lg leading-snug font-semibold hover:text-accent transition-colors">{p.name}</h3>
        </Link>
        <div className="mt-2 flex items-center gap-1 text-gold">
          {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
          <span className="text-xs text-muted-foreground ml-1">(124)</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base">Rs. {Number(p.sale_price ?? p.price).toLocaleString()}</span>
            {p.sale_price && <span className="text-xs line-through text-muted-foreground">Rs. {Number(p.price).toLocaleString()}</span>}
          </div>
          <button onClick={onAdd} className="text-xs tracking-wider font-semibold px-3 py-2 rounded-full bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-all hover:scale-105 active:scale-95">
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
