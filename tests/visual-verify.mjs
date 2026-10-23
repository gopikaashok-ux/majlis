// Renders the built demo in Chromium and checks the File Upload / Dropzone variants
// against geometry and colours read from Figma (component set 330:10272).
// Usage: npm run build && npm run verify:visual
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

// [x, y, w, h] relative to the component-set frame, exported from Figma.
const figma = {
  idle: {
    variant: [24, 24, 480, 158], Label: [24, 24, 88, 20], Dropzone: [24, 52, 480, 130],
    "Upload icon": [252, 77, 24, 24], Prompt: [161, 109, 206, 24], "Prompt text": [161, 109, 144, 24],
    "Browse link": [309, 109, 58, 24], Hint: [183.5, 141, 161, 16],
  },
  "drag-over": {
    variant: [552, 24, 480, 160], Label: [552, 24, 88, 20], Dropzone: [552, 52, 480, 132],
    "Upload icon": [780, 78, 24, 24], Prompt: [718, 110, 148, 24], Hint: [711.5, 142, 161, 16],
  },
  uploading: {
    variant: [24, 224, 480, 240], Label: [24, 224, 88, 20], Dropzone: [24, 252, 480, 130],
    "Upload icon": [252, 277, 24, 24], Prompt: [161, 309, 206, 24], Hint: [183.5, 341, 161, 16],
    "File row": [24, 390, 480, 74], "File icon": [37, 407, 40, 40], "File name": [89, 403, 119, 20],
    "File meta": [89, 427, 68, 16], Progress: [89, 447, 358, 4], Fill: [89, 447, 89.5, 4],
    Button: [459, 411, 32, 32],
  },
  uploaded: {
    variant: [552, 224, 480, 232], Label: [552, 224, 88, 20], Dropzone: [552, 252, 480, 130],
    "Upload icon": [780, 277, 24, 24], Prompt: [689, 309, 206, 24], Hint: [711.5, 341, 161, 16],
    "File row": [552, 390, 480, 66], "File icon": [565, 403, 40, 40], "File name": [617, 404, 119, 20],
    "File meta": [617, 426, 101, 16], "Status icon": [955, 413, 20, 20], Button: [987, 407, 32, 32],
  },
  error: {
    variant: [24, 504, 480, 182], Label: [24, 504, 88, 20], Dropzone: [24, 532, 480, 130],
    "Upload icon": [252, 557, 24, 24], Prompt: [161, 589, 206, 24], Hint: [183.5, 621, 161, 16],
    "Error message": [24, 670, 480, 16],
  },
};

// Token values resolved from Figma variables (Light mode).
const colors = {
  idle: { "Dropzone bg": "#f6f7f7", "Dropzone stroke": "#949d9a", "Upload icon": "#5d6763", "Prompt text": "#2a302e", "Browse link": "#096646", Hint: "#5d6763", Label: "#2a302e" },
  "drag-over": { "Dropzone bg": "#f1f9f6", "Dropzone stroke": "#0b825a", "Upload icon": "#096646", Prompt: "#096646" },
  uploading: { "File row bg": "#ffffff", "File row border": "#d7dad9", "File icon bg": "#f6f7f7", Progress: "#ebecec", Fill: "#0b825a", Button: "#2a302e" },
  uploaded: { "Status icon": "#0e682f", "File meta": "#5d6763" },
  error: { "Dropzone bg": "#fbe5e6", "Dropzone stroke": "#bc3b3f", "Error message": "#bc3b3f" },
};

const selectors = {
  variant: ":scope > div", Label: "label", Dropzone: "[data-state]", "Upload icon": "[class*=uploadIcon]",
  Prompt: "[class*=prompt]", "Prompt text": "[class*=prompt] > span", "Browse link": "[class*=browse]",
  Hint: "[class*=hint]", "File row": "[class*=fileRow]", "File icon": "[class*=fileIcon]",
  "File name": "[class*=fileName]", "File meta": "[class*=fileMeta]", Progress: "[role=progressbar]",
  Fill: "[class*=progressFill]", Button: "[class*=iconButton]", "Status icon": "[class*=statusIcon]",
  "Error message": "[role=alert]",
};
// Text boxes depend on font rasterisation; layout boxes must match to the pixel.
const isText = (k) => ["Label", "Prompt", "Prompt text", "Browse link", "Hint", "File name", "File meta"].includes(k);

const port = 4179;
const server = spawn("node_modules/.bin/vite", ["preview", "--port", String(port), "--strictPort"], {
  stdio: "pipe",
  detached: true,
});
await new Promise((resolve, reject) => {
  server.stdout.on("data", (d) => d.toString().includes(String(port)) && resolve());
  server.on("exit", (code) => reject(new Error(`vite preview exited ${code}`)));
});

