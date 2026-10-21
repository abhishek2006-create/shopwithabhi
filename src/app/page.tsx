import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Laptop,
  Smartphone,
  CookingPot,
  Watch,
  NotebookPen,
  ShieldCheck,
  GitCompareArrows,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import { initialCategories } from "@/config/navigation";
import { features } from "@/config/feature-flags";
import { getCategories, getList, getSettings } from "@/lib/data";
import { ContentCard } from "@/components/content-card";
import { Newsletter } from "@/components/forms";
import { Reveal } from "@/components/reveal";
import { ShoppingHero } from "@/components/shopping-hero";

export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "/" } };
const categoryIcons = {
  electronics: Headphones,
  "computers-accessories": Laptop,
  "mobile-accessories": Smartphone,
  "home-kitchen": CookingPot,
  lifestyle: Watch,
  productivity: NotebookPen,
};
const categoryArtwork = {
  electronics: 0,
  "computers-accessories": 1,
  "mobile-accessories": 2,
  "home-kitchen": 3,
  lifestyle: 4,
  productivity: 5,
};

export default async function Home() {
  const [categories, products, guides, articles, comparisons, settings] =
    await Promise.all([
      getCategories(),
      getList({ kind: "product" }),
      getList({ kind: "guide" }),
      getList({ kind: "article" }),
      getList({ kind: "comparison" }),
      getSettings(),
    ]);
  const availableCategories = categories.length
    ? categories.toSorted((first, second) => first.order - second.order)
    : process.env.NEXT_PUBLIC_CONVEX_URL
      ? []
      : initialCategories;
  const enabled = (section: string) =>
    !settings.featuredSections ||
    settings.featuredSections
      .split(",")
      .map((value) => value.trim())
      .includes(section);
  const featuredProducts = products.page
    .toSorted(
      (first, second) => Number(second.featured) - Number(first.featured),
    )
    .slice(0, 5);
  const updatedGuides = guides.page
    .filter((guide) => guide.publishedAt && guide.updatedAt > guide.publishedAt)
    .slice(0, 3);
  return (
    <div className="shopping-home">
      <ShoppingHero
        title={settings.heroTitle}
        description={settings.heroDescription}
      />
      <div className="container shop-content">
        {availableCategories.length > 0 && (
          <section
            className="shop-section"
            id="shop-categories"
            aria-labelledby="shop-categories-title"
          >
            <SectionHeading
              id="shop-categories-title"
              title="Shop by category"
              description="Explore the everyday essentials that fit your life."
              href="/search"
              link="Explore all categories"
            />
            <Reveal className="shop-category-grid">
              {availableCategories.map((category) => {
                const Icon =
                  categoryIcons[category.slug as keyof typeof categoryIcons] ||
                  Sparkles;
                const categoryImage = "image" in category ? category.image : "";
                const artwork =
                  categoryArtwork[
                    category.slug as keyof typeof categoryArtwork
                  ];
                return (
                  <Link
                    href={`/categories/${category.slug}`}
                    className="shop-category-card"
                    key={category.slug}
                    data-reveal
                  >
                    <div
                      className={`shop-category-visual category-${category.slug}`}
                    >
                      {categoryImage ? (
                        <Image
                          src={categoryImage}
                          alt=""
                          fill
                          sizes="(max-width: 600px) 45vw, 16vw"
                        />
                      ) : artwork !== undefined ? (
                        <span className="shop-category-art" aria-hidden="true">
                          <Image
                            src="/editorial/category-artwork.png"
                            alt=""
                            width={2172}
                            height={724}
                            sizes="540px"
                            style={{ left: -artwork * 90 }}
                          />
                        </span>
                      ) : (
                        <Icon size={57} strokeWidth={1.05} aria-hidden="true" />
                      )}
                    </div>
                    <h3>{category.title}</h3>
                    <span>
                      Explore collection <ArrowRight size={14} />
                    </span>
                  </Link>
                );
              })}
            </Reveal>
          </section>
        )}
        {enabled("products") && (
          <section
            className="shop-section"
            aria-labelledby="featured-reviews-title"
          >
            <SectionHeading
              id="featured-reviews-title"
              title="Featured product reviews"
              description="Useful details and clear tradeoffs. Find what works for you."
              href="/products"
              link="View all reviews"
            />
            {featuredProducts.length ? (
              <Reveal className="shop-product-grid">
                {featuredProducts.map((item) => (
                  <ContentCard key={item._id} item={item} variant="shop" />
                ))}
              </Reveal>
            ) : (
              <Reveal>
                <div className="shop-review-intro" data-reveal>
                  <div className="review-intro-visual" aria-hidden="true">
                    <Headphones size={80} strokeWidth={1} />
                    <span>
                      <ShieldCheck size={25} />
                    </span>
                  </div>
                  <div>
                    <span className="eyebrow">
                      CONSIDERED PICKS. CLEAR PERSPECTIVE.
                    </span>
                    <h3>Good recommendations start with good research.</h3>
                    <p>
                      Our first reviews are being prepared. In the meantime, see
                      what goes into a recommendation before it earns a place
                      here.
                    </p>
                    <Link className="button" href="/review-methodology">
                      How we review <ArrowRight size={16} />
                    </Link>
                  </div>
                  <div className="review-principles">
                    <span>
                      <ClipboardCheck size={18} />
                      Sources you can check
                    </span>
                    <span>
                      <GitCompareArrows size={18} />
                      Tradeoffs that matter
                    </span>
                    <span>
                      <ShieldCheck size={18} />
                      Clear affiliate disclosures
                    </span>
                  </div>
                </div>
              </Reveal>
            )}
          </section>
        )}
        <div className="shop-split-sections">
          {features.comparisons && (
            <section
              className="shop-section"
              aria-labelledby="comparisons-title"
            >
              <SectionHeading
                id="comparisons-title"
                title="Product comparisons"
                description="See how your options stack up, side by side."
                href="/compare"
                link="All comparisons"
              />
              {comparisons.page.length ? (
                <Reveal className="shop-comparison-list">
                  {comparisons.page.slice(0, 2).map((item) => (
                    <ContentCard item={item} key={item._id} variant="shop" />
                  ))}
                </Reveal>
              ) : (
                <Reveal>
                  <Link
                    href="/compare"
                    className="shop-comparison-preview"
                    data-reveal
                  >
                    <div className="comparison-devices" aria-hidden="true">
                      <Laptop size={100} strokeWidth={1} />
                      <span>VS</span>
                      <Laptop size={100} strokeWidth={1} />
                    </div>
                    <h3>The details make the difference.</h3>
                    <p>
                      Compare features, understand the tradeoffs, and decide
                      what matters most to you.
                    </p>
                    <span className="text-link">
                      Explore comparisons <ArrowRight size={15} />
                    </span>
                  </Link>
                </Reveal>
              )}
            </section>
          )}
          {enabled("guides") && (
            <section className="shop-section" aria-labelledby="guides-title">
              <SectionHeading
                id="guides-title"
                title="Buying guides"
                description="A little clarity before your next purchase."
                href="/guides"
                link="All buying guides"
              />
              {guides.page.length ? (
                <Reveal className="shop-guide-grid">
                  {guides.page.slice(0, 3).map((item) => (
                    <ContentCard item={item} key={item._id} variant="shop" />
                  ))}
                </Reveal>
              ) : (
                <Reveal className="shop-guide-starts">
                  {[
                    {
                      title: "Start with your everyday needs",
                      copy: "A better setup starts with what you actually use.",
                      href: "/categories/computers-accessories",
                      image: "/editorial/workspace.jpg",
                      label: "Explore work essentials",
                    },
                    {
                      title: "Make a little more room for ease",
                      copy: "Find the practical additions that fit your home.",
                      href: "/categories/home-kitchen",
                      image: "/editorial/kitchen.jpg",
                      label: "Explore home & kitchen",
                    },
                  ]
                    .filter((entry) =>
                      availableCategories.some((category) =>
                        entry.href.endsWith(category.slug),
                      ),
                    )
                    .map((entry) => (
                      <Link
                        className="shop-guide-start"
                        href={entry.href}
                        key={entry.href}
                        data-reveal
                      >
                        <div>
                          <Image
                            src={entry.image}
                            alt=""
                            fill
                            sizes="(max-width: 700px) 45vw, 23vw"
                          />
                        </div>
                        <span className="eyebrow">COLLECTION SPOTLIGHT</span>
                        <h3>{entry.title}</h3>
                        <p>{entry.copy}</p>
                        <span className="text-link">
                          {entry.label}
                          <ArrowRight size={14} />
                        </span>
                      </Link>
                    ))}
                  {!availableCategories.length && (
                    <div className="shop-quiet-state" data-reveal>
                      <BookOpen size={30} />
                      <h3>Make your next choice a considered one.</h3>
                      <p>Our buying guides are taking shape.</p>
                      <Link className="text-link" href="/guides">
                        Explore buying guides <ArrowRight size={15} />
                      </Link>
                    </div>
                  )}
                </Reveal>
              )}
            </section>
          )}
        </div>
        {enabled("journal") && articles.page.length > 0 && (
          <section className="shop-section" aria-labelledby="articles-title">
            <SectionHeading
              id="articles-title"
              title="Latest articles & insights"
              description="Fresh perspectives for smarter everyday shopping."
              href="/blog"
              link="View all articles"
            />
            <Reveal className="shop-article-grid">
              {articles.page.slice(0, 4).map((item) => (
                <ContentCard item={item} key={item._id} variant="shop" />
              ))}
            </Reveal>
          </section>
        )}
        {enabled("guides") && updatedGuides.length > 0 && (
          <section
            className="shop-section"
            aria-labelledby="updated-guides-title"
          >
            <SectionHeading
              id="updated-guides-title"
              title="Recently updated guides"
              description="Worth another look, with the latest editorial updates."
              href="/guides"
              link="All guides"
            />
            <Reveal className="shop-guide-grid">
              {updatedGuides.map((item) => (
                <ContentCard item={item} key={item._id} variant="shop" />
              ))}
            </Reveal>
          </section>
        )}
      </div>
      {features.newsletter && settings.newsletterEnabled !== "false" && (
        <div className="shop-newsletter-band">
          <div className="container">
            <Newsletter compact />
            <div className="shop-newsletter-trust">
              <span>
                <ShieldCheck size={17} />
                Transparent editorial policy
              </span>
              <Link href="/affiliate-disclosure">
                <ClipboardCheck size={17} />
                Affiliate disclosure
              </Link>
              <Link href="/review-methodology">
                <BookOpen size={17} />
                Our review methodology
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({
  id,
  title,
  description,
  href,
  link,
}: {
  id: string;
  title: string;
  description: string;
  href: string;
  link: string;
}) {
  return (
    <div className="shop-section-heading">
      <div>
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </div>
      <Link href={href} className="text-link">
        {link}
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
