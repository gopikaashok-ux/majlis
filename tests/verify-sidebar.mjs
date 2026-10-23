// Renders the built demo in Chromium and checks the Sidebar (Glass, Expanded + Collapsed)
// against geometry and colours read from Figma frame 1501:4459.
// Usage: npm run build && node tests/verify-sidebar.mjs
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

// [x, y, w, h] relative to the "Left nav" frame, exported from Figma.
const figma = {
  expanded: {
    sidebar: [60, 54, 256, 760], brand: [77, 71, 222, 44], logo: [77, 71, 32, 32], brandName: [117, 77, 142, 20],
    toggle: [267, 71, 32, 32], "item:Overview": [77, 123, 222, 46], "item:Documents": [77, 173, 222, 44],
    "icon:Documents": [89, 185, 20, 20], "item:Analytics": [77, 221, 222, 44], "icon:Analytics": [89, 233, 20, 20],
    "item:Insights": [77, 269, 222, 44], "item:Plans": [77, 317, 222, 44], divider: [77, 369, 222, 1],
    "item:Team": [77, 378, 222, 44], "icon:Team": [89, 390, 20, 20], "item:Integrations": [77, 426, 222, 44],
    "item:Settings": [77, 474, 222, 44], "icon:Settings": [89, 486, 20, 20], badge: [244, 233, 43, 20],
    profile: [77, 731, 222, 66], avatar: [90, 744, 40, 40], profileName: [142, 747, 85, 18],
    profilePlan: [142, 765, 59, 16], profileChevron: [266, 754, 20, 20],
  },
  collapsed: {
    sidebar: [356, 54, 72, 760], brand: [376, 71, 32, 84], logo: [376, 71, 32, 32], toggle: [376, 111, 32, 32],
    "item:Overview": [372, 163, 40, 40], "item:Documents": [372, 207, 40, 40], "icon:Documents": [382, 217, 20, 20],
    "item:Analytics": [372, 251, 40, 40], "item:Insights": [372, 295, 40, 40], "item:Plans": [372, 339, 40, 40],
    divider: [373, 387, 38, 1], "item:Team": [372, 396, 40, 40], "item:Integrations": [372, 440, 40, 40],
    "item:Settings": [372, 484, 40, 40], "icon:Settings": [382, 494, 20, 20], avatar: [372, 757, 40, 40],
  },
};
const isText = (k) => ["brandName", "badge", "profileName", "profilePlan"].includes(k);

