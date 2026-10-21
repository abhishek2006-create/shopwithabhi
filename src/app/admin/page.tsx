"use client";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { Reveal } from "@/components/reveal";
import { AdminTeam } from "@/components/admin-team";
export default function Admin() {
  const metrics = useQuery(api.admin.overview, {});
  const content = useQuery(api.admin.contentMetrics, {});
  return (
    <>
      <span className="eyebrow">THE BIG PICTURE</span>
      <h1>Your editorial desk.</h1>
      <p>A clear view of what’s happening at ShopWithAbhi.</p>
      <div className="toolbar">
        <Link className="button" href="/admin/products/new">
          Add a product ↗
        </Link>
        <Link className="button secondary" href="/admin/articles/new">
          Write something new ↗
        </Link>
      </div>
      <Reveal
        className="metric-grid"
        mode="entrance"
        key={metrics && content ? "loaded" : "loading"}
      >
        {metrics ? (
          metrics.map((m) => (
            <div className="metric" key={m.table} data-reveal>
              <strong>
                {m.count}
                {m.capped ? "+" : ""}
              </strong>
              <span>
                {
                  {
                    users: "Registered readers",
                    content: "Content records",
                    categories: "Categories",
                    contactMessages: "Contact messages",
                    newsletterSubscribers: "Newsletter records",
                    affiliateClicks: "Affiliate clicks",
                  }[m.table]
                }
              </span>
            </div>
          ))
        ) : (
          <div className="skeleton" />
        )}
        {content?.map((m) => (
          <div className="metric" key={m.label} data-reveal>
            <strong>
              {m.count}
              {m.capped ? "+" : ""}
            </strong>
            <span>{m.label}</span>
          </div>
        ))}
      </Reveal>
      <div className="notice">
        Metrics are actual database counts, capped at 1,000 per table.
        Newsletter records include unsubscribed addresses. Clicks are not
        purchases or commissions.
      </div>
      <AdminTeam />
      <div className="panel">
        <h3>Before your first publication</h3>
        <p style={{ marginTop: 15 }}>
          Add your categories, document product sources, review legal drafts,
          configure branding, and check each affiliate destination. Products can
          stay in draft without retailer links.
        </p>
      </div>
    </>
  );
}
