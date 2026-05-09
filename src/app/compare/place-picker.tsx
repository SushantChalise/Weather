"use client";

import { useRouter } from "next/navigation";

type Option = { slug: string; name: string };

type Props = {
  options: Option[];
  valueA: string;
  valueB: string;
};

export function PlacePicker({ options, valueA, valueB }: Props) {
  const router = useRouter();

  function update(side: "a" | "b", slug: string) {
    const next = new URLSearchParams({
      a: side === "a" ? slug : valueA,
      b: side === "b" ? slug : valueB,
    });
    router.push(`/compare?${next.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8">
      <label className="flex flex-col gap-1 flex-1">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
          Place A
        </span>
        <select
          value={valueA}
          onChange={(e) => update("a", e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        >
          {options.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end pb-2 text-neutral-400 font-medium hidden sm:flex">vs</div>

      <label className="flex flex-col gap-1 flex-1">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
          Place B
        </span>
        <select
          value={valueB}
          onChange={(e) => update("b", e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        >
          {options.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
