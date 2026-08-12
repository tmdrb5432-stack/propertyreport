import { minMaxNormalize } from "./normalize";

export interface DistrictJobDensityInput {
  districtId: string;
  companyCount: number;
  employeeCount: number | null;
}

/**
 * How job-dense each district is, normalized across all districts (same
 * company/employee inputs as the district-level 직주근접 지수). Shared base
 * for every complex's own proximity score below — a complex can't be more
 * job-proximate than the district it sits in.
 */
export function computeDistrictJobDensity(
  inputs: DistrictJobDensityInput[],
): Record<string, number> {
  const companyScores = minMaxNormalize(inputs.map((i) => i.companyCount));
  const employeeScores = minMaxNormalize(inputs.map((i) => i.employeeCount ?? 0));
  const result: Record<string, number> = {};
  inputs.forEach((input, i) => {
    result[input.districtId] = companyScores[i] * 0.6 + employeeScores[i] * 0.4;
  });
  return result;
}

// Fixed physical caps, not comparative min-max — "closest of the candidates"
// is meaningless if every candidate is still far from anything. Beyond these,
// proximity contributes nothing further.
const CENTER_DISTANCE_CAP_M = 5000; // matches PROXIMITY_RADIUS_M in districts.ts
const SUBWAY_DISTANCE_CAP_M = 2000;

function distanceScore(distanceM: number | null, capM: number): number {
  if (distanceM === null) return 0;
  return 100 * (1 - Math.min(distanceM / capM, 1));
}

export interface ComplexJobProximityInput {
  districtJobDensityScore: number; // 0-100, from computeDistrictJobDensity
  distanceToDistrictM: number | null;
  nearestSubwayDistanceM: number | null;
}

/**
 * 단지별 직주근접 지수 (0-100): the district's overall job density (50%,
 * "how many jobs are even out here"), how close this specific building is
 * to the district's business center (30%), and how close it is to a subway
 * station (20%, commute convenience). A v1 heuristic, not a real commute-time
 * model — mirrors the district-level index's honesty about that.
 */
export function computeComplexJobProximity(input: ComplexJobProximityInput): number {
  const centerScore = distanceScore(input.distanceToDistrictM, CENTER_DISTANCE_CAP_M);
  const subwayScore = distanceScore(input.nearestSubwayDistanceM, SUBWAY_DISTANCE_CAP_M);
  return Math.round(input.districtJobDensityScore * 0.5 + centerScore * 0.3 + subwayScore * 0.2);
}

export interface ComplexValueInput {
  latestAvgPricePerPyeong: number;
  priceGrowthRatio: number | null; // fractional over the trend window, e.g. 0.05 = +5%
}

/**
 * Two value signals across a candidate pool of complexes: affordability
 * (cheaper 평당가 now) and undervaluation momentum (grown less than peers
 * recently — same "hasn't caught up yet" logic as the district-level
 * affordability sub-score). Both are comparative to the pool passed in, so
 * recompute after filtering rather than reusing a global set of scores.
 */
export function computeValueScores(
  inputs: ComplexValueInput[],
): { affordability: number[]; undervaluation: number[] } {
  const priceScores = minMaxNormalize(inputs.map((i) => i.latestAvgPricePerPyeong));
  const affordability = priceScores.map((v) => 100 - v);
  const growthScores = minMaxNormalize(inputs.map((i) => i.priceGrowthRatio ?? 0));
  const undervaluation = growthScores.map((v) => 100 - v);
  return { affordability, undervaluation };
}
