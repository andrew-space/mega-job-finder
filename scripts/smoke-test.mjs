import { execFileSync } from "node:child_process";

const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const REQUEST_TIMEOUT_MS = 10000;

function getBaseUrl() {
  const rawBaseUrl = process.env.SMOKE_TEST_BASE_URL ?? DEFAULT_BASE_URL;
  return rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
}

function request(pathname) {
  const marker = "__SMOKE_META__";
  const url = new URL(pathname, getBaseUrl()).toString();
  const curlBinary = process.platform === "win32" ? "curl.exe" : "curl";
  const output = execFileSync(
    curlBinary,
    [
      "--silent",
      "--show-error",
      "--location",
      "--max-time",
      String(Math.ceil(REQUEST_TIMEOUT_MS / 1000)),
      "--write-out",
      `\n${marker}%{http_code}|%{content_type}`,
      url,
    ],
    {
      encoding: "utf8",
    }
  );

  const markerIndex = output.lastIndexOf(`\n${marker}`);
  if (markerIndex === -1) {
    throw new Error(`Missing curl metadata for ${pathname}`);
  }

  const body = output.slice(0, markerIndex);
  const metadata = output.slice(markerIndex + marker.length + 1).trim();
  const [statusCode, contentType = ""] = metadata.split("|");

  if (statusCode !== "200") {
    throw new Error(`Expected 200 from ${pathname}, received ${statusCode}`);
  }

  return {
    body,
    headers: {
      "content-type": contentType,
    },
    statusCode: Number(statusCode),
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(haystack, needle, context) {
  assert(haystack.includes(needle), `Expected ${context} to include \"${needle}\"`);
}

async function main() {
  console.log(`Running smoke test against ${getBaseUrl()}`);

  console.log("Checking /jobs/jr-001");
  const jobDetailResponse = request("/jobs/jr-001");
  const contentType = jobDetailResponse.headers["content-type"] ?? "";
  assert(contentType.includes("text/html"), "Expected /jobs/jr-001 to render HTML");

  console.log("Checking /api/jobs");
  const jobsResponse = JSON.parse(request("/api/jobs").body);
  assert(Array.isArray(jobsResponse.data), "Expected /api/jobs to return a data array");
  assert(jobsResponse.data.length > 0, "Expected /api/jobs to return at least one job");
  assert(jobsResponse.meta?.mode === "mock", "Expected /api/jobs to stay in mock mode during smoke test");
  assert(jobsResponse.data.some((job) => job.id === "jr-001"), "Expected mock jobs to include jr-001");

  console.log("Checking /search");
  const searchPage = request("/search");
  assertIncludes(searchPage.body, "JobRadar", "search page");

  console.log("Checking /");
  const homePage = request("/");
  assertIncludes(homePage.body, "JobRadar", "homepage");

  console.log("Smoke test passed.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Smoke test failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});