"use client";

import { DecisionStrip } from "@/components/decision/decision-strip";
import { MOCK_DECISION_STRIP } from "@/data/mock/decision-strip";
import { useDecisionStrip } from "@/hooks/use-decision-strip";
import type { DecisionStripData } from "@/types/weather";

type Props = { initialData?: DecisionStripData };

export function LiveDecisionStrip({ initialData }: Props) {
  const { strip } = useDecisionStrip(initialData ?? MOCK_DECISION_STRIP);
  return <DecisionStrip data={strip} />;
}
