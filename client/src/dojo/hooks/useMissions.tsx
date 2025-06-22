import { useState, useCallback, useMemo, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding, CairoCustomEnum } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { Mission } from '../bindings';
import useAppStore from '../../zustand/store';
import { AIAgentService } from '../../services/aiAgent';
import { 
  ElizaMissionData, 
  createFallbackMissions, 
  parseElizaResponse 
} from '../../components/types/missionTypes';
import { 
  getCurrentDay, 
  isMissionCacheStale, 
  isMissionFromToday 
} from '../../utils/TimeHelpers';

// Types
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

interface UseMissionsInitReturn {
  // Data
  todayMissions: Mission[];
  pendingMissions: Mission[];
  completedMissions: Mission[];
  
  // States
  isLoading: boolean;
  isSpawning: boolean;
  error: string | null;
  hasData: boolean;
  
  // Actions
  initializeMissions: () => Promise<boolean>;
  refetchMissions: () => Promise<void>;
}

// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const MISSIONS_QUERY = `
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
      totalCount
    }
  }
`;

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

/**
 * Helper function to safely create CairoCustomEnum
 */
const createCairoEnum = (rawValue: any, enumMap: Record<string, string>, defaultValue: string): CairoCustomEnum => {
  // Handle null/undefined
  if (!rawValue) {
    return new CairoCustomEnum({ [defaultValue]: defaultValue });
  }
  
  // If it's already a string
  if (typeof rawValue === 'string') {
    const enumKey = enumMap[rawValue] ? rawValue : defaultValue;
    return new CairoCustomEnum({ [enumKey]: enumKey });
  }
  
  // Handle Torii object format {Pending: {}} or {variant: {Pending: 'Pending'}}
  if (typeof rawValue === 'object') {
    // Check if it has variant property first
    if (rawValue.variant && typeof rawValue.variant === 'object') {
      for (const [key, value] of Object.entries(rawValue.variant)) {
        if (enumMap[key]) {
          return new CairoCustomEnum({ [key]: key });
        }
      }
    }
    
    // Check direct object format {Pending: {}}
    for (const [key, value] of Object.entries(rawValue)) {
      if (enumMap[key]) {
        return new CairoCustomEnum({ [key]: key });
      }
    }
  }
  
  // Fallback to default
  return new CairoCustomEnum({ [defaultValue]: defaultValue });
};

/**
 * Converts raw Torii response to Mission binding format
 */
const toriiNodeToMission = (rawNode: RawMissionNode): Mission => {
  // Enum maps
  const worldEnumMap = { Volcano: "Volcano", Glacier: "Glacier", Forest: "Forest" };
  const golemEnumMap = { Ice: "Ice", Stone: "Stone", Fire: "Fire" };
  const statusEnumMap = { Completed: "Completed", Pending: "Pending" };
  
  // Create enums safely
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
  
  // Test and patch status if needed
  try {
    mission.status.activeVariant();
  } catch (error) {
    // If activeVariant fails, create a working enum manually
    let statusKey = "Pending"; // default
    
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

/**
 * Fetches missions from Torii GraphQL
 */
const fetchMissionsFromTorii = async (playerAddress: string): Promise<Mission[]> => {
  try {
    const currentDay = getCurrentDay();
    
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query: MISSIONS_QUERY,
        variables: { 
          playerAddress,
          dayTimestamp: currentDay
        }
      }),
    });

    const result = await response.json();
    
    if (!result.data?.golemRunnerMissionModels?.edges) {
      return [];
    }

    const missions = result.data.golemRunnerMissionModels.edges.map((edge: MissionEdge) => {
      return toriiNodeToMission(edge.node);
    });

    return missions;
  } catch (error) {
    console.error("❌ Error fetching missions from Torii:", error);
    throw error;
  }
};

/**
 * Converts ElizaMissionData to Cairo enums for contract
 */
const elizaDataToCairoEnums = (elizaData: ElizaMissionData) => {
  const worldMap: Record<string, CairoCustomEnum> = {
    'Forest': new CairoCustomEnum({ Forest: "Forest" }),
    'Volcano': new CairoCustomEnum({ Volcano: "Volcano" }),
    'Glacier': new CairoCustomEnum({ Glacier: "Glacier" })
  };

  const golemMap: Record<string, CairoCustomEnum> = {
    'Fire': new CairoCustomEnum({ Fire: "Fire" }),
    'Ice': new CairoCustomEnum({ Ice: "Ice" }),
    'Stone': new CairoCustomEnum({ Stone: "Stone" })
  };

  return {
    target_coins: elizaData.target_coins,
    required_world: worldMap[elizaData.required_world] || worldMap['Forest'],
    required_golem: golemMap[elizaData.required_golem] || golemMap['Fire'],
    description: elizaData.description
  };
};

/**
 * Main hook - Solo para inicialización de misiones
 */
export const useMissionsInit = (): UseMissionsInitReturn => {
  const { client } = useDojoSDK();
  const { account } = useAccount();
  
  // Zustand store
  const {
    missions,
    lastMissionFetch,
    isMissionsLoading,
    setMissions,
    setMissionsLoading,
    setMissionsError
  } = useAppStore();

  // Local state
  const [isSpawning, setIsSpawning] = useState<boolean>(false);
  const [spawnAttempts, setSpawnAttempts] = useState<number>(0);
  const [lastSpawnTime, setLastSpawnTime] = useState<number>(0);
  
  const MAX_SPAWN_ATTEMPTS = 1; // Solo un intento por sesión
  const MIN_SPAWN_INTERVAL = 30000; // 30 segundos entre intentos

  // Memoize user address
  const userAddress = useMemo(() => 
    account ? addAddressPadding(account.address) : null, 
    [account]
  );

  // Memoized derived data with defensive programming
  const todayMissions = useMemo(() => {
    if (!Array.isArray(missions)) {
      return [];
    }
    
    return missions.filter(mission => {
      try {
        return isMissionFromToday(mission.created_at);
      } catch (error) {
        return false;
      }
    });
  }, [missions]);

  const pendingMissions = useMemo(() => {
    if (!Array.isArray(todayMissions)) {
      return [];
    }
    
    return todayMissions.filter((mission) => {
      try {
        let statusVariant = "Pending"; // default assumption
        
        if (mission.status && typeof mission.status.activeVariant === 'function') {
          statusVariant = mission.status.activeVariant();
        } else if (mission.status && typeof mission.status === 'object') {
          const statusObj = mission.status as any;
          
          if (statusObj.variant) {
            if (statusObj.variant.Pending !== undefined) statusVariant = "Pending";
            else if (statusObj.variant.Completed !== undefined) statusVariant = "Completed";
          }
          else if (statusObj.Pending !== undefined) statusVariant = "Pending";
          else if (statusObj.Completed !== undefined) statusVariant = "Completed";
        }
        
        return statusVariant === 'Pending';
        
      } catch (error) {
        return true; // Assume pending on error
      }
    });
  }, [todayMissions]);

  const completedMissions = useMemo(() => {
    try {
      return todayMissions.filter(mission => {
        try {
          let statusVariant = "Pending";
          
          if (mission.status && typeof mission.status.activeVariant === 'function') {
            statusVariant = mission.status.activeVariant();
          } else if (mission.status && typeof mission.status === 'object') {
            const statusObj = mission.status as any;
            
            if (statusObj.variant) {
              if (statusObj.variant.Completed !== undefined) statusVariant = "Completed";
              else if (statusObj.variant.Pending !== undefined) statusVariant = "Pending";
            }
            else if (statusObj.Completed !== undefined) statusVariant = "Completed";
            else if (statusObj.Pending !== undefined) statusVariant = "Pending";
          }
          
          return statusVariant === 'Completed';
        } catch (error) {
          return false;
        }
      });
    } catch (error) {
      return [];
    }
  }, [todayMissions]);

  const hasData = todayMissions.length > 0;

  /**
   * Check if we can spawn (rate limiting)
   */
  const canSpawn = useCallback((): boolean => {
    const now = Date.now();
    
    if (spawnAttempts >= MAX_SPAWN_ATTEMPTS) {
      return false;
    }
    
    if (lastSpawnTime && (now - lastSpawnTime) < MIN_SPAWN_INTERVAL) {
      return false;
    }
    
    return true;
  }, [spawnAttempts, lastSpawnTime]);

  /**
   * Fetch missions from Torii and update store
   */
  const refetchMissions = useCallback(async (): Promise<void> => {
    if (!userAddress) {
      return;
    }

    setMissionsLoading(true);
    setMissionsError(null);

    try {
      const fetchedMissions = await fetchMissionsFromTorii(userAddress);
      setMissions(fetchedMissions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch missions";
      setMissionsError(errorMessage);
      throw err;
    } finally {
      setMissionsLoading(false);
    }
  }, [userAddress, setMissions, setMissionsLoading, setMissionsError]);

  /**
   * Generate missions with error handling and tracking
   */
  const spawnNewMissions = useCallback(async (): Promise<boolean> => {
    if (!userAddress || !account) {
      return false;
    }

    if (!canSpawn()) {
      setMissionsError("Mission generation is temporarily limited. Please try again later.");
      return false;
    }

    setIsSpawning(true);
    setMissionsError(null);
    
    // Update tracking
    setSpawnAttempts(prev => prev + 1);
    setLastSpawnTime(Date.now());

    try {
      // Generate 3 missions from Eliza
      const elizaMissions: ElizaMissionData[] = [];
      const fallbackMissions = createFallbackMissions();
      
      for (let i = 0; i < 3; i++) {
        try {
          const elizaResponse = await AIAgentService.getDailyMission(userAddress);
          const elizaData = parseElizaResponse(elizaResponse);
          
          if (elizaData) {
            elizaMissions.push(elizaData);
          } else {
            elizaMissions.push(fallbackMissions[i] || fallbackMissions[0]);
          }
        } catch (error) {
          elizaMissions.push(fallbackMissions[i] || fallbackMissions[0]);
        }
      }

      // Create missions in contract (sequential transactions)
      const results = [];
      
      for (let i = 0; i < elizaMissions.length; i++) {
        const elizaData = elizaMissions[i];
        try {
          const cairoData = elizaDataToCairoEnums(elizaData);
          
          const tx = await client.game.createMission(
            account as Account,
            cairoData.target_coins,
            cairoData.required_world,
            cairoData.required_golem,
            cairoData.description
          );
          
          if (tx && tx.code === "SUCCESS") {
            results.push({ success: true, mission: elizaData, tx });
          } else {
            results.push({ success: false, mission: elizaData, error: `Transaction failed with code: ${tx?.code}` });
          }
          
          // Small delay between transactions to avoid nonce issues
          if (i < elizaMissions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          results.push({ 
            success: false, 
            mission: elizaData, 
            error: error instanceof Error ? error.message : "Unknown error" 
          });
        }
      }
      
      // Check results
      const successful = results.filter(result => result.success).length;
      
      if (successful === 0) {
        throw new Error("All mission creation transactions failed");
      }

      // Wait for blockchain to process
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Refetch missions from Torii
      await refetchMissions();
      
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to spawn missions";
      setMissionsError(errorMessage);
      return false;
    } finally {
      setIsSpawning(false);
    }
  }, [userAddress, account, client.game, refetchMissions, setMissionsError, canSpawn]);

  /**
   * Main initialization function
   */
  const initializeMissions = useCallback(async (): Promise<boolean> => {
    if (!userAddress) {
      return false;
    }

    // 1. Check if cache is fresh and has today's missions
    if (!isMissionCacheStale(lastMissionFetch) && todayMissions.length > 0) {
      return true;
    }

    // 2. Always fetch from Torii first (fresh data)
    try {
      await refetchMissions();
      
      // 3. After refetch, check if we have today's missions
      const currentTodayMissions = missions.filter(mission => isMissionFromToday(mission.created_at));
      
      if (currentTodayMissions.length > 0) {
        return true;
      }

      // 4. Only spawn if we can and have no missions
      if (canSpawn()) {
        return await spawnNewMissions();
      } else {
        setMissionsError("No daily missions available. Generation is temporarily limited.");
        return false;
      }

    } catch (error) {
      // If fetch fails and we can spawn, try to create new missions
      if (canSpawn()) {
        return await spawnNewMissions();
      } else {
        setMissionsError("Failed to load missions and generation is rate-limited.");
        return false;
      }
    }
  }, [userAddress, lastMissionFetch, todayMissions.length, missions, refetchMissions, spawnNewMissions, canSpawn, setMissionsError]);

  // 🛠️ ANTI-CICLO: Solo reset spawn tracking cuando cambia userAddress
  useEffect(() => {
    setSpawnAttempts(0);
    setLastSpawnTime(0);
  }, [userAddress]);

  // 🛠️ ANTI-CICLO: Solo clear missions cuando userAddress cambia y existe
  useEffect(() => {
    if (userAddress) {
      useAppStore.getState().clearMissions();
      setMissionsError(null);
    }
  }, [userAddress, setMissionsError]);

  return {
    // Data
    todayMissions,
    pendingMissions,
    completedMissions,
    
    // States
    isLoading: isMissionsLoading,
    isSpawning,
    error: useAppStore.getState().missionsError,
    hasData,
    
    // Actions
    initializeMissions,
    refetchMissions
  };
};