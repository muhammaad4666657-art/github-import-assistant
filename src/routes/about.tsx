import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — ALM International" }] }),
  component: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <div className="text-xs tracking-[0.3em] text-gold uppercase">Our Story</div>
        <h1 className="mt-3 text-5xl font-serif">About ALM International</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          ALM International is a Pakistan-based premium skincare and home care brand committed to
          bringing world-class quality to every home. We curate original products from trusted
          manufacturers and deliver them with care across the country.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Our mission is simple — make luxury accessible, authentic and delightful.
        </p>
      </main>
      <Footer />
    </div>
  ),
});
