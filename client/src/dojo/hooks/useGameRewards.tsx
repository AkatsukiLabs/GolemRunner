import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { Account } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";

// Types
interface GameRewardState {
  isProcessing: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
}

interface RewardResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export const useGameRewards = () => {
  const { client } = useDojoSDK();
  const { account } = useAccount();
  
  // Local state to track transaction status
  const [rewardState, setRewardState] = useState<GameRewardState>({
    isProcessing: false,
    error: null,
    txHash: null,
    txStatus: null
  });

  /**
   * Submit game results to blockchain
   * This handles both rewarding the player and updating rankings
   */
  const submitGameResults = useCallback(async (
    score: number, 
    coinsCollected: number, 
    worldId: number
  ): Promise<RewardResponse> => {
    // Prevent multiple executions
    if (rewardState.isProcessing) {
      return { 
        success: false, 
        error: "Already processing a transaction" 
      };
    }
    
    // Validation: Check if account exists
    if (!account) {
      return { 
        success: false, 
        error: "No account found. Please connect your wallet." 
      };
    }

    // Start processing
    setRewardState({
      isProcessing: true,
      error: null,
      txHash: null,
      txStatus: 'PENDING'
    });
    
    try {
      // Execute reward_player transaction
      console.log("📤 Executing reward_player transaction...");
      console.log("Parameters:", { 
        points: score, 
        coinsCollected: coinsCollected
      });
      
      const rewardTx = await client.game.rewardPlayer(
        account as Account, 
        score, 
        coinsCollected
      );
      
      console.log("📥 Reward transaction response:", rewardTx);
      
      if (rewardTx?.transaction_hash) {
        setRewardState(prev => ({
          ...prev,
          txHash: rewardTx.transaction_hash
        }));
      }
      
      if (rewardTx && rewardTx.code === "SUCCESS") {
        console.log("✅ Player reward transaction successful");
        
        // Execute update_player_ranking transaction
        console.log("📤 Executing update_player_ranking transaction...");
        console.log("Parameters:", { 
          worldId, 
          points: score 
        });
        
        const rankingTx = await client.game.updatePlayerRanking(
          account as Account, 
          worldId, 
          score
        );
        
        console.log("📥 Ranking transaction response:", rankingTx);
        
        if (rankingTx && rankingTx.code === "SUCCESS") {
          console.log("✅ Player ranking update successful");
          
          // Update transaction status
          setRewardState({
            isProcessing: false,
            error: null,
            txHash: rewardTx.transaction_hash,
            txStatus: 'SUCCESS'
          });
          
          return { 
            success: true, 
            transactionHash: rewardTx.transaction_hash 
          };
        } else {
          throw new Error("Ranking transaction failed with code: " + rankingTx?.code);
        }
      } else {
        throw new Error("Reward transaction failed with code: " + rewardTx?.code);
      }
    } catch (error) {
      console.error("❌ Error processing game rewards:", error);
      
      // Update error state
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Transaction failed. Please try again.";
      
      setRewardState({
        isProcessing: false,
        error: errorMessage,
        txHash: rewardState.txHash,
        txStatus: 'REJECTED'
      });
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }, [account, client.game, rewardState.isProcessing]);

  return {
    // State
    isProcessing: rewardState.isProcessing,
    error: rewardState.error,
    txHash: rewardState.txHash,
    txStatus: rewardState.txStatus,
    
    // Actions
    submitGameResults
  };
};