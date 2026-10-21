import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BookOpen } from "lucide-react";
import type { Doc } from "../../convex/_generated/dataModel";
import { contentPath } from "@/lib/routes";
export function ContentCard({
  item,
  variant = "standard",
}: {
  item: Doc<"content">;
  variant?: "standard" | "shop";
}) {
  return (
    <article
      className={`content-card ${variant === "shop" ? `shop-content-card shop-card-${item.kind}` : ""}`}
      data-reveal
    >
      <Link href={contentPath(item)} className="card-image">
        {variant === "shop" && item.featured && (
          <span className="shop-featured-label">Featured</span>
        )}
        {item.image ? (
          <Image
            src={item.image}
            alt={item.imageAlt || item.title}
            fill
            sizes="(max-width: 700px) 100vw, 33vw"
          />
        ) : (
          <div className="image-placeholder">
            <BookOpen size={44} />
            <span>ShopWithAbhi editorial</span>
          </div>
        )}
      </Link>
      <div className="card-copy">
        <span className="eyebrow">
          {item.kind === "product" ? "Product review" : item.kind}
        </span>
        <h3>
          <Link href={contentPath(item)}>{item.title}</Link>
        </h3>
        <p>{item.excerpt}</p>
        <Link
          className={
            variant === "shop" && item.kind === "product"
              ? "button"
              : "text-link"
          }
          href={contentPath(item)}
        >
          {variant === "shop"
            ? {
                product: "Read review",
                guide: "Read guide",
                article: "Read article",
                comparison: "Compare options",
              }[item.kind]
            : "Take a closer look"}{" "}
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </article>
  );
}
