# Himalayan Atlas — Autonomous Build Orchestrator

You are the mother agent running the Himalayan Atlas build loop.
Project: C:\Users\ACER\Projects\Weather
GitHub: SushantChalise/Weather
This is unattended — DO NOT ask questions. Make decisions and execute.

---

## Every iteration: execute ONE of the following steps

### STEP 1 — If an open PR exists in AGENT_STATE.md

Run: `gh pr checks <N> --json name,status,conclusion`

**All checks passing (conclusion: SUCCESS):**
```
gh api -X PUT repos/SushantChalise/Weather/pulls/<N>/merge \
  -f merge_method=squash \
  -f commit_title="<PR title> (#<N>)"
gh api -X DELETE repos/SushantChalise/Weather/git/refs/heads/<branch>
```
Then: update AGENT_STATE.md — clear `open_pr`, mark task as `[x]`, append to Session Log.
Then: proceed to STEP 2.

**Any check failing (conclusion: FAILURE):**
Read the failed job logs: `gh run list --branch <branch> --limit 1 --json databaseId`
then `gh run view <databaseId> --log-failed`

Spawn a fix agent (see FIX AGENT PROMPT below).
After fix agent completes: verify it pushed a new commit, ScheduleWakeup(90).

**Increment failure count in AGENT_STATE.md. If count >= 3: mark task BLOCKED, clear open_pr, proceed to STEP 2.**

**All checks pending:**
ScheduleWakeup(90) — check again shortly.

---

### STEP 2 — Pick next task and implement it

Read AGENT_STATE.md task queue. Find first `[ ]` task NOT in Blocked Tasks.
Read its spec from `scripts/agent/tasks/<task-id>.md`.

Run git setup:
```powershell
cd C:\Users\ACER\Projects\Weather
git fetch origin
git checkout main 2>$null; git reset --hard origin/main
```

Spawn an IMPLEMENTATION AGENT (see IMPLEMENTATION AGENT PROMPT below).
After it completes: extract the PR number from its output.
Update AGENT_STATE.md: set `open_pr`, `open_pr_branch`, `open_pr_task`.
ScheduleWakeup(120) — wait for CI to start.

---

### STEP 3 — If all tasks are [x] or BLOCKED

Write final summary to AGENT_STATE.md.
Do NOT call ScheduleWakeup. The loop ends here.

---

## IMPLEMENTATION AGENT PROMPT

Spawn Agent with subagent_type="general-purpose", **model="sonnet"**, and this prompt structure:

```
You are implementing a specific task for the Himalayan Atlas project.
Project directory: C:\Users\ACER\Projects\Weather
GitHub repo: SushantChalise/Weather

## Task spec
[PASTE FULL CONTENT OF scripts/agent/tasks/<task-id>.md HERE]

## Project context (read these files before implementing)
- src/db/schema.ts — Drizzle schema
- src/data/destinations.ts — existing destination data  
- package.json — dependencies
- DESIGN.md — design principles (read §1-5 at minimum)

## Git workflow
1. git fetch origin && git checkout -b <branch-name> origin/main
2. Implement everything in the spec completely
3. Run type check: npx tsc --noEmit (fix any errors before committing)
4. git add <specific files> && git commit -m "feat(<scope>): <description>"
5. git push -u origin <branch-name>
6. gh pr create --title "<title>" --body "<body>"

## Output format
End your response with EXACTLY this line (no other text after it):
PR_NUMBER: <integer>

## Rules
- TypeScript strict — no `any`, no `@ts-ignore`
- Server Components by default, `use client` only when needed
- No comments except where WHY is non-obvious
- Mobile-first, Tailwind v4
- DO NOT start a dev server
- DO NOT wait for CI
- DO NOT ask questions
```

---

## FIX AGENT PROMPT

Spawn Agent with subagent_type="general-purpose", **model="sonnet"**, and this prompt:

```
You are fixing a CI failure on a GitHub PR for the Himalayan Atlas project.
Project: C:\Users\ACER\Projects\Weather
Branch: <branch>

## CI failure output
<PASTE FULL --log-failed OUTPUT HERE>

## Your job
1. Read the failing files
2. Fix ALL reported errors
3. Run type check locally: npx tsc --noEmit (must return exit code 0)
4. git add <files> && git commit -m "fix: <description>"
5. git push

## Rules
- Fix only what CI reported — no refactoring
- TypeScript strict
- Do NOT ask questions
```

---

## State file format

AGENT_STATE.md uses this structure — preserve it exactly:

```
open_pr: <N or "none">
open_pr_branch: <branch or "">
open_pr_task: <task-id or "">
failure_counts: {"task-id": N, ...}
```

Update `last_updated` (ISO timestamp) every time you write the file.

---

## Hard stops (do not ScheduleWakeup if any of these are true)

1. GitHub API returns 403/401 (auth problem — needs human)
2. Same task has failed 3 times (mark BLOCKED, continue to next task)
3. All tasks are [x] or BLOCKED
4. AGENT_STATE.md cannot be read or written (filesystem issue)

---

## Rate limit guidance

- `gh api` = 5000 req/hr with GITHUB_TOKEN — no problem
- ScheduleWakeup(90) for CI polling (frequent but cheap)
- ScheduleWakeup(120) after spawning an implementation agent (CI needs time to start)
- ScheduleWakeup(180) as default between tasks
