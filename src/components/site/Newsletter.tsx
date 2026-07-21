export function Newsletter() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 text-center">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-gradient-gold opacity-30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-gradient-gold opacity-20 blur-3xl" />
        <div className="relative">
          <div className="text-xs tracking-[0.3em] text-gold uppercase">Join the ritual</div>
          <h2 className="mt-3 text-4xl md:text-5xl font-serif">10% off your first order</h2>
          <p className="mt-4 text-primary-foreground/70 max-w-lg mx-auto">
            Subscribe for early access to new launches, exclusive offers, and skincare rituals from ALM.
          </p>
          <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" required placeholder="Your email address"
              className="flex-1 h-12 px-5 rounded-full bg-background/10 border border-primary-foreground/20 placeholder:text-primary-foreground/50 focus:outline-none focus:border-accent" />
            <button className="h-12 px-7 rounded-full bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity">
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
