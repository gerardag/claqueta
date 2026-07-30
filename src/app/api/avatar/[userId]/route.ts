import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const userId = Number((await params).userId);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = db
    .select({ avatarData: users.avatarData, avatarMime: users.avatarMime })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user?.avatarData || !user.avatarMime) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(user.avatarData), {
    headers: {
      "Content-Type": user.avatarMime,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
