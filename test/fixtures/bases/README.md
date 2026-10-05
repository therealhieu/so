# Bases fixtures

- `alfred/` — parser cases ported from Alfred's Bases tests.
- `group-order.base` — a view whose `groupOrder` lists `todo`, `doing`, `done`, and `null` (the group without a value).

## Kanban fixture

`KANBAN_TYPE` in `src/core/features/bases/types.ts` stays `undefined` until a `.base` file saved by core Obsidian 1.14.3 or later, with a Kanban view, is added here as `obsidian-kanban.base`, unchanged. Its view `type` then becomes `KANBAN_TYPE`, and a test asserts that `parseBase` reads it.

Record where the file came from before adding it:

| Field | Value |
|---|---|
| Obsidian version (Settings → About) | |
| Installer version | |
| Operating system | |
| Date saved | |
| Steps (Create new base → Add view → Kanban → Group by → …) | |
| Community Kanban plugins enabled | none (required) |
