import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Listing } from "@/components/listing";
import { legal } from "@/config/legal";
import { getSettings } from "@/lib/data";
const collections: Record<
  string,
  {
    title: string;
    description: string;
    kind?: "product" | "article" | "guide" | "comparison";
  }
> = {
  products: {
    title: "Finds with a point of view.",
    description:
      "Research-led product reviews, useful details, and the tradeoffs worth knowing.",
    kind: "product",
  },
  guides: {
    title: "Buy with a little more clarity.",
    description:
      "Practical buying guides that start with your needs, not a shopping list.",
    kind: "guide",
  },
  blog: {
    title: "The journal.",
    description:
      "Ideas, observations, and practical notes for better everyday living.",
    kind: "article",
  },
  compare: {
    title: "The differences that matter.",
    description:
      "Thoughtful comparisons to help you choose what works for you.",
    kind: "comparison",
  },
  search: {
    title: "Find your next favorite.",
    description:
      "Explore products, buying guides, comparisons, and the journal.",
  },
};
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const item = collections[section] || legal[section];
  return {
    title: item?.title || "Not found",
    alternates: { canonical: `/${section}` },
    robots: section === "search" ? { index: false, follow: true } : undefined,
  };
}
export default async function Section({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{
    q?: string;
    sort?: string;
    cursor?: string;
    category?: string;
  }>;
}) {
  const { section } = await params;
  const collection = collections[section];
  if (collection)
    return (
      <Listing
        {...collection}
        params={await searchParams}
        path={`/${section}`}
      />
    );
  const policy = legal[section];
  if (!policy) notFound();
  const settings = await getSettings();
  return (
    <div className="container page-body">
      <div className="page-heading">
        <span className="eyebrow">
          {section === "about" ? "BEHIND THE PICKS" : "TRANSPARENCY MATTERS"}
        </span>
        <h1>{policy.title}</h1>
      </div>
      <div className="prose">
        <div className="notice">
          Draft content — owner review required before publication. Business
          details and applicable policies have not been finalized.
        </div>
        {(settings[`legal:${section}`] || policy.body)
          .split("\n")
          .filter(Boolean)
          .map((p, i) => (
            <p key={i}>{p}</p>
          ))}
      </div>
    </div>
  );
}
