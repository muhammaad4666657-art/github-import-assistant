import { useEffect, useRef, useState, type ReactNode } from "react";
import { useHomepageSettings } from "@/lib/homepage-settings";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section";
};

export function Reveal({ children, className = "", delay = 0, as = "div" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const { animations_enabled } = useHomepageSettings();

  useEffect(() => {
    if (!animations_enabled) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animations_enabled]);

  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={`reveal ${shown ? "reveal-in" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
