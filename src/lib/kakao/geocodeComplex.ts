import { prisma } from "@/lib/db";
import { searchCategory, searchKeyword } from "@/lib/adapters/kakao/client";
import { haversineM } from "@/lib/geo";

const CONCURRENCY = 16;
const SUBWAY_CATEGORY_CODE = "SW8";
const SUBWAY_SEARCH_RADIUS_M = 2000;

export interface LatLng {
  lat: number;
  lng: number;
}

async function findNearestSubway(
  loc: LatLng,
): Promise<{ name: string; distanceM: number } | null> {
  try {
    const docs = await searchCategory({
      categoryGroupCode: SUBWAY_CATEGORY_CODE,
      x: loc.lng,
      y: loc.lat,
      radius: SUBWAY_SEARCH_RADIUS_M,
    });
    if (docs.length === 0) return null;

    let nearest = docs[0];
    let nearestDistance = haversineM(loc, { lat: Number(nearest.y), lng: Number(nearest.x) });
    for (const doc of docs.slice(1)) {
      const d = haversineM(loc, { lat: Number(doc.y), lng: Number(doc.x) });
      if (d < nearestDistance) {
        nearest = doc;
        nearestDistance = d;
      }
    }
    return { name: nearest.place_name, distanceM: Math.round(nearestDistance) };
  } catch {
    return null;
  }
}

async function geocodeOne(
  districtId: string,
  complexName: string,
  near: LatLng,
  radiusM: number,
): Promise<LatLng | null> {
  let loc: LatLng | null = null;
  try {
    const docs = await searchKeyword({
      query: complexName,
      x: near.lng,
      y: near.lat,
      radius: Math.min(radiusM * 2, 20000), // Kakao's max radius is 20km; bias search, don't hard-limit.
    });
    const best = docs[0];
    if (best) loc = { lat: Number(best.y), lng: Number(best.x) };
  } catch {
    loc = null;
  }

  const subway = loc ? await findNearestSubway(loc) : null;

  // Persist immediately rather than batching at the end — on a cold cache
  // with hundreds of complexes, this call can run long enough to hit
  // Vercel's 60s function cap. Saving per-result means a killed invocation
  // still keeps whatever it resolved before the cutoff, so the next cron
  // run only has to geocode what's still missing instead of starting over.
  await prisma.complexLocationCache.upsert({
    where: { districtId_complexName: { districtId, complexName } },
    update: {
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      nearestSubwayName: subway?.name ?? null,
      nearestSubwayDistanceM: subway?.distanceM ?? null,
    },
    create: {
      districtId,
      complexName,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      nearestSubwayName: subway?.name ?? null,
      nearestSubwayDistanceM: subway?.distanceM ?? null,
    },
  });

  return loc;
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
    geocodeOne(districtId, name, near, radiusM),
  );

  missing.forEach((name, i) => result.set(name, resolved[i]));
  return result;
}
