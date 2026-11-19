// Browser smoke test: clicks through every feature in a real (headless) Chrome and fails on any regression.
// Usage: build and start the app in public mode (AI_MODE unset), then
//   node scripts/smoke.mjs http://localhost:3000 [width] [height]
// Set CHROME_PATH if Chrome is not in the default macOS location. No dependencies: talks to Chrome over the
// DevTools Protocol with Node's built-in WebSocket.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [base = "http://localhost:3000", width = "1440", height = "900"] = process.argv.slice(2);
const chromePath = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const profile = mkdtempSync(join(tmpdir(), "wyrldex-smoke-")); // fresh profile: empty localStorage every run
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(chromePath, [`--headless=new`, `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let wsUrl;
for (let i = 0; i < 40 && !wsUrl; i++) {
  await sleep(250);
  try {
    wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page")?.webSocketDebuggerUrl;
  } catch {
    // Chrome is still starting.
  }
}
if (!wsUrl) throw new Error("Chrome did not start; set CHROME_PATH");

const socket = new WebSocket(wsUrl);
await new Promise((resolve) => (socket.onopen = resolve));
let nextId = 0;
const pending = new Map();
const pageErrors = [];
socket.onmessage = ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id) pending.get(msg.id)?.(msg.result);
  if (msg.method === "Runtime.exceptionThrown") pageErrors.push(msg.params.exceptionDetails.text);
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") pageErrors.push(JSON.stringify(msg.params.args).slice(0, 200));
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    pending.set(++nextId, resolve);
    socket.send(JSON.stringify({ id: nextId, method, params }));
  });
const js = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result.value;
const click = (selector) => js(`document.querySelector(${JSON.stringify(selector)})?.click() ?? "missing"`);
const clickText = (text) => js(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(${JSON.stringify(text)}))?.click() ?? "missing"`);
// textContent, not innerText: innerText applies CSS text-transform, so "uppercase" labels would not match.
const text = (selector) => js(`document.querySelector(${JSON.stringify(selector)})?.textContent ?? ""`);
const zoom = () => js(`Math.max(0, ...[...document.querySelectorAll("div[style]")].map((d) => Number(/scale\\(([\\d.]+)\\)/.exec(d.style.transform)?.[1] ?? 0)))`);
const status = () => text("[role=status]");

const results = [];
async function check(name, fn) {
  try {
    const ok = await fn();
    results.push([ok ? "PASS" : "FAIL", name]);
  } catch (error) {
    results.push(["FAIL", `${name}: ${error.message}`]);
  }
}
async function waitFor(fn, ms = 10000) {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(200)) if (await fn()) return true;
  return false;
}

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +width, height: +height, deviceScaleFactor: 1, mobile: +width < 600 });
await send("Page.navigate", { url: base });
// Wait for React to hydrate (it attaches a __reactFiber key to elements); typing earlier would hit plain HTML.
await waitFor(() => js(`Object.keys(document.querySelector("input[type=search]") ?? {}).some((k) => k.startsWith("__reactFiber"))`));

await check("map shows the six region labels", () => js(`document.querySelectorAll('[aria-label$="(region)"]').length === 6`));
await check("no horizontal scrolling", () => js(`document.documentElement.scrollWidth <= window.innerWidth`));
await check("public mode is labelled as recorded", async () => (await text("aside")).includes("Recorded demo"));

await check("search box finds hotels via the API", async () => {
  await js(`document.querySelector('input[type=search]').focus()`);
  await send("Input.insertText", { text: "hotel" });
  return waitFor(async () => /\d+ locations? found/.test(await status()));
});
await check("clearing the search shows everything again", async () => {
  await js(`document.querySelector('input[type=search]').select()`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
  return waitFor(async () => (await status()) === "");
});
await check("category filter narrows the pins", async () => {
  await clickText("Nightlife");
  const ok = await waitFor(() => js(`document.querySelectorAll('[aria-label$=", Nightlife"]').length === 2 && document.querySelectorAll('[aria-label$=", Hotel"]').length === 0`));
  await js(`[...document.querySelectorAll('[aria-label="Filter by category"] button')].find((b) => b.textContent === "All").click()`);
  return ok;
});

await check("AI replay answers the Lucia question and highlights 2 places", async () => {
  await clickText("Find locations connected to Lucia");
  return waitFor(async () => (await status()).includes("AI highlighted · 2 places"), 15000);
});
await check("answer names both places", async () => /Leonida Penitentiary/.test(await text("aside")) && /Uncle Jack/.test(await text("aside")));
await check("trace reads in plain steps", async () => (await text("aside")).includes("How the AI answered") && (await text("aside")).includes("Wrote the answer"));
await check("technical details are hidden from the public", async () => !(await text("aside")).includes("Technical details"));
await check("place labels use plain wording", async () => (await text("aside")).includes("Spotted by fans"));

await check("saving the answer creates a collection", async () => {
  await clickText("Save 2 places");
  return waitFor(async () => (await text('[aria-labelledby="collections-heading"]')).includes("Find locations connected to Lucia"));
});
await check("World Graph focuses a character", async () => {
  await click('[aria-label^="Lucia Caminos (character)"]');
  return waitFor(async () => (await status()).startsWith("Connected to Lucia Caminos") && (await text("aside")).includes("Character"));
});
await check("clicking a region clears the highlight and recentres the graph", async () => {
  await click('[aria-label="Vice City (region)"]');
  return waitFor(async () => (await status()) === "" && (await text('[aria-labelledby="graph-heading"]')).includes("Centred on Vice City"));
});
await check("suggested questions follow the selection", async () => (await text('[aria-label="Suggested questions"]')).includes("What is in Vice City?"));
await check("Esc closes the selection", async () => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  return waitFor(async () => (await text("aside")).includes("Select a place, region or character"));
});
await check("zoom controls zoom in, and home shows the whole map", async () => {
  await click('[aria-label="Show the whole map"]');
  await waitFor(async () => (await zoom()) === 1);
  await click('[aria-label="Zoom in"]');
  const zoomedIn = await waitFor(async () => (await zoom()) > 1);
  await click('[aria-label="Show the whole map"]');
  return zoomedIn && waitFor(async () => (await zoom()) === 1);
});
await check("full-screen map covers the window, Esc exits", async () => {
  await click('[aria-label="Full screen map"]');
  const covers = await waitFor(() =>
    js(`(() => { const r = document.querySelector('[aria-label="Exit full screen"]').closest(".fixed").getBoundingClientRect(); return r.width === innerWidth && r.height === innerHeight; })()`),
  );
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  return covers && waitFor(() => js(`!!document.querySelector('[aria-label="Full screen map"]')`));
});

await send("Page.navigate", { url: `${base}/about` });
await check("About page loads", () => waitFor(() => js(`document.title === "About · Wyrldex"`)));

await check("no errors in the page console", () => pageErrors.length === 0);

for (const [verdict, name] of results) console.log(`${verdict}  ${name}`);
if (pageErrors.length) console.log("Page errors:", pageErrors);
socket.close();
await new Promise((resolve) => {
  chrome.once("exit", resolve); // Chrome must stop writing to its profile before we delete it
  chrome.kill();
});
rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
const failed = results.filter(([verdict]) => verdict === "FAIL").length;
console.log(`\n${results.length - failed}/${results.length} passed at ${width}×${height}`);
process.exit(failed ? 1 : 0);
