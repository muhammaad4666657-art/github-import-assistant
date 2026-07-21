import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X, Loader2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/product-image";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  short_description: string | null;
  stock: number;
};

const RECENT_KEY = "alm_recent_searches";
const TRENDING = ["Serum", "Face Cream", "Perfume", "Sunscreen", "Hair Oil"];

export function SearchBar({ className = "", onNavigate }: { className?: string; onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // load recent
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(r)) setRecent(r.slice(0, 5));
    } catch {}
  }, []);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 180);
    return () => clearTimeout(t);
  }, [query]);

  // fetch
  useEffect(() => {
    if (!debounced) { setResults([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("products")
      .select("id,name,slug,price,sale_price,image_url,short_description,stock")
      .eq("status", "active")
      .or(`name.ilike.%${debounced}%,short_description.ilike.%${debounced}%,tag.ilike.%${debounced}%`)
      .limit(8)
      .then(({ data }) => {
        if (cancelled) return;
        setResults((data ?? []) as Product[]);
        setLoading(false);
        setHighlight(0);
      });
    return () => { cancelled = true; };
  }, [debounced]);

  // outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // keyboard shortcut "/"
  useEffect(() => {
    function h(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  function saveRecent(term: string) {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  }

  function gotoProduct(p: Product) {
    saveRecent(p.name);
    setOpen(false);
    setQuery("");
    onNavigate?.();
    navigate({ to: "/product/$slug", params: { slug: p.slug } });
  }

  function gotoSearch(term?: string) {
    const t = (term ?? query).trim();
    if (!t) return;
    saveRecent(t);
    setOpen(false);
    setQuery("");
    onNavigate?.();
    navigate({ to: "/products", search: { q: t } as any });
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (results[highlight]) gotoProduct(results[highlight]);
      else gotoSearch();
    } else if (e.key === "Escape") {
      setOpen(false); inputRef.current?.blur();
    }
  }

  const showPanel = open && (loading || results.length > 0 || !!debounced || recent.length > 0);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Search serums, creams, fragrances…"
          className="w-full h-10 pl-10 pr-16 bg-secondary rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
        />
        {query ? (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center px-1.5 rounded border border-border bg-background/50 text-[10px] text-muted-foreground font-mono">/</kbd>
        )}
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {loading && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}

          {!loading && debounced && results.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No products match “{debounced}”
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {results.map((p, i) => {
                const price = Number(p.sale_price ?? p.price);
                const hasDiscount = p.sale_price != null && Number(p.sale_price) < Number(p.price);
                return (
                  <li key={p.id}>
                    <button
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => gotoProduct(p)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${i === highlight ? "bg-accent/40" : "hover:bg-accent/20"}`}
                    >
                      <img src={resolveImage(p.image_url)} alt={p.name}
                        className="h-12 w-12 rounded-md object-cover bg-muted flex-shrink-0" loading="lazy" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        {p.short_description && (
                          <div className="text-xs text-muted-foreground truncate">{p.short_description}</div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold">Rs. {price.toLocaleString()}</div>
                        {hasDiscount && (
                          <div className="text-[10px] text-muted-foreground line-through">Rs. {Number(p.price).toLocaleString()}</div>
                        )}
                        {p.stock <= 0 && <div className="text-[10px] text-destructive">Out of stock</div>}
                      </div>
                    </button>
                  </li>
                );
              })}
              <li className="border-t border-border mt-1">
                <button onClick={() => gotoSearch()}
                  className="w-full text-center text-xs font-medium py-2.5 text-accent hover:bg-accent/10 transition-colors">
                  View all results for “{debounced}” →
                </button>
              </li>
            </ul>
          )}

          {!loading && !debounced && (
            <div className="p-3 space-y-3">
              {recent.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-1 mb-1.5">Recent</div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <button key={r} onClick={() => { setQuery(r); setOpen(true); }}
                        className="px-2.5 h-7 rounded-full text-xs bg-secondary hover:bg-accent/30 transition-colors">
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-1 mb-1.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Trending
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TRENDING.map((t) => (
                    <button key={t} onClick={() => { setQuery(t); setOpen(true); }}
                      className="px-2.5 h-7 rounded-full text-xs bg-secondary hover:bg-accent/30 transition-colors">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
