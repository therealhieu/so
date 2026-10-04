# P1-G3 Verification Report

## Scope

- **Group:** `P1-G3`
- **Tasks:** `P1-G3-T1`, `P1-G3-T2`, `P1-G3-T3`, `P1-G3-T4`
- **Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g3-verification-report.md`
- **Implementation Report:** `.s1mple/work/active/w261003s6bq-live-and-browser-preview/reports/p1-g3-implementation-report.md`

Verified at `HEAD` `a0e278e` (group change range `0876a21`..`3d9c36a`; task commits T2 `119d9c9`, T3 `3bc3959`, T4 `3d9c36a`; T1 is no-change). Governing sources: system design (authoritative), requirements, plan context, plan part 1 §P1-G3, plan index, goal.

## Status

`Failed`

Every assigned `REQ → DES → S → V` chain is implemented and every V case and group check passes. One Minor test-coverage finding remains: two specified behaviours have no regression test (`P1-G3-VER1`).

## Assigned Traceability

- **System Design:** `REQ2@R2, REQ5@R1 → DES7, DES6 → S7, S8 → V15, V18, V19, V40, V43, V50, V51`
- **UI Design:** `None — image placeholders and rows follow the parent UDES through design DES7.`

## Specification Verification

| System chain | UI chain | Planned outcome | Implementation evidence | Result |
|---|---|---|---|---|
| `REQ2 → DES7 → S8 → V43` | None | Kitty and sixel clearing on scroll, view switch, and buffer switch confirmed and recorded; the confirmed behaviour becomes a V18 assertion | Implementation report "Graphics spike outcome"; raw recordings `tty-*.raw` and `evidence/*.analysis.txt` in the session scratchpad; `test/ui/live-preview.test.ts` "an image is drawn only while it is on screen, so no placement outlives it" | `Satisfied` |
| `REQ2 → DES7 → S8 → V50` | None | `readImage` contained, ≤ 32 MiB; `fetchImage` `http(s)` only, 10 s, 16 MiB, no Cookie or Referer, non-2xx rejected; loader ≤ 4 in flight; workspace path without a request | `src/workspace/images.ts:readImage`, `readCapped`, `fetchImage`, `createImageLoader`, `WEB_IMAGE` | `Satisfied` |
| `REQ2 → DES7 → S8 → V19, V40, V51` | None | One load per reference; 64 MiB LRU with `dispose()`; repaint per load; failures without throwing; retry on the first `get` ≥ 60 s after a failure | `src/ui/images.ts:ImageCache.get`, `start`, `decode`, `store`, `evict`; `imageTier` | `Satisfied` |
| `REQ2 → DES7 → S8 → V18` | None | Tier per capability (kitty, sixel, blocks, placeholder); `[image: name]` with `images = "off"` and no load; no stale placement; cropped draw at the window bottom | `src/ui/widgets/image.ts:paintImage`; `src/ui/shell.ts:createShell` (`capabilities`, one `ImageCache`); `src/core/lang/markdown/renderers/image.ts:imageRenderer` (`off` → placeholder text, unchanged) | `Satisfied` |
| `REQ5 → DES6 → S7 → V15` | None | Hardware cursor on screen at the cursor line's row past a tall image | `src/ui/editors/text-view.ts` `layoutFrame` host (`imageSize`, `cellAspect` from `deps.images`); `src/ui/shell.ts` repaint re-runs the views after a load | `Satisfied` (16-row image; see Scope Changes) |
| `REQ2 → DES7 → S8` placeholders | None | `◌ name` while loading; `[image: name]` on failure (SVG, corrupt, missing, failed download) | `src/ui/widgets/image.ts:34-35` | `Satisfied` in code; `◌ name` has no test (`P1-G3-VER1`) |

Layer and scope constraints:

- `git diff --stat 0876a21..3d9c36a -- src/core` is empty. The kernel, `RenderLine`, `layoutText`, the core image renderer, `AppState`, and the G4 signatures are unchanged.
- `@opentui` is imported only under `src/ui` (`rg -ln "@opentui" src` lists nothing outside `src/ui/`), and `test/boundaries.test.ts` passes.
- Image bytes, sizes, and decoded images never enter `AppState`. `ImageCache` and `paintImage` never dispatch (`rg -n dispatch src/ui/images.ts src/ui/widgets/image.ts` → no match).
- Cross-work gates: none are due for this group (plan part 1 §P1-G3 Cross-Work Gates). G2 was confirmed in P1-G1. The G4 outputs (`registerWidgetPainter`, `WidgetPainter`, `PaintTarget`) are untouched, because `src/ui/widgets/registry.ts` is not in the diff.

## Technical Verification

| Verification case or check | Success criteria | Governing design | Command or method | Actual evidence | Result |
|---|---|---|---|---|---|
| `V43` | `S8` | `DES7` | Re-ran `bun analyze.ts tty-<t>.raw rows` on all seven recordings; diffed against `evidence/<t>.analysis.txt`; read `evidence/spike-<t>.log`; read `spike-images.ts`, `launch.sh`, `analyze.ts`; independent headless PTY recording (`/usr/bin/script`, no GUI) of an image drawn twice, then once, then not at all | All seven re-runs are byte-identical to the recorded analyses. The logs show each terminal identifying itself (`term=ghostty`, `kitty`, `WezTerm`, `iTerm2`, `Apple_Terminal`) with the protocol used. Kitty-protocol runs: `a=d,d=i` + `a=p … r=5,y=60,h=60` on half-off scroll, `a=d,d=I` on view and buffer switch; Ghostty, iTerm2, and WezTerm send identical command sequences. Sixel: phase 3 rewrites rows 2–5 whose text did not change, which isolates OpenTUI's own cell invalidation. Blocks: 400 → 160/200 → 0 glyphs. Phase 4 (caller crop) emits no new command, so caller cropping equals OpenTUI's clip. The headless run gives two draws of one image distinct ids and placements (`p=1`, `p=2`), and an undrawn image `a=d,d=I`, which reproduces the mechanism | `Passed` |
| `V18` | `S8` | `DES7` | `bun test test/ui/live-preview.test.ts` | 7 pass, 0 fail. `drawImage` protocol argument is `"kitty"` and `"sixel"`; no-graphics mount has > 10 rows of block glyphs; `images = "off"` shows `[image: diagram.png]` with `loads` `[]` and no `drawImage`. After `G`, `<leader>m`, and a buffer switch, the next frame has 0 `drawImage` calls. A cut widget draws `37 − (y − 1)` rows with `sourceHeight = round(120 × rows / 24)` | `Passed` |
| `V15` | `S7` | `DES6` | same command | 120×24 with a 16-row reserved image; for each `j` from line 0 to 29 the hardware cursor row lies in rows 1–21 and that row's gutter shows `line + 1` | `Passed` |
| `V19` | `S8` | `DES7` | `bun test src/ui/images.test.ts` | One load for two `get` calls before settle; three 2805² images (≈ 30 MiB each): 3 loads, 3 repaints, 1 `dispose`, `bytes()` ≤ 64 MiB, the first evicted; LRU order follows `get` | `Passed` |
| `V40` | `S8` | `DES7` | same | `broken.png`, `logo.svg`, and a rejecting load each give `{ failed: true }` with no throw and no size | `Passed` |
| `V51` | `S8` | `DES7` | same | Rejection at t=0 → `{failed:true}` at 59 s with 1 load call; at 60 s a second call, then the decoded image; repaints = 2 | `Passed` |
| `V50` | `S8` | `DES7` | `bun test src/workspace/images.test.ts`; scratch probe against `Bun.serve` | 5 pass. PNG bytes returned; 17 MiB body and an endless stream rejected "too large"; 404 rejected; hang rejected at 200 ms; `ftp://` rejected; Cookie and Referer absent; max in flight = 4 of 6; workspace path read with 0 requests; symlink and `..` escapes rejected; 32 MiB + 1 file rejected. Probe: a slow-drip body aborts at 302 ms with `timeoutMs` 300, so the timeout covers the body; redirects to `file://` and `ftp://` fail `UnsupportedRedirectProtocol`; request headers are only `accept`, `accept-encoding`, `connection`, `host`, `user-agent`; six failed downloads release their slots | `Passed` |
| Cache bound, in-flight cap, header leaks, containment, `images = "off"`, 60 s retry | `S8` | `DES7` | Code inspection of `src/ui/images.ts`, `src/workspace/images.ts`; the cases above | The oversized image is refused from its `imageInfo` header before decoding. Eviction skips the newly stored entry, and any single kept image is ≤ the limit, so the total stays bounded. `clear()` during a load makes `store` dispose the late result. The queue hands a slot directly to the next waiter and releases it in `finally`. `off` is handled in core (placeholder text, no widget) and again in `paintImage`; `size()` never starts a load. A retry starts only on a `get` | `Passed` |
| Fast gate | — | — | `bun run check` | Biome clean, tsc clean, knip clean; 713 pass, 0 fail, 18 snapshots | `Passed` |
| Component suites | — | — | `CI=true bun run test:ci` | 125 pass, 0 fail, 28 snapshots | `Passed` |
| Spike recorded | `S8` | `DES7` | Read implementation report | "Graphics spike outcome" table present; the V18 assertion is named and implemented | `Passed` |
| Single network call | `S8` | `DES7` | `rg -n "fetch\(" src --glob '!**/*.test.ts'`; `rg -n "\bfetch\b" …`; `rg -n "Bun\.connect\|node:http\|node:https\|node:net\|WebSocket\|XMLHttpRequest" src` | The literal `fetch\(` grep finds no match, because the call is `(o.fetch ?? fetch)(url, …)`, exactly the design's proposed shape (system design §7 `src/workspace/images.ts`). The wider grep finds `fetch` only in `src/workspace/images.ts` (lines 69, 72, 91, 114), and no other network API appears in `src` | `Passed` |
| Layer rules and no work-process identifiers | — | — | `rg -ln "@opentui" src`; `git diff 0876a21..3d9c36a -- src test \| grep "^+" \| rg "W261\|REQ[0-9]\|DES[0-9]\|\bV[0-9]{1,2}\b\|P1-G\|\bG[0-9]\b\|UV[0-9]\|\bS[0-9]{1,2}\b"` | No `@opentui` import outside `src/ui`; no identifier match in any added line | `Passed` |

