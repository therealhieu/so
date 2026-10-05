# W261005F2A7 Plan Part 3 — ui-and-delivery

## Status

`Ready`

## Objective

The user sees and uses Git in so exactly as the accepted UI design shows: a change column left of the line numbers, the statusline Git segment, explorer markers, the hunk preview float, `warn` notices, and the which-key `+git`/`+hunk` rows in production, with every surface byte-identical to v1 outside a repository. A real PTY hand-off, the keystroke bench, the project document, manual terminal checks, and the PR complete the work per `.s1mple/S1MPLE.md` Delivery.

## Coverage Summary

- **System Design:** `W261005F2A7-REQ2@R2`, `REQ4@R3`, `REQ5@R2`, `REQ7@R2`, `REQ3@R1` (docs); `DES8`–`DES13` (UI and wiring side); `S7`–`S11`, `S13`–`S15`, `S19`, `S26`, `S31`–`S36`; `V44`–`V47`, `V50`–`V53`, `V61`, `V64`, `V65`
- **UI Design:** `W261005F2A7-UREQ1@R1`–`UREQ12@R1`; `UDES1@R1`–`UDES12@R1`; `US1@R1`–`US12@R1`; `UV1@R1`–`UV4@R1`, `UV6@R1`–`UV10@R1`, `UV13@R1` (snapshot part), `UV14@R1`–`UV18@R1`

## Sources

