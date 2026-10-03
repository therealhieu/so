# P3-G1 Verification Report

## Scope

- **Group:** `P3-G1` — UI Shell, Composition Root, Lifecycle, and Delivery Verification
- **Tasks:** `P3-G1-T1`, `P3-G1-T2`, `P3-G1-T3`, `P3-G1-T4`, `P3-G1-T5`, `P3-G1-T6`, `P3-G1-T7`
- **Report:** `.s1mple/work/active/w261003hege-editor-foundation/reports/p3-g1-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261003hege-editor-foundation/reports/p3-g1-implementation-report.md` (commit `d4f19de`)
- **Baseline:** branch `feat/rm261003abzp-di1-editor-foundation`, HEAD `97d134e`; group range `563ef56..37b9e73` (tasks `8898bd9`, `eb4253a`, `1ba0f67`, `55d12a7`, `16d7a7a`, `989b725`, `a0b1a58`, `37b9e73`). No code changes after `37b9e73` (`git diff --stat 37b9e73..HEAD -- . ':!.s1mple'` is empty); `eac91dd`, `3b7714a`, `97d134e` touch only `.s1mple`. Bun `1.4.2`, macOS Darwin 23.4.0. Working tree clean before and after verification.
- **Parent baseline:** `git log d00d3a3..HEAD -- .s1mple/work/active/rm261003abzp-so-v1/` is empty (no parent writes); `git tag` and `git ls-remote --tags origin` are empty (no tag, DEV5 respected).

## Status

`Failed`

The group works: every assigned automated check passes, repeatedly and on PR CI, and delivery stayed inside the granted authorization. It fails on one unreported UI deviation from the accepted mockups (P3-G1-VER1, Major) and four Minor findings: a signal-flush self-conflict that can lose text typed during an in-flight autosave, statusline/winbar order and truncation drift from M1, a file-type branch in the UI, and untested fallback and narrow-diff paths.

## Assigned Traceability

