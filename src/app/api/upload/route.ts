import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
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

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${randomUUID()}.${ext}`;
    
    // Safe buffer conversion for Node.js environment
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    return NextResponse.json({ url: `/uploads/${fileName}` });
  } catch (error: any) {
    console.error("UPLOAD API EXCEPTION:", error);
    return NextResponse.json(
      { error: `Erreur d'écriture sur le serveur : ${error?.message || "Erreur inconnue"}` },
      { status: 500 }
    );
  }
}