const port = 4181;
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
  const gallery = page.getByTestId("sidebar-gallery");
  await gallery.scrollIntoViewIfNeeded();

  const measure = () =>
    page.evaluate(() => {
      const root = document.querySelector("[data-testid=sidebar-gallery]").getBoundingClientRect();
      const rel = (el) => {
        const b = el.getBoundingClientRect();
        return [b.x - root.x, b.y - root.y, b.width, b.height];
      };
      const out = {};
      for (const mode of ["expanded", "collapsed"]) {
        const nav = document.querySelector(`[data-testid=sidebar-${mode}] nav`);
        const q = (s) => nav.querySelector(s);
        const boxes = {
          sidebar: rel(nav), brand: rel(q("[class*=brand]")), logo: rel(q("[class*=logo]")),
          toggle: rel(q("[class*=toggle]")), divider: rel(q("hr")),
        };
        if (q("[class*=brandName]")) boxes.brandName = rel(q("[class*=brandName]"));
        for (const item of nav.querySelectorAll("[class*=item]:is(a,button)")) {
          const name = item.getAttribute("aria-label") || item.querySelector("[class*=label]").textContent;
          boxes[`item:${name}`] = rel(item);
          boxes[`icon:${name}`] = rel(item.querySelector("[class*=icon20]"));
        }
        if (q("[class*=badge]")) boxes.badge = rel(q("[class*=badge]"));
        if (q("[class*=profile]")) {
          boxes.profile = rel(q("[class*=profile]"));
          boxes.profileName = rel(q("[class*=userName]"));
          boxes.profilePlan = rel(q("[class*=userPlan]"));
          boxes.profileChevron = rel(q("[class*=profile] > [class*=icon20]"));
        }
        boxes.avatar = rel(q("[class*=avatar]:not([class*=avatarButton])"));
        out[mode] = boxes;
      }
      return out;
    });

  const measured = await measure();
  for (const [mode, expected] of Object.entries(figma)) {
    for (const [key, want] of Object.entries(expected)) {
      const got = measured[mode][key];
      const tol = isText(key) ? 4 : 0.5;
      const ok = got && got.every((v, i) => Math.abs(v - want[i]) <= tol);
      check(ok, `${mode.padEnd(9)} ${key.padEnd(18)} figma=${want.join(",")}  dom=${got ? got.map((v) => +v.toFixed(1)).join(",") : "missing"}`);
    }
  }

  // Colours / effects resolved from the Figma variables.
  const styleOf = (sel, props) =>
    page.locator(sel).first().evaluate((el, props) => {
      const cs = getComputedStyle(el);
      return Object.fromEntries(props.map((p) => [p, cs[p]]));
    }, props);
  const exp = "[data-testid=sidebar-expanded] nav";
  const expect = async (label, sel, wants) => {
    const got = await styleOf(sel, Object.keys(wants));
    for (const [prop, want] of Object.entries(wants)) {
      const ok = want instanceof RegExp ? want.test(got[prop]) : got[prop] === want;
      check(ok, `style     ${label.padEnd(22)} ${prop}=${got[prop]}${ok ? "" : `  (want ${want})`}`);
    }
  };
  await expect("sidebar (glass)", exp, {
    backgroundColor: "rgba(255, 255, 255, 0.6)", borderTopColor: "rgba(255, 255, 255, 0.4)",
    borderTopLeftRadius: "16px", backdropFilter: "blur(12px)",
  });
  await expect("logo gradient", `${exp} [class*=logo]`, {
    backgroundImage: "linear-gradient(120deg, rgb(77, 184, 148) 0%, rgb(15, 163, 163) 50%, rgb(196, 231, 143) 100%)",
    color: "rgb(255, 255, 255)",
  });
  await expect("brand name", `${exp} [class*=brandName]`, { color: "rgb(42, 48, 46)", fontWeight: "700", fontSize: "16px" });
  await expect("toggle icon", `${exp} [class*=toggle]`, { color: "rgb(93, 103, 99)" });
  await expect("item Active", `${exp} [aria-current=page]`, {
    color: "rgb(9, 102, 70)", fontWeight: "600", backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderTopColor: "rgba(255, 255, 255, 0.4)", borderTopLeftRadius: "12px",
    boxShadow: "rgba(42, 48, 46, 0.1) 0px 4px 8px -2px, rgba(42, 48, 46, 0.06) 0px 2px 4px -2px",
  });
  await expect("item Default", `${exp} ul:first-of-type li:nth-child(2) button`, {
    color: "rgb(93, 103, 99)", fontWeight: "500", backgroundColor: "rgba(0, 0, 0, 0)", boxShadow: "none",
  });
  await expect("badge", `${exp} [class*=badge]`, { backgroundColor: "rgb(228, 238, 254)", color: "rgb(38, 83, 157)", fontWeight: "600" });
  await expect("divider", `${exp} hr`, { backgroundColor: "rgb(215, 218, 217)" });
  await expect("profile", `${exp} [class*=profile]`, { backgroundColor: "rgba(255, 255, 255, 0.6)", borderTopColor: "rgba(255, 255, 255, 0.4)" });
  await expect("avatar", `${exp} [class*=avatar]`, { backgroundColor: "rgb(221, 242, 235)", color: "rgb(9, 102, 70)" });

  // State=Hover on a default item.
  const documents = page.locator(`${exp} ul:first-of-type li:nth-child(2) button`);
  await documents.hover();
  await expect("item Hover", `${exp} ul:first-of-type li:nth-child(2) button`, {
    backgroundColor: "rgba(255, 255, 255, 0.6)", color: "rgb(42, 48, 46)",
  });
  mkdirSync("tests/output", { recursive: true });
  await gallery.screenshot({ path: "tests/output/sidebar-gallery-hover@2x.png" });
  await page.mouse.move(0, 0);
  await gallery.screenshot({ path: "tests/output/sidebar-gallery@2x.png" });

  // Interaction on the live demo: navigate, collapse, expand.
  const demo = page.getByTestId("sidebar-demo");
  const demoNav = demo.locator("nav");
  await demoNav.getByRole("button", { name: "Insights" }).click();
  const activeText = await page.getByTestId("sidebar-demo-active").textContent();
  const insightsCurrent = await demoNav.getByRole("button", { name: "Insights" }).getAttribute("aria-current");
  check(activeText === "insights" && insightsCurrent === "page", `demo      click Insights -> active=${activeText}, aria-current=${insightsCurrent}`);
  await demoNav.getByRole("button", { name: "Collapse sidebar" }).click();
  const collapsedWidth = (await demoNav.boundingBox()).width;
  check(collapsedWidth === 72, `demo      collapse -> width=${collapsedWidth}`);
  await demoNav.getByRole("button", { name: "Expand sidebar" }).click();
  const expandedWidth = (await demoNav.boundingBox()).width;
  check(expandedWidth === 256, `demo      expand -> width=${expandedWidth}`);
} finally {
  await browser.close();
  process.kill(-server.pid);
}
console.log(report.join("\n"));
console.log(failures ? `\n${failures} check(s) failed` : `\nAll ${report.length} checks passed`);
process.exit(failures ? 1 : 0);
