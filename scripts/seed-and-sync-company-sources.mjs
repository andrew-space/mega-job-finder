import { execFileSync } from "node:child_process";

const base = process.env.OPS_BASE_URL ?? "http://127.0.0.1:3000";
const token = process.env.OPS_TOKEN;

if (!token) {
  console.error("OPS_TOKEN is required");
  process.exit(1);
}

const curlBinary = process.platform === "win32" ? "curl.exe" : "curl";

function post(path, payload) {
  const response = execFileSync(
    curlBinary,
    [
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
    ],
    { encoding: "utf8" }
  );

  return JSON.parse(response);
}

const sources = [
  {
    companyName: "Notion",
    careersUrl: "https://boards.greenhouse.io/notion",
  },
  {
    companyName: "Stripe",
    careersUrl: "https://jobs.lever.co/stripe",
  },
  {
    companyName: "Example Careers",
    careersUrl: "https://careers.example.com/jobs",
  },
];

for (const source of sources) {
  const registered = post("/api/ops/sources", source);
  if (!registered.ok) {
    console.error("Failed to register source", source.companyName, registered.error);
    process.exit(1);
  }
  console.log(`[ok] registered ${source.companyName}`);
}

const synced = post("/api/ops/sources", { action: "sync", limit: 50 });
if (!synced.ok) {
  console.error("Failed to sync sources", synced.error);
  process.exit(1);
}

console.log(
  `[ok] sync complete: fetched=${synced.result.fetched}, inserted=${synced.result.inserted}, updated=${synced.result.updated}`
);
