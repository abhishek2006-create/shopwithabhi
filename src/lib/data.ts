import "server-only";
import { cache } from "react";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
export const db = () =>
  process.env.NEXT_PUBLIC_CONVEX_URL
    ? new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)
    : null;
export async function getContent(slug: string) {
  return db()?.query(api.content.bySlug, { slug }) ?? null;
}
export const getCategories = cache(async () => {
  return db()?.query(api.content.categories, {}) ?? [];
});
export const getSettings = cache(async () => {
  const rows = (await db()?.query(api.content.settings, {})) ?? [];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
});
export async function getList(
  args: {
    kind?: "product" | "article" | "guide" | "comparison";
    categoryId?: Id<"categories">;
    search?: string;
    sort?: "newest" | "oldest";
    cursor?: string;
  } = {},
) {
  const { cursor, ...rest } = args;
  return (
    db()?.query(api.content.list, {
      ...rest,
      paginationOpts: { numItems: 12, cursor: cursor || null },
    }) ?? { page: [], isDone: true, continueCursor: "" }
  );
}
