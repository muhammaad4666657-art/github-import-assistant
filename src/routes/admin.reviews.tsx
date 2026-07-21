import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, Check, Trash2, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Admin" }] }),
  component: AdminReviews,
});

function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("reviews")
      .select("*, products(name, slug)")
      .order("created_at", { ascending: false });
    if (filter === "pending") q = q.eq("approved", false);
    if (filter === "approved") q = q.eq("approved", true);
    const { data } = await q;
    setReviews(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const approve = async (id: string) => {
    const { error } = await supabase.from("reviews").update({ approved: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Review approved");
    load();
  };

  const remove = async (r: any) => {
    if (!confirm("Delete this review?")) return;
    // delete media from storage
    const paths = (r.media ?? [])
      .map((m: any) => m.path)
      .filter(Boolean);
    if (paths.length) await supabase.storage.from("review-media").remove(paths);
    const { error } = await supabase.from("reviews").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Review deleted");
    load();
  };

  const removeMedia = async (r: any, idx: number) => {
    const media = [...(r.media ?? [])];
    const [removed] = media.splice(idx, 1);
    if (removed?.path) await supabase.storage.from("review-media").remove([removed.path]);
    const { error } = await supabase.from("reviews").update({ media }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Media removed");
    load();
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-serif">Reviews</h1>
        <div className="flex gap-2">
          {(["pending", "approved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 h-9 rounded-full text-sm capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {loading && <p className="text-muted-foreground text-sm">Loading...</p>}
        {!loading && reviews.length === 0 && (
          <p className="text-muted-foreground text-sm">No reviews in this view.</p>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="p-5 bg-card border border-border rounded-2xl">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-xs text-muted-foreground">
                  Product: <span className="font-medium text-foreground">{r.products?.name ?? "—"}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex text-gold">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-current" : ""}`} />
                    ))}
                  </div>
                  {r.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-green-700">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${r.approved ? "bg-green-500/10 text-green-700" : "bg-amber-500/10 text-amber-700"}`}>
                    {r.approved ? "Approved" : "Pending"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {!r.approved && (
                  <button onClick={() => approve(r.id)} className="h-9 px-3 rounded-lg bg-green-600 text-white text-xs inline-flex items-center gap-1 hover:bg-green-700">
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                )}
                <button onClick={() => remove(r)} className="h-9 px-3 rounded-lg bg-destructive text-destructive-foreground text-xs inline-flex items-center gap-1 hover:bg-destructive/90">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>

            {r.comment && <p className="mt-3 text-sm whitespace-pre-line">{r.comment}</p>}

            {Array.isArray(r.media) && r.media.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {r.media.map((m: any, i: number) => (
                  <div key={i} className="relative">
                    {m.type === "video" ? (
                      <video src={m.url} controls className="h-24 w-24 object-cover rounded-lg bg-secondary" />
                    ) : (
                      <img src={m.url} alt="" className="h-24 w-24 object-cover rounded-lg" />
                    )}
                    <button
                      onClick={() => removeMedia(r, i)}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground text-xs hover:bg-destructive/90"
                      aria-label="Remove media"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
