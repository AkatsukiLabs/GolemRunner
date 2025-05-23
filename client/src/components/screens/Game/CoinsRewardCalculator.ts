export interface ScoreRange {
    min: number;
    max: number;
    coins: number;
    label: string;
  }
  
  export interface CoinReward {
    coins: number;
    range: ScoreRange;
    percentage: number; // Percentage towards next tier
  }
  
  // Predefined score ranges for coin rewards
  const SCORE_RANGES: ScoreRange[] = [
    { min: 0, max: 999, coins: 5, label: "Beginner" },
    { min: 1000, max: 2999, coins: 15, label: "Runner" },
    { min: 3000, max: 5999, coins: 30, label: "Speedster" },
    { min: 6000, max: 9999, coins: 50, label: "Champion" },
    { min: 10000, max: Infinity, coins: 100, label: "Legend" }
  ];
  
  /**
   * Calculates coin reward based on score
   * @param score - Final game score
   * @returns CoinReward object with coins, range info, and progress
   */
  export const calculateCoinReward = (score: number): CoinReward => {
    // Find the appropriate range for the score
    const range = SCORE_RANGES.find(range => 
      score >= range.min && score <= range.max
    ) || SCORE_RANGES[0]; // Fallback to first range
  
    // Calculate percentage towards next tier
    let percentage = 0;
    if (range.max !== Infinity) {
      const rangeSize = range.max - range.min + 1;
      const scoreInRange = score - range.min;
      percentage = Math.min(100, (scoreInRange / rangeSize) * 100);
    } else {
      // For the highest tier, show 100%
      percentage = 100;
    }
  
    return {
      coins: range.coins,
      range,
      percentage: Math.round(percentage)
    };
  };
  
  /**
   * Gets the next tier information
   * @param currentRange - Current score range
   * @returns Next range or null if at max tier
   */
  export const getNextTier = (currentRange: ScoreRange): ScoreRange | null => {
    const currentIndex = SCORE_RANGES.findIndex(range => range === currentRange);
    if (currentIndex === -1 || currentIndex === SCORE_RANGES.length - 1) {
      return null;
    }
    return SCORE_RANGES[currentIndex + 1];
  };
  
  /**
   * Hook for coin reward calculation with additional utilities
   * @param score - Final game score
   * @returns Coin reward data and utilities
   */
  export const useCoinReward = (score: number) => {
    const reward = calculateCoinReward(score);
    const nextTier = getNextTier(reward.range);
    
    // Calculate points needed for next tier
    const pointsToNextTier = nextTier ? nextTier.min - score : 0;
    
    return {
      ...reward,
      nextTier,
      pointsToNextTier: Math.max(0, pointsToNextTier),
      isMaxTier: nextTier === null
    };
  };