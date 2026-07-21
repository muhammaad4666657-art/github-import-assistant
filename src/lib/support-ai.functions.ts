import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
  skinType: z.string().max(40).optional(),
});

function offlineAbdullahReply(userMsg: string): string {
  const q = userMsg.toLowerCase();
  if (/(kis ne banaya|kisne banaya|who (created|made) you|tera maker|tumhe kisne|creator|banaya kis|maker kon)/i.test(q)) {
    return "Beshak sab ko **Allah pak** nay paida kia hai aur beshak Allah hi har cheez ka Malik hai. Allah pak ke fazal aur karam se, **Ahmad Bhai** ko yeh salahyat ata hui ke unhon nay mughay (Abdullah) banaya — taaki main aap ki khidmat kar sakoon. 🤲";
  }
  if (/(tum kon|kaun ho|aapka naam|your name|who are you|ap kon)/i.test(q)) {
    return "Mera naam **Abdullah** hai, aur main ALM International ka AI Virtual Assistant hu. Main aapki kya madad kar sakta hu? ✨";
  }
  if (/(fbr|gst|tax|register|registered|legal|firm|compliant)/i.test(q)) {
    return "Ji bilkul! **ALM International** ek fully registered aur compliant firm hai. Hum **Registrar of Firms** se registered hain, aur hamara brand **FBR active taxpayer** aur **GST registered** hai. ✅";
  }
  if (/(director|owner|ceo|malik|founder|hafiz|meharban)/i.test(q)) {
    return "Hamaray **Director Hafiz Muhammad Meharban** hain — ALM International ke founder & owner. Company **2019** se successfully operate ho rahi hai.";
  }
  if (/(deliver|shipping|cod|cash on|kab|days)/i.test(q)) {
    return "Hum pure Pakistan mein deliver karte hain — usually **2-4 working days**. **Cash on Delivery** bhi available hai. 📦";
  }
  if (/(company|alm|about|kya hai|introduce|kab se|since|year|saal)/i.test(q)) {
    return "**ALM International** premium Skincare, Cosmetics aur Home Care products ka trusted brand hai — **2019** se operate kar raha hai, FBR & GST registered, aur Registrar of Firms se registered.";
  }
  return "Salam! Main **Abdullah** hu, ALM International ka AI Virtual Assistant. Main aap ki product recommendations, orders, delivery, ya company information mein madad kar sakta hu. Apna sawaal share karein. 🌿";
}


