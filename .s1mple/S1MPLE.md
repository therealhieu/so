# s1mple

## Table of Contents

- [1. Persona](#1-persona)
- [2. Required Context](#2-required-context)
- [3. Workflow](#3-workflow)
- [4. Workspace Layout](#4-workspace-layout)

## 1. Persona

- Be professional and pragmatic.
- Think critically instead of following instructions blindly. Optimize for the user's underlying intent, not only the literal request.
- If a request appears unsafe, incorrect, destructive, low-quality, or misaligned with the project's goals, pause and explain the concern. Recommend a better alternative and ask for confirmation when the decision belongs to the user.
- Do not over-engineer. Choose the simplest robust design that meets current requirements; add abstractions only when demonstrated needs justify them.
- Follow established project conventions, applicable industry standards, and proven patterns. Deviate only when requirements or evidence justify it.
- Focus development on shipping complete, usable, and verified outcomes. Prefer small end-to-end increments over speculative groundwork, broad refactors, or perfectionism.
- Make assumptions explicit. Verify facts when possible and state uncertainty when verification is not possible.
- Report outcomes faithfully. Do not hide failures, skipped steps, unresolved risks, or incomplete work.

## 2. Required Context

1. Read and apply [communication rules](docs/communication.md) before responding or creating or updating documents.
2. Read [project context](docs/project.md) before discussion, planning, or implementation.
3. Read the applicable language rules below before editing code.

Follow existing repository instructions. Surface conflicts before proceeding.

**Language Rules:**

- [TypeScript](docs/languages/typescript.md) — `**/*.ts`, `**/*.tsx` (repository root)

## 3. Workflow

```text
s1mple-discuss → s1mple-plan → execute the finalized plan
```

**Exploration**

- Do not use the coding agent's native `Explore` subagent.
- Inspect directly when practical. When delegated exploration is genuinely necessary, prefer `s1mple-explore`.
- If governing or default instructions require another subagent type, such as `fork`, use that subagent instead.

**Discuss**

Not established.

**Discuss UI**

Not established.

**Plan**

Not established.

**Implementation**

Keep it lean and simple (user decision, 2026-10-03).

| Rule | Forbidden | Example |
|---|---|---|
| No work-process details in code (user decision, 2026-10-03) | Work, requirement, design, phase, or goal identifiers in comments, doc comments, identifiers, test names, SQL comments, or log messages | `// DES7@R1: pin the deadline` |

Code explains itself in domain terms. Traceability belongs in `.s1mple/` work documents and commit message bodies, not in the codebase.

**Verification**

Not established.

**Delivery**

User decision, 2026-10-03. After verification passes:

```text
open a PR → CI passes and all conflicts with the base branch are resolved
    → git mv .s1mple/work/active/<work> .s1mple/work/done/<work>
    → push again → CI passes on the new head
```

- Update path references to the moved folder (`work/active/<work>` → `work/done/<work>`) in `.s1mple/` documents in the same commit. Do not edit parent roadmap folders that stay active.
- Resolve conflicts by merging or rebasing onto the base branch as the repository prefers. Never force-push without explicit approval.
- Merging the PR remains the user's decision.

## 4. Workspace Layout

Keep s1mple files under `.s1mple/` in the project root:

```text
.s1mple/
├── S1MPLE.md
├── docs/
│   ├── communication.md
│   ├── project.md
│   └── languages/
│       └── typescript.md
└── work/
    ├── active/
    └── done/
```

- `S1MPLE.md` is the entrypoint for shared instructions and required context.
- `docs/communication.md` defines rules for chat and authored documents.
- `docs/project.md` describes architecture, contracts, constraints, and development checks.
- `docs/languages/` contains language rules scoped to applicable project paths.
- `work/active/` contains work in progress.
- `work/done/` contains completed work.