- Plan index: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-plan-index.md`
- Plan context: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-plan-context.md`
- System design: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-system-design.md`
- UI design: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-ui-design.md` (mockups `ui-mockups/` M1@R3, M2@R3, M3@R3)
- System requirements: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-requirements.md`
- UI requirements: `.s1mple/work/done/w261005f2a7-git-integration/w261005f2a7-ui-requirements.md`

## Dependencies

- Part 1 and Part 2 complete and verified. Consumed outputs: `hunkSigns`, `GIT_SIGNS`, `RenderLine.changeSign`, `explorerMarkers`, `Marker`, `StatusSegments.git`, `MessageLevel`, catalogue constants, `Overlay` `gitHunk`, `gitCommands`/`gitBindings`/`gitGroups` (Part 1); `createGit`, `watchGitDirs`, `createToolHost`, `holdInterrupts`, `Shell.flush/suspend/resume/resetForeignModes` and paint guard, `RunnerDeps.git/watchGit/tool` wired in `main.ts` and `startApp`, `test/support/git-repo.ts`, mounted-shell observability in `test/support/ui.ts`, `test/ui/git.test.ts` (Part 2).

**Execution rules for every task and every delegated agent:**

- Read and follow `.s1mple/S1MPLE.md` and its required references (`docs/communication.md`, `docs/project.md`, `docs/languages/typescript.md`) before editing.
- No work-process identifiers in code, comments, identifiers, test names, or log messages.
- Canonical verification ids follow system design §8 "Test Suites and Cases" and UI design §8.
- Glyphs, wording, token names, and token values come only from the UI design; do not invent or change them.
- Existing v1 snapshots must not change; never update an existing snapshot to make a test pass.
- Kill every process you start (PTYs, test apps, lazygit, watchers) before finishing; check for orphans before `bun run bench`.
- Manual checks run in Ghostty with the tui-test monitor sized to the window; no recording unless the user asks; never Terminal.app as the demo terminal (Terminal.app may only be checked for glyph width when available).
- Never tag or publish a release; never force-push or merge without the user's approval.
- `bun run check` passes before each commit.

## Execution Flow

```text
P3-G1: git surfaces, wiring, and delivery
```

## Groups

### P3-G1 — git surfaces, wiring, and delivery

#### Goal

Every Git surface paints derived state per the UI design, production registries expose the commands, the hand-off and stage update every surface in the right frames, the real PTY hand-off and bench gate pass, `project.md` documents the feature, manual checks are recorded, and the PR is delivered with CI green before and after the work folder moves to `work/done/`.

#### Coverage Summary

- **System Design:** `REQ2@R2`, `REQ3@R1`, `REQ4@R3`, `REQ5@R2`, `REQ7@R2`; `DES8`–`DES13`; `S7`–`S11`, `S13`–`S15`, `S19`, `S26`, `S31`–`S36`; `V44`–`V47`, `V50`–`V53`, `V61`, `V64`, `V65`
- **UI Design:** `UREQ1@R1`–`UREQ12@R1`; `UDES1@R1`–`UDES12@R1`; `US1@R1`–`US12@R1`; `UV1@R1`–`UV4@R1`, `UV6@R1`–`UV10@R1`, `UV13@R1`, `UV14@R1`–`UV18@R1`

#### Scope

- Included: theme tokens and `src/ui/theme.test.ts`; gutter change column and `hunkSigns` provider; statusline segment; explorer markers; message `warn` token; `HunkView` and its registration/anchor in `shell.ts`; production `registries()` merge in `main.ts`; UI suite cases; PTY e2e; bench and `bench-gate` target; `project.md`; manual checks; PR, CI, and work-folder move.
- Excluded: any core or adapter behavior change (defects found here go back through their Part 1/2 tests in the same task, with the fix scoped to the defect).
- Main files: `src/ui/theme.ts`, `src/ui/theme.test.ts`, `src/ui/editors/text-view.ts`, `src/ui/views/{statusline,explorer,cmdline}.ts`, `src/ui/overlays/hunk.ts`, `src/ui/shell.ts`, `src/app/main.ts`, `test/ui/git.test.ts`, `test/e2e/git-tool.test.ts`, `test/bench/git-diff.bench.ts`, `scripts/bench-gate.ts`, `.s1mple/docs/project.md`

#### Traceability

| System chain | UI chain | Required outcome |
|---|---|---|
| `REQ4@R3 → DES10, DES13 → S34` | `UREQ12@R1 → UDES12@R1 → US12@R1 → UV18@R1` | 17 tokens resolve in dark/light/nocolor; no existing token changes |
| `REQ4@R3, REQ5@R2 → DES10, DES12 → S7, S8, S32, S33 → V44, V64, V65` | `UREQ1@R1, UREQ2@R1, UREQ11@R1 → UDES1@R1, UDES2@R1, UDES11@R1 → US1@R1, US2@R1, US11@R1 → UV1@R1–UV4@R1, UV17@R1` | Change column in a repo only; paint, hit-test, and cursor agree; v1 frames unchanged outside a repo |
| `REQ4@R3 → DES10, DES13 → S9, S10, S34 → V45, V46` | `UREQ4@R1, UREQ5@R1, UREQ9@R1 → UDES4@R1, UDES5@R1, UDES9@R1 → US4@R1, US5@R1, US9@R1 → UV7@R1, UV8@R1, UV13@R1` | Segment after path, dropped first; markers after name and `●`; `warn` painted `messageWarn` |
| `REQ4@R3 → DES11 → S7 → V47` | `UREQ6@R1 → UDES6@R1 → US6@R1 → UV9@R1, UV10@R1` | Float layout, cap, placement, dismissal |
| `REQ4@R3, REQ2@R2 → DES11, DES9, DES13 → S35, S36` | `UREQ3@R1, UREQ7@R1, UREQ10@R1 → UDES3@R1, UDES7@R1, UDES10@R1 → US3@R1, US7@R1, US10@R1 → UV6@R1, UV14@R1` | Production which-key rows; stage updates all surfaces in one frame; hand-off frames |
| `REQ2@R2, REQ5@R2, REQ7@R2 → DES2, DES8, DES9 → S13–S15, S19, S26 → V50, V51, V53` | None | PTY hand-off restores the terminal and survives Ctrl-C; keystroke P95 within gate; first frame unchanged |
| `REQ1@R2–REQ9@R1 → DES1–DES13 → S1–S36 → V52, V61` | `UREQ2@R1, UREQ4@R1, UREQ10@R1 → US2@R1, US4@R1, US10@R1 → UV15@R1, UV16@R1` | Full checks and build; manual hand-off and glyph-width observations |

#### Cross-Work Gates

None

#### Tasks

##### P3-G1-T1 — Git theme tokens

- **Outcome:** `TOKENS` gains the 17 Git tokens with the UI design's palette keys and attributes; every pre-existing token resolves exactly as before in dark, light, and nocolor.
- **System Design:** `REQ4@R3`; `DES10`, `DES13`; `S34`
- **UI Design:** `UREQ12@R1`, `UREQ2@R1`; `UDES12@R1`; `US12@R1`; `UV18@R1`
- **Canonical Shapes:** UI design §7 Component: Git theme tokens (table and code shape)
- **Files:** `src/ui/theme.ts` — `TOKENS`; `src/ui/theme.test.ts` (new)
- **Execution Approach:** TDD

**Steps:**

1. **RED — `UV18`:** `src/ui/theme.test.ts` — each Git token resolves to its palette keys and attributes in each theme; nocolor uses default colours with the NO_COLOR attributes; every pre-existing token equals a snapshot taken from the current resolution.

   **Preview:**

   ```ts
   test("git tokens resolve to their palette colours in every theme", () => {
     // for each [name, fg, bg, attrs, noColorAttrs] in the UI design table:
     // expect(themes.dark.style(name)).toEqual(styleFrom(palette.dark[fg], palette.dark[bg], attrs)); likewise light; nocolor attrs
   });
   test("existing tokens keep their values", () => {
     // expect(resolveAll(themes)).toMatchSnapshot() — snapshot recorded BEFORE adding tokens, filtered to pre-existing names
   });
   ```

   - Record the pre-existing-token snapshot first (on the unmodified theme), then run and confirm the Git-token case fails.

2. **GREEN:** `src/ui/theme.ts`

   **Preview:**

   ```ts
   // Git: each sign kind and marker has its own glyph, so colour only adds emphasis.
   // add exactly the 17 entries from UI design §7 Component: Git theme tokens
   ```

   - No palette change; no edit to an existing entry.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   allowed: grouping the new entries in one block
   prohibited: reordering or editing existing tokens
   ```

   - Keep all affected checks passing (`test/ui/theme.golden.test.ts`).

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): add git theme tokens

   Task: P3-G1-T1 — Git theme tokens
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `UV18@R1` — `bun test src/ui/theme.test.ts` → pass; `bun test test/ui/theme.golden.test.ts` → unchanged.

