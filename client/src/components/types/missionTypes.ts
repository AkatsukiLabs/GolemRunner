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
 * Simple display data for the UI (converted from Mission bindings)
 */
export interface MissionDisplayData {
  id: number;
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
 * Validates if Eliza response has the correct structure
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