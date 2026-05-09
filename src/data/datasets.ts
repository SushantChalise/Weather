import type { CitationDataset } from "@/components/ui/citation-pill";

export type { CitationDataset } from "@/components/ui/citation-pill";

export const OPEN_METEO: CitationDataset = {
  slug: "open-meteo",
  name: "Open-Meteo",
  license: "CC BY 4.0",
  citation:
    "Zippenfenig, P. (2023). Open-Meteo.com Weather API [Computer software]. " +
    "Zenodo. https://doi.org/10.5281/zenodo.7970649",
  sourceUrl: "https://open-meteo.com",
  description:
    "Open-source weather API providing high-resolution numerical weather prediction " +
    "forecasts and historical data. Aggregates multiple NWP models including ECMWF, " +
    "GFS, and regional models for worldwide coverage.",
  temporalRes: "Hourly",
  methodologyUrl: "https://open-meteo.com/en/docs",
};

export const ERA5_LAND: CitationDataset = {
  slug: "era5-land",
  name: "ERA5-Land",
  version: "5.1",
  license: "Copernicus License",
  citation:
    "Muñoz Sabater, J. (2019). ERA5-Land hourly data from 1950 to present. " +
    "Copernicus Climate Change Service (C3S) Climate Data Store (CDS). " +
    "https://doi.org/10.24381/cds.e2161bac",
  sourceUrl: "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land",
  description:
    "High-resolution reanalysis dataset produced by the European Centre for Medium-Range " +
    "Weather Forecasts (ECMWF). Provides a consistent view of land variables from 1950 to " +
    "present at 0.1° × 0.1° resolution, making it ideal for climate studies in mountain regions.",
  spatialRes: "0.1°",
  temporalRes: "Hourly",
  methodologyUrl: "https://confluence.ecmwf.int/display/CKB/ERA5-Land%3A+data+documentation",
};

export const HIMAWARI9: CitationDataset = {
  slug: "himawari9-b13",
  name: "Himawari-9 Band 13",
  license: "Public Domain (NOAA AWS)",
  citation:
    "Japan Meteorological Agency / NOAA. Himawari-9 Advanced Himawari Imager (AHI) " +
    "Band 13 (10.4 µm IR) imagery. Available on AWS Open Data. " +
    "https://registry.opendata.aws/noaa-himawari/",
  sourceUrl: "https://registry.opendata.aws/noaa-himawari/",
  description:
    "Thermal infrared imagery from the Himawari-9 geostationary satellite operated by " +
    "the Japan Meteorological Agency. Band 13 (10.4 µm) provides cloud-top temperature " +
    "and effective cloud cover over the Asia-Pacific region, updated every 10 minutes " +
    "with 2 km nadir resolution. Used in this app to display near-real-time cloud " +
    "conditions over the Himalayas.",
  spatialRes: "2 km",
  temporalRes: "30 min",
  methodologyUrl: "https://www.data.jma.go.jp/mscweb/en/himawari89/space_segment/spsg_ahi.html",
};