##### P3-G1-T2 — Gutter change column

- **Outcome:** Inside a repository the editor appends `hunkSigns` to `layoutFrame`'s providers and paints `row.changeSign` (or a blank) at x = 0 on each line's first screen row; `gutterWidth(lineCount, change)` is called with the same `s.git.repo !== null` for paint, hit-test, and cursor; outside a repository the provider list and gutter are byte-identical to v1.
- **System Design:** `REQ4@R3`, `REQ5@R2`; `DES10`, `DES12`; `S7`, `S8`, `S32`, `S33`; `V44`, `V64`, `V65`
- **UI Design:** `UREQ1@R1`, `UREQ2@R1`, `UREQ11@R1`; `UDES1@R1`, `UDES2@R1`, `UDES11@R1`; `US1@R1`, `US2@R1`, `US11@R1`; `UV1@R1`, `UV2@R1`, `UV3@R1`, `UV4@R1`, `UV17@R1`
- **Canonical Shapes:** UI design §7 Surface: Editor gutter (Applicable Code Shape), Component: Git sign column; system design §7 UI files (`EditorView.layoutFrame`, `gutterWidth`)
- **Files:** `src/ui/editors/text-view.ts` — `gutterWidth`, `layoutFrame` providers, gutter painter, the three width callers (`:335`, `:457`, `:520`); `test/ui/git.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V44`, `V64`, `V65`, `UV1`–`UV4`, `UV17`:** `test/ui/git.test.ts` with `mountShell` and seeded `GitState`.

   **Preview:**

   ```ts
   test("changed lines show their git sign left of the line number", async () => {
     // 120×36, add hunk on line 18, cursor on 18 in live view: row starts "+  18 ▕"; unchanged row starts " " + number;
     // wrapped continuation row has " " in cell 0
   });
   test("every sign kind shows its glyph in every view and theme", async () => {
     // add/change/delete/topdelete/changedelete + an untracked buffer; live/source/reading × dark/light/color="never"
     // cell 0 glyphs "+ ~ _ ‾ ≃ ┆" with cellStyle equal to the git* token; nocolor glyphs still distinct
   });
   test("a rendered block shows the git sign of a changed hidden line", async () => { /* mermaid block, third hidden line changed → "~" on the block row; v1 sign cell unchanged */ });
   test("a reveal sign and a git sign share a line, and nothing changes outside a repository", async () => {
     // repo frame: git glyph x = 0, "▕" in the sign cell, text one cell right; git.repo null frame equals the existing v1 snapshot
   });
   test("clicks and the cursor land on the painted text with the change column", async () => {
     // press on text column 5 of line 3 → cursor {3, 5}; drawn cursor x === rect.x + gutterWidth(lineCount, true) + 5
     // line "abcdef" at line 5: click the cell showing "c" → cursor col 2; cursor().x === screen x of "c"
   });
   ```

   - Run `bun test test/ui/git.test.ts` and confirm the new cases fail; confirm every existing `test/ui` snapshot still passes.

2. **GREEN:** `src/ui/editors/text-view.ts`

   **Preview:**

   ```ts
   const gutterWidth = (lineCount: number, change: boolean) =>
     (change ? 1 : 0) + Math.max(4, String(lineCount).length) + 2;
   const git = s.git.repo ? [hunkSigns(s.git.files[b.path]?.hunks ?? [])] : [];
   // providers: [...existing, ...git]
   // gutter(text, at, sign?, changeSign?) per UI design §7 Surface: Editor gutter; continuation and "~" filler rows leave cell 0 blank
   ```

   - All three width callers pass the same flag from the same state in one frame.

