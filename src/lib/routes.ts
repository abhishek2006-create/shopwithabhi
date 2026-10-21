export function contentPath(item: { kind: string; slug: string }) {
  return `/${({ product: "products", guide: "guides", article: "blog", comparison: "compare" } as Record<string, string>)[item.kind]}/${item.slug}`;
}
