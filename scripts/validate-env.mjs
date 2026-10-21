import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
if (process.env.VERCEL_ENV !== "production") {
  console.log(
    "Local/preview build: external service credentials are optional.",
  );
} else {
  const required = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_CONVEX_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "AUTH_PRIVATE_JWK",
    "AUTH_ISSUER",
    "FORM_GATEWAY_SECRET",
  ];
  const missing = required.filter(
    (key) => !process.env[key] || /YOUR_|PLACEHOLDER/.test(process.env[key]),
  );
  if (missing.length)
    throw new Error(`Production configuration missing: ${missing.join(", ")}`);
  for (const key of [
    "NEXT_PUBLIC_SITE_URL",
    "NEXTAUTH_URL",
    "AUTH_ISSUER",
    "NEXT_PUBLIC_CONVEX_URL",
  ]) {
    const url = new URL(process.env[key]);
    if (
      url.protocol !== "https:" ||
      /localhost|127\.0\.0\.1/.test(url.hostname)
    )
      throw new Error(`${key} must be a real HTTPS origin.`);
  }
  if (
    new URL(process.env.NEXTAUTH_URL).origin !==
    new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
  )
    throw new Error(
      "NEXTAUTH_URL and NEXT_PUBLIC_SITE_URL must use the same production origin.",
    );
  for (const key of ["NEXTAUTH_SECRET", "FORM_GATEWAY_SECRET"])
    if (process.env[key].length < 32)
      throw new Error(`${key} must contain at least 32 characters.`);
  const privateKey = JSON.parse(process.env.AUTH_PRIVATE_JWK);
  if (privateKey.kty !== "RSA" || !privateKey.d || !privateKey.kid)
    throw new Error(
      "AUTH_PRIVATE_JWK must be a private RSA JWK with a key ID.",
    );
  console.log(
    "Production environment checks passed. Verify matching Convex deployment secrets separately.",
  );
}
