import { Mission } from '../dojo/bindings';

/**
 * Mission validation utilities for determining completable missions
 * Pure functions without side effects for easy testing
 */

/**
 * Maps theme strings to world IDs for mission validation
 */
export const WORLD_ID_MAP = {
  'forest': 1,
  'ice': 2, 
  'volcano': 3
} as const;

/**
 * Maps world IDs back to enum strings for validation
 */
export const WORLD_ENUM_MAP = {
  1: 'Forest',
  2: 'Glacier', // Ice world is actually Glacier in the enum
  3: 'Volcano'
} as const;

/**
 * Maps golem IDs to enum strings for validation
 */
export const GOLEM_ENUM_MAP = {
  1: 'Stone', // Starter golem
  2: 'Fire',
  3: 'Ice'
} as const;

/**
 * Game completion data from the Game Over modal
 */
export interface GameCompletionData {
  coinsCollected: number;
  worldId: number;
  golemId: number;
}

/**
 * Result of mission validation
 */
export interface CompletableMission {
  mission: Mission;
  reason: string; // Why this mission is completable
}

/**
 * Safe function to extract enum variant value
 */
const getEnumVariant = (enumObj: any, defaultValue: string): string => {
  if (!enumObj) return defaultValue;
  
  // Try activeVariant() function first
  if (typeof enumObj.activeVariant === 'function') {
    try {
      return enumObj.activeVariant();
    } catch (error) {
      console.warn("activeVariant failed:", error);
    }
  }
  
  // Try variant object structure
  if (enumObj.variant && typeof enumObj.variant === 'object') {
    const keys = Object.keys(enumObj.variant);
    if (keys.length > 0) {
      return keys[0];
    }
  }
  
  // Try direct object keys
  if (typeof enumObj === 'object') {
    const keys = Object.keys(enumObj);
    if (keys.length > 0) {
      return keys[0];
    }
  }
  
  return defaultValue;
};

/**
 * Validates if the world requirement matches the played world
 */
export const validateWorldRequirement = (
  requiredWorld: any, 
  playedWorldId: number
): boolean => {
  const requiredWorldVariant = getEnumVariant(requiredWorld, 'Forest');
  const expectedWorld = WORLD_ENUM_MAP[playedWorldId as keyof typeof WORLD_ENUM_MAP];
  
  if (!expectedWorld) {
    console.warn(`Unknown world ID: ${playedWorldId}`);
    return false;
  }
  
  const matches = requiredWorldVariant === expectedWorld;
  
  console.log(`🗺️ World validation: Required=${requiredWorldVariant}, Played=${expectedWorld}, Matches=${matches}`);
  
  return matches;
};

/**
 * Validates if the golem requirement matches the used golem
 */
export const validateGolemRequirement = (
  requiredGolem: any,
  usedGolemId: number  
): boolean => {
  const requiredGolemVariant = getEnumVariant(requiredGolem, 'Stone');
  const expectedGolem = GOLEM_ENUM_MAP[usedGolemId as keyof typeof GOLEM_ENUM_MAP];
  
  if (!expectedGolem) {
    console.warn(`Unknown golem ID: ${usedGolemId}`);
    return false;
  }
  
  const matches = requiredGolemVariant === expectedGolem;
  
  console.log(`🧌 Golem validation: Required=${requiredGolemVariant}, Used=${expectedGolem}, Matches=${matches}`);
  
  return matches;
};

/**
 * Validates if the coins requirement is met
 */
export const validateCoinsRequirement = (
  targetCoins: number,
  coinsCollected: number
): boolean => {
  const meets = coinsCollected >= targetCoins;
  
  console.log(`💰 Coins validation: Required=${targetCoins}, Collected=${coinsCollected}, Meets=${meets}`);
  
  return meets;
};

/**
 * Checks if a mission is currently pending (not completed)
 */
