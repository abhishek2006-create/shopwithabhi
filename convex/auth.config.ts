import type { AuthConfig } from "convex/server";
export default {
  providers:
    process.env.AUTH_ISSUER && process.env.AUTH_JWKS
      ? [
          {
            type: "customJwt",
            issuer: process.env.AUTH_ISSUER,
            applicationID: "shopwithabhi",
            algorithm: "RS256",
            jwks: process.env.AUTH_JWKS,
          },
        ]
      : [],
} satisfies AuthConfig;
