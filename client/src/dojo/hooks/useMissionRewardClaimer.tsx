import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import { getRewardFromDifficulty, type MissionDifficulty } from '../../utils/missionRewards';

interface UseMissionRewardClaimerReturn {
  isClaiming: boolean;
  error: string | null;
  claimMissionReward: (missionId: number, difficulty: MissionDifficulty) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useMissionRewardClaimer = (): UseMissionRewardClaimerReturn => {
  const { client } = useDojoSDK();
  const { account } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Claims mission reward by calling reward_current_mission contract
   * Uses fixed reward amounts based on mission difficulty
   */
  const claimMissionReward = useCallback(async (
    missionId: number,
    difficulty: MissionDifficulty
  ): Promise<{ success: boolean; error?: string }> => {
    if (!account) {
      return { success: false, error: "No account connected" };
    }

    setIsClaiming(true);
    setError(null);

    try {
      // Get fixed reward amount based on difficulty
      const rewardAmount = getRewardFromDifficulty(difficulty);
      
      const tx = await client.game.rewardCurrentMission(
        account as Account,
        missionId,
        rewardAmount  
      );
      
      if (tx && tx.code === "SUCCESS") {
        console.log(`Mission reward claimed successfully for mission ${missionId} with difficulty ${difficulty}`);
        console.log("Transaction:", tx);
        return { success: true };
      } else {
        const errorMsg = `Transaction failed: ${tx?.code || 'Unknown error'}`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown transaction error";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsClaiming(false);
    }
  }, [account, client.game]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isClaiming,
    error,
    claimMissionReward,
    clearError
  };
};