3. **REFACTOR:** Compute `change` once per frame and pass it down.

   **Preview:**

   ```text
   allowed: one `change` value per layout pass
   prohibited: touching the v1 number/sign cell logic beyond the x shift
   ```

   - Keep all affected checks passing; no existing snapshot file changes.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): paint git signs in a change column inside a repository

   Task: P3-G1-T2 — Gutter change column
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V44`, `V64`, `V65`, `UV1@R1`–`UV4@R1` — `bun test test/ui/git.test.ts` → pass.
- `UV17@R1` — `bun test test/ui` with `git status --porcelain test/ui/__snapshots__` → no modified existing snapshot.

##### P3-G1-T3 — Statusline, explorer, and message-line surfaces

- **Outcome:** The statusline paints `⎇ <ref> [op] [+a] [~c] [-r]` right after the path with per-part tokens, hides zero counts, and drops `git` first (`[git, preview, words, view]`, always when narrow); explorer rows paint ` M`, ` S`, ` ?`, ` U`, or ` •` after the name and `●` via `put`; the message painter maps `warn` to `messageWarn`; outside a repository none of these appear.
- **System Design:** `REQ4@R3`; `DES10`, `DES13`; `S9`, `S10`, `S34`; `V45`, `V46`
- **UI Design:** `UREQ4@R1`, `UREQ5@R1`, `UREQ9@R1`, `UREQ11@R1`; `UDES4@R1`, `UDES5@R1`, `UDES9@R1`, `UDES11@R1`; `US4@R1`, `US5@R1`, `US9@R1`, `US11@R1`; `UV7@R1`, `UV8@R1`, `UV13@R1` (snapshot part)
- **Canonical Shapes:** UI design §7 Component: Statusline Git segment, Component: Explorer Git marker, Surface: Message line (code shapes)
- **Files:** `src/ui/views/statusline.ts` — `Seg.parts`, `gitSegment`, drop list, part painting; `src/ui/views/explorer.ts` — `GIT_MARKERS`, row painter; `src/ui/views/cmdline.ts` — `MESSAGE_TOKEN`; `test/ui/git.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V45`, `V46`, `UV7`, `UV8`, `UV13`:** `test/ui/git.test.ts`.

   **Preview:**

   ```ts
   test("the statusline git segment reads its variants and drops first", async () => {
     // texts "⎇ main +2 ~2 -3", "⎇ main", "⎇ a1b2c3d rebasing +2 ~2 -3", "⎇ main merging", unborn "⎇ main", untracked "⎇ main" right after the path
     // 80 cols → no "⎇"; 100 cols long path → "⎇" dropped before preview; "rebasing" uses statusGitOp (underline in nocolor)
   });
   test("explorer rows show git markers after the name", async () => {
     // "2026-10-02.md S", "so-roadmap.md ● M", "ideas.md ?" expanded / "ideas •" collapsed, selected "linh.md U" in base style,
     // "daily •" and no "2026-10-03.md" row, no "D"; floating explorer at 80×24 identical markers; nocolor
   });
   test("warnings and errors use their own message styles", async () => {
     // stale notice → messageWarn style; conflict notice → messageError (bold in nocolor); dark and nocolor
   });
   ```

   - Run `bun test test/ui/git.test.ts` and confirm failure.

2. **GREEN:** statusline, explorer, cmdline

   **Preview:**

   ```ts
   // statusline.ts — per UI design §7 Component: Statusline Git segment
   type Seg = { text: string; token: string; parts?: readonly { text: string; token: string }[] };
   function gitSegment(g: NonNullable<StatusSegments["git"]>): Seg { /* parts per UI design */ }
   // explorer.ts — GIT_MARKERS and `put(\` ${glyph}\`, token)` after the dirty dot
   // cmdline.ts
   const MESSAGE_TOKEN = { info: "message", warn: "messageWarn", error: "messageError" } as const;
   ```

   - The marker map comes only from `explorerMarkers(s.git.status)`; no precedence logic in the view.

3. **REFACTOR:** None beyond removing the old two-level ternary.

   **Preview:**

   ```text
   allowed: replacing the cmdline ternary with the lookup
   prohibited: changing v1 segment order or truncation rules
   ```

   - Keep all affected checks passing; existing snapshots unchanged.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): show git state in the statusline, explorer, and message line

   Task: P3-G1-T3 — Statusline, explorer, and message-line surfaces
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V45`, `V46`, `UV7@R1`, `UV8@R1`, `UV13@R1` (snapshot) — `bun test test/ui/git.test.ts` → pass.

##### P3-G1-T4 — Hunk preview float

