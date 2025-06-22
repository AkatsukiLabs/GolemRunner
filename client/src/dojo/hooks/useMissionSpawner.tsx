import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account, CairoCustomEnum } from "starknet";
import { AIAgentService } from '../../services/aiAgent';
import { 
  ElizaMissionData, 
  createFallbackMissions, 
  parseElizaResponse 
} from '../../components/types/missionTypes';

interface UseMissionSpawnerReturn {
  isSpawning: boolean;
  error: string | null;
  spawnMissions: (playerAddress: string) => Promise<boolean>;
}

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

export const useMissionSpawner = (): UseMissionSpawnerReturn => {
  const { client } = useDojoSDK();
  const { account } = useAccount();
  const [isSpawning, setIsSpawning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spawnMissions = useCallback(async (): Promise<boolean> => {
    if (!account) {
      setError("No account connected");
      return false;
    }

    setIsSpawning(true);
    setError(null);

    try {
      // Generate 3 missions from Eliza
      const elizaMissions: ElizaMissionData[] = [];
      const fallbackMissions = createFallbackMissions();
      
      for (let i = 0; i < 3; i++) {
        try {
          console.log(`🤖 Requesting mission ${i + 1} from Eliza...`);

          // Just a small delay to avoid rate limiting
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          const elizaResponse = await AIAgentService.getDailyMission();
          const elizaData = parseElizaResponse(elizaResponse);
          
          if (elizaData) {
            elizaMissions.push(elizaData);
            console.log(`✅ Mission ${i + 1} from Eliza:`, elizaData);
          } else {
            const fallback = fallbackMissions[i] || fallbackMissions[0];
            elizaMissions.push(fallback);
            console.log(`⚠️ Mission ${i + 1} parse failed, using fallback:`, fallback);
          }
          
        } catch (error) {
          console.error(`❌ Error getting mission ${i + 1} from Eliza:`, error);
          const fallback = fallbackMissions[i] || fallbackMissions[0];
          elizaMissions.push(fallback);
        }
      }

      // Write missions into the Dojo Contracts
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
            console.log(`✅ Mission ${i + 1} created successfully in dojo`);
            console.log("Transaction details:", tx);
            results.push({ success: true });
          } else {
            results.push({ success: false, error: `Transaction failed: ${tx?.code}` });
          }
          
          // Small delay between transactions
          if (i < elizaMissions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          results.push({ 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error" 
          });
        }
      }
      
      const successful = results.filter(result => result.success).length;
      
      if (successful === 0) {
        throw new Error("All mission creation transactions failed");
      }

      // Wait for blockchain to process
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to spawn missions";
      setError(errorMessage);
      return false;
    } finally {
      setIsSpawning(false);
    }
  }, [account, client.game]);

  return {
    isSpawning,
    error,
    spawnMissions
  };
};