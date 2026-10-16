import { Database } from "bun:sqlite";
import { cpSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createSvgRasterizer } from "../../../src/workspace/svg";
import { edit, initRepo, type Profile } from "../profile";
import { png } from "./media";

/** The vault the README intro is recorded in, kept beside its recorder. */
export const INTRO_VAULT = join(import.meta.dir, "../../intro/vault");

const LAKE = { width: 1600, height: 1000 };

/** A raft on a lake at dusk, for the image window and the note's embed. */
function lakeSvg(): string {
  const { width: w, height: h } = LAKE;
  const stars = Array.from({ length: 40 }, (_, i) => {
    const x = (i * 397) % w;
    const y = (i * i * 53) % 320;
    return `<circle cx="${x}" cy="${y}" r="${1 + (i % 3)}" fill="#fff" opacity="${0.3 + (i % 5) / 10}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1a1b3a"/><stop offset="0.45" stop-color="#6b3d7a"/>
    <stop offset="0.75" stop-color="#e0707a"/><stop offset="1" stop-color="#f7b267"/>
  </linearGradient>
  <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e08a7a"/><stop offset="0.3" stop-color="#5b3d6e"/><stop offset="1" stop-color="#141530"/>
  </linearGradient>
  <radialGradient id="sun"><stop offset="0" stop-color="#fff3c4"/><stop offset="0.6" stop-color="#ffd27a"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${w}" height="620" fill="url(#sky)"/>
${stars}
<circle cx="1080" cy="560" r="200" fill="url(#sun)"/>
<circle cx="1080" cy="560" r="95" fill="#ffe5a3"/>
<polygon points="0,560 220,400 380,500 560,340 760,520 900,470 1100,600 0,600" fill="#3b2a55"/>
<polygon points="700,600 980,430 1180,540 1380,380 1600,520 1600,600" fill="#2c2148"/>
<polygon points="0,620 300,520 620,600 1000,540 1400,610 1600,570 1600,620" fill="#1f1a3a"/>
<rect y="620" width="${w}" height="380" fill="url(#water)"/>
<g fill="#ffe5a3" opacity="0.55">
  <rect x="1000" y="640" width="160" height="5" rx="2"/><rect x="1020" y="670" width="120" height="5" rx="2"/>
  <rect x="1040" y="705" width="80" height="4" rx="2"/><rect x="1055" y="745" width="50" height="4" rx="2"/>
</g>
<g transform="translate(470 720)">
  <polygon points="0,40 280,40 260,64 20,64" fill="#2a1b14"/>
  <rect x="10" y="26" width="260" height="16" rx="4" fill="#7a4b2a"/>
  <rect x="134" y="-150" width="8" height="176" fill="#3a2618"/>
  <polygon points="142,-145 142,10 250,10" fill="#f2e2c4"/>
  <polygon points="134,-120 134,10 50,10" fill="#e6c79c"/>
</g>
<ellipse cx="610" cy="800" rx="190" ry="10" fill="#0e0f22" opacity="0.5"/>
</svg>`;
}

/** `cluster.db`: the simulator's nodes, log, and votes. */
function stageCluster(path: string): void {
  const db = new Database(path);
  db.run(`CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  term INTEGER NOT NULL,
  last_index INTEGER NOT NULL,
  address TEXT
)`);
  db.run(`CREATE TABLE log_entries (
  idx INTEGER PRIMARY KEY,
  term INTEGER NOT NULL,
  command TEXT NOT NULL
)`);
  db.run(`CREATE TABLE votes (
  term INTEGER NOT NULL,
  voter TEXT NOT NULL REFERENCES nodes (id),
  candidate TEXT NOT NULL REFERENCES nodes (id),
  PRIMARY KEY (term, voter)
)`);
  const node = db.prepare("INSERT INTO nodes VALUES (?, ?, ?, ?, ?)");
  const entry = db.prepare("INSERT INTO log_entries VALUES (?, ?, ?)");
  const vote = db.prepare("INSERT INTO votes VALUES (?, ?, ?)");
  const ids = ["n1", "n2", "n3", "n4", "n5"];
  db.transaction(() => {
    const roles = ["leader", "follower", "follower", "candidate", "follower"];
    const last = [1284, 1283, 1231, 912, 488];
    ids.forEach((id, i) => {
      node.run(
        id,
        roles[i] ?? "follower",
        7,
        last[i] ?? 0,
        i === 4 ? null : `10.0.0.${i + 11}:7000`,
      );
    });
    const keys = ["user", "cart", "order", "session", "stock"];
    for (let i = 1; i <= 1284; i++)
      entry.run(
        i,
        Math.min(7, 1 + Math.floor(i / 190)),
        `SET ${keys[i % 5]}:${(i * 37) % 1000} ${(i * 13) % 97}`,
      );
    for (let term = 1; term <= 7; term++)
      for (const voter of ids)
        vote.run(term, voter, voter === "n4" ? "n4" : `n${(term % 5) + 1}`);
  })();
  db.close();
}

export const intro: Profile = {
  name: "intro",
  summary:
    "The README intro vault: Raft notes, a base, a paper PDF, a picture, a web page, a SQLite database, a Rust crate with an uncommitted edit",
  config: "[lsp]\nenabled = true\n",
  journeys: [
    {
      title: "Recorded tour",
      steps: [
        "Needs rust-analyzer, Poppler, and Chrome",
        "Run bun run record:intro",
      ],
      expect: [
        "Ghostty opens, so plays the tour, and docs/intro.gif is rewritten",
      ],
    },
  ],
  stage: async (vault) => {
    cpSync(INTRO_VAULT, vault, { recursive: true });
    const lake = await createSvgRasterizer()({
      svg: lakeSvg(),
      background: "#000000",
      crop: { x: 0, y: 0, w: LAKE.width, h: LAKE.height },
      ...LAKE,
    });
    writeFileSync(
      join(vault, "lakeside.png"),
      png(lake.rgba, lake.width, lake.height),
    );
    stageCluster(join(vault, "raft-sim/cluster.db"));
    initRepo(vault, "Start reading notes");
    // rust-analyzer's build output stays out of git without a dot file in the explorer.
    writeFileSync(join(vault, ".git/info/exclude"), "target/\n");
    // An uncommitted change, so the code file shows the git change column.
    edit(
      join(vault, "raft-sim/src/lib.rs"),
      "use std::time::Duration;\n",
      "use std::time::Duration;\n\n/// How often a leader sends heartbeats: well under the shortest timeout.\npub const HEARTBEAT: Duration = Duration::from_millis(50);\n",
    );
  },
};