- **Outcome:** `HunkView` paints the `gitHunk` overlay: framed float titled ` hunk preview ` with footer `esc / q close`, header `<glyph> <kind label> · <range> · hunk <n>/<m>`, `- ` rows in `diffDel` then `+ ` rows in `diffAdd`, capped at 12 (8 when narrow) with the overflow row, below the cursor row or above when it does not fit, inside the editor area; `itemAt` answers only inside the float; `shell.ts` registers it with an anchor callback giving the active editor text rect and cursor row.
- **System Design:** `REQ4@R3`; `DES11`; `S7`; `V47`
- **UI Design:** `UREQ6@R1`; `UDES6@R1`; `US6@R1`; `UV9@R1`, `UV10@R1`
- **Canonical Shapes:** UI design §7 Surface: Hunk preview float, Component: HunkView (code shape); system design §7 `src/ui/shell.ts` (registration)
- **Files:** `src/ui/overlays/hunk.ts` — `HunkView`, `KIND_LABEL`; `src/ui/shell.ts` — overlay list, anchor; `test/ui/git.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V47`, `UV9`, `UV10`:** `test/ui/git.test.ts`.

   **Preview:**

   ```ts
   test("the hunk float lays out header, removed and added lines, and caps long hunks", async () => {
     // changedelete 3 removed / 1 added at hunk 3/4: header "≃ changed + deleted · line 31 · hunk 3/4"; three "- " diffDel then one "+ " diffAdd
     // delete after line 35: "after line 35"; 22-line add: 12 rows then "… 10 more lines (0 removed, 22 added)"; 80×24: 8 rows, "… 14 more lines …"
     // footer "esc / q close"; near the bottom → above the cursor row; never covers the cursor row; 80×24 width reaches the editor right edge
   });
   test("the hunk float closes on escape, q, outside clicks, and other keys", async () => {
     // Esc / q / outside click → closed, cursor unchanged; inside click → open; j → closed and cursor down;
     // Space g h p on a clean line → nothing opens, message "no hunk at cursor"
   });
   ```

   - Run `bun test test/ui/git.test.ts` and confirm failure.

2. **GREEN:** `src/ui/overlays/hunk.ts`, `src/ui/shell.ts`

   **Preview:**

   ```ts
   export class HunkView extends Renderable { /* per UI design §7 Component: HunkView; drawFrame from overlays/host.ts */ }
   // shell.ts: add `new HunkView(ctx, () => activeEditorAnchor())` to the OverlayHost views
   ```

   - Added lines come from the buffer at `hunk.new`; `n/m` from `s.git.files[path].hunks` matched by `new.start`; the view computes no diff.
   - Registration must not bypass the suspend paint guard from Part 2.

3. **REFACTOR:** Keep placement math in one private method.

   **Preview:**

   ```text
   allowed: private layout helpers in hunk.ts
   prohibited: key or close rules in the view (core owns them)
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(ui): add the hunk preview float

   Task: P3-G1-T4 — Hunk preview float
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V47`, `UV9@R1`, `UV10@R1` — `bun test test/ui/git.test.ts` → pass.

##### P3-G1-T5 — Production registries and cross-surface frames

