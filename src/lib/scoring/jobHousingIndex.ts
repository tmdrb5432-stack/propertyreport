import { minMaxNormalize } from "./normalize";

export interface JobHousingInput {
  districtId: string;
  companyCount: number;
  employeeCount: number | null;
  /** Fractional price growth over the available history window (e.g. 0.05 = +5%). */
  priceGrowthRatio: number | null;
}

const WEIGHTS = { company: 0.4, employee: 0.3, affordability: 0.3 };

/**
 * 직주근접 지수 (0-100): a v1 heuristic combining job density (company count,
 * employee count) with a relative-affordability sub-score (districts whose
 * nearby housing prices have grown more slowly score higher, on the theory
 * that job proximity there is comparatively less priced-in yet). This is not
 * a rigorous economic model — weights are placeholders to revisit once real
 * MOLIT transaction data replaces the mock price series.
 */
export function computeJobHousingIndex(
  inputs: JobHousingInput[],
): Record<string, number> {
  const companyScores = minMaxNormalize(inputs.map((i) => i.companyCount));
  const employeeScores = minMaxNormalize(
    inputs.map((i) => i.employeeCount ?? 0),
  );
  const growthScores = minMaxNormalize(
    inputs.map((i) => i.priceGrowthRatio ?? 0),
  );
  // Lower growth should score higher on affordability, so invert.
  const affordabilityScores = growthScores.map((v) => 100 - v);

  const result: Record<string, number> = {};
  inputs.forEach((input, i) => {
    const score =
      companyScores[i] * WEIGHTS.company +
      employeeScores[i] * WEIGHTS.employee +
      affordabilityScores[i] * WEIGHTS.affordability;
    result[input.districtId] = Math.round(score);
  });
  return result;
}
