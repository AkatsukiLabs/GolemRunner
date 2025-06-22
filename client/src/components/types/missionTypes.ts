/**
 * Super simple types for mission management
 * Zustand uses the full Mission bindings, but these are for working data
 */

/**
 * Simple mission data that Eliza returns (no complex types)
 */
export interface ElizaMissionData {
  target_coins: number;
  required_world: 'Forest' | 'Volcano' | 'Glacier';
  required_golem: 'Fire' | 'Ice' | 'Stone';
  description: string;
}

/**
 * Mission display data for the UI (compatible with ClaimMissionAnimation)
 * Using string ID to match existing ClaimMissionAnimation component
 */
export interface MissionDisplayData {
  id: string; // Changed from number to string for compatibility
  title: string;
  description: string;
  difficulty: 'Easy' | 'Mid' | 'Hard';
  reward: number;
  requiredWorld: string;
  requiredGolem: string;
  completed: boolean;
  claimed?: boolean;
}

/**
 * Parses Eliza response text to mission data
 * Eliza returns plain text like: "150, coins, glacier, ice"
 * No JSON parsing needed!
 */
export function parseElizaResponse(elizaResponse: string): ElizaMissionData | null {
  try {
    console.log("🔍 Parsing Eliza response:", elizaResponse);
    
    // Eliza returns plain text directly, not JSON!
    // Split the text by commas and clean up
    const parts = elizaResponse.split(',').map(part => part.trim().toLowerCase());
    
    if (parts.length < 4) {
      throw new Error(`Insufficient parts in Eliza response. Expected 4, got ${parts.length}`);
    }
    
    // Extract values: [target_coins, "coins", world, golem]
    const [coinsStr, , worldStr, golemStr] = parts;
    
    // Parse target coins
    const target_coins = parseInt(coinsStr);
    if (isNaN(target_coins) || target_coins <= 0) {
      throw new Error(`Invalid target_coins: ${coinsStr}`);
    }
    
    // Normalize and validate world
    const worldMap: Record<string, 'Forest' | 'Volcano' | 'Glacier'> = {
      'forest': 'Forest',
      'volcano': 'Volcano', 
      'glacier': 'Glacier',
      'ice': 'Glacier', // Alternative name
      'fire': 'Volcano', // Alternative name
      'lava': 'Volcano'  // Alternative name
    };
    
    const required_world = worldMap[worldStr];
    if (!required_world) {
      console.warn(`Unknown world "${worldStr}", defaulting to Forest`);
    }
    
    // Normalize and validate golem
    const golemMap: Record<string, 'Fire' | 'Ice' | 'Stone'> = {
      'fire': 'Fire',
      'ice': 'Ice',
      'stone': 'Stone',
      'rock': 'Stone'  // Alternative name
    };
    
    const required_golem = golemMap[golemStr];
    if (!required_golem) {
      console.warn(`Unknown golem "${golemStr}", defaulting to Stone`);
    }
    
    // Create description
    const description = `Collect ${target_coins} coins in the ${(required_world || 'Forest').toLowerCase()} using your ${(required_golem || 'Stone').toLowerCase()} golem`;
    
    const missionData: ElizaMissionData = {
      target_coins,
      required_world: required_world || 'Forest',
      required_golem: required_golem || 'Stone',
      description
    };
    
    console.log("✅ Successfully parsed Eliza mission:", missionData);
    return missionData;
    
  } catch (error) {
    console.error("❌ Error parsing Eliza response:", error);
    return null;
  }
}

/**
 * Creates fallback missions if Eliza fails
 */
export function createFallbackMissions(): ElizaMissionData[] {
  return [
    {
      target_coins: 300,
      required_world: 'Forest',
      required_golem: 'Stone',
      description: 'Collect 300 coins in the mystical forest with your stone golem'
    },
    {
      target_coins: 500,
      required_world: 'Volcano',
      required_golem: 'Fire',
      description: 'Gather 500 coins from the volcanic realm using your fire golem'
    },
    {
      target_coins: 750,
      required_world: 'Glacier',
      required_golem: 'Ice',
      description: 'Obtain 750 coins in the frozen wastes with your ice golem'
    }
  ];
}

/**
 * Validates if parsed data is a valid mission
 */
export function isValidElizaMissionData(data: any): data is ElizaMissionData {
  return (
    typeof data === 'object' &&
    typeof data.target_coins === 'number' &&
    ['Forest', 'Volcano', 'Glacier'].includes(data.required_world) &&
    ['Fire', 'Ice', 'Stone'].includes(data.required_golem) &&
    typeof data.description === 'string' &&
    data.target_coins > 0 &&
    data.description.length > 0
  );
}