- **Outcome:** `registries()` in `src/app/main.ts` merges `gitCommands`, `gitBindings`, and `gitGroups`; after a stage, the gutter, statusline, and explorer change in the same frame; with one dirty buffer, `Space g g` paints `"<path>" written · opening lazygit` as the last frame before `suspend()`, nothing between `suspend()` and `resume()`, and a first frame after resume equal to the pre-hand-off frame except refreshed Git visuals and a cleared message line, with the image draw re-issued.
- **System Design:** `REQ2@R2`, `REQ4@R3`; `DES9`, `DES11`, `DES13`; `S31`, `S35`, `S36`
- **UI Design:** `UREQ3@R1`, `UREQ7@R1`, `UREQ10@R1`; `UDES3@R1`, `UDES7@R1`, `UDES10@R1`; `US3@R1`, `US7@R1`, `US10@R1`; `UV6@R1`, `UV14@R1`
- **Canonical Shapes:** System design §5 Construction and Wiring Flow (Registration); UI design §8 `UV6@R1`, `UV14@R1`
- **Files:** `src/app/main.ts` — `registries()`; `test/ui/git.test.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `UV6`, `UV14`:** `test/ui/git.test.ts` with `mountShell`, a fake Git adapter answering the recorded effects, and a `createToolHost` built on `m.shell` with a fake spawn.

   **Preview:**

   ```ts
   test("staging updates gutter, statusline, and explorer together", async () => {
     // so-roadmap.md with four hunks, statusline "⎇ main +2 ~2 -3", explorer "M"
     // stage hunk 2 → feed gitStaged/gitIndexRead/gitStatus from the fake adapter → one frame: no "+" on its lines, "⎇ main ~2 -3", "M"
     // stage the rest → no signs, "⎇ main", explorer "S"
   });
   test("the hand-off paints the saved message once and restores the screen", async () => {
     // one dirty buffer + visible image; Space g g; save acknowledged; runTool → host.run on m.shell
     // last frame before suspend contains '"projects/so-roadmap.md" written · opening lazygit'; no frames while suspended;
     // first frame after resume equals the pre-hand-off frame except git visuals and a cleared message row; image draw re-issued
   });
   ```

   - Run `bun test test/ui/git.test.ts` and confirm failure where wiring is missing.

2. **GREEN:** `src/app/main.ts`

   **Preview:**

   ```ts
   for (const c of gitCommands) commands.register(c);
   // bindings: [..., ...baseBindings, ...gitBindings]; groups: { ...defaultGroups, ...linkGroups, ...noteGroups, ...gitGroups }
   ```

   - Fix only wiring defects these cases expose; core/adapter defects go back through their Part 1/2 tests.

3. **REFACTOR:** None.

   **Preview:**

   ```text
   allowed: none
   prohibited: exporting registries() (the which-key check stays on testRegistries())
   ```

   - Keep all affected checks passing.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   feat(git): register git commands in the app and cover cross-surface frames

   Task: P3-G1-T5 — Production registries and cross-surface frames
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `UV6@R1`, `UV14@R1` — `bun test test/ui/git.test.ts` → pass.

##### P3-G1-T6 — PTY hand-off and keystroke bench

- **Outcome:** A PTY run of `bun src/app/main.ts` in a temp repo with `git.tool` set to a stub script (enables `?1003h`, prints, then `kill -9` itself) returns to a restored so screen with no `?1003` mode active and survives a Ctrl-C sent during the tool; `test/bench/git-diff.bench.ts` measures keystroke P95 in a 5,000-line note whose every line differs from the index, and `scripts/bench-gate.ts` adds `gitDiffKeystrokeP95: 24`; existing bench targets (including `firstFrame`) hold.
- **System Design:** `REQ2@R2`, `REQ5@R2`, `REQ7@R2`; `DES2`, `DES8`, `DES9`; `S13`, `S14`, `S15`, `S19`, `S26`; `V50`, `V51`, `V53`
- **UI Design:** None
- **Canonical Shapes:** System design §8 `test/e2e/git-tool.test.ts`, `test/bench/git-diff.bench.ts`; §7 Cross-Cutting Applicability (Performance); `scripts/bench-gate.ts` `TARGETS`/`BENCHES`
- **Files:** `test/e2e/git-tool.test.ts` (uses `test/e2e/pty.ts` `runInPty`, `test/support/git-repo.ts`); `test/bench/git-diff.bench.ts` (uses `make5000LineNote` from `test/fixtures/generate.ts`); `scripts/bench-gate.ts`
- **Execution Approach:** TDD

**Steps:**

1. **RED — `V50`, `V51`:** write both suites.

   **Preview:**

   ```ts
   // test/e2e/git-tool.test.ts
   test("the editor returns intact after the git tool is killed", async () => {
     // temp repo + config with [git] tool = ["<stub script>"]; runInPty; <leader>gg; send Ctrl-C while the stub runs; stub kill -9 itself
     // expect statusline row visible again, xterm mouse tracking mode off (?1003 not active), process still running; then quit and await exit
   });
   ```

   ```ts
   // test/bench/git-diff.bench.ts — mirrors live-keystroke.bench.ts: temp repo with an index blob whose every line differs
   // from the 5,000-line note; 200 keys; report gitDiffKeystrokeP95 in the bench-gate result format
   ```

   - Run `bun test test/e2e/git-tool.test.ts` and `bun test/bench/git-diff.bench.ts`; confirm the e2e fails only for an intended missing behavior (or passes if Parts 1–2 already provide it — record which) and the bench produces a number.

2. **GREEN:** `scripts/bench-gate.ts` and any wiring defect fix

   **Preview:**

   ```ts
   export const TARGETS = { /* existing */, gitDiffKeystrokeP95: 24 } as const;
   const BENCHES = { /* existing */, gitDiffKeystrokeP95: "test/bench/git-diff.bench.ts" };
   ```

   - If the bench exceeds its gate, apply quick speedups within the diff path first; if still over, relax the target and record the measured value and reason (perf gates do not block development).

3. **REFACTOR:** None.

   **Preview:**

   ```text
   allowed: none
   prohibited: weakening the e2e assertions
   ```

   - Keep all affected checks passing; no PTY, stub, or so process left running.

4. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   test(git): cover the terminal hand-off in a pty and gate diff keystrokes

   Task: P3-G1-T6 — PTY hand-off and keystroke bench
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V50` — `bun test test/e2e/git-tool.test.ts` → pass.
- `V51`, `V53` — `bun run bench` (after checking for orphan processes) → every median ≤ 2× target, including `gitDiffKeystrokeP95` and `firstFrame`.

##### P3-G1-T7 — Project document, full checks, and manual terminal checks

- **Outcome:** `.s1mple/docs/project.md` documents the `[git] tool` key (non-empty argv, default `["lazygit"]`, `~` passed literally), the Git module map (`src/core/features/git`, `src/core/state/git*.ts`, `src/workspace/git*.ts`, `src/app/tool-host.ts`, `src/ui/overlays/hunk.ts`), the minimum Git 2.31, the `gitDiffKeystrokeP95` bench row, and refreshed Last Modified/Sources; every project check passes; manual hand-off and glyph-width observations are written down.
- **System Design:** `REQ1@R2`–`REQ9@R1`; `DES1`–`DES13`; `S1`–`S36`; `V52`, `V61`
- **UI Design:** `UREQ2@R1`, `UREQ4@R1`, `UREQ10@R1`; `US2@R1`, `US4@R1`, `US10@R1`; `UV15@R1`, `UV16@R1`
- **Canonical Shapes:** System design §8 Non-test verification; UI design §8 `UV15@R1`, `UV16@R1`; `.s1mple/docs/project.md` structure
- **Files:** `.s1mple/docs/project.md`; observations recorded in this work folder's execution notes (no recording files)
- **Execution Approach:** Direct verification — documentation and manual checks have no automated RED phase.

