import serum from "@/assets/product-serum.jpg";
import cream from "@/assets/product-cream.jpg";
import oil from "@/assets/product-oil.jpg";
import diffuser from "@/assets/product-diffuser.jpg";
import hero from "@/assets/hero-skincare.jpg";

const map: Record<string, string> = {
  "product-serum.jpg": serum,
  "product-cream.jpg": cream,
  "product-oil.jpg": oil,
  "product-diffuser.jpg": diffuser,
  "hero-skincare.jpg": hero,
};

export function resolveImage(url?: string | null): string {
  if (!url) return cream;
  if (url.startsWith("http")) return url;
  const filename = url.split("/").pop() ?? "";
  return map[filename] ?? cream;
}
