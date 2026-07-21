import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, Phone, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({ meta: [{ title: "Customer Leads — ALM Admin" }] }),
  component: AdminLeads,
});

type Lead = { id: string; name: string; phone: string; message: string; source: string; handled: boolean; created_at: string };

function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from as any)("customer_leads")
      .select("*").order("created_at", { ascending: false }).limit(500);
    if (error) toast.error(error.message);
    setLeads((data ?? []) as Lead[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (l: Lead) => {
    const { error } = await (supabase.from as any)("customer_leads").update({ handled: !l.handled }).eq("id", l.id);
    if (error) return toast.error(error.message);
    setLeads((prev) => prev.map((x) => x.id === l.id ? { ...x, handled: !x.handled } : x));
  };

  const del = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    const { error } = await (supabase.from as any)("customer_leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setLeads((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif flex items-center gap-2"><MessageSquare className="h-5 w-5 text-gold" /> Customer Leads</h1>
        <p className="text-sm text-muted-foreground mt-1">Callback requests captured by the AI assistant.</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">No leads yet.</div>
      ) : (
        <div className="space-y-3">
          {leads.map((l) => (
            <div key={l.id} className={`rounded-xl border bg-card p-4 ${l.handled ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="font-medium">{l.name}</div>
                    <a href={`tel:${l.phone}`} className="text-sm flex items-center gap-1 text-primary hover:underline">
                      <Phone className="h-3.5 w-3.5" /> {l.phone}
                    </a>
                    <span className="text-[10px] uppercase tracking-wider bg-secondary rounded-full px-2 py-0.5 text-muted-foreground">{l.source}</span>
                    {l.handled && <span className="text-[10px] uppercase tracking-wider bg-green-500/15 text-green-700 rounded-full px-2 py-0.5">Handled</span>}
                  </div>
                  <p className="text-sm mt-2 text-foreground/80 whitespace-pre-wrap">{l.message}</p>
                  <div className="text-[11px] text-muted-foreground mt-2">{new Date(l.created_at).toLocaleString()}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => toggle(l)} className={`h-8 w-8 rounded-lg flex items-center justify-center ${l.handled ? "bg-secondary" : "bg-green-500/10 text-green-700 hover:bg-green-500/20"}`} title={l.handled ? "Mark as new" : "Mark handled"}>
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => del(l.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive flex items-center justify-center" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
