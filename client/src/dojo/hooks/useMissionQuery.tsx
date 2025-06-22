import { useState, useCallback } from "react";
import { CairoCustomEnum } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { Mission } from '../bindings';
import { getCurrentDay } from '../../utils/TimeHelpers';

interface MissionEdge {
  node: RawMissionNode;
}

interface RawMissionNode {
  id: string;
  player_id: string;
  target_coins: string;
  required_world: any;
  required_golem: any;
  description: string;
  status: any;
  created_at: string;
}

interface UseMissionQueryReturn {
  missions: Mission[];
  isLoading: boolean;
  error: string | null;
  fetchTodayMissions: (playerAddress: string) => Promise<Mission[]>;
}

// Helper functions
const hexToNumber = (hexValue: string | number): number => {
  if (typeof hexValue === 'number') return hexValue;
  if (typeof hexValue === 'string' && hexValue.startsWith('0x')) {
    return parseInt(hexValue, 16);
  }
  if (typeof hexValue === 'string') {
    return parseInt(hexValue, 10);
  }
  return 0;
};

const createCairoEnum = (rawValue: any, enumMap: Record<string, string>, defaultValue: string): CairoCustomEnum => {
  if (!rawValue) {
    return new CairoCustomEnum({ [defaultValue]: defaultValue });
  }
  
  if (typeof rawValue === 'string') {
    const enumKey = enumMap[rawValue] ? rawValue : defaultValue;
    return new CairoCustomEnum({ [enumKey]: enumKey });
  }
  
  if (typeof rawValue === 'object') {
    if (rawValue.variant && typeof rawValue.variant === 'object') {
      for (const [key] of Object.entries(rawValue.variant)) {
        if (enumMap[key]) {
          return new CairoCustomEnum({ [key]: key });
        }
      }
    }
    
    for (const [key] of Object.entries(rawValue)) {
      if (enumMap[key]) {
        return new CairoCustomEnum({ [key]: key });
      }
    }
  }
  
  return new CairoCustomEnum({ [defaultValue]: defaultValue });
};

const toriiNodeToMission = (rawNode: RawMissionNode): Mission => {
  const worldEnumMap = { Volcano: "Volcano", Glacier: "Glacier", Forest: "Forest" };
  const golemEnumMap = { Ice: "Ice", Stone: "Stone", Fire: "Fire" };
  const statusEnumMap = { Completed: "Completed", Pending: "Pending" };
  
  const required_world = createCairoEnum(rawNode.required_world, worldEnumMap, "Forest");
  const required_golem = createCairoEnum(rawNode.required_golem, golemEnumMap, "Fire");
  const status = createCairoEnum(rawNode.status, statusEnumMap, "Pending");

  const mission: Mission = {
    id: hexToNumber(rawNode.id),
    player_id: rawNode.player_id,
    target_coins: hexToNumber(rawNode.target_coins),
    required_world,
    required_golem,
    description: rawNode.description,
    status,
    created_at: hexToNumber(rawNode.created_at)
  };
  
  try {
    mission.status.activeVariant();
  } catch (error) {
    let statusKey = "Pending";
    
    if (mission.status && typeof mission.status === 'object') {
      const statusObj = mission.status as any;
      
      if (statusObj.variant) {
        if (statusObj.variant.Pending !== undefined) statusKey = "Pending";
        else if (statusObj.variant.Completed !== undefined) statusKey = "Completed";
      }
      else if (statusObj.Pending !== undefined) statusKey = "Pending";
      else if (statusObj.Completed !== undefined) statusKey = "Completed";
    }
    
    mission.status = new CairoCustomEnum({ [statusKey]: statusKey });
  }
  
  return mission;
};

export const useMissionQuery = (): UseMissionQueryReturn => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayMissions = useCallback(async (playerAddress: string): Promise<Mission[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const currentDay = getCurrentDay();
      
      const response = await fetch(dojoConfig.toriiUrl + "/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: `
            query GetMissions($playerAddress: ContractAddress!, $dayTimestamp: u32!) {
              golemRunnerMissionModels(
                where: { 
                  player_id: $playerAddress, 
                  created_at: $dayTimestamp 
                }
                first: 10
              ) {
                edges {
                  node {
                    id
                    player_id
                    target_coins
                    required_world
                    required_golem
                    description
                    status
                    created_at
                  }
                }
              }
            }
          `,
          variables: { playerAddress, dayTimestamp: currentDay }
        }),
      });

      const result = await response.json();
      
      if (!result.data?.golemRunnerMissionModels?.edges) {
        setMissions([]);
        return [];
      }

      const fetchedMissions = result.data.golemRunnerMissionModels.edges.map((edge: MissionEdge) => {
        return toriiNodeToMission(edge.node);
      });

      setMissions(fetchedMissions);
      return fetchedMissions;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch missions";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    missions,
    isLoading,
    error,
    fetchTodayMissions
  };
};