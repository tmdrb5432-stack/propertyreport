import { seededRandom, randRange } from "@/lib/adapters/mockRng";

// Rough, illustrative employee-count bands by keyword signal in a place's
// name/category — used only as a fallback when a company isn't a DART-listed
// entity (see src/lib/dart/matchCompany.ts). Always surfaced in the UI as an
// estimate, never presented as a real figure.
const LARGE_KEYWORDS = ["본사", "타워", "그룹", "홀딩스"];
const MEDIUM_KEYWORDS = ["센터", "사옥"];

function bandFor(name: string, category: string): [number, number] {
  const text = `${name} ${category}`;
  if (LARGE_KEYWORDS.some((k) => text.includes(k))) return [200, 3000];
  if (MEDIUM_KEYWORDS.some((k) => text.includes(k))) return [50, 500];
  return [5, 80];
}

export function estimateEmployeeCount(
  id: string,
  name: string,
  category: string,
): number {
  const [min, max] = bandFor(name, category);
  const rng = seededRandom(`companySize:${id}`);
  return Math.round(randRange(rng, min, max));
}
