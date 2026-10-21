import "server-only";
import { getServerSession } from "next-auth";
import { importJWK, SignJWT } from "jose";
import { authOptions, authConfigured } from "./auth";
export async function convexToken() {
  if (!authConfigured) return null;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.emailVerified) return null;
  if (!process.env.AUTH_PRIVATE_JWK || !process.env.AUTH_ISSUER)
    throw new Error("Authentication signing configuration is missing.");
  const jwk = JSON.parse(process.env.AUTH_PRIVATE_JWK);
  const key = await importJWK(jwk, "RS256");
  return new SignJWT({
    email: session.user.email,
    email_verified: true,
    name: session.user.name,
    picture: session.user.image,
  })
    .setProtectedHeader({ alg: "RS256", kid: jwk.kid, typ: "JWT" })
    .setSubject(session.user.id)
    .setIssuer(process.env.AUTH_ISSUER)
    .setAudience("shopwithabhi")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}
