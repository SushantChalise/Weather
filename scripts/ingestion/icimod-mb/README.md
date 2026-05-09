# ICIMOD Glacier Mass Balance Ingestion (Preliminary Placeholder)

**Preliminary data only.** This pipeline generates placeholder annual mass balance time series for 4 HKH glaciers (Khumbu, Yala, Rikha Samba, Gangotri) using:
- Mean annual rates from Hugonnet et al. 2021
- Deterministic seeded noise around the mean for plausible year-to-year variability
- 2000–2019 range

To be replaced with **real ICIMOD CSV time series** once the user manually downloads the source files (the ICIMOD RDS portal does not expose a programmatic API for these datasets).

## Setup
- `DATABASE_URL` in `.env.local`

## Run
```
npm run db:icimod-mb
```

## Status
**Placeholder.** Real ICIMOD ingestion forthcoming.
