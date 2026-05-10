"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Map as MapGL, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import type { MapLayerMouseEvent, StyleSpecification } from "maplibre-gl";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { MapRef } from "react-map-gl/maplibre";

// ─── Types ───────────────────────────────────────────────────────────────────

type GlacierYear = 1990 | 2000 | 2010 | 2020;

type GlofFilter = "all" | "risky" | "by-tier";

type ActiveLayers = {
  glaciers: boolean;
  lakes: boolean;
  earthquakes: boolean;
  fires: boolean;
  yala: boolean;
};

type FeatureProperties = GeoJsonProperties & {
  name?: string;
  area_km2?: number;
  tier?: "low" | "medium" | "high";
  mag?: number;
};

type ClickedFeature = {
  layerId: string;
  name: string;
  areaKm2?: number;
  tier?: "low" | "medium" | "high";
  mag?: number;
  slug?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const GLACIER_YEARS: GlacierYear[] = [1990, 2000, 2010, 2020];

const GLACIER_PALETTE: Record<GlacierYear, { fill: string; opacity: number; haloWidth: number }> = {
  1990: { fill: "#B9F3FF", opacity: 0.35, haloWidth: 0.5 },
  2000: { fill: "#7FDBFF", opacity: 0.5, haloWidth: 0.5 },
  2010: { fill: "#39B5E8", opacity: 0.7, haloWidth: 0.75 },
  2020: { fill: "#DDF7FF", opacity: 0.85, haloWidth: 1 },
};

// HKH bounding box: lon 70-95, lat 26-36
const HKH_BOUNDS: [[number, number], [number, number]] = [
  [70, 26],
  [95, 36],
];

// Yala glacier position from PLACE_REGISTRY
const YALA_LON = 85.6167;
const YALA_LAT = 28.2333;

const LAYER_PARAM_KEYS: (keyof ActiveLayers)[] = [
  "glaciers",
  "lakes",
  "earthquakes",
  "fires",
  "yala",
];

// ─── Map style ────────────────────────────────────────────────────────────────

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "esri-imagery": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [
    {
      id: "esri-imagery",
      type: "raster",
      source: "esri-imagery",
      paint: {
        "raster-saturation": -0.4,
        "raster-brightness-max": 0.7,
        "raster-brightness-min": 0,
      },
    },
  ],
};

// ─── URL state helpers ────────────────────────────────────────────────────────

function parseYear(raw: string | null): GlacierYear {
  const n = Number(raw);
  if (n === 1990 || n === 2000 || n === 2010 || n === 2020) return n;
  return 2020;
}

function parseLayers(raw: string | null): ActiveLayers {
  const base: ActiveLayers = {
    glaciers: true,
    lakes: true,
    earthquakes: false,
    fires: false,
    yala: false,
  };
  if (!raw) return base;
  const parts = raw.split(",");
  const result = { ...base };
  for (const key of LAYER_PARAM_KEYS) {
    result[key] = parts.includes(key);
  }
  // if param present but empty, keep defaults
  if (parts.length === 0) return base;
  return result;
}

function parseGlofFilter(raw: string | null): GlofFilter {
  if (raw === "risky" || raw === "by-tier") return raw;
  return "all";
}

function layersToParam(layers: ActiveLayers): string {
  return LAYER_PARAM_KEYS.filter((k) => layers[k]).join(",");
}

// ─── Data fetching hook ───────────────────────────────────────────────────────

type GeoData = FeatureCollection<Geometry, FeatureProperties>;

