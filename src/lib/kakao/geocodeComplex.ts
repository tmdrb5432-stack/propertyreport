import { prisma } from "@/lib/db";
import { searchKeyword } from "@/lib/adapters/kakao/client";

const CONCURRENCY = 8;

export interface LatLng {
  lat: number;
  lng: number;
}

async function geocodeOne(
  complexName: string,
  near: LatLng,
  radiusM: number,
): Promise<LatLng | null> {
  try {
    const docs = await searchKeyword({
      query: complexName,
      x: near.lng,
      y: near.lat,
      radius: Math.min(radiusM * 2, 20000), // Kakao's max radius is 20km; bias search, don't hard-limit.
    });
    const best = docs[0];
    if (!best) return null;
    return { lat: Number(best.y), lng: Number(best.x) };
  } catch {
    return null;
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function runNext(): Promise<void> {
    const i = next++;
    if (i >= items.length) return;
    results[i] = await worker(items[i]);
    return runNext();
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runNext));
  return results;
}

/**
 * Read-through cache: for each complex name, return its cached coordinates
 * (possibly null if a previous lookup found nothing), geocoding+caching any
 * name not yet in ComplexLocationCache. Shared by the district map (display)
 * and the real MOLIT adapters (radius filtering) so a complex is only ever
 * geocoded once per district.
 */
export async function resolveComplexLocations(
  districtId: string,
  complexNames: string[],
  near: LatLng,
  radiusM: number,
): Promise<Map<string, LatLng | null>> {
  const uniqueNames = Array.from(new Set(complexNames));
  const result = new Map<string, LatLng | null>();
  if (uniqueNames.length === 0) return result;

  const cached = await prisma.complexLocationCache.findMany({
    where: { districtId, complexName: { in: uniqueNames } },
  });
  for (const row of cached) {
    result.set(row.complexName, row.lat !== null && row.lng !== null ? { lat: row.lat, lng: row.lng } : null);
  }

  const missing = uniqueNames.filter((name) => !result.has(name));
  if (missing.length === 0) return result;

  const resolved = await runWithConcurrency(missing, CONCURRENCY, (name) =>
    geocodeOne(name, near, radiusM),
  );

  await prisma.$transaction(
    missing.map((name, i) =>
      prisma.complexLocationCache.upsert({
        where: { districtId_complexName: { districtId, complexName: name } },
        update: { lat: resolved[i]?.lat ?? null, lng: resolved[i]?.lng ?? null },
        create: {
          districtId,
          complexName: name,
          lat: resolved[i]?.lat ?? null,
          lng: resolved[i]?.lng ?? null,
        },
      }),
    ),
  );

  missing.forEach((name, i) => result.set(name, resolved[i]));
  return result;
}