**Steps:**

1. `.s1mple/docs/project.md` — Config file contract row, Repository and Component Map / Architecture notes, Benchmarks table, Sources

   **Preview:**

   ```text
   Config file row: add "`[git]` sets `tool` (non-empty argv list, default `["lazygit"]`; `~` is passed literally)"
   Architecture: one short Git flow (detect after first frame → status/index reads → hunks; stage/tool save-gated; tool hand-off suspends the shell); Git ≥ 2.31, inert outside a repository
   Benchmarks: | `gitDiffKeystrokeP95` | 24 (or the recorded relaxed value) | `git-diff.bench.ts` — 200 keys in a 5,000-line note whose every line differs from the index |
   ```

   - Keep the document's existing style; link sources rather than duplicating design content; no work-process ids beyond what the document already uses for sources.

2. **VERIFY — `V52`, `V61`, `UV15`, `UV16`:**

   **Preview:**

   ```text
   bun run check && bun run test:ci && bun run build
   └── Expect: zero errors; knip zero findings; dist/so produced
   grep -rnE "W261005F2A7|\b(REQ|DES|UDES|UV)[0-9]" src test scripts
   └── Expect: no matches
   Ghostty (tui-test monitor sized to the window): note with an unsaved edit and an image → Space g g → lazygit → stage a hunk → quit
   └── Expect: no so content while lazygit runs; same note, cursor, and image on return; mouse works; staged hunk's signs gone
   Glyph width: Ghostty, kitty, iTerm2, Terminal.app (each only if available): "+ ~ _ ‾ ≃ ┆", "•", "⎇"
   └── Expect: one cell each; numbers and separators aligned; any terminal not available is reported as skipped
   ```

   - Run each command or method and inspect the exact expected result; kill lazygit, so, and the monitor afterwards.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   docs: document git integration in the project baseline

   Task: P3-G1-T7 — Project document, full checks, and manual terminal checks
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- `V52` — `bun run check`, `bun run test:ci`, `bun run build` → pass; `dist/so` exists.
- `V61`, `UV15@R1` — Ghostty manual hand-off → observation written; kitty observation written or reported skipped.
- `UV16@R1` — glyph-width observation per terminal; unavailable terminals reported as skipped, not passed.

##### P3-G1-T8 — Pull request and delivery

- **Outcome:** A PR from `feat/w261005f2a7-git-integration` to `main` is open with CI green and no conflicts; the work folder is moved from `.s1mple/work/active/` to `.s1mple/work/done/` with every `.s1mple/` reference updated; the new head is pushed and CI is green again. No merge, force-push, or release tag happens without the user's approval.
- **System Design:** Delivery per `.s1mple/S1MPLE.md`; system design §7 Migration and Delivery
- **UI Design:** None
- **Canonical Shapes:** `.s1mple/S1MPLE.md` §3 Delivery
- **Files:** `.s1mple/work/{active,done}/w261005f2a7-git-integration/` (moved from `active` to `done`); any `.s1mple/` file referencing the old path
- **Execution Approach:** Direct verification — delivery is a process with external CI evidence, not code behavior.

**Steps:**

1. Open the PR, then move the work folder

   **Preview:**

   ```text
   git push -u origin feat/w261005f2a7-git-integration
   gh pr create --base main --title "feat: git integration" --body "<summary, verification evidence, manual observations, skipped checks>"
   gh pr checks --watch            → all green; resolve any conflict with main by merging main into the branch (no force-push)
   git mv .s1mple/work/{active,done}/w261005f2a7-git-integration
   grep -rnE "work/(active)/w261005f2a7" .s1mple   → update every hit to work/done/
   commit, git push
   ```

   - CI runs only on `pull_request`, so CI evidence exists only after the PR is open.
   - After the move, a goal file path under `work/active/` is stale; tell the user that `/goal clear` may be needed.

2. **VERIFY — delivery:**

   **Preview:**

   ```text
   gh pr checks <pr>             (on the new head)
   └── Expect: every check passes
   gh pr view <pr> --json mergeable,state
   └── Expect: MERGEABLE, OPEN (not merged)
   grep -rnE "work/(active)/w261005f2a7" .s1mple
   └── Expect: no matches
   ```

   - Run each command and inspect the exact expected result; report the PR URL and both CI runs.

