import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "How long does delivery take?", a: "Orders are delivered within 4 working days across Pakistan. Lahore orders often arrive sooner." },
  { q: "Are your products 100% original?", a: "Yes. Every product is sourced from authorized channels and verified by our team before dispatch." },
  { q: "Do you offer Cash on Delivery?", a: "Absolutely. COD is available nationwide with no additional fees beyond city-based shipping." },
  { q: "Can I track my order?", a: "Yes, use the Track Order page with your order ID or contact us on WhatsApp for a live update." },
  { q: "How do I contact customer support?", a: "Chat with our AI assistant Abdullah on the site, message us on WhatsApp, or use the Contact page." },
  { q: "Do you ship outside Lahore?", a: "Yes — we deliver across all of Pakistan. Shipping fees adjust automatically at checkout based on your city." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-20 md:py-28 bg-secondary/40">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">Answers</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-serif">Frequently asked</h2>
          <div className="mt-4 mx-auto h-px w-16 bg-primary/40" />
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="rounded-2xl bg-white border border-border overflow-hidden transition-all">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition"
                >
                  <span className="font-medium text-foreground">{f.q}</span>
                  {isOpen ? <Minus className="h-4 w-4 text-primary shrink-0" /> : <Plus className="h-4 w-4 text-primary shrink-0" />}
                </button>
                <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
