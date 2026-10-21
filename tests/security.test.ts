import { describe, it, expect } from "vitest";
import {
  validAffiliateUrl,
  contactSchema,
  newsletterSchema,
  slugify,
} from "../src/lib/validation";
import { affiliateAllowed } from "../convex/security";
describe("affiliate destinations", () => {
  for (const value of [
    "https://www.amazon.in/dp/B123?tag=owner-21",
    "https://www.amazon.com/dp/B123",
    "https://amazon.co.uk/example",
  ])
    it(`permits ${value}`, () => {
      expect(validAffiliateUrl(value)).toBe(true);
      expect(affiliateAllowed(value)).toBe(true);
    });
  for (const value of [
    "javascript:alert(1)",
    "http://amazon.in/a",
    "https://amazon.in.evil.com",
    "https://amazon.in@evil.com",
    "https://evil.com@amazon.in",
    "https://amazon.in:8443",
    "https://amzn.to/example",
    "https://www.amazon.in/?tag=YOUR_AMAZON_ASSOCIATE_TAG",
    "//amazon.in",
  ])
    it(`rejects ${value}`, () => {
      expect(validAffiliateUrl(value)).toBe(false);
      expect(affiliateAllowed(value)).toBe(false);
    });
});
it("validates forms and bot traps", () => {
  expect(
    contactSchema.safeParse({
      name: "A",
      email: "invalid",
      subject: "",
      message: "hi",
    }).success,
  ).toBe(false);
  expect(
    newsletterSchema.safeParse({ email: "reader@example.test", consent: false })
      .success,
  ).toBe(false);
  expect(
    newsletterSchema.safeParse({
      email: "reader@example.test",
      consent: true,
      website: "bot",
    }).success,
  ).toBe(false);
});
it("makes stable slugs", () =>
  expect(slugify("  A Better Desk!  ")).toBe("a-better-desk"));
