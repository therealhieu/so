// The showcase's interactions. Each one also names itself in the title, so
// so's statusline shows what the page last saw.
const $ = (id) => document.getElementById(id);
const say = (what) => {
  document.title = `showcase · ${what}`;
};

// A clock: one small change a second.
const tick = () => {
  $("clock").textContent = new Date().toLocaleTimeString();
};
tick();
setInterval(tick, 1000);

// A static drawing on a canvas.
{
  const c = $("art").getContext("2d");
  for (let i = 0; i < 24; i++) {
    c.strokeStyle = `hsl(${i * 15}, 70%, 65%)`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(160, 80, 8 + i * 3, i * 0.3, i * 0.3 + Math.PI * 1.2);
    c.stroke();
  }
}

// Forms.
$("name").addEventListener("input", (e) => say(`name: ${e.target.value}`));
$("notes").addEventListener("input", (e) => {
  $("count").textContent = String(e.target.value.length);
});
$("plan").addEventListener("change", (e) => say(`plan: ${e.target.value}`));
$("volume").addEventListener("input", (e) => {
  $("vol").textContent = e.target.value;
  $("level").style.width = `${e.target.value}%`;
  say(`volume ${e.target.value}`);
});
let clicks = 0;
$("plus").addEventListener("click", () => {
  clicks++;
  $("clicks").textContent = String(clicks);
  say(`clicked ${clicks}`);
});
$("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  $("result").textContent = JSON.stringify(data, null, 2);
  say("submitted");
});
$("open").addEventListener("click", () => $("dialog").showModal());
$("close").addEventListener("click", () => $("dialog").close());

// Mouse: a pointer tracker, a double-click lamp, and a drag-to-sort list.
$("pad").addEventListener("mousemove", (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  $("where").textContent =
    `x ${Math.round(e.clientX - r.left)}, y ${Math.round(e.clientY - r.top)}`;
});
$("lamp").addEventListener("dblclick", (e) => {
  const off = e.currentTarget.classList.toggle("off");
  e.currentTarget.querySelector("b").textContent = off ? "on" : "off";
  say(off ? "lamp off" : "lamp on");
});
{
  const list = $("sortable");
  let dragged = null;
  list.addEventListener("pointerdown", (e) => {
    if (e.target.tagName !== "LI") return;
    dragged = e.target;
    dragged.classList.add("dragging");
    list.setPointerCapture(e.pointerId);
  });
  list.addEventListener("pointermove", (e) => {
    if (!dragged) return;
    const over = document.elementFromPoint(e.clientX, e.clientY);
    if (over?.tagName !== "LI" || over === dragged || over.parentNode !== list)
      return;
    const r = over.getBoundingClientRect();
    list.insertBefore(
      dragged,
      e.clientY < r.top + r.height / 2 ? over : over.nextSibling,
    );
  });
  list.addEventListener("pointerup", () => {
    if (!dragged) return;
    dragged.classList.remove("dragging");
    say(`order: ${[...list.children].map((li) => li.textContent).join(", ")}`);
    dragged = null;
  });
}
for (const tab of document.querySelectorAll(".tab")) {
  tab.addEventListener("click", () => {
    for (const t of document.querySelectorAll(".tab"))
      t.classList.toggle("on", t === tab);
    for (const p of document.querySelectorAll(".panel"))
      p.hidden = p.id !== tab.dataset.tab;
    say(`tab: ${tab.textContent}`);
  });
}

// Keys: the last few keys pressed in the box.
$("keybox").addEventListener("keydown", (e) => {
  const mods = ["ctrl", "alt", "shift", "meta"].filter((m) => e[`${m}Key`]);
  const li = document.createElement("li");
  li.textContent = `${[...mods, e.key].join("+")}  (code ${e.code})`;
  $("keylog").prepend(li);
  while ($("keylog").children.length > 6) $("keylog").lastChild.remove();
  if (e.key === "Tab" || e.key.startsWith("Arrow")) e.preventDefault();
  say(`key ${li.textContent}`);
});

// Data: filter and sort the table.
{
  const body = $("table").tBodies[0];
  $("filter").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    for (const row of body.rows)
      row.hidden = !row.textContent.toLowerCase().includes(q);
  });
  let last = 0;
  let up = true;
  for (const th of $("table").tHead.rows[0].cells) {
    th.addEventListener("click", () => {
      const k = Number(th.dataset.key);
      up = k === last ? !up : true;
      last = k;
      const rows = [...body.rows].sort((a, b) => {
        const x = a.cells[k].textContent;
        const y = b.cells[k].textContent;
        const n = Number(x) - Number(y);
        return (Number.isNaN(n) ? x.localeCompare(y) : n) * (up ? 1 : -1);
      });
      body.append(...rows);
      say(
        `sorted by ${th.textContent.replace(/[▾▴]/, "").trim()} ${up ? "up" : "down"}`,
      );
    });
  }
}

// Motion: bouncing balls on a canvas and a spinner, until stopped.
{
  const c = $("balls").getContext("2d");
  const balls = Array.from({ length: 12 }, (_, i) => ({
    x: 40 + i * 45,
    y: 30 + (i % 4) * 35,
    dx: 2 + (i % 3),
    dy: 1.5 + (i % 2),
    hue: i * 30,
  }));
  let running = false;
  const draw = () => {
    c.fillStyle = "#16161e";
    c.fillRect(0, 0, 640, 200);
    for (const b of balls) {
      b.x += b.dx;
      b.y += b.dy;
      if (b.x < 10 || b.x > 630) b.dx *= -1;
      if (b.y < 10 || b.y > 190) b.dy *= -1;
      c.fillStyle = `hsl(${b.hue}, 70%, 60%)`;
      c.beginPath();
      c.arc(b.x, b.y, 10, 0, Math.PI * 2);
      c.fill();
    }
    if (running) requestAnimationFrame(draw);
  };
  draw();
  $("animate").addEventListener("click", (e) => {
    running = !running;
    e.target.textContent = running ? "Stop animation" : "Start animation";
    document.querySelector(".spinner").classList.toggle("on", running);
    say(running ? "animating" : "still");
    if (running) requestAnimationFrame(draw);
  });
}
