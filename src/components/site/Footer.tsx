import { Instagram, Facebook, Mail, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/lib/site-settings";
import logo from "@/assets/alm-logo.png.asset.json";

export function Footer() {
  const settings = useSiteSettings();
  const city = settings.business_city || "Lahore";
  const phone = settings.contact_phone || "+92 326 4465422";
  const cols: { title: string; links: { label: string; to: any }[] }[] = [
    { title: "Shop", links: [
      { label: "All Products", to: "/products" },
      { label: "New Arrivals", to: "/products" },
      { label: "Best Sellers", to: "/products" },
    ]},
    { title: "Support", links: [
      { label: "Contact Us", to: "/contact" },
      { label: "Track Order", to: "/track-order" },
      { label: "My Account", to: "/account" },
    ]},
    { title: "Company", links: [
      { label: "About ALM", to: "/about" },
      { label: "Sign In as Distributor", to: "/distributor/login" },
    ]},
  ];

  return (
    <footer className="relative bg-gradient-to-br from-[oklch(0.22_0.12_268)] via-[oklch(0.28_0.14_268)] to-[oklch(0.2_0.1_268)] text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-4 gap-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-glass">
            <img src={logo.url} alt="ALM International" width={140} height={44} className="h-10 w-auto object-contain" />
          </div>
          <p className="mt-5 text-sm text-primary-foreground/75 max-w-xs leading-relaxed">
            Premium skincare & home care, delivered with care across Pakistan.
          </p>
          <div className="flex gap-3 mt-6">
            {[Instagram, Facebook, Mail].map((I, i) => (
              <a key={i} href="#" className="h-10 w-10 rounded-full glass-dark flex items-center justify-center hover:bg-white hover:text-primary transition-all">
                <I className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <div className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{col.title}</div>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              {col.links.map((l) => (
                <li key={l.label}><Link to={l.to} className="hover:text-accent transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="gold-divider" />
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between gap-3 text-xs text-primary-foreground/60">
        <span>© {new Date().getFullYear()} ALM International. All rights reserved.</span>
        <span className="flex items-center gap-2"><Phone className="h-3 w-3 text-gold" /> {phone} · {city}, Pakistan</span>
      </div>
    </footer>
  );
}
