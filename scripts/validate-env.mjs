import nextEnv from "@next/env";
import { productionErrors } from "./deployment-env.mjs";
nextEnv.loadEnvConfig(process.cwd());
const errors = productionErrors(
  process.env,
  process.argv.includes("--before-deploy"),
);
if (errors.length) {
  console.error(
    "Production configuration needs updating:\n" +
      errors.map((error) => `  - ${error}`).join("\n"),
  );
  console.error(
    "Update Vercel → Project → Settings → Environment Variables (Production), then redeploy. See README.md → Vercel deployment. No secret values are printed.",
  );
  process.exitCode = 1;
} else {
  console.log(
    process.env.VERCEL_ENV === "production"
      ? "Production environment checks passed. Verify matching Convex deployment secrets separately."
      : "Local/preview build: external service credentials are optional.",
  );
}
