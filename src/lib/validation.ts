import { z } from "zod";
import { affiliate } from "@/config/affiliate";
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(20).max(5000),
  website: z.string().max(0).optional(),
});
export const newsletterSchema = z.object({
  email: z.email().max(254),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
});
export function validAffiliateUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      (affiliate.allowedDomains as readonly string[]).includes(u.hostname) &&
      !/YOUR_|PLACEHOLDER/i.test(value)
    );
  } catch {
    return false;
  }
}
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
