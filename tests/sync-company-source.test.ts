import test from "node:test";
import assert from "node:assert/strict";
import { syncCompanySource } from "../src/lib/sync/sync-company-source";

test("returns empty result for inactive source without hitting collectors", async () => {
  const result = await syncCompanySource({
    id: "inactive-1",
    companyName: "Acme",
    careersUrl: "https://careers.example.com",
    sourceType: "custom",
    sourceIdentifier: "https://careers.example.com",
    isActive: false,
  });

  assert.equal(result.fetched, 0);
  assert.equal(result.jobs.length, 0);
});
