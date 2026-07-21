import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Search, Package, Tag, ImageIcon, Percent, Upload } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("products").select("*, categories(name)").order("created_at", { ascending: false });
    setProducts(data ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCats(data ?? []));
  }, []);

  const blank = {
    name: "", slug: "", short_description: "", description: "",
    price: 0, sale_price: null as number | null, stock: 0,
    image_url: "", images: [] as string[], category_id: null as string | null,
    featured: false, is_new: false, status: "active", tag: "",
  };

  const openNew = () => { setEditing({ ...blank }); setOpen(true); };
  const openEdit = (p: any) => { setEditing({ ...p, images: Array.isArray(p.images) ? p.images : [] }); setOpen(true); };

  const discountPct = useMemo(() => {
    if (!editing) return 0;
    const reg = Number(editing.price) || 0;
    const sale = Number(editing.sale_price) || 0;
    if (!reg || !sale || sale >= reg) return 0;
    return Math.round((1 - sale / reg) * 100);
  }, [editing?.price, editing?.sale_price]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (editing.sale_price && Number(editing.sale_price) >= Number(editing.price)) {
      toast.error("Sale price must be lower than regular price");
      return;
    }
    const payload = {
      ...editing,
      slug: editing.slug || slugify(editing.name),
      price: Number(editing.price),
      sale_price: editing.sale_price ? Number(editing.sale_price) : null,
      stock: Number(editing.stock),
    };
    const { id, categories, created_at, updated_at, ...rest } = payload;
    const op = id
      ? supabase.from("products").update(rest).eq("id", id)
      : supabase.from("products").insert(rest);
    const { error } = await op;
    if (error) toast.error(error.message);
    else { toast.success(id ? "Product updated" : "Product created"); setOpen(false); load(); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  const filtered = products.filter((p) => {
    const matchesQuery = !query || p.name?.toLowerCase().includes(query.toLowerCase()) || p.slug?.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesQuery && matchesStatus;
  });

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.status === "active").length,
    outOfStock: products.filter((p) => p.stock === 0).length,
    onSale: products.filter((p) => p.sale_price).length,
  }), [products]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-serif">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your catalog, pricing and inventory.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button onClick={openNew} className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm shadow-soft">
              <Plus className="h-4 w-4" /> Add product
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[92vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{editing?.id ? "Edit product" : "New product"}</DialogTitle>
              <DialogDescription>Fill in the product details. Sale price is optional; discount % is calculated automatically.</DialogDescription>
            </DialogHeader>
            {editing && (
              <form onSubmit={save} className="space-y-6 text-sm pt-2">
                {/* Basic */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Package className="h-3.5 w-3.5" /> Basic info</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Product name *</label>
                      <input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        className="mt-1 w-full h-10 px-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">URL slug</label>
                      <input placeholder="auto-generated from name" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                        className="mt-1 w-full h-10 px-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Short description</label>
                    <input value={editing.short_description ?? ""} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })}
                      className="mt-1 w-full h-10 px-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Full description</label>
                    <textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                      className="mt-1 w-full min-h-28 p-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
                  </div>
                </section>

                {/* Pricing */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Percent className="h-3.5 w-3.5" /> Pricing & stock</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Regular price (Rs.) *</label>
                      <input required type="number" min="0" step="any" value={editing.price}
                        onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                        className="mt-1 w-full h-10 px-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
                      <p className="text-[10px] text-muted-foreground mt-1">Original / MRP price</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Sale price (Rs.)</label>
                      <input type="number" min="0" step="any" value={editing.sale_price ?? ""}
                        onChange={(e) => setEditing({ ...editing, sale_price: e.target.value || null })}
                        className="mt-1 w-full h-10 px-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
                      <p className="text-[10px] text-muted-foreground mt-1">Discounted selling price</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Stock *</label>
                      <input required type="number" min="0" value={editing.stock}
                        onChange={(e) => setEditing({ ...editing, stock: e.target.value })}
                        className="mt-1 w-full h-10 px-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
                      <p className="text-[10px] text-muted-foreground mt-1">Units available</p>
                    </div>
                  </div>
                  {discountPct > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-accent/30">
                      <span className="inline-flex items-center justify-center h-9 px-3 rounded-full bg-destructive text-destructive-foreground text-sm font-medium">
                        -{discountPct}% OFF
                      </span>
                      <div className="text-xs">
                        <div>Customer saves <span className="font-medium text-foreground">Rs. {(Number(editing.price) - Number(editing.sale_price)).toLocaleString()}</span></div>
                        <div className="text-muted-foreground">Showing as Rs. {Number(editing.sale_price).toLocaleString()} <span className="line-through ml-1">Rs. {Number(editing.price).toLocaleString()}</span></div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Images */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5" /> Product images <span className="normal-case text-[10px] text-muted-foreground">(first is main / cover)</span></h3>
                  <div className="flex flex-wrap gap-3">
                    {[editing.image_url, ...(editing.images ?? [])].filter(Boolean).map((url: string, idx: number) => (
                      <div key={url + idx} className="relative h-24 w-24 rounded-lg overflow-hidden bg-secondary border border-border group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {idx === 0 && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-accent text-accent-foreground text-[9px] uppercase font-semibold">Main</span>}
                        <button type="button" onClick={() => {
                          if (idx === 0) {
                            const rest = editing.images ?? [];
                            setEditing({ ...editing, image_url: rest[0] ?? "", images: rest.slice(1) });
                          } else {
                            const rest = [...(editing.images ?? [])];
                            rest.splice(idx - 1, 1);
                            setEditing({ ...editing, images: rest });
                          }
                        }} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                        {idx !== 0 && (
                          <button type="button" onClick={() => {
                            const rest = [...(editing.images ?? [])];
                            const [pick] = rest.splice(idx - 1, 1);
                            const oldMain = editing.image_url;
                            setEditing({ ...editing, image_url: pick, images: oldMain ? [oldMain, ...rest] : rest });
                          }} className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-background/95 text-[9px] opacity-0 group-hover:opacity-100">
                            Set main
                          </button>
                        )}
                      </div>
                    ))}
                    <label className="h-24 w-24 rounded-lg border-2 border-dashed border-border hover:border-accent cursor-pointer flex flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground bg-secondary/40">
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Add image"}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                        const list = e.target.files; if (!list?.length) return;
                        setUploading(true);
                        const newUrls: string[] = [];
                        for (const file of Array.from(list)) {
                          const ext = file.name.split(".").pop();
                          const path = `${crypto.randomUUID()}.${ext}`;
                          const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
                          if (upErr) { toast.error(upErr.message); continue; }
                          const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
                          newUrls.push(pub.publicUrl);
                        }
                        setEditing((prev: any) => {
                          if (!prev) return prev;
                          if (!prev.image_url && newUrls.length) {
                            return { ...prev, image_url: newUrls[0], images: [...(prev.images ?? []), ...newUrls.slice(1)] };
                          }
                          return { ...prev, images: [...(prev.images ?? []), ...newUrls] };
                        });
                        setUploading(false);
                        if (newUrls.length) toast.success(`${newUrls.length} image(s) uploaded`);
                        e.currentTarget.value = "";
                      }} />
                    </label>
                  </div>
                  <input placeholder="…or paste an image URL and press Enter to add"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = (e.currentTarget.value || "").trim();
                        if (!val) return;
                        setEditing((prev: any) => {
                          if (!prev.image_url) return { ...prev, image_url: val };
                          return { ...prev, images: [...(prev.images ?? []), val] };
                        });
                        e.currentTarget.value = "";
                      }
                    }}
                    className="w-full h-9 px-3 bg-secondary rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-accent/40" />
                </section>

                {/* Organization */}
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Tag className="h-3.5 w-3.5" /> Organization</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Category</label>
                      <select value={editing.category_id ?? ""} onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
                        className="mt-1 w-full h-10 px-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40">
                        <option value="">— No category —</option>
                        {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Status</label>
                      <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                        className="mt-1 w-full h-10 px-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40">
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Badge / Tag</label>
                      <input placeholder="e.g. Best Seller" value={editing.tag ?? ""}
                        onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
                        className="mt-1 w-full h-10 px-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40" />
                    </div>
                  </div>
                  <div className="flex gap-6 pt-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
                      Featured on homepage
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={editing.is_new} onChange={(e) => setEditing({ ...editing, is_new: e.target.checked })} />
                      Mark as new arrival
                    </label>
                  </div>
                </section>

                <div className="flex justify-end gap-3 pt-2 border-t border-border">
                  <button type="button" onClick={() => setOpen(false)} className="h-10 px-5 rounded-full border border-border hover:bg-secondary text-sm">Cancel</button>
                  <button className="h-10 px-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm shadow-soft">
                    {editing.id ? "Save changes" : "Create product"}
                  </button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total products", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Out of stock", value: stats.outOfStock },
          { label: "On sale", value: stats.onSale },
        ].map((s) => (
          <div key={s.label} className="p-4 bg-card border border-border rounded-xl">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
            <div className="mt-1 text-2xl font-serif">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or slug…"
            className="w-full h-10 pl-10 pr-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/40" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 px-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/40">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Regular</th>
                <th className="px-4 py-3 font-medium">Sale</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No products found.</td></tr>
              )}
              {filtered.map((p) => {
                const pct = p.sale_price && Number(p.price) > 0
                  ? Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100)
                  : 0;
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-secondary overflow-hidden shrink-0">
                          {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.categories?.name ?? "—"}</td>
                    <td className="px-4 py-3">Rs. {Number(p.price).toLocaleString()}</td>
                    <td className="px-4 py-3">{p.sale_price ? `Rs. ${Number(p.sale_price).toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3">
                      {pct > 0
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">-{pct}%</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={p.stock === 0 ? "text-destructive font-medium" : p.stock < 5 ? "text-gold" : ""}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs capitalize ${
                        p.status === "active" ? "bg-green-500/10 text-green-700" :
                        p.status === "draft" ? "bg-muted text-muted-foreground" :
                        "bg-secondary text-muted-foreground"
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(p)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-secondary hover:text-accent" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => del(p.id)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-secondary hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
