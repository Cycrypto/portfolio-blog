# Custom Subagents For `my-blog`

This project now has project-scoped Codex subagents under `.codex/agents/`.

Defined agents:

- `code_mapper`: map the real code path before editing.
- `browser_debugger`: reproduce browser issues and collect evidence without changing code.
- `ui_designer`: turn UI goals into concrete screen, layout, and interaction guidance.
- `ux_researcher`: synthesize browser evidence and feedback into prioritized UX fixes.
- `product_manager`: frame feature decisions, priority, and ship-now versus later scope.
- `business_analyst`: normalize messy requests into explicit scope and acceptance criteria.
- `nextjs_frontend`: implement client and UI changes in `frontend/`.
- `nest_backend`: implement API and persistence changes in `backend/`.
- `ai_worker_engineer`: own `worker/` and the backend integration around AI import/session flows.
- `reviewer`: read-only correctness and regression review.
- `security_reviewer`: read-only security-focused review.
- `ci_debugger`: fix CI, workflow, and deploy automation issues.

Suggested prompt patterns:

```text
Investigate why the admin post editor loses formatting after save.
Have browser_debugger reproduce it, code_mapper trace the frontend/backend path,
and nextjs_frontend implement the smallest fix after the failure mode is clear.
```

```text
Audit the admin posts experience and propose targeted UI/UX improvements.
Have browser_debugger capture the runtime behavior, ux_researcher rank the biggest usability problems,
ui_designer turn those into implementation-ready screen guidance, then let nextjs_frontend apply the smallest high-value changes.
```

```text
Plan a new idea inbox workflow for the admin.
Have business_analyst normalize the request into scope and acceptance criteria,
product_manager recommend ship-now versus later scope, and code_mapper identify the existing touchpoints before implementation starts.
```

```text
Review this branch against main.
Have reviewer find correctness issues and security_reviewer check auth,
sanitization, and upload/comment risks. Wait for both and summarize separately.
```

```text
Investigate why ChatGPT import sometimes fails.
Have code_mapper trace the request path, ai_worker_engineer inspect the worker flow,
and nest_backend fix any API contract mismatch. Wait for all three.
```

```text
CI is failing on this branch.
Have ci_debugger inspect the workflow, reproduce the failing step locally if possible,
and apply the smallest workflow or test fix.
```

Notes:

- These agents are project-scoped and override any global agent with the same `name`.
- Project-level subagent limits live in `.codex/config.toml`.
- Keep orchestration explicit in prompts. Codex does not auto-spawn custom agents.
- The planning and design agents above were adapted for this repo from VoltAgent's `awesome-codex-subagents` catalog.
