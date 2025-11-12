import { Router } from "express";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 12, fileSize: 20 * 1024 * 1024 },
});

async function yandexCreateFolder(path: string, token: string) {
  const url = `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `OAuth ${token}` },
  });
  if (!res.ok && res.status !== 409) {
    const t = await res.text();
    throw new Error(`Folder create failed: ${res.status} ${t}`);
  }
}

async function yandexGetUploadHref(path: string, token: string) {
  const url = `https://cloud-api.yandex.net/v1/disk/resources/upload?overwrite=true&path=${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    headers: { Authorization: `OAuth ${token}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Get href failed: ${res.status} ${t}`);
  }
  const data = (await res.json()) as { href: string };
  return data.href;
}

async function yandexPutFile(href: string, buffer: Buffer) {
  const res = await fetch(href, { method: "PUT", body: buffer });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Upload failed: ${res.status} ${t}`);
  }
}

router.post("/", upload.array("photos", 12), async (req, res) => {
  try {
    const token = process.env.YANDEX_DISK_TOKEN;
    if (!token) {
      return res
        .status(500)
        .json({ error: "YANDEX_DISK_TOKEN not configured on server" });
    }
    const parkName = String((req.body?.parkName || "").trim());
    const carNumber = String((req.body?.carNumber || "").trim());
    const comment = String((req.body?.comment || "").trim());
    const projectName = String((req.body?.projectName || "").trim());
    const driverPhone = String((req.body?.driverPhone || "").trim());
    const deliveredBy = String((req.body?.deliveredBy || "").trim());
    const oldWrapRemoved = String((req.body?.oldWrapRemoved || "").trim());
    const files = (req.files as Express.Multer.File[]) || [];

    if (!parkName || !carNumber) {
      return res
        .status(400)
        .json({ error: "parkName and carNumber are required" });
    }
    if (files.length < 5 || files.length > 12) {
      return res.status(400).json({ error: "Upload from 5 to 12 photos" });
    }

    const timestamp = new Date()
      .toISOString()
      .replaceAll(":", "-")
      .split(".")[0];
    const baseFolder = `${parkName}/${carNumber}/${timestamp}`;

    await yandexCreateFolder(baseFolder, token);

    let commentSaved = false;
    if (comment) {
      const commentHref = await yandexGetUploadHref(
        `${baseFolder}/Комментарий.txt`,
        token,
      );
      await yandexPutFile(commentHref, Buffer.from(comment, "utf8"));
      commentSaved = true;
    }

    if (projectName) {
      const projectHref = await yandexGetUploadHref(
        `${baseFolder}/Проект.txt`,
        token,
      );
      await yandexPutFile(projectHref, Buffer.from(projectName, "utf8"));
    }

    if (driverPhone) {
      const phoneHref = await yandexGetUploadHref(
        `${baseFolder}/Телефон водителя.txt`,
        token,
      );
      await yandexPutFile(phoneHref, Buffer.from(driverPhone, "utf8"));
    }

    if (deliveredBy) {
      const whoHref = await yandexGetUploadHref(
        `${baseFolder}/Кто пригнал.txt`,
        token,
      );
      await yandexPutFile(whoHref, Buffer.from(deliveredBy, "utf8"));
    }

    if (oldWrapRemoved) {
      const demHref = await yandexGetUploadHref(
        `${baseFolder}/Демонтаж старой плёнки.txt`,
        token,
      );
      const yesNo = /true/i.test(oldWrapRemoved) ? "Да" : "Нет";
      await yandexPutFile(demHref, Buffer.from(yesNo, "utf8"));
    }

    for (const f of files) {
      const remotePath = `${baseFolder}/${f.originalname}`;
      const href = await yandexGetUploadHref(remotePath, token);
      await yandexPutFile(href, f.buffer);
    }

    res.json({
      ok: true,
      folder: baseFolder,
      count: files.length,
      commentSaved,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

router.get("/list", async (req, res) => {
  try {
    const token = process.env.YANDEX_DISK_TOKEN;
    if (!token)
      return res
        .status(500)
        .json({ error: "YANDEX_DISK_TOKEN not configured on server" });

    const path = String(req.query.path ?? "").trim() || "disk:/";
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
    const offset = Math.max(0, Number(req.query.offset ?? 0));

    const params = new URLSearchParams({
      path,
      limit: String(limit),
      offset: String(offset),
      preview_size: "200x200",
      preview_crop: "true",
      fields:
        "name,path,type,_embedded.total,_embedded.items.name,_embedded.items.path,_embedded.items.type,_embedded.items.media_type,_embedded.items.preview,_embedded.items.size,_embedded.items.mime_type,_embedded.items.modified",
    });

    const url = `https://cloud-api.yandex.net/v1/disk/resources?${params.toString()}`;
    const r = await fetch(url, {
      headers: { Authorization: `OAuth ${token}` },
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: t });
    }
    const json = await r.json();
    const items = (json?._embedded?.items ?? []).map((it: any) => ({
      name: it.name as string,
      path: it.path as string,
      type: it.type as string,
      media_type: it.media_type as string | undefined,
      preview: it.preview as string | undefined,
      modified: it.modified as string | undefined,
      size: it.size as number | undefined,
    }));
    res.json({
      path: json.path ?? path,
      total: json?._embedded?.total ?? items.length,
      limit,
      offset,
      items,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

export const reportRouter = router;
