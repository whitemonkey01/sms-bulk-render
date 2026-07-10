# SMS-Web OTP Sender — Hugging Face Spaces

## Deploy Steps

1. Go to https://huggingface.co/spaces
2. Click **"Create new Space"**
3. Set **Space Name** (e.g. `sms-otp-sender`)
4. **Space SDK**: select **Docker**
5. **Docker Template**: **Blank**
6. **Space Hardware**: **CPU free** (do NOT select GPU — unnecessary)
7. Click **"Create Space"**
8. Upload all files from this folder to the Space:
   - `Dockerfile`
   - `.dockerignore`
   - `package.json`
   - `package-lock.json`
   - `server.js`
   - `README.md` (optional)

### Upload via terminal:
```bash
git init
git add .
git commit -m "initial"
git remote add space https://huggingface.co/spaces/YOUR_USERNAME/sms-otp-sender
git push --force space main
```

### Upload via web UI:
- Go to your Space → **"Files"** tab → **"Add file"** → upload all files.

## Usage

Once deployed (takes 5–10 min to build):

1. Open your Space URL: `https://YOUR_USERNAME-sms-otp-sender.hf.space`
2. Enter phone number, count, delay
3. Click **Run**

## Note

- Hugging Face Spaces free tier has **48h inactivity timeout** — after 48h without any visit, the Space hibernates.
- Use a free uptime monitor (UptimeRobot, Better Uptime, cron-job.org) pinging the URL every 5 min to prevent sleep.
- Even with uptime pings, cold starts take 10–30s.
