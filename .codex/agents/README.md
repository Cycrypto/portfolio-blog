# Custom Subagents For `my-blog`

This project now has project-scoped Codex subagents under `.codex/agents/`.

Defined agents:

- `code_mapper`: map the real code path before editing.
- `browser_debugger`: reproduce browser issues and collect evidence without changing code.
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
