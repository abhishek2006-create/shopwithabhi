"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
export function Reveal({
  children,
  className = "",
  mode = "scroll",
}: {
  children: React.ReactNode;
  className?: string;
  mode?: "scroll" | "entrance";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const targets = Array.from(
          ref.current?.querySelectorAll<HTMLElement>("[data-reveal]") || [],
        );
        if (mode === "entrance") {
          gsap.fromTo(
            targets,
            { y: 22, opacity: 0.55 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              stagger: 0.09,
              ease: "power3.out",
              clearProps: "transform,opacity",
            },
          );
        } else {
          targets.forEach((target, index) => {
            gsap.fromTo(
              target,
              { y: 24, opacity: 0.65 },
              {
                y: 0,
                opacity: 1,
                duration: 0.65,
                delay: Math.min((index % 4) * 0.055, 0.16),
                ease: "power2.out",
                immediateRender: false,
                clearProps: "transform,opacity",
                scrollTrigger: {
                  trigger: target,
                  start: "top 94%",
                  once: true,
                },
              },
            );
          });
        }
      }, ref);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, [mode]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
