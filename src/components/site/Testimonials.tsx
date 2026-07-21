import { Star } from "lucide-react";

const reviews = [
  { name: "Ayesha K.", city: "Lahore", text: "The Radiance Serum genuinely transformed my skin in three weeks. Packaging feels truly premium.", rating: 5 },
  { name: "Hamza R.", city: "Islamabad", text: "Delivery was super fast and the diffuser smells incredible. ALM is now my go-to.", rating: 5 },
  { name: "Sana M.", city: "Karachi", text: "Original products, beautiful unboxing, and the support team was so helpful with my order.", rating: 5 },
];

export function Testimonials() {
  return (
    <section className="bg-gradient-luxe">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <div className="text-xs tracking-[0.3em] text-gold uppercase">Loved across Pakistan</div>
          <h2 className="mt-3 text-4xl md:text-5xl font-serif">What our customers say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <figure key={r.name} className="bg-background p-8 rounded-2xl shadow-soft border border-border">
              <div className="flex gap-1 text-gold">
                {[...Array(r.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="mt-4 font-serif text-xl leading-relaxed text-foreground/90">
                “{r.text}”
              </blockquote>
              <figcaption className="mt-6 text-sm">
                <div className="font-medium">{r.name}</div>
                <div className="text-muted-foreground">{r.city}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
