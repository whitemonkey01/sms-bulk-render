const express = require("express");
const app = express();
const PORT = process.env.PORT || 7860;

app.use(express.urlencoded({ extended: true }));

const https = require("https");

function sendMedEasy(phone) {
  const formatted = `+880${phone.slice(-10)}`;
  return new Promise((resolve) => {
    https.get(`https://api.medeasy.health/api/send-otp/${formatted}/`, { headers: { Accept: "application/json" } }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve(res.statusCode >= 200 && res.statusCode < 300 ? "DONE" : `HTTP ${res.statusCode}`));
    }).on("error", (e) => resolve(e.message.split("\n")[0]));
  });
}

function sendRedX(phone) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ phoneNumber: phone });
    const req = https.request("https://api.redx.com.bd/v1/merchant/registration/generate-registration-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": data.length },
    }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve(res.statusCode >= 200 && res.statusCode < 300 ? "DONE" : `HTTP ${res.statusCode}`));
    });
    req.on("error", (e) => resolve(e.message.split("\n")[0]));
    req.write(data);
    req.end();
  });
}

function sendBDTickets(phone) {
  return (async () => {
    try {
      const deviceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const body = JSON.stringify({ device_id: deviceId, device_type: "desktop" });
      const tokenRes = await fetch("https://apiv1.bdtickets.com/api/v1/auth/anonymous", { method: "POST", body, headers: { "Content-Type": "application/json" } });
      const token = (await tokenRes.json()).access_token || "";
      if (!token) return "no token";
      const otpRes = await fetch("https://apiv1.bdtickets.com/api/v1/auth/otp/send", { method: "POST", body: JSON.stringify({ phone: `+880${phone.slice(-10)}` }), headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-platform": "web", "x-channel": "direct" } });
      return otpRes.ok ? "DONE" : `HTTP ${otpRes.status}`;
    } catch (e) {
      return e.message.split("\n")[0];
    }
  })();
}

const browserSites = [
  {
    name: "Arogga", url: "https://www.arogga.com/account",
    steps: [
      { action: "wait", ms: 2000 },
      { action: "click", selector: 'button:has-text("Login")' },
      { action: "wait", ms: 2000 },
      { action: "fill", selector: 'input[placeholder="Enter phone number"]' },
      { action: "wait", ms: 500 },
      { action: "click", selector: 'button:has-text("Send")' },
      { action: "wait", ms: 2000 },
    ],
  },
  {
    name: "IqraLive", url: "https://iqra-live.com/",
    steps: [
      { action: "fill", selector: "#mobile" },
      { action: "wait", ms: 500 },
      { action: "click", selector: 'button:has-text("Sign In")' },
      { action: "wait", ms: 2000 },
    ],
  },
  {
    name: "Apex4u", url: "https://apex4u.com/sign-in",
    steps: [
      { action: "wait", ms: 5000 },
      { action: "fill", selector: 'input.form-field' },
      { action: "wait", ms: 500 },
      { action: "click", selector: '[data-testid="proceed-button"]' },
      { action: "wait", ms: 2000 },
    ],
  },
  {
    name: "MedEasy", url: "https://medeasy.health/",
    steps: [
      { action: "wait", ms: 3000 },
      { action: "click", selector: 'text=Sign In' },
      { action: "wait", ms: 3000 },
      { action: "fill", selector: 'input[name="phone"]' },
      { action: "wait", ms: 500 },
      { action: "click", selector: 'button:has-text("Send OTP")' },
      { action: "wait", ms: 2000 },
    ],
  },
  {
    name: "Chorki", url: "https://www.chorki.com/login",
    steps: [
      { action: "wait", ms: 5000 },
      { action: "wait_turnstile" },
      { action: "fill_phone", selector: 'input.react-international-phone-input' },
      { action: "check", selector: 'input[name="userConsent"]' },
      { action: "wait", ms: 500 },
      { action: "click", selector: 'button[type="submit"]' },
      { action: "wait", ms: 3000 },
    ],
  },
  {
    name: "Robi", url: "https://www.robi.com.bd/en/auth/login",
    steps: [
      { action: "wait", ms: 5000 },
      { action: "robi" },
      { action: "wait", ms: 4000 },
    ],
  },
  {
    name: "MyGov", url: "https://idp-v2.live.mygov.bd/registration", waitUntil: "domcontentloaded",
    steps: [
      { action: "wait", ms: 3000 },
      { action: "fill", selector: 'input[name="citizen_name"]', value: "Test User" },
      { action: "wait", ms: 500 },
      { action: "fill", selector: 'input#mobile' },
      { action: "wait", ms: 500 },
      { action: "click", selector: 'button[type="submit"]' },
      { action: "wait", ms: 3000 },
    ],
  },
  {
    name: "Sailor", url: "https://sailor.clothing/login",
    steps: [
      { action: "wait", ms: 3000 },
      { action: "click", selector: 'button:has-text("registration")' },
      { action: "wait", ms: 1000 },
      { action: "fill", selector: 'input[placeholder="01XXXXXXXXX"]' },
      { action: "wait", ms: 300 },
      { action: "fill_rnd", selector: 'input[placeholder="Enter email address (example@example.com)"]', prefix: "sailor_", suffix: "@mail.com" },
      { action: "wait", ms: 300 },
      { action: "fill", selector: 'input[placeholder="Enter Password"]', value: "Test1234" },
      { action: "wait", ms: 300 },
      { action: "fill", selector: 'input[placeholder="Enter confirm-password"]', value: "Test1234" },
      { action: "wait", ms: 300 },
      { action: "click", selector: 'button:has-text("create account")' },
      { action: "wait", ms: 3000 },
    ],
  },
  {
    name: "LeraveCraze", url: "https://www.lerevecraze.com/login/",
    steps: [
      { action: "wait", ms: 3000 },
      { action: "fill", selector: "input#account_display_name" },
      { action: "wait", ms: 500 },
      { action: "click", selector: "input#lrv-login-btn" },
      { action: "wait", ms: 3000 },
    ],
  },
  {
    name: "Othoba", url: "https://othoba.com/register?returnUrl=%2F", waitUntil: "domcontentloaded",
    steps: [
      { action: "wait", ms: 4000 },
      { action: "fill", selector: "input#Phone" },
      { action: "wait", ms: 300 },
      { action: "fill_rnd", selector: "input#Email", prefix: "oth_", suffix: "@mail.com" },
      { action: "wait", ms: 300 },
      { action: "fill", selector: "input#FirstName", value: "Test" },
      { action: "wait", ms: 300 },
      { action: "fill", selector: "input#LastName", value: "User" },
      { action: "wait", ms: 300 },
      { action: "click", selector: 'label:has-text("Male")' },
      { action: "wait", ms: 300 },
      { action: "select", selector: 'select[name="DateOfBirthDay"]', value: "15" },
      { action: "wait", ms: 200 },
      { action: "select", selector: 'select[name="DateOfBirthMonth"]', value: "6" },
      { action: "wait", ms: 200 },
      { action: "select", selector: 'select[name="DateOfBirthYear"]', value: "1995" },
      { action: "wait", ms: 300 },
      { action: "fill", selector: "input#Password", value: "Test1234" },
      { action: "wait", ms: 300 },
      { action: "fill", selector: "input#ConfirmPassword", value: "Test1234" },
      { action: "wait", ms: 300 },
      { action: "click", selector: "button#register-button" },
      { action: "wait", ms: 5000 },
    ],
  },
  {
    name: "PizzaHutBD", url: "https://www.pizzahutbd.com/customer/login",
    steps: [
      { action: "wait", ms: 3000 },
      { action: "fill", selector: "input#locationInput", value: "Gulshan 1" },
      { action: "wait", ms: 1500 },
      { action: "click", selector: ".pac-item" },
      { action: "wait", ms: 1000 },
      { action: "click", selector: "button.confirm-btn" },
      { action: "wait", ms: 4000 },
      { action: "goto", url: "https://www.pizzahutbd.com/customer/login" },
      { action: "wait", ms: 3000 },
      { action: "fill", selector: "input#full_name", value: "User" },
      { action: "fill", selector: "input#phone" },
      { action: "wait", ms: 500 },
      { action: "click", selector: 'button:has-text("Sign In")' },
      { action: "wait", ms: 5000 },
    ],
  },
  {
    name: "Kimi", url: "https://www.kimi.com/login", waitUntil: "domcontentloaded",
    steps: [
      { action: "wait", ms: 8000 },
      { action: "click", selector: 'input[placeholder="+86"]' },
      { action: "wait", ms: 500 },
      { action: "click", selector: 'span:has-text("+880")' },
      { action: "wait", ms: 500 },
      { action: "fill", selector: 'input[placeholder="Phone number"]' },
      { action: "wait", ms: 500 },
      { action: "click", selector: 'button:has-text("Send Code")' },
      { action: "wait", ms: 3000 },
    ],
  },
  {
    name: "Ostad", url: "https://ostad.app/login",
    steps: [
      { action: "wait", ms: 3000 },
      { action: "click", selector: '.cursor-pointer.py-2.px-3:nth-of-type(2)' },
      { action: "wait", ms: 1000 },
      { action: "fill", selector: 'input[type="number"]' },
      { action: "wait", ms: 500 },
      { action: "click", selector: 'button[type="submit"]' },
      { action: "wait", ms: 3000 },
    ],
  },
  {
    name: "Bishworang", url: "https://www.bishworang.com.bd/login",
    steps: [
      { action: "wait", ms: 3000 },
      { action: "bishworang_forgot" },
      { action: "wait", ms: 3000 },
    ],
  },
  {
    name: "Ilyn", url: "https://ilyn.global/bd/en/auth/forgot-password", waitUntil: "domcontentloaded",
    steps: [
      { action: "wait", ms: 6000 },
      { action: "ilyn_forgot" },
      { action: "wait", ms: 5000 },
    ],
  },
];

const apiSites = [
  { name: "MedEasy-API", fn: sendMedEasy },
  { name: "RedX-API", fn: sendRedX },
  { name: "BDTickets-API", fn: sendBDTickets },
];

const { chromium } = require("playwright");

let browser;
let browserReady = false;

async function runSite(site, phone) {
  let ctx;
  try {
    ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(site.url, { waitUntil: site.waitUntil || "networkidle", timeout: 60000 });
    for (const step of site.steps) {
      if (step.action === "fill") {
        await page.waitForSelector(step.selector, { timeout: 30000 });
        const val = step.value || phone;
        await page.fill(step.selector, val);
      } else if (step.action === "click") {
        await page.waitForSelector(step.selector, { timeout: 30000 });
        await page.click(step.selector);
      } else if (step.action === "wait") {
        await page.waitForTimeout(step.ms);
      } else if (step.action === "check") {
        await page.waitForSelector(step.selector, { timeout: 30000 });
        await page.check(step.selector);
      } else if (step.action === "fill_phone") {
        await page.waitForSelector(step.selector, { timeout: 30000 });
        await page.fill(step.selector, `+880${phone.slice(-10)}`);
      } else if (step.action === "wait_turnstile") {
        await page.waitForTimeout(5000);
        try { await page.waitForFunction(() => { const el = document.querySelector('input[name="cf-turnstile-response"]'); return el && el.value && el.value.length > 0; }, { timeout: 20000 }); } catch {}
      } else if (step.action === "goto") {
        await page.goto(step.url, { waitUntil: "networkidle", timeout: 30000 });
      } else if (step.action === "fill_rnd") {
        await page.waitForSelector(step.selector, { timeout: 30000 });
        const val = `${step.prefix || ""}${Date.now()}${step.suffix || ""}`;
        await page.fill(step.selector, val);
      } else if (step.action === "select") {
        await page.waitForSelector(step.selector, { timeout: 30000 });
        await page.selectOption(step.selector, step.value);
      } else if (step.action === "bishworang_forgot") {
        await page.evaluate((phone) => {
          const a = document.querySelector("a.forget-pass");
          if (a) a.click();
          setTimeout(() => {
            const inp = document.querySelector(".forgot-pass-modal input");
            if (inp) { inp.value = phone; inp.dispatchEvent(new Event("input", { bubbles: true })); }
            setTimeout(() => {
              const btn = document.querySelector(".forgot-pass-modal .send-btn");
              if (btn) btn.click();
            }, 500);
          }, 1000);
        }, phone);
      } else if (step.action === "ilyn_forgot") {
        await page.evaluate((phone) => {
          const inp = document.querySelector('input[type="text"]');
          if (!inp) return;
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          nativeSetter.call(inp, phone);
          inp.dispatchEvent(new Event("input", { bubbles: true }));
          inp.dispatchEvent(new Event("change", { bubbles: true }));
          setTimeout(() => {
            const btn = document.querySelector('button[type="submit"]');
            if (btn && !btn.disabled) btn.click();
          }, 500);
        }, phone);
      } else if (step.action === "robi") {
        await page.evaluate((phone) => {
          const accept = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Accept Cookies"));
          if (accept) accept.click();
          setTimeout(() => { const bd = document.querySelector(".MuiBackdrop-root"); if (bd) bd.click(); }, 500);
          setTimeout(() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Log In")); if (btn) btn.click(); }, 1500);
          setTimeout(() => {
            const input = document.querySelector('input[aria-label="mobile-number"]');
            if (!input) return;
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            nativeSetter.call(input, phone);
            input.dispatchEvent(new Event("input", { bubbles: true }));
            const sendBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Send OTP"));
            if (sendBtn && !sendBtn.disabled) sendBtn.click();
          }, 3500);
        }, phone);
      }
    }
    return { name: site.name, status: "DONE" };
  } catch (err) {
    return { name: site.name, status: "FAILED", error: err.message.split("\n")[0] };
  } finally {
    if (ctx) await ctx.close();
  }
}

async function run(phone, count, delay) {
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r("__TIMEOUT__"), ms))]);

  const disabled = loadDisabled();
  const enabledBrowser = browserSites.filter(s => !disabled.includes(s.name));
  const enabledApi = apiSites.filter(s => !disabled.includes(s.name));

  async function runApiSite(site) {
    const v = await withTimeout(site.fn(phone), 15000);
    if (v === "__TIMEOUT__") return { name: site.name, status: "FAILED", error: "timed out" };
    const status = v === "DONE" ? "DONE" : v.startsWith("HTTP") ? v : "FAILED";
    const error = v !== "DONE" && !v.startsWith("HTTP") ? v : undefined;
    return { name: site.name, status, error };
  }

  async function runBrowserSite(site) {
    const v = await withTimeout(runSite(site, phone), 60000);
    if (v === "__TIMEOUT__") return { name: site.name, status: "FAILED", error: "timed out" };
    return v;
  }

  const CONCURRENCY = process.env.FLY_MACHINE_ID ? 5 : 1;

  for (let i = 0; i < count; i++) {
    console.log(`[${i + 1}/${count}]`);

    await Promise.all([
      (async () => {
        const queue = enabledBrowser.slice();
        async function worker() {
          while (queue.length) {
            const site = queue.shift();
            const r = await runBrowserSite(site);
            console.log(`  [${r.name}] ${r.status}${r.error ? " - " + r.error : ""}`);
          }
        }
        await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
      })(),
      ...enabledApi.map(async site => {
        const r = await runApiSite(site);
        console.log(`  [${r.name}] ${r.status}${r.error ? " - " + r.error : ""}`);
      }),
    ]);

    if (i < count - 1 && delay > 0) {
      console.log(`  Waiting ${delay}s ...`);
      await new Promise((r) => setTimeout(r, delay * 1000));
    }
  }
}

