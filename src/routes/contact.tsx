import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useSiteSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — ALM International" }] }),
  component: ContactPage,
});

function ContactPage() {
  const s = useSiteSettings();
  const city = s.business_city || "Lahore";
  const phone = s.contact_phone || "+92 326 4465422";
  const wa = s.whatsapp_number || "923264465422";
  const email = s.contact_email || "info@alminternational.pk";
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <div className="text-xs tracking-[0.3em] text-gold uppercase">Get in Touch</div>
        <h1 className="mt-3 text-5xl font-serif">Contact Us</h1>
        <p className="mt-4 text-muted-foreground">We'd love to hear from you. Reach out anytime.</p>

        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          <a href={`https://wa.me/${wa}`} className="p-6 bg-card border border-border rounded-xl hover-lift">
            <Phone className="h-6 w-6 text-gold" />
            <div className="mt-3 font-medium">WhatsApp</div>
            <div className="text-sm text-muted-foreground">{phone}</div>
          </a>
          <a href={`mailto:${email}`} className="p-6 bg-card border border-border rounded-xl hover-lift">
            <Mail className="h-6 w-6 text-gold" />
            <div className="mt-3 font-medium">Email</div>
            <div className="text-sm text-muted-foreground">{email}</div>
          </a>
          <div className="p-6 bg-card border border-border rounded-xl">
            <MapPin className="h-6 w-6 text-gold" />
            <div className="mt-3 font-medium">Location</div>
            <div className="text-sm text-muted-foreground">{city}, Pakistan</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
