import "server-only";
import { redirect } from "next/navigation";
import { convexToken } from "./token";
import { db } from "./data";
import { api } from "../../convex/_generated/api";
export async function requireSession(admin = false) {
  const token = await convexToken();
  if (!token) redirect("/signin");
  const client = db();
  if (!client) redirect("/signin?error=Configuration");
  client.setAuth(token);
  let user;
  try {
    await client.mutation(api.users.sync, {});
    user = await client.query(api.users.me, {});
  } catch {
    redirect("/signin?error=AccountConnection");
  }
  if (!user) redirect("/signin?error=AccountUnavailable");
  if (admin && user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
