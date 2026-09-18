import { put } from "@vercel/blob";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readBody(req: VercelRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of req as AsyncIterable<Buffer | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Метод не поддерживается" });
  }

  try {
    const body = await readBody(req);
    if (!body.length) return res.status(400).json({ error: "Файл не передан" });

    const contentType = String(req.headers["content-type"] || "application/octet-stream");
    if (!contentType.startsWith("image/")) return res.status(415).json({ error: "Разрешены только изображения" });

    const rawName = String(req.headers["x-file-name"] || "photo");
    const filename = decodeURIComponent(rawName).replace(/[^a-zA-Z0-9а-яА-Я._-]/g, "-").slice(0, 120) || "photo";
    const blob = await put(`public-photos/${Date.now()}-${filename}`, body, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });

    return res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (error) {
    console.error("Blob upload failed", error);
    return res.status(500).json({ error: "Сервис хранения пока недоступен. Проверь BLOB_READ_WRITE_TOKEN в Vercel." });
  }
}
