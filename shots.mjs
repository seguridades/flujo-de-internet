import { chromium } from "playwright";

const URL = "http://localhost:5176/";
const OUT = "/tmp/sim-shots";
import { mkdirSync } from "fs";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(URL, { waitUntil: "networkidle" });
await page.getByText("Auto-Armado").click();
await page.waitForTimeout(600);

const modes = ["Básico", "HTTPS", "E2EE", "VPN"];
for (const m of modes) {
  // El selector de modos está abajo; el botón muestra el label.
  await page.locator("button", { hasText: new RegExp(`^${m}$`, "i") }).first().click();
  await page.waitForTimeout(700);
  const file = `${OUT}/mode-${m.replace(/[^a-z]/gi, "").toLowerCase()}.png`;
  await page.screenshot({ path: file });
  console.log("saved", file);
}

console.log("CONSOLE_ERRORS:", errors.length ? errors.join(" | ") : "none");
await browser.close();