const fs = require("fs");
const CONFIG_PATH = process.env.SMS_WEB_CONFIG || "/app/config.json";

let lastResults = [];

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")); } catch { return {}; }
}

function saveConfig(data) {
  try {
    const dir = require("path").dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const existing = loadConfig();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, ...data }, null, 2));
  } catch {}
}

function loadDisabled() {
  return loadConfig().disabled || [];
}

function saveDisabled(list) {
  saveConfig({ disabled: [...new Set(list)] });
}

const allSites = [
  ...browserSites.map(s => s.name),
  ...apiSites.map(s => s.name),
];

function htmlPage(title, body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:sans-serif;max-width:700px;margin:20px auto;padding:0 10px}h1{font-size:20px}.site{display:flex;align-items:center;padding:6px 0;border-bottom:1px solid #eee}.site form{margin:0}.site button{padding:4px 12px;border:1px solid #ccc;border-radius:4px;cursor:pointer;background:#fff}.site .name{flex:1}.site .status{font-size:12px;color:#666;margin-right:10px}.enabled{color:#090}.disabled{color:#c00}form.main{margin:20px 0}form.main input{padding:6px;font-size:14px;width:200px}form.main button{padding:6px 20px;font-size:14px;background:black;color:white;border:none;border-radius:4px;cursor:pointer}pre{font-size:12px}</style></head><body>${body}</body></html>`;
}

