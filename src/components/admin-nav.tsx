"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="dashboard-nav" aria-label="Editorial administration">
      <span className="eyebrow">EDITORIAL WORKSPACE</span>
      {[
        ["Overview", ""],
        ["Products", "/products"],
        ["Articles & guides", "/articles"],
        ["Comparisons", "/comparisons"],
        ["Categories", "/categories"],
        ["Readers", "/users"],
        ["Contact inbox", "/messages"],
        ["Newsletter", "/newsletter"],
        ["Site settings", "/settings"],
        ["Audit trail", "/audit"],
      ].map(([label, p]) => (
        <Link
          key={p}
          href={`/admin${p}`}
          className={path === `/admin${p}` ? "active" : ""}
        >
          {label}
        </Link>
      ))}
      <Link href="/dashboard">Your account ↗</Link>
      <Link href="/">View website ↗</Link>
    </nav>
  );
}
