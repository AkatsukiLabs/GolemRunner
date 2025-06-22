import { useState, useCallback, useMemo } from "react";
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
  getCurrentDayTimestamp, 
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
 * Converts raw Torii response to Mission binding format
 */
const toriiNodeToMission = (rawNode: RawMissionNode): Mission => {
  // Extract world type from Cairo enum
  let required_world: CairoCustomEnum;
  if (rawNode.required_world?.Volcano !== undefined) {
    required_world = new CairoCustomEnum({ Volcano: "Volcano" });
  } else if (rawNode.required_world?.Glacier !== undefined) {
    required_world = new CairoCustomEnum({ Glacier: "Glacier" });
  } else {
    required_world = new CairoCustomEnum({ Forest: "Forest" });
  }

  // Extract golem type from Cairo enum
  let required_golem: CairoCustomEnum;
  if (rawNode.required_golem?.Ice !== undefined) {
    required_golem = new CairoCustomEnum({ Ice: "Ice" });
  } else if (rawNode.required_golem?.Stone !== undefined) {
    required_golem = new CairoCustomEnum({ Stone: "Stone" });
  } else {
    required_golem = new CairoCustomEnum({ Fire: "Fire" });
  }

  // Extract status from Cairo enum
  let status: CairoCustomEnum;
  if (rawNode.status?.Completed !== undefined) {
    status = new CairoCustomEnum({ Completed: "Completed" });
  } else {
    status = new CairoCustomEnum({ Pending: "Pending" });
  }

  return {
    id: hexToNumber(rawNode.id),
    player_id: rawNode.player_id,
    target_coins: hexToNumber(rawNode.target_coins),
    required_world,
    required_golem,
    description: rawNode.description,
    status,
    created_at: hexToNumber(rawNode.created_at)
  };
};

/**
 * Fetches missions from Torii GraphQL
 */