app.get("/status", (req, res) => {
  res.json({ browserReady, browser: !!browser });
});

app.get("/", (req, res) => {
  const disabled = loadDisabled();
  const lastRun = lastResults.length ? `<h2>Last Run</h2><pre>${lastResults.join("\n")}</pre>` : "";
  const siteRows = allSites.map(name => {
    const isDisabled = disabled.includes(name);
    return `<div class="site"><span class="name">${name}</span><span class="status ${isDisabled ? 'disabled' : 'enabled'}">[${isDisabled ? 'DISABLED' : 'ENABLED'}]</span><form method="POST" action="/toggle"><input type="hidden" name="name" value="${name}"><button type="submit">${isDisabled ? 'Enable' : 'Disable'}</button></form></div>`;
  }).join("");

  res.send(htmlPage("SMS-Web OTP", `
    <h1>SMS-Web OTP Sender</h1>
    <form class="main" method="POST" action="/">
      <input name="phone" placeholder="017XXXXXXXX" value="01775777774">
      <input name="count" value="1" style="width:50px">
      <input name="delay" value="3" style="width:50px">
      <button type="submit">Run</button>
    </form>
    ${lastRun}
    <hr>
    <h2>Sites</h2>
    ${siteRows}
  `));
});

app.post("/toggle", (req, res) => {
  const name = req.body.name;
  if (!name) return res.redirect("/");
  let disabled = loadDisabled();
  if (disabled.includes(name)) {
    disabled = disabled.filter(n => n !== name);
  } else {
    disabled.push(name);
  }
  saveDisabled(disabled);
  res.redirect("/");
});

