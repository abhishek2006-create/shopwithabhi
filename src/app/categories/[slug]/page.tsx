import { notFound } from "next/navigation";
import { initialCategories } from "@/config/navigation";
import { getCategories } from "@/lib/data";
import { Listing } from "@/components/listing";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await getCategories();
  const category =
    categories.find((c) => c.slug === slug) ||
    initialCategories.find((c) => c.slug === slug);
  return {
    title: category?.title || "Category",
    description:
      category && "seoDescription" in category
        ? category.seoDescription || category.description
        : category?.description,
    alternates: { canonical: `/categories/${slug}` },
  };
}
export default async function Category({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; sort?: string; cursor?: string }>;
}) {
  const { slug } = await params;
  const cats = await getCategories();
  const category = cats.find((c) => c.slug === slug);
  const fallback = !process.env.NEXT_PUBLIC_CONVEX_URL
    ? initialCategories.find((c) => c.slug === slug)
    : null;
  if (!category && !fallback) notFound();
  const chosen = category || fallback!;
  return (
    <Listing
      title={chosen.title}
      description={chosen.description}
      categoryId={category?._id}
      image={category?.image}
      params={await searchParams}
      path={`/categories/${slug}`}
    />
  );
}
