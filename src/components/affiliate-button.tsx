import { ArrowUpRight } from "lucide-react";
import { affiliate } from "@/config/affiliate";
import { marketplaces } from "@/config/marketplace";
import { validAffiliateUrl } from "@/lib/validation";

export function AffiliateButton({
  product,
}: {
  product: {
    title: string;
    slug: string;
    marketplace: string;
    affiliateUrl?: string;
  };
}) {
  const marketplace =
    marketplaces[product.marketplace as keyof typeof marketplaces];
  if (!product.affiliateUrl || !validAffiliateUrl(product.affiliateUrl))
    return (
      <button className="button" disabled>
        Retailer link coming soon
      </button>
    );
  return (
    <a
      className="button"
      href={`/go/${product.slug}`}
      rel={affiliate.rel}
      target="_blank"
      aria-label={`View ${product.title} on ${marketplace?.name || "Amazon"} (affiliate link, opens in a new tab)`}
    >
      View on {marketplace?.name || "Amazon"} <ArrowUpRight size={16} />
    </a>
  );
}
