import { execFileSync } from "node:child_process";

const base = process.env.SMOKE_TEST_BASE_URL ?? "http://127.0.0.1:3000";
const token = process.env.SMOKE_OPS_TOKEN ?? "ci-ops-token";

function runCurl(args) {
  const curlBinary = process.platform === "win32" ? "curl.exe" : "curl";
  return execFileSync(curlBinary, args, { encoding: "utf8" });
}

function runPost(path, payload) {
  return runCurl([
    "--silent",
    "--show-error",
    "--request",
    "POST",
    "--header",
    "Content-Type: application/json",
    "--header",
    `x-ops-token: ${token}`,
    "--data",
    JSON.stringify(payload),
    `${base}${path}`,
  ]);
}

try {
  const response = runPost("/api/ops/sources", {
    action: "sync-preview",
    sourceType: "custom",
    sourceIdentifier: "https://careers.example.com",
    companyName: "Example Co",
    limit: 3,
  });

  const json = JSON.parse(response);
  if (!json.ok) {
    throw new Error(json.error ?? "sync-preview failed");
  }

  console.log(`[ok] sync-preview custom source fetched=${json.fetched}`);
  process.exit(0);
} catch (error) {
  console.error("[error] sync-preview smoke test failed", error);
  process.exit(1);
}
