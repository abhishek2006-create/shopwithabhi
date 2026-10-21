import nextEnv from "@next/env";
import { readFile, writeFile } from "node:fs/promises";
import { createPublicKey } from "node:crypto";
import { spawnSync } from "node:child_process";
import { generateKeyPair, exportJWK } from "jose";

nextEnv.loadEnvConfig(process.cwd());
const deployment = process.env.CONVEX_DEPLOYMENT;
const endpoint = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!deployment?.startsWith("dev:") || !endpoint) {
  throw new Error(
    "Run npx convex dev to configure a development deployment first.",
  );
}
const hostname = new URL(endpoint).hostname;
if (hostname !== `${deployment.slice(4)}.convex.cloud`) {
  throw new Error(
    "CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_URL must select the same deployment.",
  );
}
const updates = {};
const administrator = process.argv
  .find((argument) => argument.startsWith("--admin-email="))
  ?.slice("--admin-email=".length);
if (administrator) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(administrator))
    throw new Error("Provide a valid administrator email.");
  updates.ADMIN_EMAILS = [
    ...new Set(
      [...(process.env.ADMIN_EMAILS || "").split(","), administrator]
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].join(",");
}
let privateJwk;
if (process.env.AUTH_PRIVATE_JWK) {
  privateJwk = JSON.parse(process.env.AUTH_PRIVATE_JWK);
} else {
  const { privateKey } = await generateKeyPair("RS256", { extractable: true });
  privateJwk = {
    ...(await exportJWK(privateKey)),
    kid: "shopwithabhi-1",
    alg: "RS256",
    use: "sig",
  };
  updates.AUTH_PRIVATE_JWK = JSON.stringify(privateJwk);
}
if (privateJwk.kty !== "RSA" || !privateJwk.d || !privateJwk.kid) {
  throw new Error("AUTH_PRIVATE_JWK must contain a private RSA JWK and kid.");
}
const publicJwk = {
  ...createPublicKey({ key: privateJwk, format: "jwk" }).export({
    format: "jwk",
  }),
  kid: privateJwk.kid,
  alg: "RS256",
  use: "sig",
};
const derivedJwks = `data:text/plain;charset=utf-8;base64,${Buffer.from(JSON.stringify({ keys: [publicJwk] })).toString("base64")}`;
if (!process.env.AUTH_JWKS) updates.AUTH_JWKS = derivedJwks;
else {
  const prefix = "data:text/plain;charset=utf-8;base64,";
  if (!process.env.AUTH_JWKS.startsWith(prefix))
    throw new Error("AUTH_JWKS must use the generated public JWKS data URI.");
  const publicKeys = JSON.parse(
    Buffer.from(process.env.AUTH_JWKS.slice(prefix.length), "base64").toString(
      "utf8",
    ),
  );
  if (
    !publicKeys.keys?.some(
      (key) =>
        key.kid === publicJwk.kid &&
        key.n === publicJwk.n &&
        key.e === publicJwk.e,
    )
  ) {
    throw new Error(
      "AUTH_JWKS does not match AUTH_PRIVATE_JWK. Correct the key pair before deploying.",
    );
  }
}
const values = { ...process.env, ...updates };
if (
  !values.AUTH_ISSUER ||
  !values.FORM_GATEWAY_SECRET ||
  values.FORM_GATEWAY_SECRET.length < 32
) {
  throw new Error(
    "Set AUTH_ISSUER and a FORM_GATEWAY_SECRET of at least 32 characters in .env.local.",
  );
}
if (Object.keys(updates).length) {
  let source = await readFile(".env.local", "utf8");
  for (const [name, value] of Object.entries(updates)) {
    const line = `${name}='${value}'`;
    const pattern = new RegExp(`^${name}=.*$`, "m");
    source = pattern.test(source)
      ? source.replace(pattern, () => line)
      : `${source}\n${line}\n`;
  }
  await writeFile(".env.local", source);
  console.log(
    `Filled missing local configuration: ${Object.keys(updates).join(", ")}. Values are not displayed.`,
  );
}
const backendNames = [
  "AUTH_ISSUER",
  "AUTH_JWKS",
  "FORM_GATEWAY_SECRET",
  "AFFILIATE_CLICK_TRACKING",
  "ADMIN_EMAILS",
];
for (const name of backendNames) {
  if (!values[name]) continue;
  const result = spawnSync(
    process.execPath,
    ["node_modules/convex/bin/main.js", "env", "set", name],
    {
      input: `${values[name]}\n`,
      encoding: "utf8",
      env: values,
      windowsHide: true,
    },
  );
  if (result.status !== 0)
    throw new Error(
      `Could not configure ${name} on Convex. Check CLI login and deployment access.`,
    );
  console.log(`Configured Convex ${name}.`);
}
const deploy = spawnSync(
  process.execPath,
  ["node_modules/convex/bin/main.js", "dev", "--once", "--typecheck", "enable"],
  {
    stdio: "inherit",
    env: values,
    windowsHide: true,
  },
);
if (deploy.status !== 0) process.exit(deploy.status || 1);
console.log(
  "Backend functions deployed. Restart Next.js to load local signing configuration.",
);
