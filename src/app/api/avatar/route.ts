import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

const MAX_AVATAR_BYTES = 1024 * 1024; // 1MB
const MAX_AVATAR_DIMENSION = 400;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Reads width/height from the PNG IHDR chunk (bytes 16-23) without decoding the image.
function readPngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.type !== "image/png") {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dimensions = readPngDimensions(buffer);
  if (!dimensions) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }
  if (dimensions.width > MAX_AVATAR_DIMENSION || dimensions.height > MAX_AVATAR_DIMENSION) {
    return NextResponse.json({ error: "Image too large" }, { status: 400 });
  }

  const userId = Number(session.user.id);
  const updatedAt = new Date();

  db.update(users)
    .set({ avatarData: buffer, avatarMime: file.type, avatarUpdatedAt: updatedAt })
    .where(eq(users.id, userId))
    .run();

  return NextResponse.json({ avatarUpdatedAt: updatedAt.getTime() });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);

  db.update(users)
    .set({ avatarData: null, avatarMime: null, avatarUpdatedAt: null })
    .where(eq(users.id, userId))
    .run();

  return NextResponse.json({ ok: true });
}
