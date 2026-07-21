import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Sparkles, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { ProductCard } from "@/components/site/Products";
import { useCart } from "@/lib/cart-context";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/products")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Shop All Products — ALM International" }] }),
  component: ProductsPage,
});

type SortKey = "newest" | "price_asc" | "price_desc" | "name";

function ProductsPage() {
  const { category, q } = Route.useSearch();
  const { add } = useCart();
  const [items, setItems] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | undefined>(category);
  const [query, setQuery] = useState<string>(q ?? "");
  const [sort, setSort] = useState<SortKey>("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => { setSelectedCat(category); }, [category]);
  useEffect(() => { setQuery(q ?? ""); }, [q]);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCats(data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    supabase.from("products").select("*, categories(slug,name)").eq("status", "active")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        let arr = data ?? [];
        if (selectedCat) arr = arr.filter((p: any) => p.categories?.slug === selectedCat);
        if (query.trim()) {
          const needle = query.trim().toLowerCase();
          arr = arr.filter((p: any) =>
            p.name?.toLowerCase().includes(needle) ||
            p.short_description?.toLowerCase().includes(needle) ||
            p.tag?.toLowerCase().includes(needle)
          );
        }
        setItems(arr);
        setLoading(false);
      });
  }, [selectedCat, query]);

  const sorted = useMemo(() => {
    const a = [...items];
    if (sort === "price_asc") a.sort((x, y) => Number(x.sale_price ?? x.price) - Number(y.sale_price ?? y.price));
    if (sort === "price_desc") a.sort((x, y) => Number(y.sale_price ?? y.price) - Number(x.sale_price ?? x.price));
    if (sort === "name") a.sort((x, y) => x.name.localeCompare(y.name));
    return a;
  }, [items, sort]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-luxe py-16 md:py-20">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-gold/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 text-center fade-up">
            <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] text-gold uppercase">
              <Sparkles className="h-3.5 w-3.5" /> Collection
            </div>
            <h1 className="mt-4 text-4xl md:text-6xl font-serif">
              {query ? <>Results for <span className="text-gold">"{query}"</span></> : "Our Premium Collection"}
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              {query ? `${items.length} product${items.length === 1 ? "" : "s"} found` : "Handcrafted skincare & home care, delivered to your door across Pakistan."}
            </p>
            {query && (
              <button onClick={() => setQuery("")} className="mt-4 text-xs text-accent hover:underline">Clear search ×</button>
            )}
          </div>
        </div>

        {/* Filters + sort */}
        <div className="sticky top-20 z-20 bg-background/85 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 flex flex-wrap gap-2">
              <FilterPill active={!selectedCat} onClick={() => setSelectedCat(undefined)}>All</FilterPill>
              {cats.map((c) => (
                <FilterPill key={c.id} active={selectedCat === c.slug} onClick={() => setSelectedCat(c.slug)}>
                  {c.name}
                </FilterPill>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-9 px-3 rounded-full bg-secondary border border-transparent focus:border-accent text-sm focus:outline-none cursor-pointer">
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="aspect-square bg-secondary animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-secondary rounded animate-pulse" />
                    <div className="h-3 w-24 bg-secondary rounded animate-pulse" />
                    <div className="h-8 bg-secondary rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-24 fade-up">
              <div className="inline-flex h-16 w-16 rounded-full bg-secondary items-center justify-center mb-4">
                <Sparkles className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-lg font-serif">No products found</p>
              <p className="text-sm text-muted-foreground mt-2">Try a different category or search term.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sorted.map((p, i) => (
                <div key={p.id} style={{ animationDelay: `${Math.min(i * 60, 600)}ms` }} className="fade-up">
                  <ProductCard p={p} onAdd={() => add({
                    product_id: p.id, name: p.name, slug: p.slug,
                    image_url: p.image_url, unit_price: Number(p.sale_price ?? p.price),
                  })} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 h-9 rounded-full text-sm border transition-all hover:scale-[1.03] active:scale-95 ${
        active ? "bg-primary text-primary-foreground border-primary shadow-soft" : "border-border hover:border-accent bg-card"
      }`}>
      {children}
    </button>
  );
}
