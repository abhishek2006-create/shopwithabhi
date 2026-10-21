"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  ArrowUpRight,
  Menu,
  X,
  ShoppingBag,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import gsap from "gsap";
import { navigation } from "@/config/navigation";
import { AccountControls } from "./account-controls";

type CategoryLink = { title: string; slug: string; description: string };
export function Header({
  name,
  logo,
  categories = [],
}: {
  name?: string;
  logo?: string;
  categories?: CategoryLink[];
}) {
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const scope = useRef<HTMLElement>(null);
  const categoryButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    setOpen(false);
    setCategoriesOpen(false);
    setSearchOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!searchOpen && dialog.current?.open) dialog.current.close();
  }, [searchOpen]);
  useEffect(() => {
    if (!open && !categoriesOpen && !searchOpen) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          "[data-menu-panel]",
          { y: -9, opacity: 0.65 },
          {
            y: 0,
            opacity: 1,
            duration: 0.24,
            ease: "power2.out",
            clearProps: "transform,opacity",
          },
        );
      }, scope);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, [open, categoriesOpen, searchOpen]);
  useEffect(() => {
    function dismiss(event: MouseEvent) {
      if (scope.current && !scope.current.contains(event.target as Node)) {
        setCategoriesOpen(false);
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  function closeNavigation() {
    setOpen(false);
    setCategoriesOpen(false);
  }
  function openSearch() {
    closeNavigation();
    if (!dialog.current?.open) dialog.current?.showModal();
    setSearchOpen(true);
  }
  return (
    <>
      <div className="announcement">
        <div className="container announcement-inner">
          <span>
            <ShieldCheck size={15} />
            Thoughtful reviews. Clear comparisons. Better buying decisions.
          </span>
          <Link href="/affiliate-disclosure">
            Affiliate disclosure <ArrowRight size={13} />
          </Link>
        </div>
      </div>
      <header
        className="header publication-header store-header"
        ref={scope}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !searchOpen) {
            if (open) menuButton.current?.focus();
            else if (categoriesOpen) categoryButton.current?.focus();
            closeNavigation();
          }
        }}
      >
        <div className="container header-inner">
          <Link href="/" aria-label="ShopWithAbhi home" className="wordmark">
            <span className="logo-mark">
              {logo?.startsWith("/") ? (
                <Image src={logo} alt="" width={23} height={23} />
              ) : (
                <ShoppingBag size={23} />
              )}
            </span>
            {name && name !== "ShopWithAbhi" ? name : <>ShopWithAbhi</>}
          </Link>
          <form
            className="header-search-form"
            action="/search"
            role="search"
            aria-label="Site search"
          >
            <label className="sr-only" htmlFor="header-inline-query">
              Search the website
            </label>
            <input
              id="header-inline-query"
              name="q"
              maxLength={100}
              placeholder="Search products, guides, and more…"
            />
            <button type="submit" aria-label="Search website">
              <Search size={18} />
            </button>
          </form>
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
              Home
            </Link>
            <button
              ref={categoryButton}
              className="nav-category-button"
              aria-expanded={categoriesOpen}
              aria-controls="category-menu"
              onClick={() => {
                setCategoriesOpen(!categoriesOpen);
                setOpen(false);
              }}
            >
              Categories{" "}
              <ChevronDown
                size={13}
                className={categoriesOpen ? "rotated" : ""}
              />
            </button>
            {navigation
              .filter((entry) => entry.href !== "/")
              .map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  aria-current={pathname === entry.href ? "page" : undefined}
                >
                  {entry.label}
                </Link>
              ))}
          </nav>
          <div className="header-actions">
            <button
              className="icon-button search-trigger"
              onClick={openSearch}
              aria-label="Open search"
            >
              <Search size={20} />
            </button>
            <AccountControls onNavigate={closeNavigation} />
            <button
              ref={menuButton}
              className="menu-toggle"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => {
                setOpen(!open);
                setCategoriesOpen(false);
              }}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {categoriesOpen && (
          <div id="category-menu" className="mega-menu" data-menu-panel>
            <div className="container mega-menu-grid">
              <div className="mega-intro">
                <span className="eyebrow">A PLACE FOR EVERY INTEREST</span>
                <h2>
                  What’s on
                  <br />
                  your list?
                </h2>
                <Link
                  className="text-link"
                  href="/search"
                  onClick={closeNavigation}
                >
                  Explore everything <ArrowRight size={16} />
                </Link>
              </div>
              <div className="mega-links">
                {categories.map((c) => (
                  <Link
                    href={`/categories/${c.slug}`}
                    key={c.slug}
                    onClick={closeNavigation}
                  >
                    <strong>
                      {c.title}
                      <ArrowUpRight size={14} />
                    </strong>
                    <span>{c.description}</span>
                  </Link>
                ))}
                {!categories.length && (
                  <p>
                    Categories are being prepared.{" "}
                    <Link href="/search">Browse the publication.</Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {open && (
          <nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label="Mobile navigation"
            data-menu-panel
          >
            <AccountControls placement="mobile" onNavigate={closeNavigation} />
            {navigation.map((n) => (
              <Link onClick={closeNavigation} key={n.href} href={n.href}>
                {n.label}
                <ArrowUpRight size={16} />
              </Link>
            ))}
            <span className="eyebrow">EXPLORE CATEGORIES</span>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                onClick={closeNavigation}
              >
                {c.title}
                <ArrowUpRight size={14} />
              </Link>
            ))}
            <Link href="/dashboard" onClick={closeNavigation}>
              Your reading list
            </Link>
          </nav>
        )}
        <dialog
          ref={dialog}
          className="search-dialog"
          aria-labelledby="search-dialog-title"
          onClose={() => setSearchOpen(false)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="search-dialog-content" data-menu-panel>
            <button
              className="icon-button dialog-close"
              aria-label="Close search"
              onClick={() => setSearchOpen(false)}
            >
              <X />
            </button>
            <span className="eyebrow">GOOD DISCOVERIES START HERE</span>
            <h2 id="search-dialog-title">What’s on your mind?</h2>
            <form action="/search" onSubmit={() => setSearchOpen(false)}>
              <label className="sr-only" htmlFor="header-query">
                Search products and guides
              </label>
              <input
                id="header-query"
                name="q"
                autoFocus
                maxLength={100}
                placeholder="Try headphones, home, or a better desk…"
              />
              <button className="button">
                Search <ArrowRight size={18} />
              </button>
            </form>
            <p>Explore products, guides, comparisons, and the journal.</p>
            <div className="search-suggestions">
              {categories.slice(0, 4).map((c) => (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  onClick={() => setSearchOpen(false)}
                >
                  {c.title} ↗
                </Link>
              ))}
            </div>
          </div>
        </dialog>
      </header>
    </>
  );
}
