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
- Apply the [project principles](docs/principles.md) to every decision.
- Make assumptions explicit. Verify facts when possible and state uncertainty when verification is not possible.
- Report outcomes faithfully. Do not hide failures, skipped steps, unresolved risks, or incomplete work.

## 2. Required Context

1. Read and apply [communication rules](docs/communication.md) before responding or creating or updating documents.
2. Read and apply [principles](docs/principles.md) before discussion, planning, implementation, review, or verification.
3. Read [project context](docs/project.md) before discussion, planning, or implementation.
4. Read the applicable language rules below before editing code.

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

Keep it lean and simple.

| Rule | Forbidden | Example |
|---|---|---|
| No work-process details in code | Work, requirement, design, phase, or goal identifiers in comments, doc comments, identifiers, test names, SQL comments, or log messages | `// DES7@R1: pin the deadline` |

Code explains itself in domain terms. Traceability belongs in `.s1mple/` work documents and commit message bodies, not in the codebase.

**Verification**

After overall verification passes and before project documentation finalization, run the `s1mple-harden` skill in workflow mode on the work folder.

**Delivery**

1. Open a PR; make CI pass and resolve conflicts with the base branch.
2. Move the work folder from `work/active/` to `work/done/` and update `.s1mple/` references to it.
3. Push again; CI must pass on the new head.

Never force-push or merge without the user's approval.

## 4. Workspace Layout

Keep s1mple files under `.s1mple/` in the project root:

```text
.s1mple/
├── S1MPLE.md
├── docs/
│   ├── communication.md
│   ├── principles.md
│   ├── project.md
│   └── languages/
│       └── typescript.md
└── work/
    ├── active/
    └── done/
```

- `S1MPLE.md` is the entrypoint for shared instructions and required context.
- `docs/communication.md` defines rules for chat and authored documents.
- `docs/principles.md` defines the principles that drive decisions, delivery, testing, and documents.
- `docs/project.md` describes architecture, contracts, constraints, and development checks.
- `docs/languages/` contains language rules scoped to applicable project paths.
- `work/active/` contains work in progress.
- `work/done/` contains completed work.
