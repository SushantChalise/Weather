# Contributing

This project ships to production via Vercel auto-deploy on every push to `main`. To prevent broken builds reaching prod (which has happened — see commit history `c17ec6b` → `8424039`, an 11-deploy stretch where every push to main failed Vercel's build but went undetected), **all changes go through a pull request, and CI must pass before merge**.

This document is the single source of truth for the workflow. Any contributor — solo or otherwise — must follow it.

---

## 1. Branch model

| Branch | Purpose | Rules |
|---|---|---|
| `main` | Production. Auto-deploys to https://weather-ruby-iota-35.vercel.app on every push. | Protected: no direct pushes, no force-pushes, no bypassing CI. |
| `feat/*`, `fix/*`, `chore/*`, `docs/*`, `ci/*`, `claude/*` | Short-lived working branches. | Branch from `main`, PR back to `main`. Delete after merge. |

Branch names use the same prefix vocabulary as Conventional Commits (see §5).

---

## 2. Workflow — every change, no exceptions

```
1.  git checkout main && git pull
2.  git checkout -b fix/short-description
3.  ... make changes ...
4.  Run pre-flight locally (§3) — must pass before pushing
5.  git push -u origin fix/short-description
6.  gh pr create   (or open in GitHub UI)
7.  Wait for CI green (§4)
8.  Click through the Vercel preview deploy linked on the PR — verify the change visually
9.  Merge via "Squash and merge" in GitHub
10. Vercel auto-deploys main → production
11. Smoke-test the live URL (§7)
12. Delete the merged branch
```

There is no "just push to main for a small fix" exception. Small fixes are exactly the kind that bypass thinking and break prod.

---

## 3. Pre-flight — run locally before pushing

These are the same three commands CI runs. If they fail locally, they will fail on CI.

```powershell
npm run typecheck      # tsc --noEmit
npm run build          # next build — catches ESLint rules that `next dev` silences
npx biome check src/   # formatting + lint
```

**Why `npm run build` and not just `npm run dev`:** `next dev` reports `react/no-unescaped-entities` and similar ESLint errors as warnings only — the page still loads. `next build` treats them as errors and fails. Vercel runs `next build`. So if you only test in dev, you can ship a change that crashes prod's build.

This is exactly how the 11-deploy outage happened: the apostrophe in `<p>Loading yesterday's conditions…</p>` was visible in `next dev` but blocked every `next build` until the file was fixed.

---

## 4. CI — `.github/workflows/ci.yml`

Runs on every PR and every push to `main`. All three jobs must pass.

| Job | Command | Catches |
|---|---|---|
| `typecheck` | `npx tsc --noEmit` | Type errors |
| `build` | `npm run build` | ESLint errors that `next dev` silences, broken imports, missing env vars |
| `lint` | `npx biome check src/` | Formatting drift, `noExplicitAny`, etc. |

The merge button is disabled while any check is red. **Do not merge a red PR.** Investigate the failure, push another commit, let CI re-run.

---

## 5. Commit conventions — Conventional Commits

Format:

```
<type>(<scope>): <imperative summary, lowercase, no period>

[optional body — explain WHY, not what]
```

Types used in this repo:

| Type | When |
|---|---|
| `feat` | New user-visible feature |
| `fix` | Bug fix |
| `chore` | Plumbing: deps, configs, repo hygiene |
| `style` | Formatting only (no behavior change) |
| `refactor` | Code change without behavior change |
| `docs` | Documentation only |
| `ci` | CI/CD changes |
| `test` | Test-only changes |

Examples already in this repo:

```
fix(himawari): use path.relative() so tiles upload to correct Blob paths
fix(map): bake Himawari tile URL into MapLibre style via useMemo
fix(css): add @source to anchor Tailwind v4 scanner to project src/
```

**Keep each commit a single concern.** Reasons:
- Easier code review (reviewer reads one diff, one purpose)
- Easier `git bisect` (each commit is a clean before/after)
- Easier revert (revert the bad change without losing unrelated good changes)

If your branch does multiple things, split the commits before pushing. Use `git rebase -i` or `git reset` + re-stage.

---

## 6. Branch protection — one-time GitHub setup

In the repo's GitHub settings → Branches → add a rule for `main`:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - Required checks: `typecheck`, `build`, `lint` (from `.github/workflows/ci.yml`)
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings (applies to admins too)

Once enabled, even the repo owner cannot push directly to `main` or merge a red PR. This is a feature, not a constraint.

---

## 7. Releasing / deploying

Production deploys are **automatic** — every merge to `main` triggers a Vercel build. There is no manual release step, no version bump required.

After a merge:

1. Open the [Vercel dashboard](https://vercel.com/sushantchalises-projects/weather/deployments).
2. Wait for the new deployment to reach **Ready** (not Failed, not Building).
3. Smoke-test the live URL:
   - Homepage loads, decision strip shows real destinations
   - Map renders with destination markers
   - `curl https://weather-ruby-iota-35.vercel.app/api/himawari` returns `"source":"himawari-9"` (not the MODIS fallback)
   - Browser console is clean

If the deploy is **Failed**, see §8.

---

## 8. When `main` is broken in prod

Symptoms: Vercel deployments keep failing, live site is stale, `/api` routes 404 because the route file doesn't exist in the last successful build.

Diagnosis:

```powershell
gh api repos/SushantChalise/Weather/deployments --jq '.[0:5] | .[] | {ref: .ref[0:7], created_at}'
# Then for each id:
gh api repos/SushantChalise/Weather/deployments/<id>/statuses --jq '.[0].state'
```

Find the most recent **success** — that is what's actually live. Everything after it is stuck.

**Do not push another commit to main hoping it fixes things.** That just queues another failed deploy. Instead:

1. Reproduce the failure locally with `npm run build`.
2. Read the actual error.
3. Fix on a branch, push, open a PR, let CI confirm green.
4. Merge.
5. Verify the new deploy is Ready before celebrating.

---

## 9. Local environment

See [SETUP.md](SETUP.md) for one-time scaffolding.

For ongoing dev:

```powershell
npm install
Copy-Item .env.local.example .env.local
# Fill in HIMAWARI_STORE_ID etc.
npm run dev   # http://localhost:3000
```

`.env.local` is gitignored. Never commit secrets. If you accidentally do, rotate the secret and use `git filter-repo` to scrub history before pushing.

---

## 10. Documentation discipline

When you change something a future contributor needs to know, update the docs in the same PR:

| You changed… | Update… |
|---|---|
| Architecture, new service, new data flow | `ARCHITECTURE.md` |
| New design token, new component pattern | `DESIGN.md` |
| New data source, new pipeline | `DATA.md` |
| Setup steps, dependencies | `SETUP.md` |
| Workflow rules (this file) | `CONTRIBUTING.md` |
| Anything user-visible at a high level | `README.md` |

Out-of-date docs are worse than no docs. Reviewers should reject PRs whose docs are stale relative to the code change.

---

## 11. Quick reference — the rules in one screen

1. Never push directly to `main`.
2. Never merge a red PR.
3. Always run `npm run build` locally before pushing — `next dev` is not enough.
4. One commit = one concern, with a Conventional Commits message.
5. Smoke-test prod after every merge.
6. If prod is broken, fix via PR — never via direct push to "fix it quickly."
