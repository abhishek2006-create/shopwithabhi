"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  Search,
  ShieldCheck,
  GitCompareArrows,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import gsap from "gsap";

export function ShoppingHero({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.fromTo(
          "[data-hero-reveal]",
          { y: 22, opacity: 0.55 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.11,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
        );
        gsap.fromTo(
          ".shopping-hero-photo",
          { scale: 1.045 },
          {
            scale: 1,
            duration: 1.8,
            ease: "power2.out",
            clearProps: "transform",
          },
        );
      }, section);
      return () => context.revert();
    });
    return () => media.revert();
  }, []);
  return (
    <section
      className="shopping-hero"
      ref={section}
      aria-labelledby="shopping-hero-title"
    >
      <div className="shopping-hero-photo">
        <Image
          src="/editorial/shopping-hero.png"
          alt="Illustrative workspace with an unbranded laptop and headphones on a sunlit desk"
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="shopping-hero-wash" />
      <div className="container shopping-hero-inner">
        <div className="shopping-hero-copy">
          <span className="eyebrow" data-hero-reveal>
            SMARTER SHOPPING STARTS HERE
          </span>
          <h1 id="shopping-hero-title" data-hero-reveal>
            {title || (
              <>
                Find the right products
                <br />
                for your life.
              </>
            )}
          </h1>
          <p data-hero-reveal>
            {description ||
              "Thoughtful reviews, clear comparisons, and practical buying guides. Find what fits your life—with a little less guesswork."}
          </p>
          <form
            className="shopping-hero-search"
            action="/search"
            role="search"
            aria-label="Product discovery"
            data-hero-reveal
          >
            <label className="sr-only" htmlFor="hero-search">
              Search products, categories or guides
            </label>
            <Search size={19} aria-hidden="true" />
            <input
              id="hero-search"
              name="q"
              maxLength={100}
              placeholder="Search products, categories or guides…"
            />
            <button className="button">
              Search <ArrowRight size={16} />
            </button>
          </form>
          <div className="shopping-hero-values" data-hero-reveal>
            <span>
              <ShieldCheck size={17} />
              Clear sources
            </span>
            <span>
              <GitCompareArrows size={17} />
              Smart comparisons
            </span>
            <span>
              <BookOpen size={17} />
              Useful guides
            </span>
          </div>
          <Link href="/guides" className="hero-guide-link" data-hero-reveal>
            Find your buying guide <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
