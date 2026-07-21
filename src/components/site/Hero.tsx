import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useHomepageSettings } from "@/lib/homepage-settings";
import logo from "@/assets/alm-logo.png.asset.json";

export function Hero() {
  const s = useHomepageSettings();

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Soft orbs */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-primary/20 blur-3xl float-slow" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full bg-accent/25 blur-3xl float-slow" style={{ animationDelay: "-3s" }} />

      {/* Particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              animationDelay: `${(i % 6) * 0.7}s`,
              animationDuration: `${8 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32 text-center hero-stagger">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-[11px] tracking-[0.22em] uppercase text-primary font-semibold">
          <Sparkles className="h-3.5 w-3.5" /> Premium Skincare · Est. 2019
        </div>

        {/* Floating logo stage */}
        <div className="relative mx-auto mt-10 w-fit">
          <div className="absolute inset-0 -m-10 rounded-full bg-primary/25 blur-3xl logo-glow" />
          <div className="absolute inset-0 -m-6 rounded-full ring-1 ring-primary/20 animate-[spinSlow_22s_linear_infinite]" />
          <div className="absolute inset-0 -m-16 rounded-full ring-1 ring-primary/10 animate-[spinSlow_36s_linear_infinite_reverse]" />
          <img
            src={logo.url}
            alt="ALM International"
            width={420}
            height={140}
            className="relative w-[240px] md:w-[360px] h-auto object-contain float-logo drop-shadow-[0_20px_60px_rgba(30,42,138,0.35)]"
          />
        </div>

        <h1 className="mt-10 text-4xl md:text-6xl font-serif leading-[1.05] tracking-tight">
          {s.hero_title || "Timeless beauty, crafted for you."}
        </h1>
        <p className="mt-5 mx-auto max-w-xl text-base md:text-lg text-muted-foreground">
          {s.hero_subtitle || "Luxury skincare and home care from ALM International — delivered across Pakistan with care."}
        </p>

        <div className="mt-9 flex flex-wrap gap-3 justify-center">
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 h-12 px-8 rounded-full bg-gradient-royal text-primary-foreground shadow-gold hover:scale-[1.03] hover:shadow-glass transition-all"
          >
            Shop Now
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-full border border-primary/20 bg-white/70 backdrop-blur hover:border-primary hover:text-primary transition-all"
          >
            Our story
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          {[
            { k: "12k+", v: "Happy customers" },
            { k: "100%", v: "Original products" },
            { k: "4-Day", v: "Fast delivery" },
          ].map((st) => (
            <div key={st.v} className="glass rounded-2xl px-4 py-4">
              <div className="font-serif text-2xl md:text-3xl text-primary">{st.k}</div>
              <div className="text-[11px] md:text-xs text-muted-foreground mt-1 uppercase tracking-wider">{st.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
