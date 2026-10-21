import { generateKeyPair, exportJWK } from "jose";
import { writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
const { privateKey, publicKey } = await generateKeyPair("RS256", {
  extractable: true,
});
const privateJwk = {
  ...(await exportJWK(privateKey)),
  kid: "shopwithabhi-1",
  alg: "RS256",
  use: "sig",
};
const publicJwk = {
  ...(await exportJWK(publicKey)),
  kid: "shopwithabhi-1",
  alg: "RS256",
  use: "sig",
};
const output = {
  AUTH_PRIVATE_JWK: JSON.stringify(privateJwk),
  AUTH_JWKS: `data:text/plain;charset=utf-8;base64,${Buffer.from(JSON.stringify({ keys: [publicJwk] })).toString("base64")}`,
  NEXTAUTH_SECRET: randomBytes(32).toString("hex"),
  FORM_GATEWAY_SECRET: randomBytes(32).toString("hex"),
};
await writeFile("auth-keys.local.json", JSON.stringify(output, null, 2), {
  flag: "wx",
});
console.log(
  "Created ignored auth-keys.local.json. Copy values to the environments described in README. Do not commit this file.",
);
