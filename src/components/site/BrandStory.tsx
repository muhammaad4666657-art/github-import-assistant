import { Link } from "@tanstack/react-router";
import logo from "@/assets/alm-logo.png.asset.json";

export function BrandStory() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-royal opacity-15 blur-3xl rounded-full" />
          <div className="relative rounded-3xl overflow-hidden glass p-12 md:p-16 aspect-square grid place-items-center">
            <img src={logo.url} alt="ALM International" className="w-3/4 h-auto object-contain float-logo" />
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">Our story</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-serif leading-tight">Crafted with intent, since 2019.</h2>
          <div className="mt-4 h-px w-16 bg-primary/40" />
          <p className="mt-6 text-muted-foreground leading-relaxed">
            ALM International began with a single belief — that premium skincare and home care should be accessible, honest, and effective. Today we serve thousands of Pakistani homes with curated, authentic products from the world's most trusted names.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Every order is hand-checked in Lahore and shipped nationwide with care. That is the ALM standard.
          </p>
          <Link to="/about" className="mt-8 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition">
            Read our journey
          </Link>
        </div>
      </div>
    </section>
  );
}
