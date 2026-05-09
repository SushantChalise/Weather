import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sparkline } from "@/components/ui/sparkline";

type ChartConfig = {
  title: string;
  subtitle: string;
  values: number[];
  labels: string[];
  unit: string;
};

const CHART_REGISTRY: Record<string, ChartConfig> = {
  "trek-window-shift-ebc-october": {
    title: "Trek Window Shift — EBC October",
    subtitle: "Percent of clear days, by decade",
    values: [0.65, 0.62, 0.58, 0.55, 0.52, 0.48, 0.45],
    labels: ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
    unit: "%",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "chart-id": string }>;
}): Promise<Metadata> {
  const { "chart-id": chartId } = await params;
  const chart = CHART_REGISTRY[chartId];
  if (!chart) return { title: "Chart not found — Himalayan Atlas" };
  return {
    title: `${chart.title} — Himalayan Atlas`,
    description: chart.subtitle,
    openGraph: { title: chart.title, description: chart.subtitle, type: "website" },
  };
}

export default async function EmbedPage({ params }: { params: Promise<{ "chart-id": string }> }) {
  const { "chart-id": chartId } = await params;
  const chart = CHART_REGISTRY[chartId];
  if (!chart) notFound();

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">{chart.title}</h1>
      <p className="text-sm text-neutral-600 mb-4">{chart.subtitle}</p>

      <div className="my-6">
        <Sparkline
          values={chart.values}
          width={400}
          height={120}
          stroke="#0a0a0a"
          strokeWidth={2}
          ariaLabel={chart.title}
        />
      </div>

      <div className="flex justify-between text-xs text-neutral-500 mb-2">
        {chart.labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <p className="text-xs text-neutral-500 mt-6">
        Source: Himalayan Atlas. Data is illustrative until ERA5 ingestion lands.
      </p>
    </div>
  );
}
