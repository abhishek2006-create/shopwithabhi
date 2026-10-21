import { mkdir, writeFile } from "node:fs/promises";

const photos = {
  workspace: "photo-1498050108023-c5249f4df085",
  kitchen: "photo-1556911220-bff31c812dba",
  headphones: "photo-1546435770-a3e426bf472b",
  lifestyle: "photo-1449247709967-d4461a6a6103",
};
await mkdir("public/editorial", { recursive: true });
for (const [name, photo] of Object.entries(photos)) {
  const response = await fetch(
    `https://images.unsplash.com/${photo}?fm=jpg&fit=crop&w=1400&q=82`,
    {
      signal: AbortSignal.timeout(30000),
    },
  );
  if (
    !response.ok ||
    !response.headers.get("content-type")?.startsWith("image/")
  ) {
    throw new Error(`Could not download the ${name} editorial image.`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > 2000000)
    throw new Error(`Unexpectedly large ${name} image.`);
  await writeFile(`public/editorial/${name}.jpg`, bytes);
  console.log(`Saved ${name}.jpg (${Math.round(bytes.length / 1024)} KB).`);
}