## Findings

### P1-G3-VER1 — Minor — Test coverage — The loading placeholder and the whole-download timeout have no regression test

- **System Design:** `REQ2@R2, DES7, S8, V18, V50`
- **UI Design:** `None`
- **Evidence:**
  - Plan P1-G3-T4 Outcome requires that "`paintImage` shows `◌ name` while loading", and the group's Review Focus lists "Placeholder text". REQ2@R2 says a web image shows `◌ <name>` while it downloads. The code is `src/ui/widgets/image.ts:34`, `if (got === undefined) return paintText(t, \`◌ ${name}\`);`. `rg -n "◌" test src` finds no test that asserts it, because every image test lets the load settle before reading the frame.
  - System design §7 `src/workspace/images.ts` states "the timeout covers the whole download". `src/workspace/images.test.ts` covers only a handler that never sends headers (`/hang.png`). A scratch probe shows the behaviour is correct today: a 10-byte-per-50-ms body aborts at 302 ms with `timeoutMs` 300. No committed test protects it.
- **Impact:** Both behaviours are implemented, but no test catches a regression. A painter that drew nothing, or the wrong text, while loading would pass every suite. A refactor that applied the timeout only to the response headers would let a slow-drip host hold a download slot indefinitely.
- **Required resolution:** Add a component assertion and a unit assertion.
  - **Component:** before the load settles, the image row shows `◌ diagram.png` in the `imagePlaceholder` style. For example, use a mount whose `loadImage` is still pending, or read the first frame before `Bun.sleep(0)`.
  - **Unit:** `fetchImage` against a `Bun.serve` handler that sends headers and then drips the body rejects within a short `timeoutMs`.
