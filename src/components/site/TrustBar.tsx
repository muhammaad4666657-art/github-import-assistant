import { Truck, ShieldCheck, BadgeCheck, Headphones } from "lucide-react";

const items = [
  { icon: Truck, title: "Pakistan-wide delivery", desc: "Within 4 days nationwide" },
  { icon: ShieldCheck, title: "Secure payment", desc: "COD & online · 100% safe" },
  { icon: BadgeCheck, title: "Original products", desc: "Authentic & quality assured" },
  { icon: Headphones, title: "WhatsApp support", desc: "We reply within minutes" },
];

export function TrustBar() {
  return (
    <section className="border-y border-border bg-secondary/50">
      <div className="max-w-7xl mx-auto px-4 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {items.map((i) => (
          <div key={i.title} className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-full bg-background flex items-center justify-center text-gold shrink-0 border border-border">
              <i.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">{i.title}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{i.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
