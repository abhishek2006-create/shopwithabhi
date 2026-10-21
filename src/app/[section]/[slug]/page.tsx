import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getContent, getSettings } from "@/lib/data";
import { cleanHtml } from "@/lib/sanitize";
import { contentPath } from "@/lib/routes";
import { SaveButton } from "@/components/save-button";
import { ContentCard } from "@/components/content-card";
import { affiliate } from "@/config/affiliate";
import { publicOrigin } from "@/config/site";
import { AffiliateButton } from "@/components/affiliate-button";
import { ReadingProgress } from "@/components/reading-progress";
import { Reveal } from "@/components/reveal";
export const dynamic = "force-dynamic";
const kinds: Record<string, string> = {
  products: "product",
  guides: "guide",
  blog: "article",
  compare: "comparison",
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { section, slug } = await params;
  if (!kinds[section]) return {};
  const item = await getContent(slug);
  if (!item || item.kind !== kinds[section]) return {};
  return {
    title: item.seoTitle || item.title,
    description: item.seoDescription || item.excerpt,
    alternates: { canonical: contentPath(item) },
    openGraph: {
      title: item.title,
      description: item.excerpt,
      images: item.image ? [item.image] : [],
    },
  };
}
export default async function Detail({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { section, slug } = await params;
  if (!kinds[section]) notFound();
  const item = await getContent(slug);
  if (!item || item.kind !== kinds[section]) notFound();
  const settings = await getSettings();
  const disclosure = settings.affiliateDisclosure || affiliate.disclosure;
  const html = cleanHtml(item.body);
  let headingCount = 0;
  const toc: Array<{ id: string; title: string }> = [];
  const body = html.replace(/<h([23])>(.*?)<\/h\1>/g, (_, level, text) => {
    const id = `section-${++headingCount}`;
    toc.push({ id, title: text.replace(/<[^>]*>/g, "") });
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
  const minutes = Math.max(
    1,
    Math.ceil(html.replace(/<[^>]*>/g, " ").split(/\s+/).length / 220),
  );
  const date = (n: number) =>
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeZone: "Asia/Kolkata",
    }).format(n);
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: publicOrigin(),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: item.title,
          item: publicOrigin() + contentPath(item),
        },
      ],
    },
    ...(item.kind === "article" || item.kind === "guide"
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: item.title,
            description: item.excerpt,
            author: { "@type": "Person", name: item.author },
            datePublished: new Date(
              item.publishedAt || item.updatedAt,
            ).toISOString(),
            dateModified: new Date(item.updatedAt).toISOString(),
            image: item.image,
          },
        ]
      : []),
  ];
  const compared = item.related.filter((x) => x?.kind === "product");
  const criteria = Array.from(
    new Set(compared.flatMap((x) => x!.specifications.map((s) => s.label))),
  );
  return (
    <div className="container page-body">
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
        }}
      />
      <div className="breadcrumb">
        <Link href="/">Home</Link>/<Link href={`/${section}`}>{section}</Link>/
        <span>{item.title}</span>
      </div>
      <div className="page-heading">
        <span className="eyebrow">
          {item.kind === "product"
            ? "RESEARCH-BASED PRODUCT REVIEW"
            : item.kind}
        </span>
        <h1>{item.title}</h1>
        <p>{item.excerpt}</p>
      </div>
      <div className="article-meta">
        <span>By {item.author}</span>
        <span>Published {date(item.publishedAt || item.updatedAt)}</span>
        <span>Updated {date(item.updatedAt)}</span>
        <span>{minutes} min read</span>
      </div>
      {item.image && (
        <div className="article-image">
          <Image
            fill
            src={item.image}
            alt={item.imageAlt || item.title}
            sizes="(max-width: 760px) 100vw, 1180px"
            priority
          />
        </div>
      )}
      <Reveal className="article-layout">
        <article>
          <div className="notice">
            {disclosure}{" "}
            <Link href="/affiliate-disclosure">How affiliate links work ↗</Link>
          </div>
          {toc.length > 2 && (
            <nav className="toc" aria-label="Table of contents">
              <strong>In this guide</strong>
              {toc.map((h) => (
                <a key={h.id} href={`#${h.id}`}>
                  {h.title}
                </a>
              ))}
            </nav>
          )}
          <div className="prose" dangerouslySetInnerHTML={{ __html: body }} />
          {item.specifications.length > 0 && (
            <section className="prose">
              <h2>At a glance</h2>
              <table className="specs">
                <tbody>
                  {item.specifications.map((s, i) => (
                    <tr key={i}>
                      <th scope="row">{s.label}</th>
                      <td>{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          {(item.pros.length > 0 || item.cons.length > 0) && (
            <section className="prose">
              <h2>The tradeoffs</h2>
              <div className="pros-cons">
                <div>
                  <h3>What stands out</h3>
                  <ul>
                    {item.pros.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Worth considering</h3>
                  <ul>
                    {item.cons.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}
          {item.audience && (
            <section className="prose">
              <h2>Who is it for?</h2>
              <p>{item.audience}</p>
            </section>
          )}
          {item.kind === "comparison" && compared.length > 0 && (
            <section className="prose">
              <h2>Side by side</h2>
              <div className="table-scroll">
                <table className="specs">
                  <thead>
                    <tr>
                      <th>Criteria</th>
                      {compared.map((p) => (
                        <th key={p!._id}>
                          <Link href={contentPath(p!)}>{p!.title} ↗</Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((label) => (
                      <tr key={label}>
                        <th scope="row">{label}</th>
                        {compared.map((p) => (
                          <td key={p!._id}>
                            {p!.specifications.find((s) => s.label === label)
                              ?.value || "Not provided"}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <th>Best suited to</th>
                      {compared.map((p) => (
                        <td key={p!._id}>{p!.audience || "Not specified"}</td>
                      ))}
                    </tr>
                    <tr>
                      <th>What stands out</th>
                      {compared.map((p) => (
                        <td key={p!._id}>
                          {p!.pros.join("; ") || "See detailed review"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th>Considerations</th>
                      {compared.map((p) => (
                        <td key={p!._id}>
                          {p!.cons.join("; ") || "See detailed review"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th>Retailer links</th>
                      {compared.map((p) => (
                        <td key={p!._id}>
                          <AffiliateButton product={p!} />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <p className="muted">
                  {disclosure} Check the retailer for current price and
                  availability.
                </p>
              </div>
            </section>
          )}
          {item.editorial && (
            <section className="prose">
              <h2>The editorial perspective</h2>
              <p>{item.editorial}</p>
            </section>
          )}
          {item.source && (
            <div className="notice">
              Source: {item.source}
              <br />
              {item.verifiedAt
                ? `Last verified: ${date(item.verifiedAt)}.`
                : "Verification date not recorded."}{" "}
              Research-based content; no hands-on testing is implied. Confirm
              current details with the retailer.
            </div>
          )}
        </article>
        <aside className="article-aside" data-reveal>
          <span className="eyebrow">KEEP IT CONSIDERED</span>
          <h3 style={{ marginTop: 12 }}>Worth coming back to.</h3>
          <p>Keep your favorite reads and product discoveries in one place.</p>
          <SaveButton id={item._id} />
          {item.kind === "product" && (
            <>
              <hr
                style={{
                  border: 0,
                  borderTop: "1px solid var(--border)",
                  margin: "24px 0",
                }}
              />
              <AffiliateButton product={item} />
              <p>
                Check the retailer for current price and availability.{" "}
                {disclosure}
              </p>
            </>
          )}
        </aside>
      </Reveal>
      {item.related.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <h2>Continue exploring.</h2>
          </div>
          <div className="content-grid">
            {item.related.map((r) => r && <ContentCard key={r._id} item={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
