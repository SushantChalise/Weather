import type { Destination } from "@/types/weather";

type PlaceHeaderProps = {
  place: Destination;
};

export function PlaceHeader({ place }: PlaceHeaderProps) {
  return (
    <header className="px-4 pt-6 pb-4">
      <p className="text-xs text-neutral-500 mb-2">Nepal &rsaquo; {place.name}</p>
      <h1 className="text-2xl font-semibold text-neutral-900 leading-tight">{place.name}</h1>
      <div className="flex flex-wrap items-center gap-3 mt-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
          {place.altitude.toLocaleString()} m
        </span>
        <span className="text-xs text-neutral-400">
          {place.lat.toFixed(4)}&deg;N, {place.lon.toFixed(4)}&deg;E
        </span>
      </div>
    </header>
  );
}
