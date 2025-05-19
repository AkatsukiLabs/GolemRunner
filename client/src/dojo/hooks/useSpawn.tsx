import { useState, useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAccount } from "@starknet-react/core";
import { Account } from "starknet";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useStarknetConnect } from "./useStarknetConnect";
import { usePlayer } from "./usePlayer";
import useAppStore from "../../zustand/store";

// Types
interface InitializeState {
  isInitializing: boolean;
  error: string | null;
  completed: boolean;
  step: 'checking' | 'spawning' | 'loading' | 'success';
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
}

interface InitializeResponse {
  success: boolean;
  playerExists: boolean;
  transactionHash?: string;
  error?: string;
}

export const useSpawnPlayer = () => {
  const { useDojoStore, client } = useDojoSDK();
  const state = useDojoStore((state) => state);
  const { account } = useAccount();
  const { status } = useStarknetConnect();
  const { player, isLoading: playerLoading, refetch: refetchPlayer } = usePlayer();
  const { setPlayer, setLoading } = useAppStore();

  // Ref to prevent multiple executions
  const isInitializingRef = useRef(false);
  const hasExecutedRef = useRef(false);

  // Local state
  const [initState, setInitState] = useState<InitializeState>({
    isInitializing: false,
    error: null,
    completed: false,
    step: 'checking',
    txHash: null,
    txStatus: null
  });

  /**
   * Check if player exists and initialize accordingly
   * This function handles both existing players and new player creation
   */
  const initializePlayer = useCallback(async (): Promise<InitializeResponse> => {
    // Prevenir ejecuciones múltiples
    if (isInitializingRef.current || hasExecutedRef.current) {
      console.log("🚫 Initialize already in progress or completed");
      return { success: false, playerExists: false, error: "Already initialized" };
    }

    // Validation: Check if wallet is connected
    if (status !== "connected") {
      const error = "Wallet not connected. Please connect your wallet first.";
      setInitState(prev => ({ ...prev, error }));
      return { success: false, playerExists: false, error };
    }

    // Validation: Check if account exists
    if (!account) {
      const error = "No account found. Please connect your wallet.";
      setInitState(prev => ({ ...prev, error }));
      return { success: false, playerExists: false, error };
    }

    // Mark as initializing
    isInitializingRef.current = true;
    hasExecutedRef.current = true;

    const transactionId = uuidv4();

    try {
      // Step 1: Check if player exists
      setInitState(prev => ({ 
        ...prev, 
        isInitializing: true, 
        error: null,
        step: 'checking'
      }));

      console.log("🎮 Starting player initialization...");

      // Wait for player loading to complete if it's still loading
      let attempts = 0;
      while (playerLoading && attempts < 50) { // Max 5 seconds
        console.log("⏳ Waiting for player data...");
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      // Refetch player data to ensure we have the latest information
      console.log("🔄 Fetching latest player data...");
      await refetchPlayer();

      // Get latest player state after refetch
      const latestPlayer = player;
      
      // Check if player exists (non-null and has a valid address)
      const playerExists = latestPlayer && latestPlayer.address && latestPlayer.address !== "0x0";
      
      console.log("🎮 Player check:", { 
        playerExists: !!playerExists, 
        playerAddress: latestPlayer?.address,
        accountAddress: account.address 
      });

      if (playerExists) {
        // Step 2a: Player exists - load data and continue
        console.log("✅ Player already exists, continuing with existing data...");
        
        setInitState(prev => ({ 
          ...prev, 
          step: 'loading'
        }));

        // Ensure player data is in the store
        setPlayer(latestPlayer);
        
        // Small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setInitState(prev => ({ 
          ...prev, 
          completed: true,
          isInitializing: false,
          step: 'success'
        }));

        return { 
          success: true, 
          playerExists: true 
        };

      } else {
        // Step 2b: Player doesn't exist - spawn new player
        console.log("🆕 Player does not exist, spawning new player...");
        
        setInitState(prev => ({ 
          ...prev, 
          step: 'spawning',
          txStatus: 'PENDING'
        }));

        // Execute spawn transaction
        console.log("📤 Executing spawn transaction...");
        const spawnTx = await client.game.spawnPlayer(account as Account);
        
        console.log("📥 Spawn transaction response:", spawnTx);
        
        // Update transaction hash
        if (spawnTx?.transaction_hash) {
          setInitState(prev => ({ 
            ...prev, 
            txHash: spawnTx.transaction_hash
          }));
        }
        
        // Check transaction success
        if (spawnTx && spawnTx.code === "SUCCESS") {
          console.log("🎉 Player spawned successfully!");
          
          // Update transaction status
          setInitState(prev => ({ 
            ...prev, 
            txStatus: 'SUCCESS'
          }));
          
          // Wait for transaction to be processed
          console.log("⏳ Waiting for transaction to be processed...");
          await new Promise(resolve => setTimeout(resolve, 2500));
          
          // Refetch player data to get the newly created player
          console.log("🔄 Refetching player data after spawn...");
          await refetchPlayer();
          
          setInitState(prev => ({ 
            ...prev, 
            completed: true,
            isInitializing: false,
            step: 'success'
          }));
          
          // Confirm transaction in store
          state.confirmTransaction(transactionId);
          
          return { 
            success: true, 
            playerExists: false,
            transactionHash: spawnTx.transaction_hash 
          };
        } else {
          // Update transaction status to rejected
          setInitState(prev => ({ 
            ...prev, 
            txStatus: 'REJECTED'
          }));
          throw new Error("Spawn transaction failed with code: " + spawnTx?.code);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to initialize player. Please try again.";
      
      console.error("❌ Error initializing player:", error);
      
      // Revert optimistic update if applicable
      state.revertOptimisticUpdate(transactionId);
      
      // Update transaction status to rejected if there was a transaction
      if (initState.txHash) {
        setInitState(prev => ({ 
          ...prev, 
          txStatus: 'REJECTED'
        }));
      }
      
      setInitState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isInitializing: false,
        step: 'checking'
      }));
      
      return { success: false, playerExists: false, error: errorMessage };
    } finally {
      isInitializingRef.current = false;
    }
  }, [status, account]); 

  /**
   * Reset initialization state (useful for retry scenarios)
   */
  const resetInitializer = useCallback(() => {
    console.log("🔄 Resetting initializer state...");
    hasExecutedRef.current = false;
    isInitializingRef.current = false;
    setInitState({
      isInitializing: false,
      error: null,
      completed: false,
      step: 'checking',
      txHash: null,
      txStatus: null
    });
  }, []);

  // Sync loading state with store
  useEffect(() => {
    setLoading(initState.isInitializing || playerLoading);
  }, [initState.isInitializing, playerLoading, setLoading]);

  // Cleanup for unmounted component
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up spawn player hook...");
      isInitializingRef.current = false;
      hasExecutedRef.current = false;
    };
  }, []);

  return {
    // State
    isInitializing: initState.isInitializing,
    error: initState.error,
    completed: initState.completed,
    currentStep: initState.step,
    txHash: initState.txHash,
    txStatus: initState.txStatus,
    isConnected: status === "connected",
    playerExists: !!(player && player.address && player.address !== "0x0"),
    
    // Actions
    initializePlayer,
    resetInitializer
  };
};
