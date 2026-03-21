# AGENTS.md

This repository uses project-scoped Codex subagents defined under `.codex/agents/`.

Use this file as the orchestration guide for when to delegate, which agent to use, and how to split ownership cleanly in this monorepo.

## Repository Map

- `frontend/`: Next.js 15 app-router application, admin UI, TipTap editor, public blog pages, client API bindings.
- `backend/`: NestJS 11 API, TypeORM entities and migrations, auth, comments, profile, projects, ideas, media.
- `worker/`: Node-based AI worker for ChatGPT import, summarization, and assistant/session flows.
- `.github/workflows/`: CI and deploy automation.

## Available Project Agents

- `code_mapper`
  Read-only explorer for tracing the real code path across `frontend/`, `backend/`, and `worker/`.
- `browser_debugger`
  Reproduces UI bugs, captures browser evidence, and reports actual runtime behavior without changing code.
- `ui_designer`
  Read-only UI design specialist for concrete screen-level direction and implementation-ready interaction guidance.
- `ux_researcher`
  Read-only UX synthesis agent for turning browser evidence and feedback into prioritized usability changes.
- `product_manager`
  Read-only product planning agent for feature framing, prioritization, and ship-now versus later scope.
- `business_analyst`
  Read-only requirements agent for clarifying scope, constraints, and acceptance criteria before engineering starts.
- `nextjs_frontend`
  Owns implementation in `frontend/`.
- `nest_backend`
  Owns implementation in `backend/`.
- `ai_worker_engineer`
  Owns implementation in `worker/` and the backend integration around AI worker flows.
- `reviewer`
  Read-only reviewer for correctness, regressions, and missing tests.
- `security_reviewer`
  Read-only reviewer for auth, sanitization, uploads, secrets, and trust boundaries.
- `ci_debugger`
  Owns GitHub Actions, build/test automation, and deployment workflow troubleshooting.

## Default Orchestration Rules

1. Keep simple tasks local.
   Do not spawn subagents for small, single-file, low-ambiguity changes.

2. Use subagents when the task is parallelizable or crosses boundaries.
   Good candidates are frontend/backend integration bugs, AI worker flows, code reviews, and CI failures.

3. Keep ownership disjoint.
   Use one implementation agent per write area.
   `nextjs_frontend` owns `frontend/`.
   `nest_backend` owns `backend/`.
   `ai_worker_engineer` owns `worker/` and worker integration fixes.

4. Prefer read-only discovery first when the root cause is unclear.
   Start with `code_mapper` for code-path tracing.
   Start with `browser_debugger` for UI regressions or flaky browser behavior.

5. Prefer read-only planning and design agents before implementation when the work is not yet concrete.
   For UI/UX changes, start with `ux_researcher` and/or `ui_designer`.
   For new feature discovery, start with `business_analyst` and `product_manager`.

6. Do not implement before the failure mode or scope is understood.
   For ambiguous bugs, wait for `code_mapper` or `browser_debugger` before handing off to a write-capable agent.
   For ambiguous features, wait for `business_analyst` or `product_manager` before handing off to an implementation agent.

7. Use review agents at the end of risky changes.
   Run `reviewer` after meaningful behavior changes.
   Run `security_reviewer` when auth, admin-only actions, uploads, rendering, comments, or worker trust boundaries are touched.

8. Keep delegation depth shallow.
   This project is configured for direct child delegation only. Avoid recursive fan-out.

## Recommended Patterns

### UI bug or regression

Use:
- `browser_debugger`
- `code_mapper`
- `nextjs_frontend`

Pattern:
- `browser_debugger` reproduces and captures evidence.
- `code_mapper` identifies the responsible code path and API boundary.
- `nextjs_frontend` applies the smallest defensible fix in `frontend/`.

Prompt template:

```text
Investigate why the admin post editor loses formatting after save.
Have browser_debugger reproduce it, code_mapper trace the frontend/backend path,
and nextjs_frontend implement the smallest fix after the failure mode is clear.
Wait for the discovery agents before changing code.
```

### UI/UX improvement or redesign

Use:
- `browser_debugger`
- `ux_researcher`
- `ui_designer`
- `nextjs_frontend`

Add `code_mapper` if API ownership or state flow is unclear.

Pattern:
- `browser_debugger` captures the actual runtime behavior and friction.
- `ux_researcher` ranks the biggest task-completion problems and likely causes.
- `ui_designer` turns those findings into implementation-ready screen and interaction guidance.
- `nextjs_frontend` implements the smallest high-value change in `frontend/`.

Prompt template:

