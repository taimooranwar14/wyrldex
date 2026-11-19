// Records the feature-tour video: drives the real app in headless Chrome, captures frames, encodes an MP4.
// Usage: build, then start the app in LIVE mode (so the AI answers are real) with Ollama running:
//   AI_MODE=local npx next start -p 3125
//   node scripts/record-demo.mjs http://localhost:3125 ~/Desktop/wyrldex-demo.mp4
// Needs Chrome (CHROME_PATH) and ffmpeg. The cursor, captions and title cards are overlays injected by this script;
// they are not part of the app.
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [base = "http://localhost:3125", output = "wyrldex-demo.mp4"] = process.argv.slice(2);
const chromePath = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const work = mkdtempSync(join(tmpdir(), "wyrldex-demo-"));
const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn(chromePath, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${join(work, "profile")}`, "--hide-scrollbars", "about:blank"]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Runs on every exit, including a crash midway, so no stray headless Chrome or temp folder is left behind.
process.on("exit", () => {
  chrome.kill();
  try {
    rmSync(work, { recursive: true, force: true });
  } catch {
    // Chrome may still hold files for a moment; the OS temp folder is cleaned eventually.
  }
});

let wsUrl;
for (let i = 0; i < 40 && !wsUrl; i++) {
  await sleep(250);
  try {
    wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page")?.webSocketDebuggerUrl;
  } catch {
    // Chrome is still starting.
  }
}
const socket = new WebSocket(wsUrl);
await new Promise((resolve) => (socket.onopen = resolve));
let nextId = 0;
const pending = new Map();
const frames = [];
socket.onmessage = ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id) pending.get(msg.id)?.(msg.result);
  if (msg.method === "Page.screencastFrame") {
    const file = join(work, `f${String(frames.length).padStart(5, "0")}.jpg`);
    writeFileSync(file, Buffer.from(msg.params.data, "base64"));
    frames.push({ file, t: msg.params.metadata.timestamp, arrived: Date.now() / 1000 });
    socket.send(JSON.stringify({ id: ++nextId, method: "Page.screencastFrameAck", params: { sessionId: msg.params.sessionId } }));
  }
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    pending.set(++nextId, resolve);
    socket.send(JSON.stringify({ id: nextId, method, params }));
  });
const js = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
const demo = (call) => js(`window.__demo.${call}`);
async function waitFor(expression, ms = 60000) {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(200)) if (await js(expression)) return;
  throw new Error(`Timed out waiting for: ${expression}`);
}

// Overlays: a cursor that glides to each target, a caption bar, and full-screen title cards.
const overlay = String.raw`
window.__demo = (() => {
  const css = document.createElement("style");
  css.textContent = ${"`"}
    #demo-cursor { position: fixed; left: 0; top: 0; z-index: 100000; pointer-events: none; transition: opacity .4s ease; }
    #demo-cursor svg { filter: drop-shadow(0 2px 6px rgba(0,0,0,.6)); }
    .demo-ripple { position: fixed; z-index: 99999; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; border: 3px solid #22d3ee; pointer-events: none; animation: demo-ripple .6s ease-out forwards; }
    @keyframes demo-ripple { from { transform: scale(.3); opacity: 1 } to { transform: scale(1.6); opacity: 0 } }
    #demo-caption { position: fixed; left: 50%; bottom: 28px; z-index: 99998; transform: translate(-50%, 20px); opacity: 0; transition: all .45s ease; pointer-events: none;
      white-space: nowrap; padding: 10px 22px; border-radius: 10px; text-align: center; font: 500 26px/1.35 var(--font-geist-sans), system-ui, sans-serif; color: #fff;
      background: rgba(10,7,20,.84); border: 1px solid rgba(255,255,255,.08); }
    #demo-caption.on { opacity: 1; transform: translate(-50%, 0); }
    #demo-card { position: fixed; inset: 0; z-index: 99997; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; text-align: center;
      background: radial-gradient(circle at 50% 40%, rgba(40,20,80,.88), rgba(10,7,20,.97)); backdrop-filter: blur(10px); opacity: 0; transition: opacity .8s ease; pointer-events: none;
      font-family: var(--font-geist-sans), system-ui, sans-serif; color: #ede9fe; }
    #demo-card.on { opacity: 1; }
    #demo-card h1 { margin: 0; font-size: 104px; font-weight: 700; letter-spacing: -2px; background: linear-gradient(90deg, #22d3ee, #a855f7, #ec4899); -webkit-background-clip: text; color: transparent; }
    #demo-card p { margin: 0; font-size: 28px; color: #c4b5fd; }
    #demo-card small { font-size: 15px; color: #8b84a8; }
  ${"`"};
  document.head.append(css);
  const cursor = Object.assign(document.createElement("div"), { id: "demo-cursor" });
  cursor.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#0a0714" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  cursor.style.transform = "translate(640px, 420px)";
  const caption = Object.assign(document.createElement("div"), { id: "demo-caption" });
  const card = Object.assign(document.createElement("div"), { id: "demo-card" });
  document.body.append(card, caption, cursor);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const find = (q) =>
    q.startsWith("text=")
      ? [...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(q.slice(5)))
      : document.querySelector(q);
  // A hand does not move in straight lines at constant speed: follow a slight arc, take longer for longer
  // moves, ease in and out, land a little off-centre and hesitate before clicking.
  let pos = { x: 640, y: 420 };
  function glide(tx, ty) {
    return new Promise((done) => {
      const sx = pos.x, sy = pos.y, dx = tx - sx, dy = ty - sy, dist = Math.hypot(dx, dy) || 1;
      const ms = Math.min(1100, 320 + dist * 0.9);
      const bend = (Math.random() - 0.5) * 0.35 * dist;
      const cx = sx + dx / 2 - (dy / dist) * bend, cy = sy + dy / 2 + (dx / dist) * bend;
      const t0 = performance.now();
      (function step(now) {
        const t = Math.min(1, (now - t0) / ms);
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * tx;
        const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * ty;
        cursor.style.transform = "translate(" + x + "px," + y + "px)";
        if (t < 1) requestAnimationFrame(step);
        else { pos = { x: tx, y: ty }; done(); }
      })(t0);
    });
  }
  async function moveTo(q) {
    const el = find(q);
    if (!el) throw new Error("Not found: " + q);
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    await wait(350);
    const r = el.getBoundingClientRect();
    const jitter = () => (Math.random() - 0.5) * 0.3;
    await glide(r.left + Math.min(r.width / 2, 60) * (1 + jitter()), r.top + r.height * (0.5 + jitter() / 2));
    await wait(120 + Math.random() * 180);
    return el;
  }
  return {
    moveTo,
    async click(q) {
      const el = await moveTo(q);
      const r = cursor.getBoundingClientRect();
      const ripple = Object.assign(document.createElement("div"), { className: "demo-ripple" });
      ripple.style.left = r.left + "px";
      ripple.style.top = r.top + "px";
      document.body.append(ripple);
      setTimeout(() => ripple.remove(), 700);
      el.click();
      await wait(250);
    },
    caption(text) {
      if (!text) return caption.classList.remove("on");
      caption.classList.remove("on");
      setTimeout(() => { caption.textContent = text; caption.classList.add("on"); }, caption.textContent ? 250 : 0);
    },
    card(html) {
      cursor.style.opacity = html ? "0" : "1"; // no cursor over title cards
      if (!html) return card.classList.remove("on");
      card.innerHTML = html;
      card.classList.add("on");
    },
    scrollTo(q) { find(q)?.scrollIntoView({ block: "center", behavior: "smooth" }); },
  };
})();
`;

const disclaimer = "<small>unofficial fan project · not affiliated with Rockstar Games or Take-Two</small>";

await send("Page.enable");
await send("Runtime.enable");
// 1280×720 CSS pixels at 1.5× = 1920×1080 video, with UI large enough to read on a phone.
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1.5, mobile: false });
await send("Page.navigate", { url: base });
await waitFor(`Object.keys(document.querySelector("input[type=search]") ?? {}).some((k) => k.startsWith("__reactFiber"))`);
await js(overlay);
await demo(`card(${JSON.stringify(`<h1>Wyrldex</h1><p>GTA VI is out today, so naturally I built a map for it</p>${disclaimer}`)})`);
await sleep(600);
await send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });

// ——— The tour ———
await sleep(3800);
await demo(`card(null)`);
await sleep(700);
await demo(`caption("29 places so far, every one with a source")`);
await sleep(2600);

await demo(`caption("let's zoom into Vice City")`);
await demo(`click('[aria-label="Vice City (region)"]')`);
await sleep(2400);

await demo(`caption("each place tells you where the info came from")`);
await demo(`click('[aria-label="Hotel Dixon, Hotel"]')`);
await sleep(600);
await demo(`scrollTo("aside article")`);
await sleep(2600);
await demo(`click('[aria-label="Show the whole map"]')`);
await sleep(900);

await demo(`caption("now the fun part: asking the AI")`);
await demo(`scrollTo('[aria-label="Suggested questions"]')`);
await sleep(500);
await demo(`click("text=Find locations connected to Lucia")`);
await waitFor(`document.querySelector("[role=status]")?.textContent.includes("AI highlighted")`, 90000);
await demo(`caption("it runs on my laptop, and it can only look things up")`);
await demo(`scrollTo("aside ol")`);
await sleep(3200);
await demo(`caption("answer comes from the database, map jumps to it")`);
await sleep(2800);

await demo(`caption("for the nerds: the actual tool call")`);
await demo(`click("text=Technical details")`);
await sleep(2800);
await demo(`click("text=Hide technical details")`);

await demo(`caption("save it for later")`);
await demo(`click("text=Save 2 places")`);
await sleep(1800);

await demo(`caption("who's connected to what")`);
await demo(`click('[aria-label^="Lucia Caminos (character)"]')`);
await sleep(1200);
await demo(`scrollTo("aside article")`);
await sleep(2400);

await demo(`caption("boring old search still works too")`);
await demo(`click('[aria-label="Show the whole map"]')`);
await demo(`click("input[type=search]")`);
await js(`document.querySelector("input[type=search]").focus()`);
for (const ch of "nightlife") {
  await send("Input.insertText", { text: ch });
  await sleep(60 + Math.random() * 140); // uneven, like real typing
}
await sleep(2200);

await demo(`caption("and full screen, because why not")`);
await demo(`click('[aria-label="Full screen map"]')`);
await sleep(700);
await demo(`click('[aria-label="Vice City (region)"]')`);
await sleep(2400);
await demo(`click('[aria-label="Exit full screen"]')`);
await sleep(700);
await demo(`caption(null)`);

await demo(
  `card(${JSON.stringify(
    `<h1>Wyrldex</h1><p>still early. lots more coming.</p><p style="font-size:22px;color:#a5f3fc">github.com/taimooranwar14/wyrldex</p>${disclaimer}`,
  )})`,
);
await sleep(4500);
const stoppedAt = Date.now() / 1000;
await send("Page.stopScreencast");
await sleep(300);

// ——— Encode: each frame lasts until the next one arrived, so pauses keep their real length ———
// Chrome only sends frames when the page changes, so the last frame lasts until recording stopped.
const lastFrame = frames.at(-1);
const lines = frames.map((f, i) => {
  const duration = frames[i + 1] ? frames[i + 1].t - f.t : stoppedAt - lastFrame.arrived;
  return `file '${f.file}'\nduration ${Math.max(duration, 0.001).toFixed(4)}`; // no 1/30 floor: Chrome sends up to 60 fps, the fps filter resamples
});
lines.push(`file '${frames.at(-1).file}'`);
writeFileSync(join(work, "frames.txt"), lines.join("\n"));
const gaps = frames.slice(1).map((f, i) => ({ gap: f.t - frames[i].t, at: frames[i].t - frames[0].t }));
const biggest = gaps.sort((x, y) => y.gap - x.gap).slice(0, 3).map((g) => `${g.gap.toFixed(1)}s at ${g.at.toFixed(1)}s`);
console.log(`Frame clock span ${(lastFrame.t - frames[0].t).toFixed(1)}s, wall span ${(lastFrame.arrived - frames[0].arrived).toFixed(1)}s, biggest gaps: ${biggest.join(", ")}`);
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(work, "frames.txt"),
  "-vf", "fps=30,scale=1920:1080:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-movflags", "+faststart", output]);
console.log(`Wrote ${output} from ${frames.length} frames`);

socket.close();
await new Promise((resolve) => {
  chrome.once("exit", resolve);
  chrome.kill();
});
rmSync(work, { recursive: true, force: true, maxRetries: 3 });
