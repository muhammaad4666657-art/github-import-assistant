import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEFAULT_HOMEPAGE, saveHomepageSettings, useHomepageSettings, type HomepageSettings } from "@/lib/homepage-settings";
import { compressImage } from "@/lib/compress-image";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

const FIELDS: { key: string; label: string; type?: string; full?: boolean }[] = [
  { key: "site_name", label: "Site name" },
  { key: "business_city", label: "Business city (shown in footer & contact page)" },
  { key: "whatsapp_number", label: "WhatsApp number (no +, e.g. 923264465422)" },
  { key: "contact_phone", label: "Display contact phone" },
  { key: "contact_email", label: "Contact email", type: "email" },
  { key: "shipping_fee", label: "Default shipping fee (Rs.) — fallback", type: "number" },
  { key: "shipping_fee_lahore", label: "Delivery charges — Lahore (Rs.)", type: "number" },
  { key: "shipping_fee_other", label: "Delivery charges — Outside Lahore (Rs.)", type: "number" },
  { key: "hero_headline", label: "Hero headline", full: true },
  { key: "hero_subtext", label: "Hero subtext", full: true },
  { key: "announcement", label: "Top bar announcement", full: true },
  { key: "facebook_url", label: "Facebook URL" },
  { key: "instagram_url", label: "Instagram URL" },
  { key: "tiktok_url", label: "TikTok URL" },
];

function AdminSettings() {
  const [s, setS] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle()
      .then(({ data }) => setS(data ?? { id: 1 }));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("site_settings")
      .upsert({
        ...s,
        id: 1,
        shipping_fee: Number(s.shipping_fee) || 0,
        shipping_fee_lahore: Number(s.shipping_fee_lahore) || 0,
        shipping_fee_other: Number(s.shipping_fee_other) || 0,
        updated_at: new Date().toISOString(),
      });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
  };

  if (!s) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-serif">Site Settings</h1>
      <p className="text-sm text-muted-foreground mt-1">Manage store branding, contact details, shipping fee and social links.</p>

      <form onSubmit={save} className="mt-8 bg-card border border-border rounded-xl p-6 grid sm:grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">{f.label}</label>
            {f.full ? (
              <textarea value={s[f.key] ?? ""} onChange={(e) => setS({ ...s, [f.key]: e.target.value })}
                className="mt-1 w-full min-h-20 p-3 bg-secondary rounded-lg" />
            ) : (
              <input type={f.type ?? "text"} value={s[f.key] ?? ""} onChange={(e) => setS({ ...s, [f.key]: e.target.value })}
                className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg" />
            )}
          </div>
        ))}
        <div className="sm:col-span-2">
          <button disabled={saving} className="h-11 px-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>

      <HomepageCustomizer />
    </div>
  );
}

function HomepageCustomizer() {
  const current = useHomepageSettings();
  const [h, setH] = useState<HomepageSettings>(DEFAULT_HOMEPAGE);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setH(current); }, [current.hero_title, current.hero_subtitle, current.hero_image_url, current.animations_enabled]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    saveHomepageSettings(h);
    setTimeout(() => setSaving(false), 200);
    toast.success("Home page updated — changes are live");
  };

  const reset = () => {
    setH(DEFAULT_HOMEPAGE);
    saveHomepageSettings(DEFAULT_HOMEPAGE);
    toast.success("Home page reset to defaults");
  };

  return (
    <form onSubmit={save} className="mt-8 bg-card border border-border rounded-xl p-6 grid gap-4">
      <div>
        <h2 className="text-xl font-serif">Home Page Customization</h2>
        <p className="text-xs text-muted-foreground mt-1">Live edits — saved locally on this device for instant preview without touching the database.</p>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Hero Title</label>
        <input value={h.hero_title} onChange={(e) => setH({ ...h, hero_title: e.target.value })}
          className="mt-1 w-full h-11 px-4 bg-secondary rounded-lg" placeholder="Crafted Beauty, Delivered with care" />
        <p className="text-[11px] text-muted-foreground mt-1">Tip: use a comma — text after the comma renders in the gold italic style.</p>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Hero Subtitle</label>
        <textarea value={h.hero_subtitle} onChange={(e) => setH({ ...h, hero_subtitle: e.target.value })}
          className="mt-1 w-full min-h-20 p-3 bg-secondary rounded-lg" />
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Hero Image</label>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center justify-center h-11 px-5 rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer text-sm font-medium border border-border">
            {h.hero_image_url ? "Replace image" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const compressed = await compressImage(file, { maxDim: 1920, quality: 0.85 });
                const reader = new FileReader();
                reader.onload = () => setH({ ...h, hero_image_url: String(reader.result) });
                reader.readAsDataURL(compressed);
              }}
            />
          </label>
          {h.hero_image_url && (
            <button type="button" onClick={() => setH({ ...h, hero_image_url: "" })}
              className="h-11 px-4 rounded-lg border border-border hover:bg-secondary text-sm">
              Remove
            </button>
          )}
        </div>
        {h.hero_image_url && (
          <img src={h.hero_image_url} alt="Hero preview" className="mt-3 h-40 w-full object-cover rounded-lg border border-border"
            onError={(e) => ((e.currentTarget.style.display = "none"))} />
        )}
        <p className="text-[11px] text-muted-foreground mt-1">PNG or JPG. Auto-compressed for fast loading.</p>
      </div>

      <label className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary cursor-pointer">
        <div>
          <div className="text-sm font-medium">Enable Animations</div>
          <div className="text-xs text-muted-foreground">Hero stagger, scroll reveals and card hover effects on the home page.</div>
        </div>
        <input type="checkbox" checked={h.animations_enabled}
          onChange={(e) => setH({ ...h, animations_enabled: e.target.checked })}
          className="h-5 w-5 accent-primary" />
      </label>

      <div className="flex flex-wrap gap-3">
        <button disabled={saving} className="h-11 px-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Saving..." : "Save & apply"}
        </button>
        <button type="button" onClick={reset} className="h-11 px-6 rounded-full border border-border hover:bg-secondary text-sm">
          Reset to defaults
        </button>
      </div>
    </form>
  );
}
