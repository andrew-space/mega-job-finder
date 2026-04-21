import { customCollector } from "@/lib/collectors/custom";
import { franceTravailCollector } from "@/lib/collectors/francetravail";
import { greenhouseCollector } from "@/lib/collectors/greenhouse";
import { leverCollector } from "@/lib/collectors/lever";
import type { Collector } from "@/lib/collectors/types";
import type { IngestionSourceType } from "@/types/source-types";

const collectorBySource: Record<IngestionSourceType, Collector> = {
  francetravail: franceTravailCollector,
  greenhouse: greenhouseCollector,
  lever: leverCollector,
  custom: customCollector,
};

export function getCollectorForSource(sourceType: IngestionSourceType): Collector {
  return collectorBySource[sourceType];
}

export { collectorBySource };