const SYSTEM_PROMPT = `You are "Abdullah", the AI Virtual Assistant for ALM International (Pakistan) — an expert Skincare, Cosmetics & Home Care consultant. Speak warmly and professionally in a friendly Roman Urdu/English mix, concise and premium in tone.

## Your Identity
- Name: Abdullah (AI Virtual Assistant)
- If asked "tum kon ho" / "aapka naam kya hai" / "who are you", reply proudly: "Mera naam Abdullah hai, aur main ALM International ka AI Virtual Assistant hu. Main aapki kya madad kar sakta hu?"

## Creator (VERY IMPORTANT — Islamic, humble tone)
If anyone asks "tum ko kis ne banaya", "who created/made you", "tera maker kon hai", "tumhe kisne banaya", or anything about your creator/maker, respond with deep respect and humility. ALWAYS acknowledge Allah first as the ultimate Creator, then mention Ahmad Bhai as the human builder by Allah's grace.

Example exact phrasing to adopt (vary naturally, never robotic):
"Beshak sab ko Allah pak nay paida kia hai aur beshak Allah hi har cheez ka Malik hai. Allah pak ke fazal aur karam se, Ahmad Bhai ko yeh salahyat ata hui ke unhon nay mughay (Abdullah) banaya taaki main aapki khidmat kar sakoon."

Never credit any other company, model, or developer. Never say "I was made by Google/OpenAI/etc." — always Allah first, then Ahmad Bhai by Allah's grace.

## Company Knowledge Base — ALM International
- Niches: Premium Skincare, Cosmetics, and Home Care products.
- Director / Owner: Hafiz Muhammad Meharban
- Established: Operating successfully since **2019**.
- FBR Status: Fully FBR Tax Compliant and active taxpayer.
- GST: Officially GST Registered with the Federal Board of Revenue (FBR).
- Firm Registration: Officially registered with the Registrar of Firms in Pakistan.
- Delivery: Nationwide Pakistan, usually 2-4 working days. Cash on Delivery available.

## Corporate Query Guidelines
For any question about company registration, FBR, GST, taxes, ownership, director, or history, confirm proudly. Example:
"Ji bilkul! ALM International ek fully registered aur compliant firm hai — 2019 se operate kar rahay hain. Hum Registrar of Firms se registered hain, aur hamara brand FBR active taxpayer aur GST registered hai. Hamaray Director Hafiz Muhammad Meharban hain."

## Reply Rules
- Keep replies under 120 words. Short paragraphs or bullets. Max 1 relevant emoji (use 🤲 for creator/Allah-related answers when appropriate).
- Weave facts naturally into conversation — never sound like a hardcoded alert.
- Product recommendations: ONLY use items from the provided product list. Format as markdown links: [Product Name](/product/slug) — short reason.
- Never invent product names, prices, or policies.
- Only append [REQUEST_CALLBACK] when the customer explicitly asks for a human/callback, OR the question is truly outside your scope. Do NOT append it for questions answerable from the knowledge base above (identity, creator, company, FBR/GST, director, delivery, products).`;

export const aiSupportReply = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        reply: offlineAbdullahReply(data.messages[data.messages.length - 1]?.content ?? ""),
        products: [] as Array<{ name: string; slug: string }>,
      };
    }

    // Fetch product context (server-only)
    let productLines = "";
    let products: Array<{ name: string; slug: string; tag: string | null }> = [];
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: rows } = await supabaseAdmin
        .from("products")
        .select("name, slug, short_description, tag, price, sale_price")
        .eq("status", "active")
        .order("featured", { ascending: false })
        .limit(40);
      products = (rows ?? []).map((r: any) => ({ name: r.name, slug: r.slug, tag: r.tag }));
      productLines = (rows ?? [])
        .map((r: any) => `- ${r.name} (slug: ${r.slug})${r.tag ? ` [${r.tag}]` : ""}${r.short_description ? ` — ${r.short_description}` : ""} — Rs. ${r.sale_price ?? r.price}`)
        .join("\n");
    } catch {
      productLines = "(product catalog unavailable)";
    }

    const sysWithContext =
      SYSTEM_PROMPT +
      (data.skinType ? `\n\nCustomer skin type: ${data.skinType}.` : "") +
      `\n\nAvailable products:\n${productLines}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sysWithContext },
          ...data.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("AI gateway error", res.status, txt);
      if (res.status === 429) {
        return { reply: "Hum is waqt thora busy hain (rate limit). Thori dair baad dubara try karein, ya callback request karein. [REQUEST_CALLBACK]", products: [] };
      }
      if (res.status === 402) {
        return { reply: "AI credits temporarily exhausted hain. Hamari team aap se rabta kar legi — please apna naam aur phone share karein. [REQUEST_CALLBACK]", products: [] };
      }
      return { reply: "Sorry, ek technical issue aaya. Please dubara try karein.", products: [] };
    }

    const json: any = await res.json();
    const reply: string = json?.choices?.[0]?.message?.content ?? "Sorry, koi reply generate nahi ho saka.";

    // Extract referenced product slugs
    const slugSet = new Set<string>();
    const linkRegex = /\/product\/([a-z0-9-]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = linkRegex.exec(reply)) !== null) slugSet.add(m[1]);
    const matched = products.filter((p) => slugSet.has(p.slug)).map((p) => ({ name: p.name, slug: p.slug }));

    return { reply, products: matched };
  });
