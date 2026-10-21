"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          bar.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".article-layout",
              start: "top top",
              end: "bottom bottom",
              scrub: 0.2,
            },
          },
        );
      });
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);
  return <div className="reading-progress" ref={bar} aria-hidden="true" />;
}
