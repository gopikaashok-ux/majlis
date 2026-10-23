// Renders the built demo in Chromium and checks every Button Variant=Primary State × Size
// against geometry and colours read from Figma component set 481:10750.
// Usage: npm run build && node tests/verify-button.mjs
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

// [x, y, w, h] of each layer relative to its variant, exported from Figma (Label "Button").
const figma = {
  small: { button: [0, 0, 86, 32], icon: [12, 8, 16, 16], label: [34, 8, 40, 16], ring: [-4, -4, 94, 40] },
  medium: { button: [0, 0, 107, 40], icon: [16, 10, 20, 20], label: [44, 10, 47, 20], ring: [-4, -4, 115, 48] },
  large: { button: [0, 0, 126, 48], icon: [20, 12, 24, 24], label: [52, 12, 54, 24], ring: [-4, -4, 134, 56] },
};
// Token values resolved from Figma variables (Light mode).
const bg = {
  default: "#0b825a", hover: "#096646", focus: "#0b825a", pressed: "#064933", disabled: "#d7dad9", loading: "#0b825a",
};
const fg = { disabled: "#949d9a" };
const font = { small: ["12px", "16px"], medium: ["14px", "20px"], large: ["16px", "24px"] };
// Label width depends on font rasterisation; layout boxes must match to the pixel.
const isText = (k) => k === "label" || k === "button" || k === "ring";

const port = 4183;
const server = spawn("node_modules/.bin/vite", ["preview", "--port", String(port), "--strictPort"], {
  stdio: "pipe",
  detached: true,
});
await new Promise((resolve, reject) => {
  server.stdout.on("data", (d) => d.toString().includes(String(port)) && resolve());
  server.on("exit", (code) => reject(new Error(`vite preview exited ${code}`)));
});

let failures = 0;
const report = [];
const check = (ok, line) => {
  if (!ok) failures++;
  report.push(`${ok ? "PASS" : "FAIL"}  ${line}`);
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:${port}/`);
  await page.evaluate(() => document.fonts.ready);
  const gallery = page.getByTestId("button-gallery");
  await gallery.waitFor();

  const measured = await page.evaluate(() => {
    const hex = (c) => {
      const m = c.match(/\d+(\.\d+)?/g);
      return m ? "#" + m.slice(0, 3).map((v) => (+v).toString(16).padStart(2, "0")).join("") : c;
    };
    const out = {};
    for (const host of document.querySelectorAll("[data-testid=button-gallery] [data-testid^=button-]")) {
      const [, size, state] = host.dataset.testid.split("-");
      const button = host.querySelector("button");
      const icon = button.querySelector("[aria-hidden]");
      const label = button.querySelector("[class*=label]");
      // Measure the spinner's unrotated box.
      icon.style.animation = "none";
      const b = button.getBoundingClientRect();
      const rel = (el) => {
        const r = el.getBoundingClientRect();
        return [r.x - b.x, r.y - b.y, r.width, r.height];
      };
      const iconBox = rel(icon);
      icon.style.animation = "";
      const cs = getComputedStyle(button);
      const ow = parseFloat(cs.outlineWidth);
      const off = parseFloat(cs.outlineOffset);
      out[`${size}-${state}`] = {
        size,
        state,
        boxes: { button: [0, 0, b.width, b.height], icon: iconBox, label: rel(label) },
        ring: cs.outlineStyle === "solid" ? [-(ow + off), -(ow + off), b.width + 2 * (ow + off), b.height + 2 * (ow + off)] : null,
        ringColor: cs.outlineStyle === "solid" ? hex(cs.outlineColor) : null,
        bg: hex(cs.backgroundColor),
        color: hex(cs.color),
        iconColor: hex(getComputedStyle(icon).backgroundColor),
        radius: cs.borderTopLeftRadius,
        font: [cs.fontSize, cs.lineHeight, cs.fontWeight, cs.fontFamily.split(",")[0]],
        spinner: getComputedStyle(icon).animationName,
        mask: /url\(/.test(getComputedStyle(icon).maskImage),
      };
    }
    return out;
  });

  for (const m of Object.values(measured)) {
    const id = `${m.size}/${m.state}`.padEnd(16);
    for (const key of ["button", "icon", "label"]) {
      const want = figma[m.size][key];
      const got = m.boxes[key];
      const tol = isText(key) ? 3 : 0.5;
      const ok = got.every((v, i) => Math.abs(v - want[i]) <= tol);
      check(ok, `${id} ${key.padEnd(7)} figma=${want.join(",")}  dom=${got.map((v) => +v.toFixed(1)).join(",")}`);
    }
    check(m.bg === bg[m.state], `${id} background  figma=${bg[m.state]}  dom=${m.bg}`);
    const wantFg = fg[m.state] ?? "#ffffff";
    check(m.color === wantFg && m.iconColor === wantFg, `${id} text/icon   figma=${wantFg}  dom=${m.color}/${m.iconColor}`);
    check(m.radius === "8px", `${id} radius      dom=${m.radius}`);
    const [fs, lh] = font[m.size];
    check(
      m.font[0] === fs && m.font[1] === lh && m.font[2] === "600" && /Plus Jakarta Sans/.test(m.font[3]),
      `${id} font        figma=${fs}/${lh} 600  dom=${m.font.join(" ")}`,
    );
    check(m.mask, `${id} icon mask loaded`);
    check((m.state === "loading") === (m.spinner === "btn-spin" || /btn-spin/.test(m.spinner)), `${id} spinner     dom=${m.spinner}`);
    if (m.state === "focus") {
      const want = figma[m.size].ring;
      const ok = m.ring && m.ring.every((v, i) => Math.abs(v - want[i]) <= 3) && m.ringColor === "#0b825a";
      check(ok, `${id} focus ring  figma=${want.join(",")} #0b825a  dom=${m.ring?.map((v) => +v.toFixed(1)).join(",")} ${m.ringColor}`);
    } else {
      check(!m.ring, `${id} no ring`);
    }
  }

  // Real interaction on the live demo: hover → Hover colour, mouse down → Pressed, Tab → focus ring.
  const live = page.getByTestId("button-demo").getByRole("button", { name: "Continue" });
  const bgOf = () => live.evaluate((el) => getComputedStyle(el).backgroundColor);
  await live.hover();
  await page.waitForTimeout(50);
  check((await bgOf()) === "rgb(9, 102, 70)", `live hover        dom=${await bgOf()}`);
  await page.mouse.down();
  check((await bgOf()) === "rgb(6, 73, 51)", `live pressed      dom=${await bgOf()}`);
  await page.mouse.up();
  await page.mouse.move(0, 0);
  const save = page.getByTestId("button-demo").locator("button").nth(1);
  await save.click();
  check((await save.getAttribute("aria-busy")) === "true", "live click → loading");
  await page.getByTestId("button-demo-saved").getByText("1").waitFor({ timeout: 5000 });
  check(true, "live loading → done");
  await page.keyboard.press("Tab");
  const focusedOutline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  check(focusedOutline === "solid", `live keyboard focus ring  dom=${focusedOutline}`);

  console.log(report.join("\n"));
  mkdirSync("tests/output", { recursive: true });
  await page.mouse.move(0, 0);
  await gallery.screenshot({ path: "tests/output/button-primary-gallery@2x.png" });
} finally {
  await browser.close();
  process.kill(-server.pid);
}
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