const fetchMissionsFromTorii = async (playerAddress: string): Promise<Mission[]> => {
  try {
    // 🔍 DEBUG: Ver qué timestamp estamos calculando
    const dayTimestamp = getCurrentDayTimestamp();
    const currentDayNumber = getCurrentDay(); // Este debería ser similar a 20261
    
    console.log("📡 Fetching missions for player:", playerAddress);
    console.log("🕐 Day timestamp (start of day in seconds):", dayTimestamp);
    console.log("🕐 Current day number:", currentDayNumber);
    console.log("🕐 Blockchain missions have created_at:", 20261);
    
    // 🛠️ FIX: Usar day number (integer) en lugar de timestamp (string)
    // El contrato usa Timestamp::unix_timestamp_to_day() que devuelve el día número
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query: MISSIONS_QUERY,
        variables: { 
          playerAddress,
          dayTimestamp: currentDayNumber // 🛠️ FIX: usar día número como integer
        }
      }),
    });

    const result = await response.json();
    console.log("📥 GraphQL missions response:", result);
    
    if (!result.data?.golemRunnerMissionModels?.edges) {
      console.log("ℹ️ No missions found in Torii response");
      return [];
    }

    const missions = result.data.golemRunnerMissionModels.edges.map((edge: MissionEdge) => 
      toriiNodeToMission(edge.node)
    );

    console.log("✅ Parsed missions from Torii:", missions);
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

  // Memoize user address
  const userAddress = useMemo(() => 
    account ? addAddressPadding(account.address) : null, 
    [account]
  );

  // Memoized derived data - Solo misiones de hoy
  const todayMissions = useMemo(() => 
    missions.filter(mission => isMissionFromToday(mission.created_at)),
    [missions]
  );

  const pendingMissions = useMemo(() => 
    todayMissions.filter(mission => 
      mission.status.activeVariant() === 'Pending'
    ),
    [todayMissions]
  );

  const completedMissions = useMemo(() => 
    todayMissions.filter(mission => 
      mission.status.activeVariant() === 'Completed'
    ),
    [todayMissions]
  );

  const hasData = todayMissions.length > 0;

  /**
   * Fetch missions from Torii and update store
   */
  const refetchMissions = useCallback(async (): Promise<void> => {
    if (!userAddress) {
      console.log("ℹ️ No user address, skipping mission fetch");
      return;
    }

    setMissionsLoading(true);
    setMissionsError(null);

    try {
      const fetchedMissions = await fetchMissionsFromTorii(userAddress);
      setMissions(fetchedMissions);
      console.log("✅ Missions successfully fetched and stored");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch missions";
      setMissionsError(errorMessage);
      console.error("❌ Error in refetchMissions:", err);
      throw err;
    } finally {
      setMissionsLoading(false);
    }
  }, [userAddress, setMissions, setMissionsLoading, setMissionsError]);

  /**
   * Generate 3 missions using Eliza and create them in the contract
   */
  const spawnNewMissions = useCallback(async (): Promise<boolean> => {
    if (!userAddress || !account) {
      console.error("❌ No user address or account for spawning missions");
      return false;
    }

    setIsSpawning(true);
    setMissionsError(null);

    try {
      console.log("🎲 Starting mission spawn process...");
      
      // Generate 3 missions from Eliza
      const elizaMissions: ElizaMissionData[] = [];
      const fallbackMissions = createFallbackMissions();
      
      for (let i = 0; i < 3; i++) {
        try {
          console.log(`🤖 Requesting mission ${i + 1} from Eliza...`);
          const elizaResponse = await AIAgentService.getDailyMission(userAddress);
          
          // Parse Eliza response using our helper
          const elizaData = parseElizaResponse(elizaResponse);
          
          if (elizaData) {
            elizaMissions.push(elizaData);
            console.log(`✅ Mission ${i + 1} parsed successfully:`, elizaData);
          } else {
            console.log(`⚠️ Failed to parse mission ${i + 1}, using fallback`);
            elizaMissions.push(fallbackMissions[i] || fallbackMissions[0]);
          }
          
        } catch (error) {
          console.error(`❌ Error getting mission ${i + 1} from Eliza:`, error);
          elizaMissions.push(fallbackMissions[i] || fallbackMissions[0]);
        }
      }

      console.log("📝 Generated missions:", elizaMissions);

      // Create missions in contract (sequential transactions)
      console.log("🔗 Creating missions in contract sequentially...");
      const results = [];
      
      for (let i = 0; i < elizaMissions.length; i++) {
        const elizaData = elizaMissions[i];
        try {
          const cairoData = elizaDataToCairoEnums(elizaData);
          console.log(`📤 Creating mission ${i + 1}/3:`, cairoData);
          
          // Usar el patrón correcto: client.game.metodo()
          const tx = await client.game.createMission(
            account as Account,
            cairoData.target_coins,
            cairoData.required_world,
            cairoData.required_golem,
            cairoData.description
          );
          
          console.log(`📥 Mission ${i + 1} transaction response:`, tx);
          
          if (tx && tx.code === "SUCCESS") {
            results.push({ success: true, mission: elizaData, tx });
            console.log(`✅ Mission ${i + 1} created successfully`);
          } else {
            results.push({ success: false, mission: elizaData, error: `Transaction failed with code: ${tx?.code}` });
            console.log(`❌ Mission ${i + 1} failed with code:`, tx?.code);
          }
          
          // Small delay between transactions to avoid nonce issues
          if (i < elizaMissions.length - 1) {
            console.log("⏳ Waiting before next transaction...");
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`❌ Failed to create mission ${i + 1}:`, error);
          results.push({ 
            success: false, 
            mission: elizaData, 
            error: error instanceof Error ? error.message : "Unknown error" 
          });
        }
      }
      
      // Check results
      const successful = results.filter(result => result.success).length;
      const failed = results.filter(result => !result.success).length;
      
      console.log(`📊 Mission creation results: ${successful}/3 successful, ${failed}/3 failed`);
      
      if (successful === 0) {
        throw new Error("All mission creation transactions failed");
      }
      
      if (failed > 0) {
        console.warn(`⚠️ ${failed} mission(s) failed to create, but continuing with ${successful} successful mission(s)`);
      }

      // Wait a bit for blockchain to process
      console.log("⏳ Waiting for blockchain to process...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refetch missions from Torii
      console.log("🔄 Refetching missions from Torii...");
      await refetchMissions();
      
      console.log("🎉 Mission spawn process completed successfully");
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to spawn missions";
      setMissionsError(errorMessage);
      console.error("❌ Error spawning missions:", error);
      return false;
    } finally {
      setIsSpawning(false);
    }
  }, [userAddress, account, client.game, refetchMissions, setMissionsError]);

  /**
   * Main initialization function - checks cache, fetches from Torii, or spawns new missions
   */
  const initializeMissions = useCallback(async (): Promise<boolean> => {
    if (!userAddress) {
      console.log("ℹ️ No user address, skipping mission initialization");
      return false;
    }

    console.log("🚀 Initializing missions...");

    // 1. Check if cache is fresh
    if (!isMissionCacheStale(lastMissionFetch) && todayMissions.length > 0) {
      console.log("✅ Using cached missions");
      return true;
    }

    // 2. Try to fetch from Torii
    console.log("📡 Fetching missions from Torii...");
    try {
      await refetchMissions();
      
      // 3. If no missions found after fetch, spawn new ones
      if (todayMissions.length === 0) {
        console.log("🎲 No missions found, spawning new ones...");
        return await spawnNewMissions();
      }

      console.log("✅ Missions initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Error fetching from Torii, trying to spawn:", error);
      // If fetch fails, try to spawn new missions
      return await spawnNewMissions();
    }
  }, [userAddress, lastMissionFetch, todayMissions.length, refetchMissions, spawnNewMissions]);

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