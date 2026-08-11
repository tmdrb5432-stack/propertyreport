import { minMaxNormalize } from "./normalize";

export interface MobilityInput {
  districtId: string;
  transitScore: number;
}

/**
 * 이동편의성 지수 (0-100): re-scales each district's absolute transit score
 * (from TransitSnapshot, itself a v1 heuristic — see kakao/transitAdapter.ts)
 * relative to the other districts in the comparison set, so the dashboard's
 * 5-district ranking always spans the full 0-100 range.
 */
export function computeMobilityIndex(
  inputs: MobilityInput[],
): Record<string, number> {
  const normalized = minMaxNormalize(inputs.map((i) => i.transitScore));
  const result: Record<string, number> = {};
  inputs.forEach((input, i) => {
    result[input.districtId] = Math.round(normalized[i]);
  });
  return result;
}
