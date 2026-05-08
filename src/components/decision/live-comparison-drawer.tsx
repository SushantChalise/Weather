"use client";

import { ComparisonDrawer } from "@/components/decision/comparison-drawer";
import { useComparison } from "@/hooks/use-comparison";
import type { ComparisonDrawerData } from "@/types/weather";

export function LiveComparisonDrawer({ fallback }: { fallback: ComparisonDrawerData }) {
  const { comparison } = useComparison(fallback);
  return <ComparisonDrawer data={comparison} />;
}