let failures = 0;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:${port}/`);
  await page.evaluate(() => document.fonts.ready);
  const gallery = page.getByTestId("fileupload-gallery");
  await gallery.waitFor();

  const measured = await page.evaluate(({ selectors }) => {
    const root = document.querySelector("[data-testid=fileupload-gallery]").getBoundingClientRect();
    const hex = (c) => {
      const m = c.match(/\d+(\.\d+)?/g);
      return m ? "#" + m.slice(0, 3).map((v) => (+v).toString(16).padStart(2, "0")).join("") : c;
    };
    const out = {};
    for (const v of ["idle", "drag-over", "uploading", "uploaded", "error"]) {
      const host = document.querySelector(`[data-testid=variant-${v}]`);
      const boxes = {};
      for (const [k, sel] of Object.entries(selectors)) {
        const el = host.querySelector(sel);
        if (!el) continue;
        const b = el.getBoundingClientRect();
        boxes[k] = [b.x - root.x, b.y - root.y, b.width, b.height];
      }
      const q = (s) => host.querySelector(s);
      const cs = (s, p) => (q(s) ? hex(getComputedStyle(q(s))[p]) : null);
      const rect = q("[data-state] svg rect");
      out[v] = {
        boxes,
        colors: {
          "Dropzone bg": cs("[data-state]", "backgroundColor"),
          "Dropzone stroke": rect ? hex(getComputedStyle(rect).stroke) : null,
          "Dropzone stroke width": rect ? getComputedStyle(rect).strokeWidth : null,
          "Dropzone dash": rect ? getComputedStyle(rect).strokeDasharray : null,
          "Upload icon": cs("[class*=uploadIcon]", "backgroundColor"),
          "Prompt text": cs("[class*=prompt] > span", "color"),
          Prompt: cs("[class*=prompt]", "color"),
          "Browse link": cs("[class*=browse]", "color"),
          Hint: cs("[class*=hint]", "color"),
          Label: cs("label", "color"),
          "File row bg": cs("[class*=fileRow]", "backgroundColor"),
          "File row border": cs("[class*=fileRow]", "borderTopColor"),
          "File icon bg": cs("[class*=fileIcon]", "backgroundColor"),
          Progress: cs("[role=progressbar]", "backgroundColor"),
          Fill: cs("[class*=progressFill]", "backgroundColor"),
          Button: cs("[class*=iconButton]", "color"),
          "Status icon": cs("[class*=statusIcon]", "backgroundColor"),
          "File meta": cs("[class*=fileMeta]", "color"),
          "Error message": cs("[role=alert]", "color"),
        },
        maskLoaded: [...host.querySelectorAll("[class*=con]")]
          .filter((e) => getComputedStyle(e).maskImage !== "none")
          .every((e) => /url\(/.test(getComputedStyle(e).maskImage)),
      };
    }
    return out;
  }, { selectors });

  const report = [];
  for (const [variant, expected] of Object.entries(figma)) {
    for (const [key, want] of Object.entries(expected)) {
      const got = measured[variant].boxes[key];
      const tol = isText(key) ? 4 : 0.5;
      const ok = got && got.every((v, i) => Math.abs(v - want[i]) <= tol);
      if (!ok) failures++;
      report.push(`${ok ? "PASS" : "FAIL"}  ${variant.padEnd(10)} ${key.padEnd(14)} figma=${want.join(",")}  dom=${got ? got.map((v) => +v.toFixed(1)).join(",") : "missing"}`);
    }
    for (const [key, want] of Object.entries(colors[variant] ?? {})) {
      const got = measured[variant].colors[key];
      const ok = got === want;
      if (!ok) failures++;
      report.push(`${ok ? "PASS" : "FAIL"}  ${variant.padEnd(10)} color:${key.padEnd(16)} figma=${want}  dom=${got}`);
    }
    const c = measured[variant].colors;
    const dashOk = c["Dropzone dash"]?.replace(/px/g, "").replace(/,\s*/g, " ") === "6 4";
    const widthOk = c["Dropzone stroke width"] === (variant === "drag-over" ? "2px" : "1px");
    if (!dashOk || !widthOk) failures++;
    report.push(`${dashOk && widthOk ? "PASS" : "FAIL"}  ${variant.padEnd(10)} stroke         dash=${c["Dropzone dash"]} width=${c["Dropzone stroke width"]}`);
  }
  console.log(report.join("\n"));

  mkdirSync("tests/output", { recursive: true });
  await gallery.screenshot({ path: "tests/output/fileupload-gallery@2x.png" });
  await page.getByTestId("tabbar-frame").screenshot({ path: "tests/output/tabbar@2x.png" });

  // Real interaction: dragging a file over the live demo switches it to Drag over, dropping uploads it.
  const demoZone = page.getByTestId("fileupload-demo").locator("[data-state]");
  const dataTransfer = await page.evaluateHandle(() => {
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array(2048)], "notes.pdf", { type: "application/pdf" }));
    return dt;
  });
  await demoZone.dispatchEvent("dragenter", { dataTransfer });
  const during = await demoZone.getAttribute("data-state");
  await demoZone.dispatchEvent("drop", { dataTransfer });
  await page.getByTestId("fileupload-demo").getByText("2 KB · Uploaded").waitFor({ timeout: 5000 });
  const flowOk = during === "dragOver";
  if (!flowOk) failures++;
  console.log(`${flowOk ? "PASS" : "FAIL"}  demo       drag → drop → uploading → uploaded (state during drag: ${during})`);
  await page.getByTestId("fileupload-demo").screenshot({ path: "tests/output/fileupload-demo-after-upload@2x.png" });
} finally {
  await browser.close();
  process.kill(-server.pid);
}
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
