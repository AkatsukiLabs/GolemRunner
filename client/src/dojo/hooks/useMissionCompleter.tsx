import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import { 
  findCompletableMissions, 
  GameCompletionData,
  CompletableMission 
} from '../../utils/missionValidation';
import { useMissionQuery } from './useMissionQuery';
import useAppStore from '../../zustand/store';

interface UseMissionCompleterReturn {
  isCompleting: boolean;
  error: string | null;
  completedMissions: CompletableMission[];
  checkAndCompleteMissions: (gameData: GameCompletionData) => Promise<CompletableMission[]>;
  clearCompletedMissions: () => void;
}

export const useMissionCompleter = (): UseMissionCompleterReturn => {
  const { client } = useDojoSDK();
  const { account } = useAccount();
  const { fetchTodayMissions } = useMissionQuery();
  
  // Zustand store actions
  const { 
    missions: storeMissions, 
    setMissions,
    setMissionsLoading,
    setMissionsError
  } = useAppStore();

  // Local state for completion process
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedMissions, setCompletedMissions] = useState<CompletableMission[]>([]);

  /**
   * Executes blockchain transaction to mark mission as completed
   */
  const executeMissionCompletion = useCallback(async (
    missionId: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!account) {
      return { success: false, error: "No account connected" };
    }

    try {
      console.log(`🔄 Executing completion transaction for mission ${missionId}...`);
      
      const tx = await client.game.updateMission(
        account as Account,
        missionId
      );
      
      if (tx && tx.code === "SUCCESS") {
        console.log(`✅ Mission ${missionId} completion transaction successful:`, tx);
        return { success: true };
      } else {
        const errorMsg = `Transaction failed: ${tx?.code || 'Unknown error'}`;
        console.error(`❌ Mission ${missionId} completion failed:`, errorMsg);
        return { success: false, error: errorMsg };
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown transaction error";
      console.error(`❌ Error completing mission ${missionId}:`, error);
      return { success: false, error: errorMsg };
    }
  }, [account, client.game]);

  /**
   * Processes multiple mission completions sequentially
   */
  const processMissionCompletions = useCallback(async (
    completableMissions: CompletableMission[]
  ): Promise<{ successful: CompletableMission[]; failed: { mission: CompletableMission; error: string }[] }> => {
    const successful: CompletableMission[] = [];
    const failed: { mission: CompletableMission; error: string }[] = [];

    console.log(`🚀 Processing ${completableMissions.length} mission completions...`);

    for (let i = 0; i < completableMissions.length; i++) {
      const completableMission = completableMissions[i];
      const missionId = completableMission.mission.id;

      try {
        console.log(`📤 Processing mission ${i + 1}/${completableMissions.length}: ${missionId}`);
        
        const result = await executeMissionCompletion(missionId);
        
        if (result.success) {
          successful.push(completableMission);
          console.log(`✅ Mission ${missionId} completed successfully`);
        } else {
          failed.push({ 
            mission: completableMission, 
            error: result.error || "Unknown error" 
          });
          console.error(`❌ Mission ${missionId} completion failed:`, result.error);
        }
        
        // Small delay between transactions to avoid nonce conflicts
        if (i < completableMissions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        failed.push({ 
          mission: completableMission, 
          error: errorMsg 
        });
        console.error(`❌ Unexpected error processing mission ${missionId}:`, error);
      }
    }

    console.log(`🎯 Mission completion results: ${successful.length} successful, ${failed.length} failed`);

    return { successful, failed };
  }, [executeMissionCompletion]);

  /**
   * Refetches missions from blockchain and updates store
   */
  const refreshMissions = useCallback(async (playerAddress: string): Promise<void> => {
    try {
      console.log("🔄 Refreshing missions from blockchain...");
      
      setMissionsLoading(true);
      
      // Wait a bit for Torii indexing after transactions
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const updatedMissions = await fetchTodayMissions(playerAddress);
      
      console.log(`✅ Refreshed ${updatedMissions.length} missions from blockchain`);
      
      // Update Zustand store with fresh data
      setMissions(updatedMissions);
      setMissionsError(null);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to refresh missions";
      console.error("❌ Error refreshing missions:", error);
      setMissionsError(errorMsg);
    } finally {
      setMissionsLoading(false);
    }
  }, [fetchTodayMissions, setMissions, setMissionsLoading, setMissionsError]);

  /**
   * Main function: Check and complete missions based on game completion data
   */
  const checkAndCompleteMissions = useCallback(async (
    gameData: GameCompletionData
  ): Promise<CompletableMission[]> => {
    if (!account) {
      setError("No account connected");
      return [];
    }

    setIsCompleting(true);
    setError(null);
    setCompletedMissions([]);

    try {
      console.log("🎯 Starting mission completion check:", gameData);

      // Step 1: Find completable missions from current store data
      const completableMissions = findCompletableMissions(storeMissions, gameData);
      
      if (completableMissions.length === 0) {
        console.log("ℹ️ No missions can be completed with current game data");
        return [];
      }

      console.log(`🎉 Found ${completableMissions.length} completable missions:`, 
        completableMissions.map(cm => ({
          id: cm.mission.id,
          reason: cm.reason
        }))
      );

      // Step 2: Process mission completion transactions
      const { successful, failed } = await processMissionCompletions(completableMissions);

      // Step 3: Handle results
      if (successful.length > 0) {
        console.log(`✅ Successfully completed ${successful.length} missions`);
        setCompletedMissions(successful);

        // Step 4: Refresh missions from blockchain
        await refreshMissions(account.address);
      }

      if (failed.length > 0) {
        const failedErrors = failed.map(f => `Mission ${f.mission.mission.id}: ${f.error}`);
        const errorMessage = `Some missions failed to complete: ${failedErrors.join(', ')}`;
        setError(errorMessage);
        console.error("❌ Some mission completions failed:", failed);
      }

      return successful;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to complete missions";
      setError(errorMessage);
      console.error("❌ Error in mission completion process:", error);
      return [];
    } finally {
      setIsCompleting(false);
    }
  }, [
    account, 
    storeMissions, 
    processMissionCompletions, 
    refreshMissions
  ]);

  /**
   * Clears completed missions list (for UI reset)
   */
  const clearCompletedMissions = useCallback(() => {
    setCompletedMissions([]);
    setError(null);
  }, []);

  return {
    isCompleting,
    error,
    completedMissions,
    checkAndCompleteMissions,
    clearCompletedMissions
  };
};