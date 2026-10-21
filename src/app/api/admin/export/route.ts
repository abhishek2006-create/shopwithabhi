import { requireSession } from "@/lib/guard";
import { convexToken } from "@/lib/token";
import { db } from "@/lib/data";
import { api } from "../../../../../convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
export async function GET() {
  await requireSession(true);
  const client = db()!;
  client.setAuth((await convexToken())!);
  const lines = ["email,consent_timestamp,source"];
  let cursor: string | null = null;
  const quote = (value: string) =>
    `"${value.replace(/^[=+\-@]/, "'$&").replace(/"/g, '""')}"`;
  for (let page = 0; page < 100; page++) {
    const result: FunctionReturnType<typeof api.admin.list> =
      await client.query(api.admin.list, {
        section: "newsletterSubscribers",
        paginationOpts: { numItems: 200, cursor },
      });
    for (const row of result.page)
      if ("consent" in row && row.consent)
        lines.push(
          [row.email, new Date(row.consentAt).toISOString(), row.source]
            .map(quote)
            .join(","),
        );
    if (result.isDone) break;
    cursor = result.continueCursor;
  }
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": 'attachment; filename="consented-subscribers.csv"',
      "Cache-Control": "no-store",
    },
  });
}