```text
Audit the admin posts experience and propose targeted UI/UX improvements.
Have browser_debugger capture runtime behavior, ux_researcher rank the biggest usability problems,
ui_designer turn those into implementation-ready screen guidance, then let nextjs_frontend apply the smallest high-value changes once the plan is clear.
```

### Backend contract or persistence bug

Use:
- `code_mapper`
- `nest_backend`

Add `nextjs_frontend` only if the client contract must change.

Prompt template:

```text
Investigate why comment deletion returns success but the admin list stays stale.
Have code_mapper trace the request path and data flow, then have nest_backend fix the root cause.
Only involve nextjs_frontend if the backend contract is not the issue.
```

### AI worker or ChatGPT import issue

Use:
- `code_mapper`
- `ai_worker_engineer`
- `nest_backend`

Pattern:
- `code_mapper` maps the request and response path.
- `ai_worker_engineer` inspects worker logic, model/config behavior, retries, and persistence.
- `nest_backend` fixes DTO, gateway, or integration mismatches in `backend/src/ideas/`.

Prompt template:

```text
Investigate why ChatGPT import sometimes fails.
Have code_mapper trace the request path, ai_worker_engineer inspect the worker flow,
and nest_backend fix any API contract mismatch. Wait for all three and summarize the failure mode first.
```

### New feature planning or discovery

Use:
- `business_analyst`
- `product_manager`
- `code_mapper`

Add `ui_designer` when the feature changes a user-facing flow.
Add `nextjs_frontend`, `nest_backend`, or `ai_worker_engineer` only after scope and acceptance criteria are explicit.

Pattern:
- `business_analyst` normalizes the request into scope, assumptions, constraints, and acceptance criteria.
- `product_manager` recommends ship-now versus later scope and sequencing tradeoffs.
- `code_mapper` identifies the existing touchpoints, dependencies, and implementation boundary.

Prompt template:

```text
Plan a new idea inbox workflow for the admin.
Have business_analyst normalize the request into scope and acceptance criteria,
product_manager recommend ship-now versus later scope, and code_mapper identify the existing frontend/backend touchpoints before implementation starts.
```

### Code review

Use:
- `reviewer`
- `security_reviewer`

Add `code_mapper` if the branch is large or the affected boundaries are unclear.

Prompt template:

```text
Review this branch against main.
Have reviewer find correctness issues and missing tests.
Have security_reviewer check auth, sanitization, uploads, comments, and worker trust boundaries.
Wait for both and summarize separately.
```

### CI or deployment failure

Use:
- `ci_debugger`

Add `reviewer` only after the automation fix if the failure hints at a code regression.

Prompt template:

```text
CI is failing on this branch.
Have ci_debugger inspect the workflow, reproduce the failing step locally if possible,
and apply the smallest workflow or test fix. Summarize whether the breakage is code, config, or missing secrets.
```

## Ownership Boundaries

- `nextjs_frontend` should not edit `backend/` or `worker/` unless the parent agent explicitly reassigns ownership.
- `nest_backend` should not make opportunistic frontend changes to paper over API issues.
- `ai_worker_engineer` should not absorb unrelated NestJS or UI cleanup.
- `ui_designer`, `ux_researcher`, `product_manager`, and `business_analyst` are read-only planning roles first. Keep them focused on decisions, constraints, and handoff quality unless the parent agent explicitly reassigns ownership.
- `browser_debugger`, `reviewer`, `security_reviewer`, and `code_mapper` are discovery/review roles first. Keep them read-heavy unless a role explicitly allows edits.

## Verification Expectations

- Planning and design recommendations:
  Ground them in repository evidence, browser captures, existing component patterns, or explicit user feedback.
- UI behavior changes:
  Validate the affected user flow, preferably with browser evidence.
- Backend behavior changes:
  Validate the endpoint or service path, and update tests when the change is non-trivial.
- Worker behavior changes:
  Validate the backend-to-worker path and any parsing, retry, or persistence changes.
- CI changes:
  Confirm the exact failing step is addressed without broad workflow churn.

## Prompting Notes

- Custom agents are not auto-spawned. Ask explicitly for the agents you want.
- Be specific about ordering when discovery must finish before implementation.
- Ask for separate summaries when you want each agent’s result preserved.
- Ask the parent agent to close with a consolidated conclusion and next action.

## Examples Of Good Delegation

Good:

```text
Have browser_debugger reproduce the issue, code_mapper locate the owning code,
then let nextjs_frontend make the smallest fix once the failure mode is confirmed.
```

Good:

```text
Have reviewer and security_reviewer review this branch in parallel and wait for both.
```

Avoid:

```text
Spawn a lot of agents and have them all fix anything they find.
```

Avoid:

```text
Have nextjs_frontend, nest_backend, and ai_worker_engineer all edit whatever files they think are relevant.
```
