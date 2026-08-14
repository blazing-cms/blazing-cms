import { useQuery } from "@tanstack/react-query";

import type { AnalyticsPeriod, AnalyticsSummary } from "@/lib/providers/types";

import {
  collections as registryCollections,
  globals as registryGlobals,
} from "@/__generated__/schema-registry";
import { useDataProvider } from "@/lib/providers/context";

export function useAnalytics(period: AnalyticsPeriod) {
  const provider = useDataProvider();

  return useQuery<AnalyticsSummary>({
    queryFn: async () => {
      const collections = registryCollections.map((c) => c.slug);
      const globals = registryGlobals.map((g) => g.slug);
      return provider.getAnalytics({ collections, globals, period });
    },
    queryKey: ["analytics", period],
    staleTime: 5 * 60 * 1000,
  });
}
