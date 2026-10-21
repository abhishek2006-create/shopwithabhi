import { describe, expect, it } from "vitest";
import {
  deploymentUrls,
  productionErrors,
} from "../scripts/deployment-env.mjs";

const production = {
  VERCEL_ENV: "production",
  VERCEL_PROJECT_PRODUCTION_URL: "assigned-project.vercel.app",
  VERCEL_URL: "temporary-build.vercel.app",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXTAUTH_URL: "http://localhost:3000",
  NEXT_PUBLIC_CONVEX_URL: "https://production-backend.convex.cloud",
  NEXTAUTH_SECRET: "s".repeat(32),
  FORM_GATEWAY_SECRET: "g".repeat(32),
  GOOGLE_CLIENT_ID: "test-client",
  GOOGLE_CLIENT_SECRET: "test-secret",
  AUTH_ISSUER: "https://stable-issuer.example.org",
  AUTH_PRIVATE_JWK: JSON.stringify({
    kty: "RSA",
    d: "test-private",
    kid: "test-id",
  }),
  CONVEX_DEPLOY_KEY: "prod:production-backend|test-deployment-key",
};

describe("Vercel deployment configuration", () => {
  it("replaces copied localhost URLs with the assigned stable production domain", () => {
    expect(deploymentUrls(production)).toEqual({
      NEXT_PUBLIC_SITE_URL: "https://assigned-project.vercel.app",
      NEXTAUTH_URL: "https://assigned-project.vercel.app",
    });
    expect(productionErrors(production)).toEqual([]);
    expect(production.AUTH_ISSUER).toBe("https://stable-issuer.example.org");
  });
  it("preserves explicit custom domains and local development", () => {
    expect(
      deploymentUrls({
        ...production,
        NEXT_PUBLIC_SITE_URL: "https://shop.example.org",
        NEXTAUTH_URL: "",
      }),
    ).toEqual({
      NEXT_PUBLIC_SITE_URL: "https://shop.example.org",
      NEXTAUTH_URL: "https://shop.example.org",
    });
    expect(
      deploymentUrls({
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXTAUTH_URL: "http://localhost:3000",
      }).NEXTAUTH_URL,
    ).toBe("http://localhost:3000");
    expect(productionErrors({ VERCEL_ENV: "preview" })).toEqual([]);
  });
  it("does not invent a production domain from a temporary deployment", () => {
    const errors = productionErrors({
      ...production,
      VERCEL_PROJECT_PRODUCTION_URL: "",
    });
    expect(
      errors.some((error) => error.startsWith("NEXT_PUBLIC_SITE_URL")),
    ).toBe(true);
  });
  it("reports configuration errors together without exposing secrets", () => {
    const errors = productionErrors({
      ...production,
      AUTH_ISSUER: "https://user:password@issuer.example.org",
      AUTH_PRIVATE_JWK: "not-json",
      NEXTAUTH_SECRET: "short-secret",
      FORM_GATEWAY_SECRET: "tiny",
    });
    expect(errors).toHaveLength(4);
    expect(errors.join(" ")).not.toContain("short-secret");
    expect(errors.join(" ")).not.toContain("not-json");
  });
  it("rejects mismatched callbacks and URLs containing credentials or paths", () => {
    expect(
      productionErrors({
        ...production,
        NEXTAUTH_URL: "https://different.example.org",
      }).join(" "),
    ).toContain("same production origin");
    for (const value of [
      "https://user:password@shop.example.org",
      "https://shop.example.org/path",
      "not-a-url",
      "https://shop.example.org?query=1",
    ])
      expect(
        productionErrors({ ...production, NEXT_PUBLIC_SITE_URL: value }).join(
          " ",
        ),
      ).toContain("NEXT_PUBLIC_SITE_URL must be");
  });
  it("blocks development keys before deploying but allows Convex to inject its URL", () => {
    expect(
      productionErrors({ ...production, NEXT_PUBLIC_CONVEX_URL: "" }, true),
    ).toEqual([]);
    for (const key of [
      "dev:development-backend|test-key",
      "preview:team:project|test-key",
      "",
    ])
      expect(
        productionErrors({ ...production, CONVEX_DEPLOY_KEY: key }, true).join(
          " ",
        ),
      ).toContain("production deployment key");
  });
  it("builds the frontend against an existing backend without a deploy key", () => {
    for (const key of ["", "dev:existing-backend|test-key"]) {
      expect(
        productionErrors({
          ...production,
          CONVEX_DEPLOY_KEY: key,
          AUTH_ISSUER: "http://localhost:3000",
        }),
      ).toEqual([]);
    }
    expect(
      productionErrors({ ...production, NEXT_PUBLIC_CONVEX_URL: "" }).join(" "),
    ).toContain("NEXT_PUBLIC_CONVEX_URL is missing");
  });
  it("preserves existing issuer identifiers while rejecting malformed issuers", () => {
    for (const issuer of [
      "http://localhost:3000",
      "https://issuer.example.org/auth",
    ]) {
      const config = { ...production, AUTH_ISSUER: issuer };
      expect(productionErrors(config)).toEqual([]);
      expect(config.AUTH_ISSUER).toBe(issuer);
    }
    for (const issuer of [
      "not-a-url",
      "javascript:alert(1)",
      "https://issuer.example.org#fragment",
    ])
      expect(
        productionErrors({ ...production, AUTH_ISSUER: issuer }).join(" "),
      ).toContain("AUTH_ISSUER must be");
  });
});