app.post("/", async (req, res) => {
  const phone = req.body.phone;
  const count = parseInt(req.body.count) || 1;
  const delay = parseInt(req.body.delay) || 3;
  if (!phone) return res.status(400).send("Phone required");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.write(`<pre style="font-family:monospace;background:#f5f5f5;padding:20px;border-radius:8px">`);

  const origLog = console.log;
  const lines = [];
  console.log = (...args) => {
    const line = args.join(" ");
    lines.push(line);
    res.write(line + "\n");
    origLog.apply(console, args);
  };

  if (!browser) {
    res.write(!browserReady ? "Chromium is still launching, try again in a moment...\n" : "Chromium failed to launch\n");
    res.write(`</pre><br><a href="/">Back</a>`);
    res.end();
    return;
  }

  try {
    await Promise.race([
      run(phone, count, delay),
      new Promise((_, r) => setTimeout(r, 180000, new Error("Global timeout"))),
    ]);
  } catch (e) {
    const err = "ERROR: " + e.message.split("\n")[0];
    lines.push(err);
    res.write(err + "\n");
    origLog(err);
  }

  console.log = origLog;
  lastResults = lines;
  saveConfig({ lastResults: lines });
  res.write(`</pre><br><a href="/">Back</a>`);
  res.end();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Launching Chromium...");
  console.log("PLAYWRIGHT_BROWSERS_PATH:", process.env.PLAYWRIGHT_BROWSERS_PATH || "(not set)");
  const launchOpts = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--js-flags=--max-old-space-size=256",
      "--disable-gpu",
      "--disable-accelerated-2d-canvas",
      "--disable-component-update",
      "--no-first-run",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-sync",
      "--disable-translate",
      "--hide-scrollbars",
      "--mute-audio",
      "--disable-extensions",
    ],
  };
  console.log("Launch opts:", JSON.stringify(launchOpts));
  chromium.launch(launchOpts).then(b => {
    browser = b;
    browserReady = true;
    console.log("Chromium ready");
  }).catch(e => {
    console.error("Chromium launch failed:", e.message);
    console.error("Chromium launch stack:", e.stack);
  });
});
