import type { UserIdentity } from "convex/server";

export function verifiedProfile(identity: UserIdentity | null) {
  if (!identity) return null;
  const verification = identity.emailVerified ?? identity.email_verified;
  if (
    verification !== true ||
    typeof identity.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)
  )
    return null;
  const picture = identity.pictureUrl ?? identity.picture;
  return {
    email: identity.email.trim().toLowerCase(),
    name:
      typeof identity.name === "string" && identity.name.trim()
        ? identity.name.trim().slice(0, 100)
        : "Reader",
    avatar: typeof picture === "string" ? picture : undefined,
  };
}