- **Required proof:** `bun test test/ui/live-preview.test.ts src/workspace/images.test.ts` passes with the new assertions. Each new assertion fails when its behaviour is removed: a blank loading paint, or a timeout signal not passed to the body read. Then run `bun run check` and `CI=true bun run test:ci`.

**Completion Checklist:**

- [ ] Required resolution is implemented.
- [ ] Required proof passes.
- [ ] Change evidence is recorded.
- [ ] Verification evidence is recorded.

## Test Coverage

- **Covered:**
  - **Tier policy:** all `off`, `blocks`, and `auto` branches, including sixel without a resolution.
  - **Cache:**
    - one load per reference;
    - LRU order and disposal within 64 MiB;
    - a repaint on each load;
    - corrupt, SVG, and rejected loads;
    - no retry before 60 s and a retry at 60 s;
    - the cell aspect.
  - **Web downloads:**
    - bytes returned;
    - the Content-Length cap and the streamed-body cap;
    - a 404;
    - a header-stage timeout;
    - a non-`http(s)` scheme;
    - no Cookie or Referer;
    - at most 4 in flight.
  - **Workspace reads:**
    - read with no request;
    - `..` and symlink escapes rejected;
    - the 32 MiB cap;
    - a missing file.
  - **Painting:**
    - kitty and sixel protocol selection;
    - block glyphs;
    - `images = "off"` with no load and no draw;
    - no `drawImage` after scroll-off, a view switch, or a buffer switch;
    - the cropped draw at the window bottom;
    - the cursor fit past a reserved image;
    - `[image: diagram.png]` for a missing file in the tour frame.