function useGeoData(url: string, enabled: boolean) {
  const [data, setData] = useState<GeoData | null>(null);
  const [error, setError] = useState(false);
  const loaded = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || loaded.current.has(url)) return;
    let cancelled = false;
    setError(false);

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<GeoData>;
      })
      .then((d) => {
        if (cancelled) return;
        loaded.current.add(url);
        setData(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [url, enabled]);

  return { data, error };
}

// Cache previously fetched years so toggling back doesn't re-fetch
const glacierCache = new Map<GlacierYear, GeoData>();

function useGlacierData(year: GlacierYear, enabled: boolean) {
  const [data, setData] = useState<GeoData | null>(() => glacierCache.get(year) ?? null);

  useEffect(() => {
    if (!enabled) return;
    const cached = glacierCache.get(year);
    if (cached) {
      setData(cached);
      return;
    }
    let cancelled = false;
    fetch(`/glaciers/hkh/${year}.geojson.br`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<GeoData>;
      })
      .then((d) => {
        if (cancelled) return;
        glacierCache.set(year, d);
        setData(d);
      })
      .catch(() => {
        // Fail silently — poster silhouette stays visible
      });
    return () => {
      cancelled = true;
    };
  }, [year, enabled]);

  return data;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function YearControl({
  year,
  disabled,
  onChange,
  onPrev,
  onPlay,
  onNext,
  playing,
}: {
  year: GlacierYear;
  disabled: boolean;
  onChange: (y: GlacierYear) => void;
  onPrev: () => void;
  onPlay: () => void;
  onNext: () => void;
  playing: boolean;
}) {
  return (
    <fieldset className="flex items-center gap-2 border-0 p-0 m-0">
      <legend className="sr-only">Select glacier year</legend>
      {/* Segmented year stops */}
      <div className="flex rounded-lg overflow-hidden border border-white/20 bg-black/60 backdrop-blur-sm">
        {GLACIER_YEARS.map((y) => (
          <button
            key={y}
            type="button"
            disabled={disabled}
            aria-pressed={year === y}
            aria-label={`Show glaciers from ${y}`}
            onClick={() => onChange(y)}
            className={[
              "min-w-[44px] h-11 px-3 text-sm font-semibold transition-colors duration-150",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              year === y ? "bg-[#DDF7FF] text-slate-900" : "text-white hover:bg-white/10",
            ].join(" ")}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Prev / Play / Next */}
      <div className="flex rounded-lg overflow-hidden border border-white/20 bg-black/60 backdrop-blur-sm">
        <button
          type="button"
          disabled={disabled}
          aria-label="Previous year"
          onClick={onPrev}
          className="w-11 h-11 flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <path d="M9 2L4 7l5 5V2z" />
          </svg>
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label={playing ? "Pause" : "Play animation"}
          onClick={onPlay}
          className="w-11 h-11 flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-x border-white/20"
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <rect x="1" y="1" width="4" height="10" rx="1" />
              <rect x="7" y="1" width="4" height="10" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M2 1l9 5-9 5V1z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label="Next year"
          onClick={onNext}
          className="w-11 h-11 flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <path d="M5 2l5 5-5 5V2z" />
          </svg>
        </button>
      </div>
    </fieldset>
  );
}

// ─── Layer panel ──────────────────────────────────────────────────────────────

function LayerToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer py-1 select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={[
          "w-8 h-4 rounded-full transition-colors duration-150 flex items-center px-0.5",
          checked ? "bg-[#12B5CB]" : "bg-white/20",
        ].join(" ")}
      >
        <span
          className={[
            "block w-3 h-3 rounded-full bg-white shadow transition-transform duration-150",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </span>
      <span className="text-xs text-white/90">{label}</span>
    </label>
  );
}

function LayerGroup({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 w-full text-left py-1"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="currentColor"
          aria-hidden="true"
          className={`text-white/60 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
        >
          <path d="M3 2l4 3-4 3V2z" />
        </svg>
        <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
          {title}
        </span>
      </button>
      {open && <div className="pl-4 mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}

function GlofFilterControl({
  value,
  onChange,
}: {
  value: GlofFilter;
  onChange: (v: GlofFilter) => void;
}) {
  const options: { val: GlofFilter; label: string }[] = [
    { val: "all", label: "All lakes" },
    { val: "risky", label: "Risky only" },
    { val: "by-tier", label: "By risk tier" },
  ];
  return (
    <div className="pl-2 mt-1 space-y-0.5" role="radiogroup" aria-label="GLOF risk filter">
      {options.map(({ val, label }) => (
        <label key={val} className="flex items-center gap-2 cursor-pointer py-0.5 select-none">
          <input
            type="radio"
            name="glof-filter"
            value={val}
            checked={value === val}
            onChange={() => onChange(val)}
            className="sr-only"
          />
          <span
            aria-hidden="true"
            className={[
              "w-3 h-3 rounded-full border transition-colors duration-150",
              value === val ? "bg-[#12B5CB] border-[#12B5CB]" : "bg-transparent border-white/40",
            ].join(" ")}
          />
          <span className="text-xs text-white/70">{label}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Feature drawer ───────────────────────────────────────────────────────────

function FeatureChooser({
  features,
  onSelect,
}: {
  features: ClickedFeature[];
  onSelect: (f: ClickedFeature) => void;
}) {
  return (
    <div className="p-4">
      <p className="text-xs text-neutral-500 mb-3">Multiple features at this point:</p>
      <ul className="space-y-2">
        {features.map((f) => (
          <li key={`${f.layerId}-${f.name}`}>
            <button
              type="button"
              onClick={() => onSelect(f)}
              className="w-full text-left px-3 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors text-sm text-neutral-800"
            >
              <span className="font-medium">{f.name}</span>
              {f.layerId === "glaciers-fill" && (
                <span className="ml-1 text-xs text-neutral-500">Glacier</span>
              )}
              {(f.layerId === "lakes-fill" || f.layerId === "risky-lakes-outline") && (
                <span className="ml-1 text-xs text-neutral-500">Glacial lake</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureCard({ feature, onClose }: { feature: ClickedFeature; onClose: () => void }) {
  const isGlacier = feature.layerId === "glaciers-fill";
  const isLake = feature.layerId === "lakes-fill" || feature.layerId === "risky-lakes-outline";

  const chartHref = isGlacier
    ? feature.slug
      ? `/charts/glacier-loss/${feature.slug}`
      : `/places/${feature.slug ?? ""}`
    : isLake
      ? feature.slug
        ? `/places/${feature.slug}`
        : "/atlas/30-years"
      : "/atlas/30-years";

  const placeHref = feature.slug ? `/places/${feature.slug}` : null;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-neutral-900 text-base leading-tight">{feature.name}</h3>
          {isGlacier && feature.areaKm2 != null && (
            <p className="text-sm text-neutral-500 mt-0.5">
              {feature.areaKm2.toFixed(1)} km² in 2020
            </p>
          )}
          {isLake && feature.tier && (
            <p className="text-sm mt-0.5">
              <span
                className={[
                  "inline-block px-2 py-0.5 rounded text-xs font-medium",
                  feature.tier === "high"
                    ? "bg-red-100 text-red-700"
                    : feature.tier === "medium"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-yellow-100 text-yellow-700",
                ].join(" ")}
              >
                {feature.tier.charAt(0).toUpperCase() + feature.tier.slice(1)} GLOF risk
              </span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex gap-2">
        <Link
          href={chartHref}
          className="flex-1 text-center px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          See full chart
        </Link>
        {placeHref && placeHref !== chartHref && (
          <Link
            href={placeHref}
            className="px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Place page
          </Link>
        )}
      </div>

      <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
        {isGlacier
          ? "Outline sourced from ICIMOD HKH Glacier inventory. Area computed at time of measurement; retreat since 1990 reflects warming trend across the Hindu Kush–Himalaya."
          : isLake
            ? "Glacial lake polygon from ICIMOD GLOF database. Risk tier based on hazard assessment including outburst potential and downstream exposure."
            : "Feature from ICIMOD open data."}
      </p>
    </div>
  );
}

// Bottom sheet — mobile. Right drawer — desktop.
function FeaturePanel({
  sheetState,
  clickedFeatures,
  selectedFeature,
  onChoose,
  onClose,
}: {
  sheetState: "hidden" | "peek" | "half" | "full";
  clickedFeatures: ClickedFeature[];
  selectedFeature: ClickedFeature | null;
  onChoose: (f: ClickedFeature) => void;
  onClose: () => void;
}) {
  const showChooser = clickedFeatures.length > 1 && selectedFeature == null;
  const showCard = selectedFeature != null;
  const visible = sheetState !== "hidden";

  if (!visible) return null;

  const heightClass = sheetState === "peek" ? "h-32" : sheetState === "half" ? "h-1/2" : "h-5/6";

  return (
    <>
      {/* Mobile bottom sheet */}
      <div
        role="dialog"
        aria-label="Feature detail"
        aria-modal="true"
        className={[
          "md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-30",
          "transition-all duration-300",
          heightClass,
          "overflow-y-auto",
        ].join(" ")}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-200" />
        </div>
        {showChooser && <FeatureChooser features={clickedFeatures} onSelect={onChoose} />}
        {showCard && <FeatureCard feature={selectedFeature} onClose={onClose} />}
      </div>

      {/* Desktop right drawer */}
      <div
        role="dialog"
        aria-label="Feature detail"
        aria-modal="true"
        className="hidden md:block fixed right-4 top-1/2 -translate-y-1/2 w-80 bg-white rounded-2xl shadow-2xl z-30 overflow-y-auto max-h-[80vh]"
      >
        {showChooser && <FeatureChooser features={clickedFeatures} onSelect={onChoose} />}
        {showCard && <FeatureCard feature={selectedFeature} onClose={onClose} />}
      </div>
    </>
  );
}

// ─── Loading status ───────────────────────────────────────────────────────────

type LoadPhase = "idle" | "glaciers" | "lakes" | "done";

function LoadingStatus({ phase }: { phase: LoadPhase }) {
  if (phase === "done" || phase === "idle") return null;
  const message = phase === "glaciers" ? "Loading glacier extent…" : "Adding lakes…";
  return (
    <div className="flex items-center gap-2 text-white/80 text-xs">
      <span
        className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"
        aria-hidden="true"
      />
      <span role="status" aria-live="polite">
        {message}
      </span>
    </div>
  );
}

// ─── HKH bbox border overlay (SVG on top of map) ─────────────────────────────

function HkhBboxMask() {
  // This is decorative — a subtle glow border around the HKH region
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        boxShadow: "inset 0 0 80px 20px rgba(0,0,0,0.45)",
      }}
    />
  );
}

// ─── Empty state when data files don't exist yet ──────────────────────────────

function GlacierPosterOverlay({ dataLoaded }: { dataLoaded: boolean }) {
  if (dataLoaded) return null;
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
    >
      <Image
        src="/atlas/glaciers-2020-silhouette.svg"
        alt=""
        fill
        className="object-contain opacity-70"
        priority
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Atlas30YearsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const year = parseYear(searchParams.get("year"));
  const activeLayers = useMemo(() => parseLayers(searchParams.get("layers")), [searchParams]);
  const glofFilter = parseGlofFilter(searchParams.get("glof"));

  const [controlsReady, setControlsReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sheetState, setSheetState] = useState<"hidden" | "peek" | "half" | "full">("hidden");
  const [clickedFeatures, setClickedFeatures] = useState<ClickedFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<ClickedFeature | null>(null);
  const [loadPhase, setLoadPhase] = useState<LoadPhase>("idle");
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);

  const mapRef = useRef<MapRef>(null);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Suppress MapLibre AbortError noise
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      if (e.reason?.name === "AbortError") e.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  // Enable controls after 1 second so first-paint doesn't show broken state
  useEffect(() => {
    const t = setTimeout(() => setControlsReady(true), 1000);
    return () => clearTimeout(t);
  }, []);

  // Glacier data (lazy per year, cached)
  const glacierData = useGlacierData(year, activeLayers.glaciers);

  // Lakes data
  const { data: lakesData } = useGeoData("/glacial-lakes/current.geojson.br", activeLayers.lakes);
  const { data: riskyLakesData } = useGeoData(
    "/glacial-lakes/risky.geojson.br",
    activeLayers.lakes && glofFilter !== "all",
  );

  // Optional layers — fetch only when toggled on; don't block headline experience
  const { data: earthquakeData } = useGeoData("/api/earthquakes", activeLayers.earthquakes);
  const { data: fireData } = useGeoData("/api/fires", activeLayers.fires);

  // Loading phase tracking
  useEffect(() => {
    if (!activeLayers.glaciers && !activeLayers.lakes) {
      setLoadPhase("done");
      return;
    }
    if (glacierData == null && activeLayers.glaciers) {
      setLoadPhase("glaciers");
      return;
    }
    if (lakesData == null && activeLayers.lakes) {
      setLoadPhase("lakes");
      return;
    }
    setLoadPhase("done");
  }, [glacierData, lakesData, activeLayers.glaciers, activeLayers.lakes]);

  // URL sync helpers
  const pushParams = useCallback(
    (updates: { year?: GlacierYear; layers?: ActiveLayers; glof?: GlofFilter }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.year != null) params.set("year", String(updates.year));
      if (updates.layers != null) {
        const layerStr = layersToParam(updates.layers);
        if (layerStr) params.set("layers", layerStr);
        else params.delete("layers");
      }
      if (updates.glof != null) {
        if (updates.glof === "all") params.delete("glof");
        else params.set("glof", updates.glof);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const setYear = useCallback((y: GlacierYear) => pushParams({ year: y }), [pushParams]);

  const setLayer = useCallback(
    (key: keyof ActiveLayers, val: boolean) => {
      pushParams({ layers: { ...activeLayers, [key]: val } });
    },
    [pushParams, activeLayers],
  );

  const setGlofFilter = useCallback((f: GlofFilter) => pushParams({ glof: f }), [pushParams]);

  // Year navigation
  const prevYear = useCallback(() => {
    const idx = GLACIER_YEARS.indexOf(year);
    const target = GLACIER_YEARS[Math.max(0, idx - 1)];
    if (target != null) setYear(target);
  }, [year, setYear]);

  const nextYear = useCallback(() => {
    const idx = GLACIER_YEARS.indexOf(year);
    const target = GLACIER_YEARS[Math.min(GLACIER_YEARS.length - 1, idx + 1)];
    if (target != null) setYear(target);
  }, [year, setYear]);

  // Track current year in a ref so the interval can read the latest without stale closure
  const yearRef = useRef<GlacierYear>(year);
  useEffect(() => {
    yearRef.current = year;
  }, [year]);

  // Play/pause auto-advance
  const togglePlay = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  useEffect(() => {
    if (!playing) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }
    playTimerRef.current = setInterval(() => {
      const idx = GLACIER_YEARS.indexOf(yearRef.current);
      const next = GLACIER_YEARS[(idx + 1) % GLACIER_YEARS.length];
      if (next != null) setYear(next);
    }, 1500);
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [playing, setYear]);

  // Map click handler
  const handleMapClick = useCallback((e: MapLayerMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const point = e.point;
    const queryLayers = ["glaciers-fill", "lakes-fill", "risky-lakes-outline"].filter((id) => {
      try {
        return !!map.getLayer(id);
      } catch {
        return false;
      }
    });

    if (queryLayers.length === 0) return;

    const features = map.queryRenderedFeatures(point, { layers: queryLayers });

    if (features.length === 0) {
      setSheetState("hidden");
      setClickedFeatures([]);
      setSelectedFeature(null);
      return;
    }

    const mapped: ClickedFeature[] = features.map((f: (typeof features)[number]) => {
      const props = f.properties as FeatureProperties;
      return {
        layerId: f.layer.id,
        name: props?.name ?? "Unknown feature",
        areaKm2: typeof props?.area_km2 === "number" ? props.area_km2 : undefined,
        tier: props?.tier,
        slug: props?.name ? props.name.toLowerCase().replace(/\s+/g, "-") : undefined,
      };
    });

    setClickedFeatures(mapped);
    setSelectedFeature(mapped.length === 1 ? (mapped[0] ?? null) : null);
    setSheetState("peek");
  }, []);

  const closeSheet = useCallback(() => {
    setSheetState("hidden");
    setClickedFeatures([]);
    setSelectedFeature(null);
  }, []);

  const palette = GLACIER_PALETTE[year];
  const glacierDataLoaded = glacierData != null;

  // Earthquake data as MapLibre GeoJSON source
  const earthquakeGeoJSON = useMemo(() => {
    if (!earthquakeData) return null;
    return earthquakeData as FeatureCollection<Geometry, FeatureProperties>;
  }, [earthquakeData]);

  // Fire data
  const fireGeoJSON = useMemo(() => {
    if (!fireData) return null;
    return fireData as FeatureCollection<Geometry, FeatureProperties>;
  }, [fireData]);

  return (
    <div className="fixed inset-0 bg-slate-900">
      {/* Headline overlay — always visible */}
      <div
        className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)",
          paddingBottom: "3rem",
        }}
      >
        <div className="px-4 pt-4 md:pt-6">
          <h1 className="text-white text-lg md:text-2xl font-bold tracking-tight leading-tight">
            30 years of HKH ice retreat
          </h1>
          <p className="text-white/60 text-xs md:text-sm mt-0.5">
            1990 → 2020 · Hindu Kush Himalaya · ICIMOD data
          </p>
        </div>
      </div>

      {/* Year control — top center */}
      <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <YearControl
          year={year}
          disabled={!controlsReady}
          onChange={setYear}
          onPrev={prevYear}
          onPlay={togglePlay}
          onNext={nextYear}
          playing={playing}
        />
        <LoadingStatus phase={loadPhase} />
      </div>

      {/* Layer panel toggle — top right */}
      <div className="absolute top-4 md:top-6 right-4 z-20">
        <button
          type="button"
          aria-label="Toggle layer panel"
          aria-expanded={layerPanelOpen}
          onClick={() => setLayerPanelOpen((v) => !v)}
          className="w-11 h-11 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-black/80 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
            <rect x="1" y="3" width="16" height="2" rx="1" />
            <rect x="1" y="8" width="16" height="2" rx="1" />
            <rect x="1" y="13" width="16" height="2" rx="1" />
          </svg>
        </button>

        {/* Layer panel */}
        {layerPanelOpen && (
          <div className="absolute right-0 top-12 w-56 bg-black/80 backdrop-blur-sm rounded-xl border border-white/20 p-3 space-y-2">
            <LayerGroup title="Ice & Water" defaultOpen={true}>
              <LayerToggle
                label="Glaciers"
                checked={activeLayers.glaciers}
                onChange={(v) => setLayer("glaciers", v)}
              />
              <div>
                <LayerToggle
                  label="Glacial lakes"
                  checked={activeLayers.lakes}
                  onChange={(v) => setLayer("lakes", v)}
                />
                {activeLayers.lakes && (
                  <GlofFilterControl value={glofFilter} onChange={setGlofFilter} />
                )}
              </div>
            </LayerGroup>

            <LayerGroup title="Risk & Events" defaultOpen={false}>
              <LayerToggle
                label="Earthquakes (M ≥ 4.5)"
                checked={activeLayers.earthquakes}
                onChange={(v) => setLayer("earthquakes", v)}
              />
              <LayerToggle
                label="Active fires (last 365d)"
                checked={activeLayers.fires}
                onChange={(v) => setLayer("fires", v)}
              />
            </LayerGroup>

            <LayerGroup title="Stations" defaultOpen={false}>
              <LayerToggle
                label="Yala 1 micromet"
                checked={activeLayers.yala}
                onChange={(v) => setLayer("yala", v)}
              />
            </LayerGroup>
          </div>
        )}
      </div>

      {/* Attribution — bottom left */}
      <div className="absolute bottom-2 left-2 z-20 pointer-events-none">
        <p className="text-white/40 text-[10px]">© Esri, Maxar · ICIMOD HKH Glacier Inventory</p>
      </div>

      {/* Poster silhouette — shown while glacier data loads */}
      <GlacierPosterOverlay dataLoaded={glacierDataLoaded} />

      {/* HKH bbox mask vignette */}
      <HkhBboxMask />

      {/* Feature panel */}
      <FeaturePanel
        sheetState={sheetState}
        clickedFeatures={clickedFeatures}
        selectedFeature={selectedFeature}
        onChoose={(f) => {
          setSelectedFeature(f);
          setSheetState("half");
        }}
        onClose={closeSheet}
      />

      {/* MapLibre canvas */}
      <MapGL
        ref={mapRef}
        mapStyle={MAP_STYLE}
        onError={(e) => {
          if (e.error?.name === "AbortError") return;
          console.error("MapLibre error:", e.error);
        }}
        initialViewState={{
          bounds: HKH_BOUNDS,
          fitBoundsOptions: { padding: 40 },
        }}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        onClick={handleMapClick}
      >
        {/* Glacier outlines for selected year */}
        {activeLayers.glaciers && glacierData && (
          <Source id="glaciers" type="geojson" data={glacierData}>
            <Layer
              id="glaciers-halo"
              type="fill"
              paint={{
                "fill-color": "#001a2e",
                "fill-opacity": 0.15,
              }}
            />
            <Layer
              id="glaciers-fill"
              type="fill"
              paint={{
                "fill-color": palette.fill,
                "fill-opacity": palette.opacity,
              }}
            />
            <Layer
              id="glaciers-outline"
              type="line"
              paint={{
                "line-color": "#001a2e",
                "line-width": palette.haloWidth,
                "line-opacity": 0.6,
              }}
            />
          </Source>
        )}

        {/* Glacial lakes — all */}
        {activeLayers.lakes && lakesData && glofFilter === "all" && (
          <Source id="lakes" type="geojson" data={lakesData}>
            <Layer
              id="lakes-fill"
              type="fill"
              paint={{
                "fill-color": "#12B5CB",
                "fill-opacity": 0.5,
              }}
            />
          </Source>
        )}

        {/* Glacial lakes — risky only (outline-only from risky dataset) */}
        {activeLayers.lakes && glofFilter === "risky" && riskyLakesData && (
          <Source id="risky-lakes" type="geojson" data={riskyLakesData}>
            <Layer
              id="risky-lakes-outline"
              type="line"
              paint={{
                "line-color": "#EB5757",
                "line-width": 3,
              }}
            />
          </Source>
        )}

        {/* Glacial lakes — by tier (outline color-coded) */}
        {activeLayers.lakes && glofFilter === "by-tier" && riskyLakesData && (
          <Source id="tiered-lakes" type="geojson" data={riskyLakesData}>
            <Layer
              id="tiered-lakes-low"
              type="line"
              filter={["==", ["get", "tier"], "low"]}
              paint={{ "line-color": "#F2C94C", "line-width": 2 }}
            />
            <Layer
              id="tiered-lakes-medium"
              type="line"
              filter={["==", ["get", "tier"], "medium"]}
              paint={{ "line-color": "#F2994A", "line-width": 2 }}
            />
            <Layer
              id="tiered-lakes-high"
              type="line"
              filter={["==", ["get", "tier"], "high"]}
              paint={{ "line-color": "#EB5757", "line-width": 3 }}
            />
          </Source>
        )}

        {/* Earthquakes */}
        {activeLayers.earthquakes && earthquakeGeoJSON && (
          <Source id="earthquakes" type="geojson" data={earthquakeGeoJSON}>
            <Layer
              id="earthquakes-circles"
              type="circle"
              paint={{
                "circle-color": "#FF5A5F",
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["coalesce", ["get", "mag"], 4.5],
                  4.5,
                  4,
                  6,
                  8,
                  8,
                  16,
                ],
                "circle-opacity": 0.7,
                "circle-stroke-color": "#fff",
                "circle-stroke-width": 0.5,
              }}
            />
          </Source>
        )}

        {/* Fires — clustered */}
        {activeLayers.fires && fireGeoJSON && (
          <Source
            id="fires"
            type="geojson"
            data={fireGeoJSON}
            cluster={true}
            clusterMaxZoom={12}
            clusterRadius={40}
          >
            <Layer
              id="fires-clusters"
              type="circle"
              filter={["has", "point_count"]}
              paint={{
                "circle-color": "#FF6B00",
                "circle-radius": ["step", ["get", "point_count"], 10, 10, 14, 50, 18],
                "circle-opacity": 0.8,
              }}
            />
            <Layer
              id="fires-singles"
              type="circle"
              filter={["!", ["has", "point_count"]]}
              paint={{
                "circle-color": "#FFD166",
                "circle-radius": 5,
                "circle-opacity": 0.85,
              }}
            />
          </Source>
        )}

        {/* Yala 1 station marker */}
        {activeLayers.yala && (
          <Source
            id="yala-station"
            type="geojson"
            data={{
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: { name: "Yala 1 micromet station" },
                  geometry: {
                    type: "Point",
                    coordinates: [YALA_LON, YALA_LAT],
                  },
                },
              ],
            }}
          >
            <Layer
              id="yala-station-circle"
              type="circle"
              paint={{
                "circle-color": "#E6FF57",
                "circle-radius": 8,
                "circle-stroke-color": "#001a2e",
                "circle-stroke-width": 2,
              }}
            />
          </Source>
        )}
      </MapGL>
    </div>
  );
}
