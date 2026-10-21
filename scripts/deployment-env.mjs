/** Resolve public URLs from Vercel's assigned host; never infer signing issuers. */
export function deploymentUrls(env) {
  const hosted = ["production", "preview"].includes(env.VERCEL_ENV);
  const assignedHost =
    env.VERCEL_ENV === "production"
      ? env.VERCEL_PROJECT_PRODUCTION_URL
      : env.VERCEL_URL;
  const assignedOrigin =
    hosted && assignedHost
      ? new URL(`https://${assignedHost}`).origin
      : undefined;
  function resolve(value, fallback) {
    const localOrExample =
      !value ||
      /YOUR_|PLACEHOLDER/i.test(value) ||
      /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?=[:/]|$)/i.test(value);
    return hosted && localOrExample ? fallback || value : value;
  }
  const siteUrl = resolve(env.NEXT_PUBLIC_SITE_URL, assignedOrigin);
  return {
    NEXT_PUBLIC_SITE_URL: siteUrl,
    NEXTAUTH_URL: resolve(env.NEXTAUTH_URL, siteUrl),
  };
}

export function productionErrors(env, beforeDeploy = false) {
  if (env.VERCEL_ENV !== "production") return [];
  const values = { ...env, ...deploymentUrls(env) };
  const errors = [];
  const required = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "AUTH_PRIVATE_JWK",
    "AUTH_ISSUER",
    "FORM_GATEWAY_SECRET",
  ];
  if (!beforeDeploy) required.push("NEXT_PUBLIC_CONVEX_URL");
  for (const key of required) {
    if (!values[key] || /YOUR_|PLACEHOLDER/i.test(values[key]))
      errors.push(`${key} is missing or still contains a placeholder.`);
  }
  const origins = {};
  for (const key of [
    "NEXT_PUBLIC_SITE_URL",
    "NEXTAUTH_URL",
    "AUTH_ISSUER",
    ...(!beforeDeploy ? ["NEXT_PUBLIC_CONVEX_URL"] : []),
  ]) {
    if (!values[key]) continue;
    try {
      const url = new URL(values[key]);
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.port ||
        url.pathname !== "/" ||
        url.search ||
        url.hash ||
        /^(localhost|127\.|\[::1\])/.test(url.hostname) ||
        /YOUR_|PLACEHOLDER/i.test(url.hostname)
      )
        throw new Error();
      origins[key] = url.origin;
    } catch {
      errors.push(
        `${key} must be a public HTTPS origin, without a path, query, or credentials.`,
      );
    }
  }
  if (
    origins.NEXTAUTH_URL &&
    origins.NEXT_PUBLIC_SITE_URL &&
    origins.NEXTAUTH_URL !== origins.NEXT_PUBLIC_SITE_URL
  )
    errors.push(
      "NEXTAUTH_URL and NEXT_PUBLIC_SITE_URL must use the same production origin.",
    );
  for (const key of ["NEXTAUTH_SECRET", "FORM_GATEWAY_SECRET"])
    if (values[key] && values[key].length < 32)
      errors.push(`${key} must contain at least 32 characters.`);
  if (values.AUTH_PRIVATE_JWK) {
    try {
      const key = JSON.parse(values.AUTH_PRIVATE_JWK);
      if (key.kty !== "RSA" || !key.d || !key.kid) throw new Error();
    } catch {
      errors.push(
        "AUTH_PRIVATE_JWK must be valid private RSA JWK JSON with a key ID.",
      );
    }
  }
  if (beforeDeploy && !/^prod:[^|]+\|.+$/.test(values.CONVEX_DEPLOY_KEY || ""))
    errors.push(
      "CONVEX_DEPLOY_KEY must be a production deployment key (prod:…), scoped to Production in Vercel. The development key shown in the failed build must be replaced.",
    );
  return errors;
}
