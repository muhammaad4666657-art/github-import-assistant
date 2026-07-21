import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let cache: any = null;
let pending: Promise<any> | null = null;

export function fetchSiteSettings(): Promise<any> {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;
  pending = (async () => {
    const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    cache = data ?? {};
    pending = null;
    return cache;
  })();
  return pending;
}

export function useSiteSettings() {
  const [s, setS] = useState<any>(cache);
  useEffect(() => { if (!cache) fetchSiteSettings().then((v) => setS(v)); }, []);
  return (s ?? {}) as any;
}
