import { useEffect, useState } from "react";

export type HomepageSettings = {
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  animations_enabled: boolean;
};

const KEY = "alm_homepage_settings_v1";

export const DEFAULT_HOMEPAGE: HomepageSettings = {
  hero_title: "Crafted Beauty, Delivered with care",
  hero_subtitle:
    "Premium skincare and home care, curated for the modern Pakistani home. Original formulas, elegant rituals, doorstep delivered nationwide.",
  hero_image_url: "",
  animations_enabled: true,
};

function read(): HomepageSettings {
  if (typeof window === "undefined") return DEFAULT_HOMEPAGE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_HOMEPAGE;
    return { ...DEFAULT_HOMEPAGE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_HOMEPAGE;
  }
}

export function saveHomepageSettings(s: HomepageSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("homepage-settings-changed"));
}

export function useHomepageSettings(): HomepageSettings {
  const [s, setS] = useState<HomepageSettings>(DEFAULT_HOMEPAGE);
  useEffect(() => {
    setS(read());
    const handler = () => setS(read());
    window.addEventListener("homepage-settings-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("homepage-settings-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return s;
}
