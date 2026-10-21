import nextEnv from "@next/env";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { importJWK, SignJWT } from "jose";

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error(
    "Configure Convex with npx convex dev before running this check.",
  );
}
const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
if (
  !process.exitCode &&
  process.env.AUTH_PRIVATE_JWK &&
  process.env.AUTH_ISSUER
) {
  try {
    const key = JSON.parse(process.env.AUTH_PRIVATE_JWK);
    const token = await new SignJWT({
      email: "configuration-readiness@example.invalid",
      email_verified: true,
    })
      .setProtectedHeader({ alg: "RS256", kid: key.kid })
      .setSubject("configuration-readiness-check")
      .setIssuer(process.env.AUTH_ISSUER)
      .setAudience("shopwithabhi")
      .setIssuedAt()
      .setExpirationTime("1m")
      .sign(await importJWK(key, "RS256"));
    client.setAuth(token);
    const status = await client.query(
      makeFunctionReference("users:connectionStatus"),
      {},
    );
    if (!status.authenticated || !status.verifiedEmail)
      throw new Error("Verified email claim was not recognized.");
    console.log(
      "Convex signing key and verified email claims: ready (read-only check; no account created).",
    );
  } catch {
    console.error(
      "Convex rejected the signing configuration. Check matching AUTH_ISSUER, AUTH_JWKS and AUTH_PRIVATE_JWK.",
    );
    process.exitCode = 1;
  }
}
for (const [name, args] of [
  ["content:settings", {}],
  ["content:categories", {}],
  ["content:list", { paginationOpts: { numItems: 1, cursor: null } }],
]) {
  try {
    await client.query(makeFunctionReference(name), args);
    console.log(`${name}: ready`);
  } catch {
    console.error(
      `${name}: unavailable. Verify the deployment URL and run npm run setup:backend for development, or deploy the backend before launching production.`,
    );
    process.exitCode = 1;
  }
}
