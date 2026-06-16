import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { ratelimit } from "@/lib/ratelimit";

// Extension dérivée du type MIME validé (jamais du nom de fichier fourni par
// le client) pour éviter toute extension arbitraire ou traversée de chemin.
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  try {
    // Upload réservé aux utilisateurs authentifiés — sinon l'écriture de
    // fichiers (ou le renvoi base64) est ouverte à n'importe qui.
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    // Per-user rate limit to prevent disk/DB flooding via repeated uploads.
    const { success } = await ratelimit.limit(`upload:${session.user.id}`);
    if (!success) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans un instant." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const ext = MIME_EXT[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: `Format non supporté (${file.type}). Utilisez JPG, PNG, WebP ou GIF.` },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "L'image ne doit pas dépasser 10 Mo." },
        { status: 400 }
      );
    }

    const fileName = `${randomUUID()}.${ext}`;

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Decode and re-encode through sharp: this proves the bytes are a genuine
    // raster image (not an HTML/SVG polyglot disguised with an image MIME type)
    // and strips any embedded metadata or payload. The output format is forced
    // from the MIME-derived extension, never the client-supplied content-type.
    let buffer: Buffer;
    try {
      const pipeline = sharp(rawBuffer, { failOn: "error", animated: true }).rotate();
      switch (ext) {
        case "png":
          buffer = await pipeline.png().toBuffer();
          break;
        case "webp":
          buffer = await pipeline.webp().toBuffer();
          break;
        case "gif":
          buffer = await pipeline.gif().toBuffer();
          break;
        default:
          buffer = await pipeline.jpeg().toBuffer();
          break;
      }
    } catch {
      return NextResponse.json(
        { error: "Fichier image invalide ou corrompu." },
        { status: 400 }
      );
    }

    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), buffer);

      return NextResponse.json({ url: `/uploads/${fileName}` });
    } catch {
      // Fallback transparent si le système de fichiers est en lecture seule (Vercel serverless / EROFS)
      console.warn("Système de fichiers en lecture seule (Vercel EROFS). Conversion de l'image en Base64...");
      const base64 = buffer.toString("base64");
      const mimeType = file.type || "image/webp";
      return NextResponse.json({ url: `data:${mimeType};base64,${base64}` });
    }
  } catch (error) {
    console.error("UPLOAD API EXCEPTION:", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur d'écriture sur le serveur : ${message}` },
      { status: 500 }
    );
  }
}
