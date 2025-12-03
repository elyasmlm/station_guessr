export interface ScoreBreakdown {
  base: number;
  attemptsPenalty: number;
  linesPenalty: number;
  cityPenalty: number;
  total: number;
}

interface ComputeScoreParams {
  attempts: number;
  extraLines: number;
  cityRevealed: boolean;
  base?: number;
  attemptCost?: number;
  lineCost?: number;
  cityCost?: number;
  isCorrectFirstTry?: boolean;
}

/**
 * Règles :
 * - Base : 500 pts
 * - -5 pts par essai
 * - -10 pts par ligne dévoilée (au-delà des 2 premières)
 * - -100 pts si la ville/arrondissement est dévoilée
 */
export function computeScore({
  attempts,
  extraLines,
  cityRevealed,
  base = 500,
  attemptCost = 5,
  lineCost = 10,
  cityCost = 100,
  isCorrectFirstTry = false,
}: ComputeScoreParams): ScoreBreakdown {
  const attemptsPenalty = isCorrectFirstTry ? 0 : attempts * attemptCost;
  const linesPenalty = extraLines * lineCost;
  const cityPenalty = cityRevealed ? cityCost : 0;

  let total = base - attemptsPenalty - linesPenalty - cityPenalty;
  if (total < 0) total = 0;

  return {
    base,
    attemptsPenalty,
    linesPenalty,
    cityPenalty,
    total,
  };
}