export const isMissionPending = (mission: Mission): boolean => {
  const statusVariant = getEnumVariant(mission.status, 'Pending');
  const isPending = statusVariant === 'Pending';
  
  console.log(`📋 Mission ${mission.id} status: ${statusVariant}, isPending=${isPending}`);
  
  return isPending;
};

/**
 * Validates if a single mission can be completed with the given game data
 */
export const validateMissionCompletion = (
  mission: Mission,
  gameData: GameCompletionData
): { canComplete: boolean; reason: string } => {
  console.log(`🔍 Validating mission ${mission.id}:`, {
    targetCoins: mission.target_coins,
    description: mission.description
  });
  
  // Check if mission is still pending
  if (!isMissionPending(mission)) {
    return {
      canComplete: false,
      reason: `Mission ${mission.id} is not in pending status`
    };
  }
  
  // Validate coins requirement
  if (!validateCoinsRequirement(mission.target_coins, gameData.coinsCollected)) {
    return {
      canComplete: false,
      reason: `Insufficient coins: need ${mission.target_coins}, collected ${gameData.coinsCollected}`
    };
  }
  
  // Validate world requirement
  if (!validateWorldRequirement(mission.required_world, gameData.worldId)) {
    const requiredWorldVariant = getEnumVariant(mission.required_world, 'Forest');
    const playedWorld = WORLD_ENUM_MAP[gameData.worldId as keyof typeof WORLD_ENUM_MAP];
    return {
      canComplete: false,
      reason: `Wrong world: need ${requiredWorldVariant}, played ${playedWorld}`
    };
  }
  
  // Validate golem requirement  
  if (!validateGolemRequirement(mission.required_golem, gameData.golemId)) {
    const requiredGolemVariant = getEnumVariant(mission.required_golem, 'Stone');
    const usedGolem = GOLEM_ENUM_MAP[gameData.golemId as keyof typeof GOLEM_ENUM_MAP];
    return {
      canComplete: false,
      reason: `Wrong golem: need ${requiredGolemVariant}, used ${usedGolem}`
    };
  }
  
  // All validations passed!
  const reason = `Completed with ${gameData.coinsCollected} coins using ${GOLEM_ENUM_MAP[gameData.golemId as keyof typeof GOLEM_ENUM_MAP]} golem in ${WORLD_ENUM_MAP[gameData.worldId as keyof typeof WORLD_ENUM_MAP]}`;
  
  return {
    canComplete: true,
    reason
  };
};

/**
 * Finds all missions that can be completed with the given game completion data
 */
export const findCompletableMissions = (
  missions: Mission[],
  gameData: GameCompletionData
): CompletableMission[] => {
  console.log(`🎯 Checking ${missions.length} missions for completion:`, gameData);
  
  const completableMissions: CompletableMission[] = [];
  
  for (const mission of missions) {
    const validation = validateMissionCompletion(mission, gameData);
    
    if (validation.canComplete) {
      completableMissions.push({
        mission,
        reason: validation.reason
      });
      
      console.log(`✅ Mission ${mission.id} can be completed: ${validation.reason}`);
    } else {
      console.log(`❌ Mission ${mission.id} cannot be completed: ${validation.reason}`);
    }
  }
  
  console.log(`🎉 Found ${completableMissions.length} completable missions`);
  
  return completableMissions;
};

/**
 * Utility function to convert theme string to world ID
 */
export const themeToWorldId = (theme: string): number => {
  const worldId = WORLD_ID_MAP[theme as keyof typeof WORLD_ID_MAP];
  return worldId || 1; // Default to Forest if unknown theme
};

/**
 * Utility function to get world name from ID
 */
export const getWorldNameFromId = (worldId: number): string => {
  return WORLD_ENUM_MAP[worldId as keyof typeof WORLD_ENUM_MAP] || 'Forest';
};

/**
 * Utility function to get golem name from ID
 */
export const getGolemNameFromId = (golemId: number): string => {
  return GOLEM_ENUM_MAP[golemId as keyof typeof GOLEM_ENUM_MAP] || 'Stone';
};