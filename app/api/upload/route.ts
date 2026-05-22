import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, and WEBP files are allowed" },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const originalExtension = path.extname(file.name) || "";
  const buffer = Buffer.from(await file.arrayBuffer());

  let outBuffer = buffer;
  let extension = originalExtension || ".jpg";

  if (file.type !== "image/svg+xml") {
    try {
      const sharpModule = await import("sharp");
      const sharp = sharpModule.default || sharpModule;
      outBuffer = await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      extension = ".webp";
    } catch (err) {
      // If sharp isn't available or fails, fall back to original buffer
      outBuffer = buffer;
      extension = originalExtension || ".jpg";
    }
  } else {
    // SVG: preserve original
    outBuffer = buffer;
    extension = originalExtension || ".svg";
  }

  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const filePath = path.join(uploadsDir, fileName);

  await writeFile(filePath, outBuffer);

  return NextResponse.json({ url: `/uploads/${fileName}` });
}
