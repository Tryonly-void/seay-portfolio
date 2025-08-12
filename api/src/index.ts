import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import axios from "axios";
import PocketBase from "pocketbase";
import { env } from "./env.js";

const app = express();
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: env.ALLOWED_ORIGIN, credentials: false }));

const limiter = rateLimit({ windowMs: env.RATE_WINDOW_SECONDS * 1000, max: env.RATE_MAX, standardHeaders: true, legacyHeaders: false });
app.use("/contact", limiter);
app.use("/newsletter", limiter);

const pb = new PocketBase(env.PB_URL);

async function verifyRecaptcha(token: string) {
  if (!env.RECAPTCHA_SECRET) return true; // allow if not configured
  const params = new URLSearchParams({ secret: env.RECAPTCHA_SECRET, response: token });
  const { data } = await axios.post("https://www.google.com/recaptcha/api/siteverify", params);
  return Boolean(data?.success);
}

app.post("/contact", async (req, res) => {
  try {
    const { name, email, message, captchaToken } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: "Missing fields" });
    if (!(await verifyRecaptcha(captchaToken))) return res.status(400).json({ error: "Captcha failed" });

    const record = await pb.collection("contact_messages").create({ name, email, message, read: false });
    res.json({ ok: true, id: record.id });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
});

app.post("/newsletter", async (req, res) => {
  try {
    const { email, captchaToken } = req.body || {};
    if (!email) return res.status(400).json({ error: "Missing email" });
    if (!(await verifyRecaptcha(captchaToken))) return res.status(400).json({ error: "Captcha failed" });

    // upsert by email
    const existing = await pb.collection("newsletter_subscribers").getFirstListItem(`email="${email}"`).catch(() => null);
    if (existing) {
      res.json({ ok: true, id: existing.id, info: "already" });
      return;
    }
    const rec = await pb.collection("newsletter_subscribers").create({ email });
    res.json({ ok: true, id: rec.id });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
});

app.listen(env.PORT, () => console.log(`[api] listening on :${env.PORT}`));