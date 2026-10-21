import Link from "next/link";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { site } from "@/config/site";
import { affiliate } from "@/config/affiliate";
import { social } from "@/config/social";
export function Footer({
  settings = {},
}: {
  settings?: Record<string, string>;
}) {
  const contactEmail = settings.contactEmail || site.contactEmail;
  const socialLinks =
    settings.socialLinks || Object.values(social).filter(Boolean).join("\n");
  return (
    <footer className="footer store-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="wordmark">
              <ShoppingBag size={24} />
              {settings.siteName && settings.siteName !== site.name ? (
                settings.siteName
              ) : (
                <>ShopWithAbhi</>
              )}
            </Link>
            <p>Better research. Smarter buys.</p>
            {contactEmail &&
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) && (
                <p>
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </p>
              )}
            {socialLinks
              ?.split("\n")
              .filter((u) => /^https:\/\//.test(u))
              .map((u) => (
                <p key={u}>
                  <a href={u} rel="noopener noreferrer" target="_blank">
                    {u.replace(/^https:\/\//, "")} ↗
                  </a>
                </p>
              ))}
          </div>
          <div>
            <h3>Explore</h3>
            <Link href="/products">Product reviews</Link>
            <Link href="/guides">Buying guides</Link>
            <Link href="/compare">Comparisons</Link>
            <Link href="/blog">The journal</Link>
          </div>
          <div>
            <h3>Behind the picks</h3>
            <Link href="/about">About ShopWithAbhi</Link>
            <Link href="/review-methodology">Our methodology</Link>
            <Link href="/editorial-policy">Editorial policy</Link>
            <Link href="/contact">
              Get in touch <ArrowUpRight size={13} />
            </Link>
          </div>
          <div>
            <h3>The small print</h3>
            <Link href="/affiliate-disclosure">Affiliate disclosure</Link>
            <Link href="/privacy-policy">Privacy policy</Link>
            <Link href="/terms">Terms & conditions</Link>
            <Link href="/cookie-policy">Cookie policy</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {site.copyrightStart} {settings.siteName || site.name}
          </span>
          <p>
            {settings.affiliateDisclosure || affiliate.disclosure} Product
            details should always be checked with the retailer.
          </p>
          <span>Made for considered choices ↗</span>
        </div>
      </div>
    </footer>
  );
}