- **Missing:** the `◌ name` loading paint and the whole-download (body-stage) timeout (`P1-G3-VER1`). The following are not findings, because the painter path is shared, but they remain untested:
  - SVG and corrupt PNG paint `[image: name]` at component level (only the missing file is asserted there);
  - the reserved row count for a failed image;
  - `pixelWidth` and `pixelHeight` passed for sixel when the terminal reports a resolution.

## Scope Changes

Every deviation in the implementation report was judged on its merit, and each is justified.

- **A finished load re-runs the views, not a bare `requestRender()`** (`src/ui/shell.ts`: `repaint = () => paint(store.get())`). `EditorView` lays out only in `show`, so a bare render request would leave a loaded image in its one-row placeholder until the next store change. V15 and V18 depend on this. It dispatches nothing and puts nothing into `AppState`, so the plan's prohibition ("no dispatching actions from the cache") holds. Accepted.
- **`ImageCache` has more surface than the design sketch** (`cell` and `cellPixels()`, `bytes()`, `clear()`).
  - `cellPixels()` supplies the pixel size that sixel `drawImage` needs, and `cellAspect()` derives from it with the 0.5 default.
  - `clear()` disposes images on shell destroy and between tests.
  - `bytes()` is a small test accessor for the 64 MiB bound.

  All are used, and knip is clean. Accepted.
- **V15 uses a 16-row image, not 20.** `src/core/state/markdown-view.ts:13` caps image rows at `floor(rows × 0.8)` (system design §7, `imageRows`, "caps it at 80% of the window rows"). At 120×24 the window has 21 text rows, so 16 is the largest image possible. The V15 text and the REQ5@R1 acceptance line ("a 20-row image … in a 24-row terminal") cannot be met literally under the design's own cap; the test proves the intent at the maximum height. Accepted. The wording conflict belongs to the planning artifacts, which this verification leaves unchanged.
- **V50 serves the 464-byte `diagram.png`, not a 1 KiB PNG.** The assertion is byte equality, so the size is immaterial. Accepted.
- **Two files changed outside the plan's lists.**
  - `test/integration/config.test.ts` now passes `createImageLoader(root)`, because `ShellDeps.loadImage` is required and this harness mirrors `main.ts`.
  - The P1-G2 tour case now expects `[image: diagram.png]`, because the `image` painter is registered and the file is not mounted.

  Both are necessary consequences of the wiring. Accepted.
- **The `fetch(` grep finds no match.** The call `(o.fetch ?? fetch)(url, …)` is the shape the system design itself prescribes, so this is not an evasion. The wider grep and the network-API grep confirm one outbound call site. Accepted.
- **The spike evidence is byte-level, not visual.** The goal's execution note expected `screencapture` evidence. macOS Screen Recording permission is denied for Ghostty and not granted for the other terminals, and the verifier did not trigger permission prompts. Accepted with the residual risk listed under Unverified Items.

## Unverified Items

- **What the terminals displayed.** The V43 outcome rests on the bytes OpenTUI sent, not on what each terminal showed. Kitty-protocol deletes (`a=d,d=i`, `a=d,d=I`) are explicit protocol commands and are well supported. For sixel, "cleared" infers that the terminal replaces sixel pixels when text is rewritten over them. Phase 3 shows that OpenTUI rewrites the old image's unchanged cells, but no screenshot confirms the terminal result.
- **Spike evidence is not committed.** It lives in the session scratchpad (`/private/tmp/claude-501/-Users-hieunguyen-git-hieu-projects-so/f4fdb1c6-615d-4aaa-a44e-105096aa170a/scratchpad/`). The raw files `tty-*.raw` are at the scratchpad root, not under `evidence/`, as the implementation report states correctly. The evidence will not survive scratchpad cleanup. The plan allows this ("not committed"), and the outcome table is preserved in the committed implementation report.
- **Overlays over an image.** Images under a picker, completion menu, or toast were not exercised. Placements use `z=-1073741823`, which kitty draws above non-default cell backgrounds and below text, so an overlay's background might not hide an image beneath it. This is outside the assigned cases (scroll, view switch, buffer switch) and is recorded only as residual risk.
- **No run of the real `so` binary with an image in a graphics terminal.** No screen capture was available, so the component tests and the protocol recordings are the evidence.

## Blockers

None.