3. **COMMIT:** Run all task verification checks and self-review before committing this task.

   - Commit only this task's changes.

   **Commit message:**

   ```text
   docs: move W261005F2A7 work to done

   Task: P3-G1-T8 — Pull request and delivery
   ```

   - Record the commit SHA. If no changes are needed, record the reason and evidence instead.

**Verification:**

- PR open, CI green on the pre-move head and on the post-move head; no `work/done/w261005f2a7` references remain; PR not merged.

#### Group Verification

| Check | Command or method | Expected result |
|---|---|---|
| UI suite | `bun test test/ui` | `V44`–`V47`, `V60`, `V64`, `V65`, `V67`, `UV1`–`UV4`, `UV6`–`UV10`, `UV13`, `UV14`, `UV17` pass; no existing snapshot file modified |
| Theme unit | `bun test src/ui/theme.test.ts` | `UV18` passes |
| CI suites | `bun run test:ci` | component, integration, e2e (`V50`) pass |
| Static and unit gate | `bun run check` | biome, tsc, knip zero, unit suites, boundaries pass |
| Bench | `bun run bench` | all medians ≤ 2× target incl. `gitDiffKeystrokeP95`, `firstFrame` |
| Build | `bun run build` | `dist/so` produced |
| No process ids in code | `grep -rnE "W261005F2A7\|\\b(REQ\|DES\|UDES\|UV)[0-9]" src test scripts` | No matches |
| Manual | Ghostty (+ kitty, iTerm2, Terminal.app when available) | `V61`, `UV15`, `UV16` observations written; unavailable terminals reported skipped |
| Delivery | `gh pr checks`, `gh pr view` | CI green before and after the folder move; PR open and unmerged |

#### Review and Verification Focus

- **Specification:** Every glyph, text, token, placement, cap, and drop rule matches the UI design and accepted mockups; outside a repository all frames are v1-identical; which-key rows in production; hand-off frames; bench target; project document; delivery rules (no merge, force-push, or tag).
- **Technical:** One gutter width flag per frame; views read only derived state; the float never bypasses the paint guard; existing snapshots untouched; PTY and bench clean up processes; knip-clean exports.

#### Acceptance Criteria

- Every task outcome is implemented.
- Every assigned system `REQ/DES/S/V` and applicable UI `UREQ/UDES/US/UV` item is satisfied.
- Every task-level and group-level verification check passes.
- Protected contracts and declared scope remain intact.
- No unresolved implementation or verification issue remains.

## Coverage

| System chain | UI chain | Groups | Tasks |
|---|---|---|---|
| `REQ4@R3 → DES10, DES13 → S34` | `UREQ12@R1 → UDES12@R1 → US12@R1 → UV18@R1` | `P3-G1` | `P3-G1-T1` |
| `REQ4@R3, REQ5@R2 → DES10, DES12 → S7, S8, S32, S33 → V44, V64, V65` | `UREQ1@R1, UREQ2@R1, UREQ11@R1 → UDES1@R1, UDES2@R1, UDES11@R1 → US1@R1, US2@R1, US11@R1 → UV1@R1–UV4@R1, UV17@R1` | `P3-G1` | `P3-G1-T2` |
| `REQ4@R3 → DES10, DES13 → S9, S10, S34 → V45, V46` | `UREQ4@R1, UREQ5@R1, UREQ9@R1 → UDES4@R1, UDES5@R1, UDES9@R1 → US4@R1, US5@R1, US9@R1 → UV7@R1, UV8@R1, UV13@R1` | `P3-G1` | `P3-G1-T3` |
| `REQ4@R3 → DES11 → S7 → V47` | `UREQ6@R1 → UDES6@R1 → US6@R1 → UV9@R1, UV10@R1` | `P3-G1` | `P3-G1-T4` |
| `REQ2@R2, REQ4@R3 → DES9, DES11, DES13 → S31, S35, S36` | `UREQ3@R1, UREQ7@R1, UREQ10@R1 → UDES3@R1, UDES7@R1, UDES10@R1 → US3@R1, US7@R1, US10@R1 → UV6@R1, UV14@R1` | `P3-G1` | `P3-G1-T5` |
| `REQ2@R2, REQ5@R2, REQ7@R2 → DES2, DES8, DES9 → S13–S15, S19, S26 → V50, V51, V53` | None | `P3-G1` | `P3-G1-T6` |
| `REQ1@R2–REQ9@R1 → DES1–DES13 → S1–S36 → V52, V61` | `UREQ2@R1, UREQ4@R1, UREQ10@R1 → US2@R1, US4@R1, US10@R1 → UV15@R1, UV16@R1` | `P3-G1` | `P3-G1-T7` |
| Delivery per `.s1mple/S1MPLE.md` | None | `P3-G1` | `P3-G1-T8` |

## Completion Criteria

- Every group satisfies its acceptance criteria.
- Every dependency and cross-work gate due within this part is satisfied at its required boundary; later gates are handed off explicitly.
- Every source obligation is covered.

## Planning Gaps

None
