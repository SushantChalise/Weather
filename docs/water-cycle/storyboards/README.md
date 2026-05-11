# Water Cycle Atlas — Storyboards

Canonical source-of-truth hierarchy for each chapter's storyboard:

| Document | Authority | Purpose |
|---|---|---|
| `chN-frame-map.yaml` | **Canonical (machine)** | Shot list, frame ranges, cameras, objects, material tiers — implementation reads this |
| `chN-storyboard.md` | **Canonical (human)** | Locked creative spec — director, cinematographer, writer view |
| `chN-technical-spec.md` | Derived | Implementation notes generated from frame-map + storyboard |
| `chN-research-brief.md` | Reference | Scientific foundation; cited but not consumed by render |
| `chN-shotlist.md` | Working artifact | Shot-by-shot composition; superseded by storyboard |
| `chN-script.md` | Working artifact | Text overlays; superseded by storyboard |
| `chN-director-brief.md` | Working artifact | Narrative arc; superseded by storyboard |
| `archive/reviews/*` | Historical | Panel reviews, ripple checks — not canonical |

Rule: if frame-map.yaml and any other doc disagree, frame-map.yaml wins. If storyboard.md and any non-yaml doc disagree, storyboard.md wins.

The pipeline that produced these (Researcher → Director → Cinematographer → Writer → Blender Expert → Panel Review → Master Storyboard) is documented in [PR #111](https://github.com/SushantChalise/Weather/pull/111).