- **System Design:** `REQ1@R3, REQ2@R2, REQ4@R3, REQ5@R1, REQ7@R2, REQ8@R2, REQ10@R2, REQ11@R2, REQ12@R1 → DES1 (V1.3), DES2, DES4, DES6, DES7, DES9, DES10, DES11, DES13, DES14, DES15 → S1, S4, S8, S9, S10, S11, S14, S15, S16, S17 → V1.3, V4.5, V8.1, V8.2, V8.3, V9.1, V9.2, V9.3, V11.4, V14.1, V14.2, V14.3, V14.4, V15.2, V15.3, V16.1, V17.1, V7.1`
- **UI Design:** `RM261003ABZP-UREQ1@R2, UREQ2@R1, UREQ7@R2, UREQ11@R1 → UDES1@R2, UDES2@R1, UDES7@R2, UDES11@R1 (UDES3@R2 non-Markdown window) → US1@R2, US5@R2, US9@R1 → UV1@R2 (DI1 states), UV2@R1, UV6@R2, UV10@R1 (DI1 states)`, verified through S14 → V14.1–V14.4.
- **Roadmap:** binding `w261003hege-discuss-context.md` (RM261003ABZP-PH1@R2, DI1@R2). G1 gate (`rm261003abzp-roadmap-phase-1-daily-usable-editor.md:73`): this group produces the shell with `editorViews`, `OverlayHost`, `PromptView`, the bench harness, the T6 evidence list, and T7 PR CI evidence. G1 status: `Pending — awaiting DI1 PR merge with CI green` (owner RM261003ABZP-DI2@R2). The evidence list is present in the implementation report and in PR #1; the PR lists parent synchronization items 1–7 as pending, not done.

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ1@R3 → DES9 → S9 → V9.1, V9.2` | `UREQ2@R1 → UDES2@R1 → US1@R2 → UV2@R1` | Raw Esc held `escTimeoutMs − 20`; kitty Esc and sequences immediate; key during hold releases Esc first; legacy meta+key split | `src/ui/input.ts:createKeyNormalizer`, `OPENTUI_ESC_MS = 20`, `toKey` (pure table `NAMES`) | `Satisfied` |
| `REQ1@R3 → DES9 → S9 → V9.3` | `UREQ2@R1 → UDES2@R1 → US1@R2 → UV2@R1` | Effective Esc `max(escTimeoutMs, 20)` through OpenTUI's parser; arrows < 10 ms | `src/ui/shell.ts:attach` feeds `renderer.keyInput` into the normalizer; measured 50.5–57.0 ms over 120 presses | `Satisfied` |
| `REQ1@R3 → DES9, DES7 → S14 → V14.1, V14.3` | `UREQ1@R2, UREQ11@R1 → UDES1@R2, UDES11@R1 → US1@R2, US9@R1 → UV1@R2, UV10@R1` (DI1 states) | Regions, statusline segments, toasts, explorer dock/float at 100 cols, themes, nocolor default-only colours | `src/ui/shell.ts`, `views/{bufferline,explorer,statusline,cmdline,window-tree}.ts`, `overlays/{host,notify}.ts`, `theme.ts`; goldens in `test/ui/__snapshots__/shell.golden.test.ts.snap` | `Mismatch` (minor: P3-G1-VER3 segment order and winbar truncation vs M1) |
| `REQ1@R3 → DES9, DES2 → S14 → V14.2` | `UREQ2@R1 → UDES2@R1 → US1@R2 → UV2@R1` | Badges INSERT→NORMAL→VISUAL→V-LINE→COMMAND; line/block cursor; E492; `vs` Tab → `vsplit` first | `src/ui/views/statusline.ts:BADGES`, `text-view.ts:show` cursor style, `cmdline.ts`, core `keys.ts:cmdlineCompletions` | `Satisfied` |
| `REQ1@R3, REQ10@R2 → DES9, DES13 → S14, S13 → V14.4` | `UREQ7@R2 → UDES7@R2 → US5@R2 → UV6@R2` | Prompts per accepted M4 (inline create/rename in the tree, move, trash confirm, typed confirm), conflict + diff, reload notice, refusals | `src/ui/overlays/{prompt,conflict}.ts`, core `keys.ts:conflictKey` (`q`) | `Mismatch` (P3-G1-VER1: create/rename/move render as a centred float, not M4 S10–S12) |
| `REQ1@R3, REQ4@R3, REQ5@R1 → DES9, DES14, DES4 → S8, S4 → V8.1–V8.3, V4.5` | `UREQ11@R1 → UDES11@R1 → US9@R1 → UV10@R1` (NO_COLOR) | Handlers for SIGTERM/SIGHUP/SIGINT/exceptions; once-guard; bounded 2 s flush; destroy once; stderr after restore; exit 0/1; Ctrl-C does not exit; no colour SGR under NO_COLOR | `src/app/lifecycle.ts:installLifecycle`, `FLUSH_BOUND_MS`; `src/ui/shell.ts:RENDERER_OPTIONS`, `destroy` guard; `src/app/main.ts` | `Mismatch` (minor: P3-G1-VER2 flush self-conflict during an in-flight autosave) |
| `REQ7@R2 → DES10 → S10` (OSC 52 wiring) | None | `detectClipboard(..., shell.copyOsc52)`; `copyOsc52 → renderer.copyToClipboardOSC52` | `src/app/main.ts:204-215`, `src/ui/shell.ts:126-128` | `Satisfied` (inspection) |
| `REQ12@R1 → DES15 → S16 → V16.1` (`VERSION`) | None | `VERSION = SO_VERSION ?? pkg.version`; define-inlined at build; `--version` prints `so <v>` | `src/app/main.ts:40`, `release.yml:25-26,46` | `Satisfied` for `VERSION`; V16.1 `Unverified` (not authorized) |
| `REQ1@R3, REQ4@R3, REQ11@R2 → DES14, DES7, DES6 → S17, S15 → V17.1, V15.3` | None | 5 fresh runs, median ≤ 2× targets, raw results in `.so-bench/`, fail closed; Linux CI step prints medians | `scripts/bench-gate.ts:TARGETS, main`; `test/bench/*.bench.ts`; `.gitignore` `.so-bench/` | `Satisfied` |
| `REQ2@R2, REQ4@R3 → DES1, DES14 → S1, S15 → V1.3, V15.2` | None | `check` < 30 s, zero knip findings; PR CI green on both OS < 3 min | `package.json` `check`; `knip.json`; PR #1 runs | `Satisfied` |
| `REQ8@R2 → DES11 → S11 → V11.4` | None | macOS trash without prompt via detected path | Implementation report T7 (NSFileManager via JXA; move observed, no prompt) | `Unverified` (`~/.Trash` presence and Put Back: pending manual check) |
| `REQ1@R3 → DES9 → S14` (UI boundaries) | `UDES1@R2` | UI never mutates `AppState`; never branches on file type; only `src/ui` imports `@opentui/*`; only the focused window sets the cursor | Views only read state and dispatch; `test/boundaries.test.ts` passes; `src/ui/views/explorer.ts:156` branches on `.md` | `Mismatch` (minor: P3-G1-VER4) |
| G1 evidence (T6) and PR evidence (T7) | None | Every G1 output mapped to passing evidence; gate `Pending — awaiting DI1 PR merge with CI green`; parent sync pending | Implementation report "G1 evidence list"; PR #1 body sections "G1 evidence", "Pending parent synchronization" | `Satisfied` |

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V9.1`, `V9.2` | `S9` | `DES9` | `bun test src/ui/input.test.ts` | 6 pass, 0 fail | `Passed` |
| `V9.3` | `S9` | `DES9` | `bun test test/ui/esc.test.ts` ×15; scratch probe (outside repo) timing 40 Esc + 40 arrow presses per run ×3 | 15/15 runs: 2 pass. Probe: Esc min 50.5, median 52.3, max 57.0 ms, 0 of 120 outside 40–60 ms; arrows max 1.2 ms | `Passed` |
| `V14.1` | `S14` (`US1`) | `DES9, DES7` (`UDES1, UDES11`) | `bun test test/ui/shell.golden.test.ts -t "shell at"`; `-t "expires|word count"` (bare `|`); golden review vs M1@R1/AD4 | 12 pass; 4 pass. Goldens match M1 for regions, dock/float at 100 cols, `source` view, word segment dropped at 80 cols, toasts; save-error/words order and winbar truncation differ (P3-G1-VER3) | `Passed` (tests); fidelity gap in VER3 |
| `V14.3` | `S14, S8` (`US9`) | `DES9` (`UDES11`) | `bun test test/ui/shell.golden.test.ts -t "themes"` | 3 pass; nocolor spans all `default` intent; states keep attributes or glyphs (cursorline via bold+underline gutter, as in `terminal.css:69`) | `Passed` |
| `V14.2` | `S14` (`US1`) | `DES9, DES2` (`UDES2`) | `bun test test/ui/cmdline.test.ts` | 3 pass (badge sequence, `line`/`block` cursor, E492 text, `:vsplit` first) | `Passed` |
| `V14.4` | `S14, S13` (`US5`) | `DES9, DES13` (`UDES7`) | `bun test test/ui/file-ops.test.ts`; rendered frames of `a`, `r`, `m`, conflict via scratch probe | 8 pass; every UV6 text assertion holds. Rendering of `a`/`r`/`m` is a centred float, not M4 S10–S12 (P3-G1-VER1) | `Passed` (tests); spec gap in VER1 |
| `V8.1` | `S8, S4` | `DES9, DES14` | `bun test test/e2e/restore.test.ts -t "restored on every exit path"` | 4 pass (`:q` 0, SIGTERM 0, SIGINT 0, injected exception 1; kitty push seen, normal buffer, mouse none, last `?25h`, last `CSI < u`) | `Passed` |
| `V8.2` | `S8` (`US9`) | `DES9` (`UDES11`) | `bun test test/e2e/restore.test.ts -t "NO_COLOR"` | 1 pass; no colour SGR with a Visual selection on screen | `Passed` |
| `V8.3` | `S4, S8` | `DES9` | `bun test test/e2e/restore.test.ts -t "Ctrl-C"` | 1 pass; alive 500 ms after `\x03`, exits 0 on `:q` | `Passed` |
| `V4.5` | `S4, S8` | `DES4, DES9` | `bun test test/e2e/quit.test.ts`; runner probe (scratch, outside repo) | 2 pass. Probe: `run(write v1, s0)` then `flush(write v2, s0)` → flush rejects `conflict`, disk keeps `v1` (P3-G1-VER2) | `Passed` (assigned case); defect in VER2 |
| e2e robustness | `S8, S4` | `DES14` | `bun test test/e2e` ×6 | 6/6 runs: 8 pass, 0 fail (4.30–4.33 s) | `Passed` |
| Component robustness | `S14, S9` | `DES9` | `bun test test/ui` ×5 | 5/5 runs: 30 pass, 15 snapshots | `Passed` |
| `V17.1` | `S17` | `DES14, DES7, DES6` | `bun run bench` (exit captured separately) | exit 0; `sourceKeystrokeP95 median=3.74ms limit=32ms ok`, `openFile median=7.35ms limit=100ms ok`; `.so-bench/results.json` holds 5 runs each | `Passed` |
| `V7.1` | `S7` | `DES14` | `bun test test/boundaries.test.ts` | 2 pass | `Passed` |
| `V1.3` | `S1` | `DES1, DES14` | `time bun run check` | exit 0 in 2.42 s; biome clean, tsc clean, knip prints nothing, 430 pass | `Passed` |
| `V15.2` | `S15` | `DES14` | `gh pr view 1`; `gh run view 37118234988`, `gh run view 37118408437` (read-only) | Both `success`, event `pull_request`. Run 37118234988 (head `3b7714a`): 11:00:13Z → 11:00:53Z (40 s); `check`, `test (ubuntu-24.04)`, `test (macos-15)` success. Run 37118408437 (head `d4f19de`, current PR head): 33 s, all success. 59 pass on both OS | `Passed` |
| `V15.3` | `S15, S17` | `DES14` | `gh run view <id> --log` | Linux `Run bun run bench`: `sourceKeystrokeP95 median=12.88ms … ok`, `openFile median=20.33ms … ok` (run 1); `7.83ms`, `15.32ms` (run 2); no bench step on macOS | `Passed` |
| `V16.1` | `S16` | `DES15` | Not run — tag refused by the user (DEV5) | No tag exists locally or on origin | `Insufficient` (Not authorized — tag out of scope) |
| `VERSION` / release define (V16.2 static support) | `S16` | `DES15` | `bun run build && ./dist/so --version`; `bun build --compile --define 'process.env.SO_VERSION="0.1.0-rc.1"'` to scratch; `SO_VERSION=9.9.9 bun src/app/main.ts --version` | `so 0.0.0`; `so 0.1.0-rc.1`; `so 9.9.9`; same `--define` form as `release.yml:25-26`, smoke compares `so ${TAG#v}` (`release.yml:46`) | `Passed` |
| CLI errors | `S8` | `DES2` | `bun src/app/main.ts /nonexistent-xyz` | stderr `so: no such file or directory: /nonexistent-xyz`, exit 2, terminal untouched | `Passed` |
| `V11.4` | `S11` | `DES11` | Implementation report evidence; not re-run (no Full Disk Access; must not trash real files) | Move observed without a prompt via NSFileManager/JXA; `~/.Trash` presence and Put Back unobserved | `Insufficient` (Pending manual check, accepted) |
| Integration and units | `S1–S17` | all | `bun run test:ci`; `bun test src test/vim`; `bun test src/ui`; full `bun test` | 59 pass; 425 pass; 6 pass; 490 pass, 15 snapshots, 0 fail | `Passed` |
| Lockfile | `S1` | `DES1` | `bun install --frozen-lockfile` | no changes | `Passed` |
| DEV1 identifier scan | — | — | `grep -rnE` for W/RM ids, `REQ|DES|UREQ|UDES|UV|US<n>`, `V<n>.<n>`, `P<n>-G<n>`, `PH/DI<n>`, `S<n>`, `M<n>@`, `AD<n>`, `DEV<n>`, `RF<n>`, `-VER<n>` over `src test scripts bin .github knip.json package.json biome.json tsconfig.json` (+ `test/vim/expected.json`) | 0 matches (snapshot names, test names, comments, logs included) | `Passed` |
| Report `-t` commands select > 0 tests | — | — | Each report command run with bare `|` | `"shell at"` 12, `"expires|word count"` 4, `"themes"` 3, `"restored on every exit path"` 4, `"NO_COLOR"` 1, `"Ctrl-C"` 1 | `Passed` |
| G1 gate and parent sync | — | — | PR #1 body; `git log` on parent path | G1 reported `Pending`; items 1–7 listed "None of these items are done"; no parent commits | `Passed` |

## Findings

### P3-G1-VER1 — Major — Specification — Explorer create, rename, and move do not follow the accepted M4 states, and the deviation is unreported

- **System Design:** `REQ1@R3, REQ10@R2 → DES9, DES13 → S14, S13 → V14.4`
- **UI Design:** `UREQ7@R2 → UDES7@R2 → US5@R2 → UV6@R2`; accepted `M4@R1` S10, S11, S12
- **Evidence:**
  - The parent surface contract says `a` opens an "inline input under that folder" and `r` an "inline rename" (`rm261003abzp-ui-design.md:837-838`; region hierarchy `:807` "inline input row (a/r)"). Accepted M4 S10 draws "an inline name field under the selected folder" and S11 "edits the name in place" (`ui-mockups/m4-links-files.html:367-368`, `treeAction` at `:101-102`). `m` is a folder picker (`:839`, S12).
  - The implementation renders all three as a centred float (`src/ui/overlays/prompt.ts:63-77`, placed by `centered` in `host.ts:36`). `ExplorerView.renderSelf` (`src/ui/views/explorer.ts:131-179`) never draws a field. Rendered at 120×36:

    ```text
    ╭─ New file or folder ─────────────────────────────────────────╮
    │                                                              │
    │ in the workspace root · a trailing / makes a folder          │
    │                                                              │
    │ ❯ weekly                                                     │
    ╰─ ⏎ confirm · esc cancel ─────────────────────────────────────╯
    ```

  - Move cannot use the picker in DI1 (picker files are excluded by the plan), so a text field is a defensible substitute, but it is also not recorded.
  - The plan rule (`…plan-3…md:37`) is "If a golden cannot match the accepted design, stop and report." The implementation report's deviation list (items 1–13) does not mention any of this, and T2/T3 claim review against the accepted mockups.
  - Mitigating context: the parent Prompt component (`rm261003abzp-ui-design.md:1515` ff.) lists S10/S11 among its mockups and draws a float anatomy, so the parent text is not fully consistent. The surface contract and the accepted mockup frames are still the specific sources for the explorer.
- **Impact:** The DI1 explorer differs from the accepted UI and from S14 ("match accepted parent goldens and interactions"). Later DIs inherit the float pattern without a decision. The unrecorded change also weakens the evidence that goldens were reviewed against M4.
- **Required resolution:** One of:
  - `a` and `r` show their name field inline in the explorer tree row (under the target folder, or in place of the renamed row) as in M4 S10/S11, and the move substitution is recorded as a deviation; or
  - an orchestrator-recorded, user-approved deviation in the goal's Blockers and Deviations accepts the centred float for `a`/`r`/`m` in DI1, with location, evidence, impact, and parent-sync note.
- **Required proof:** A file-ops test asserting that after `a` the field row appears inside the explorer region directly under the target folder (and `r` on the selected row), plus the existing 8 file-ops tests passing; or the goal's deviation entry with its commit SHA.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P3-G1-VER2 — Minor — Correctness — A signal during an in-flight autosave makes the shutdown flush conflict with so's own write

- **System Design:** `REQ5@R1, REQ4@R3 → DES4, DES9 → S4 → V4.5`
- **UI Design:** None
- **Evidence:**
  - `src/app/lifecycle.ts:27` takes `pendingWrites(d.store.get())`, whose `expected` is `b.stamp` (`src/core/state/save.ts:261-271`). The stamp only changes when `saved` is dispatched.
  - An autosave write already queued on the runner's serial chain runs first (`src/app/effects.ts:148-163`) and changes the file's stamp. The flush write then fails the stamp check in `atomicWrite` (`src/workspace/fs.ts:106-107`, `FsError("conflict")`).
  - Scratch probe (real `createEffectRunner`, `atomicWrite`; outside the repo): `run(write "v1", s0)` then `flush([write "v2", s0])` → `flush error: Error: conflict | disk: "v1\n"`.
  - Result on a signal in that window: text typed after the autosave started is not written, and lifecycle prints `so: unsaved: <path>`. Without newer typing, it prints a false `so: unsaved:` although the disk already holds the latest text.
- **Impact:** Limited: the window is the duration of one write (milliseconds locally, longer on slow file systems). The loss is reported on stderr, but REQ5's "signals flush" does not hold in that window.
- **Required resolution:** A shutdown flush issued while an earlier own write of the same path is queued or in flight writes the newest text without a false conflict. For example, the runner uses the stamp of its own preceding successful write of that path as `expected`, and stays strict when the disk changed for any other reason.
- **Required proof:** A runner (or lifecycle) test where `run(write v1, s0)` is followed by `flush([write v2, s0])`: disk ends `v2`, flush resolves, and no unsaved path is reported. A companion test where an external write changes the file still rejects with `conflict`.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P3-G1-VER3 — Minor — Specification — Statusline segment order and winbar truncation differ from accepted M1

- **System Design:** `REQ1@R3 → DES9, DES7 → S14 → V14.1`
- **UI Design:** `UREQ1@R2 → UDES1@R2 → US1@R2 → UV1@R2`; accepted `M1@R1`
- **Evidence:**
  - M1 fixes the order `MODE │ view │ path ● │ save errors │ ⇠ backlinks │ words │ preview │ index │ Ln:Col` (`ui-mockups/m1-app-shell.html:147`; `shared/term.js:294-310` puts the save error right after the path).
  - `src/ui/views/statusline.ts:76-87` pushes `words` before the save error. The committed golden encodes this order: `NORMAL │ source │ notes/ideas.md ● │ 11 words │ ✗ save failed: EACCES · retry in 1s` (`test/ui/__snapshots__/shell.golden.test.ts.snap`, "a failed save shows its reason and retry time", 120×36).
  - The parent Overflow state requires "winbar title middle-truncated" (`rm261003abzp-ui-design.md:473`). `EditorView.paintWinbar` (`src/ui/editors/text-view.ts:280-281`) cuts the title at the end through `drawCells`.
- **Impact:** A golden that encodes the wrong order hides the regression it should catch. Long paths lose their file name in split winbars.
- **Required resolution:** The save-error segment follows the path (before `words`) at every width, and the winbar title is middle-truncated like the statusline path. Regenerate the affected goldens and review them against M1.
- **Required proof:** `bun test test/ui/shell.golden.test.ts` with updated goldens showing `path ● │ ✗ save failed… │ 11 words`, plus an assertion that a winbar title longer than its window keeps its file name (for example `…/ideas.md`).

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P3-G1-VER4 — Minor — Standards — The explorer picks its note glyph by file extension in the UI

- **System Design:** `REQ1@R3 → DES9 → S14`
- **UI Design:** `UDES1@R2`; AD4/AD5 glyphs (`◇` notes, `≡` other text files)
- **Evidence:** `src/ui/views/explorer.ts:156` uses `row.path.endsWith(".md") ? "◇ " : "≡ "`. The plan states "UI never branches on file type" (`…plan-3…md:195`), and the system design keeps file-type knowledge in the registries. `FileTypeRegistry` lowercases extensions (`src/core/filetypes/registry.ts:70`), so `NOTE.MD` opens as Markdown but shows `≡`.
- **Impact:** File-type knowledge leaks into a view. A later Markdown extension, or a different case, shows the wrong glyph.
- **Required resolution:** The glyph comes from the registered file type (for example `deps.fileTypes` resolving the path, or a glyph or kind supplied with the core's explorer rows). No extension test remains in `src/ui`.
- **Required proof:** `grep -rn '\.md' src/ui` finds no branch, and a component test shows `◇` for `NOTE.MD` and `≡` for `config.yaml`.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

### P3-G1-VER5 — Minor — Test Coverage — Render-error fallback and the narrow diff are untested

- **System Design:** `REQ1@R3 → DES9, DES7, DES13 → S14 → V14.1, V14.4`
- **UI Design:** `UDES7@R2` (diff stacked below 100 cols, `rm261003abzp-ui-design.md:851, 1648`); `UV10@R1` (80×24 prompt text not clipped)
- **Evidence:**
  - T2's outcome includes "render errors paint raw lines". The `catch` in `EditorView.layout` (`src/ui/editors/text-view.ts:259-268`) has no test.
  - The narrow diff branch (`src/ui/overlays/conflict.ts:223-235`) never runs in tests: `test/ui/file-ops.test.ts:9` mounts only 120×36. No prompt or conflict frame is rendered at 80×24.
- **Impact:** A regression in the crash-safe paint path, the < 100-column diff, or prompt clipping at 80×24 would pass CI.
- **Required resolution:** Tests cover all three paths.
- **Required proof:**
  - A component test where layout throws (for example a file type whose `analyze` throws) and the window still shows the raw lines.
  - A file-ops test at 80×24 that opens the diff and asserts `−`/`+` rows in one column.
  - An 80×24 assertion that the trash, typed-confirm, and conflict texts appear unclipped.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - Esc hold, legacy split, kitty pass-through, and key mapping at unit level.
  - Real OpenTUI parser timing. The test bounds each press ≥ 40 ms and the median ≤ 60 ms. That is looser than "each 50 ± 10 ms", but the measured distribution (50.5–57.0 ms) meets the stricter bound.
  - UV1 DI1 goldens at 120×36 and 80×24, and toast expiry at 3 s and 10 s.
  - Theme spans for dark, light, and nocolor, with a nocolor all-default-intent assertion.
  - UV2 mode, cursor, E492, and completion.
  - Every UV6 text assertion, including the typed-confirm Enter gate and no write on refused files.
  - Restore on `:q`, SIGTERM, SIGINT, and an injected exception, with exit codes.
  - NO_COLOR SGR, Ctrl-C, and the bounded slow flush with the stderr path.
  - The bench gate; the core `q`-from-diff and completion changes (`src/core/state/keys.test.ts`).
- **Missing:**
  - Signal flush during an in-flight own write (P3-G1-VER2).
  - Render-error fallback, the narrow diff, and 80×24 prompt/conflict text (P3-G1-VER5).
  - Inline explorer field placement (P3-G1-VER1).
  - SIGHUP has a handler but no e2e case. Design V8.1 lists only `:q`, SIGTERM, SIGINT, and exceptions, so this is not required.

## Scope Changes

Assessment of the implementer's declared deviations:

| Deviation | Judgment | Reason |
|---|---|---|
| Core: `cmdlineCompletions` exported and full ex names first; `visiblePaths` exported; `conflictKey` `q` back from the diff | Necessary | UV2 requires `vs` → `vsplit` listed first. UV6 and the Conflict component require `q` from the diff (`rm261003abzp-ui-design.md` "q back from diff"). The explorer must share the core's row order. Each change is small and tested in `keys.test.ts`. |
| Render error paints raw lines without a notification | Acceptable | Plan T2 requires only raw-line painting. The design's §5 notification has no `Action` to carry it, and P2-G1 froze the protocol. Candidate for design or parent reconciliation. Untested (VER5). |
| Mouse scroll-only | Acceptable | DEV3 accepted a scroll-only `MouseEvent`; manifest Assumptions mark mouse clicks as optional extras. |
| Watcher errors through the `uncaughtException` path | Acceptable | No design rule covers watcher failure (P2-G2 verification noted this). The path flushes, restores, prints `so: <error>`, and exits 1. It is proven only with the injected throw. |
| Lifecycle: `writeSync` stderr after restore; per-write flush; `so: unsaved:` only on flush paths | Acceptable | It follows the §7 order (flush → destroy → stderr → exit). Per-write flush gives exact unsaved paths. `:q` exits only after writes confirm, and `:q!` discards on purpose. See VER2 for the in-flight case. |
| Test hooks `SO_TEST_SLOW_WRITE`, `SO_TEST_THROW` gated by `SO_TEST=1` | Acceptable | System design §8 Coverage Balance prescribes exactly these hooks, read only in `main.ts` when `SO_TEST === "1"` (verified with `grep`). Production reach needs a deliberate env var, and the effect is only a delay or a crash that flushes. The throw is raised outside the reducer, which is the only way to reach `uncaughtException`, because `update` contains thrown commands. |
| knip `ignoreExportsUsedInFile: true`; `src/app/main.ts` entry removed | Acceptable | It is a standard knip option and the design gives no `knip.json` shape. It keeps design-named exports (`RENDERER_OPTIONS`, `layoutClass`, `FLUSH_BOUND_MS`). knip still reaches `main.ts` (0 findings means no unused-file report). Follow-up for the orchestrator's documentation step: `.s1mple/docs/languages/typescript.md` still lists `src/app/main.ts` as a knip entry. |
| Horizontal scroll instead of wrap | Acceptable | The DI1 kernel lays out one row per line, and the plan names no wrap behaviour for DI1. |
| `CONFLICT` and `EXPLORER` badges | Acceptable | The mockup statusline helper defines both modes (`shared/term.js:295`), and M4 S16 shows `CONFLICT`. |
| Explorer glyphs `◇`/`≡` | Acceptable visually (AD4/AD5); the selection mechanism is VER4 | — |
| T2 TDD order (tests after views) | Acceptable, process only | Disclosed. The goldens and tests exist and pass. T3 and T4 show RED first. |
| Esc test asserts the median ≤ 60 ms | Acceptable | Robustness choice after a polling artefact. The measured worst case is 57.0 ms. |

Unreported deviations: explorer create/rename/move rendering (VER1); statusline save-error order and winbar truncation (VER3). Extra file `test/support/ui.ts` (shared mount helper) is in scope and lean.

## Unverified Items

- **V16.1:** `Not authorized — tag out of scope` (DEV5). No release ran. The `--define SO_VERSION` path was proven locally by a scratch compile printing `so 0.1.0-rc.1`, and `release.yml` gating is static (V16.2).
- **V11.4:** `Pending manual check`. Not re-run here, so no user files were trashed and Full Disk Access is missing. `~/.Trash` presence and Put Back need a person in Finder.
- **G1 gate:** `Pending — awaiting DI1 PR merge with CI green` (owner RM261003ABZP-DI2@R2). PR #1 is open, not merged, and its latest CI run 37118408437 is green on head `d4f19de`. Local `97d134e` (docs only) is not pushed.
- **Parent synchronization items 1–7:** pending, with no authorization. This is administrative and not a technical defect.

## Blockers

None. Every assigned local check ran. GitHub evidence was read with `gh pr view`, `gh run view`, and `gh run view --log` only; nothing on GitHub was changed.
