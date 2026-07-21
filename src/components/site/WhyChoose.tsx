import { ShieldCheck, Truck, Sparkles, HeartHandshake, Leaf, BadgeCheck } from "lucide-react";

const items = [
  { icon: BadgeCheck, title: "100% Authentic", desc: "Every product is originally sourced and verified by our team." },
  { icon: Truck, title: "Nationwide Delivery", desc: "Fast 4-day delivery across Pakistan with Cash on Delivery." },
  { icon: ShieldCheck, title: "Secure Checkout", desc: "Encrypted, safe payments and buyer protection at every step." },
  { icon: Sparkles, title: "Dermatologist Loved", desc: "Formulas trusted by professionals and thousands of customers." },
  { icon: Leaf, title: "Skin-Friendly", desc: "Gentle, effective ingredients suitable for sensitive skin." },
  { icon: HeartHandshake, title: "Real Support", desc: "Personal help on WhatsApp & live chat, 7 days a week." },
];

export function WhyChoose() {
  return (
    <section className="py-20 md:py-28 bg-gradient-luxe">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">The ALM promise</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-serif">Why choose ALM</h2>
          <div className="mt-4 mx-auto h-px w-16 bg-primary/40" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group relative rounded-2xl border border-border bg-white p-6 hover-lift">
              <div className="h-12 w-12 rounded-xl bg-gradient-royal grid place-items-center text-primary-foreground shadow-soft">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
