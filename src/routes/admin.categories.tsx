import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function AdminCategories() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const blank = { name: "", slug: "", description: "", image_url: "", sort_order: 0 };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...editing, slug: editing.slug || slugify(editing.name), sort_order: Number(editing.sort_order) || 0 };
    const { id, created_at, ...rest } = payload;
    const op = id ? supabase.from("categories").update(rest).eq("id", id) : supabase.from("categories").insert(rest);
    const { error } = await op;
    if (error) toast.error(error.message);
    else { toast.success("Saved"); setOpen(false); load(); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">{rows.length} total</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button onClick={() => { setEditing({ ...blank }); setOpen(true); }}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
              <Plus className="h-4 w-4" /> Add category
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} category</DialogTitle></DialogHeader>
            {editing && (
              <form onSubmit={save} className="space-y-3 text-sm">
                <input required placeholder="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full h-10 px-3 bg-secondary rounded-lg" />
                <input placeholder="slug (auto)" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  className="w-full h-10 px-3 bg-secondary rounded-lg" />
                <textarea placeholder="Description" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full min-h-20 p-3 bg-secondary rounded-lg" />
                <input placeholder="Image URL" value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                  className="w-full h-10 px-3 bg-secondary rounded-lg" />
                <input type="number" placeholder="Sort order" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })}
                  className="w-full h-10 px-3 bg-secondary rounded-lg" />
                <button className="w-full h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3">{c.sort_order}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditing({ ...c }); setOpen(true); }} className="h-8 w-8 inline-flex items-center justify-center hover:text-accent"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(c.id)} className="h-8 w-8 inline-flex items-center justify-center hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
