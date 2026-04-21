import type { Collector } from "@/lib/collectors/types";

export const customCollector: Collector = {
  sourceType: "custom",
  async collect() {
    // Placeholder for selected company pages. We keep this intentionally simple for MVP.
    return [];
  },
};
