import { Router } from "express";
import crypto from "node:crypto";

const router = Router();

function checkTelegramInitData(initData: string, botToken: string) {
  const url = new URLSearchParams(initData);
  const hash = url.get("hash");
  if (!hash) return { ok: false, reason: "no-hash" } as const;

  const data: Record<string, string> = {};
  url.forEach((v, k) => {
    if (k !== "hash") data[k] = v;
  });
  const dataCheckString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join("\n");

  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const computed = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  return {
    ok: computed === hash,
    reason: computed === hash ? undefined : "bad-hash",
    data,
  } as const;
}

router.post("/verify", (req, res) => {
  const initData: string = String(req.body?.initData || "");
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token)
    return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not configured" });
  if (!initData) return res.status(400).json({ error: "initData required" });

  const result = checkTelegramInitData(initData, token);
  if (!result.ok) return res.status(401).json({ error: result.reason });
  return res.json({ ok: true, data: result.data });
});

export const telegramRouter = router;
