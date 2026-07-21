import { Link } from "@tanstack/react-router";

const cats = [
  { name: "Skincare", slug: "skincare", icon: "✦" },
  { name: "Home Care", slug: "home-care", icon: "❋" },
  { name: "Fragrances", slug: "fragrances", icon: "✺" },
  { name: "Hair Care", slug: "hair-care", icon: "✿" },
];

export function Categories() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <div className="text-xs tracking-[0.3em] text-gold uppercase">Shop by</div>
        <h2 className="mt-3 text-4xl md:text-5xl font-serif">Categories</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cats.map((c) => (
          <Link
            key={c.slug}
            to="/products"
            search={{ category: c.slug }}
            className="group relative p-8 bg-secondary rounded-2xl text-left hover-lift overflow-hidden block"
          >
            <div className="text-4xl text-gold mb-4">{c.icon}</div>
            <div className="font-serif text-2xl">{c.name}</div>
            <div className="mt-6 text-sm tracking-wider text-foreground/70 group-hover:text-accent transition-colors">
              Explore →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
