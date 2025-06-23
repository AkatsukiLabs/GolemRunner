/**
 * Mission reward system based on difficulty
 */

export type MissionDifficulty = 'Easy' | 'Mid' | 'Hard';

/**
 * Fixed coin rewards by mission difficulty
 */
export const MISSION_REWARDS: Record<MissionDifficulty, number> = {
  'Easy': 100,
  'Mid': 250,
  'Hard': 500
} as const;

/**
 * Gets the coin reward amount for a mission difficulty
 */
export const getMissionReward = (difficulty: MissionDifficulty): number => {
  return MISSION_REWARDS[difficulty];
};

/**
 * Gets the reward amount for a mission based on its difficulty
 * Uses the mission's existing difficulty field instead of calculating from target_coins
 */
export const getRewardFromDifficulty = (difficulty: MissionDifficulty): number => {
  return getMissionReward(difficulty);
};