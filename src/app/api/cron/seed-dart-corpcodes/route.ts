import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isCronAuthorized } from "@/lib/cronAuth";
import { fetchListedCorpCodes } from "@/lib/dart/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One-time/occasional refresh of the listed-company corp code table used to
// match Kakao place names to real DART employee data. Bounded to listed
// companies only (a few thousand rows), so this is safe to run in one
// request. Not registered in vercel.json — run manually after deploy and
// occasionally thereafter (DART_API_KEY required; without it this 401s the
// same as the other Kakao/MOLIT-key-gated routes would).
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const entries = await fetchListedCorpCodes();

    // Reference data with a stable identity (corpCode) and no incoming FK
    // references — a full replace via bulk createMany is far faster than
    // thousands of individual upserts (which was timing out on Hobby's 60s
    // cap: one query round-trip per row vs. one per few thousand rows).
    const BATCH_SIZE = 5000;
    await prisma.$transaction(async (tx) => {
      await tx.dartCorpCode.deleteMany({});
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);
        await tx.dartCorpCode.createMany({ data: batch, skipDuplicates: true });
      }
    });

    return NextResponse.json({ seeded: entries.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
