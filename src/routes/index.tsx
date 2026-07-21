import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { TrustBar } from "@/components/site/TrustBar";
import { Categories } from "@/components/site/Categories";
import { Products } from "@/components/site/Products";
import { Testimonials } from "@/components/site/Testimonials";
import { Newsletter } from "@/components/site/Newsletter";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { Reveal } from "@/components/site/Reveal";
import { WhyChoose } from "@/components/site/WhyChoose";
import { BrandStory } from "@/components/site/BrandStory";
import { FAQ } from "@/components/site/FAQ";
import { useHomepageSettings } from "@/lib/homepage-settings";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALM International - Premium Skincare & Home Care in Pakistan" },
      { name: "description", content: "Shop luxury skincare and home care at ALM International. Original products, creams, fragrances..." },
      { property: "og:title", content: "ALM International - Premium Skincare & Home Care" },
      { property: "og:description", content: "Luxury skincare & home care delivered across Pakistan." },
    ],
    script: [
      {
        children: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '862939506871294');
          fbq('track', 'PageView');
        `,
      },
    ],
  }),
  component: Index,
});
function Index() {
  const { animations_enabled } = useHomepageSettings();
  return (
    <div className={`min-h-screen bg-background flex flex-col ${animations_enabled ? "" : "no-anim"}`}>
      <Header />
      <main>
        <Hero />
        <Reveal><TrustBar /></Reveal>
        <Reveal delay={80}><Categories /></Reveal>
        <Reveal delay={60}><Products title="Best Sellers" eyebrow="Loved by thousands" /></Reveal>
        <Reveal delay={60}><Products title="New Arrivals" eyebrow="Just landed" /></Reveal>
        <Reveal><WhyChoose /></Reveal>
        <Reveal><BrandStory /></Reveal>
        <Reveal><Testimonials /></Reveal>
        <Reveal><FAQ /></Reveal>
        <Reveal><Newsletter /></Reveal>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
