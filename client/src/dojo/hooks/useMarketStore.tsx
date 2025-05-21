import { useState, useCallback } from "react";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useAccount } from "@starknet-react/core";
import { Account } from "starknet";
import { v4 as uuidv4 } from "uuid";
import useAppStore from "../../zustand/store";
import { Golem, World } from "../bindings";

interface PurchaseResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export const useMarketStore = () => {
  const { useDojoStore, client } = useDojoSDK();
  const state = useDojoStore((state) => state);
  const { account } = useAccount();
  
  // Get data and actions from zustand store
  const { 
    player,
    golems, 
    worlds,
    unlockGolem: updateGolemInStore,
    unlockWorld: updateWorldInStore,
    updatePlayerCoins
  } = useAppStore();
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'PENDING' | 'SUCCESS' | 'REJECTED' | null>(null);

  /**
   * Check if player can afford the price
   */
  const canAfford = useCallback((price: number): boolean => {
    if (!player) return false;
    return player.coins >= price;
  }, [player]);

  /**
   * Get golem by ID
   */
  const getGolemById = useCallback((golemId: number): Golem | undefined => {
    return golems.find(golem => golem.id === golemId);
  }, [golems]);

  /**
   * Get world by ID
   */
  const getWorldById = useCallback((worldId: number): World | undefined => {
    return worlds.find(world => world.id === worldId);
  }, [worlds]);

  /**
   * Purchase a golem
   */
  const purchaseGolem = useCallback(async (golemId: number): Promise<PurchaseResponse> => {
    // Check if transaction is already in progress
    if (isProcessing) {
      return { success: false, error: "Another transaction is in progress" };
    }
    
    // Get golem data
    const golem = getGolemById(golemId);
    if (!golem) {
      return { success: false, error: "Golem not found" };
    }
    
    // Check if golem is already unlocked
    if (golem.is_unlocked) {
      return { success: false, error: "Golem is already unlocked" };
    }
    
    // Check if player has enough coins
    if (!canAfford(golem.price)) {
      return { success: false, error: "Insufficient coins" };
    }
    
    // Check if account exists
    if (!account) {
      return { success: false, error: "Wallet not connected" };
    }
    
    // Start processing
    setIsProcessing(true);
    setTxStatus('PENDING');
    
    // Generate transaction ID for optimistic update
    const transactionId = uuidv4();
    
    try {
      // Update state optimistically
      updateGolemInStore(golemId);
      updatePlayerCoins(player!.coins - golem.price);
      
      // Execute transaction
      console.log(`📤 Executing unlock_golem_store transaction for golemId ${golemId}...`);
      const tx = await client.game.unlockGolemStore(account as Account, golemId);
      
      console.log("📥 Transaction response:", tx);
      
      if (tx?.transaction_hash) {
        setTxHash(tx.transaction_hash);
      }
      
      if (tx && tx.code === "SUCCESS") {
        console.log("🎉 Golem unlocked successfully!");
        setTxStatus('SUCCESS');
        
        // Confirm optimistic update
        state.confirmTransaction(transactionId);
        
        setIsProcessing(false);
        return { 
          success: true,
          transactionHash: tx.transaction_hash 
        };
      } else {
        // Revert optimistic update if transaction failed
        setTxStatus('REJECTED');
        state.revertOptimisticUpdate(transactionId);
        
        // Reset store to original state by reloading golems and player
        // Note: This would ideally call refetch methods from useGolem and usePlayer hooks
        
        throw new Error("Transaction failed with code: " + tx?.code);
      }
    } catch (error) {
      console.error("❌ Error purchasing golem:", error);
      
      // Revert optimistic update
      state.revertOptimisticUpdate(transactionId);
      setTxStatus('REJECTED');
      
      setIsProcessing(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Transaction failed" 
      };
    }
  }, [isProcessing, getGolemById, canAfford, account, player, updateGolemInStore, updatePlayerCoins, client.game, state]);

  /**
   * Purchase a world
   */
  const purchaseWorld = useCallback(async (worldId: number): Promise<PurchaseResponse> => {
    // Check if transaction is already in progress
    if (isProcessing) {
      return { success: false, error: "Another transaction is in progress" };
    }
    
    // Get world data
    const world = getWorldById(worldId);
    if (!world) {
      return { success: false, error: "Map not found" };
    }
    
    // Check if world is already unlocked
    if (world.is_unlocked) {
      return { success: false, error: "Map is already unlocked" };
    }
    
    // Check if player has enough coins
    if (!canAfford(world.price)) {
      return { success: false, error: "Insufficient coins" };
    }
    
    // Check if account exists
    if (!account) {
      return { success: false, error: "Wallet not connected" };
    }
    
    // Start processing
    setIsProcessing(true);
    setTxStatus('PENDING');
    
    // Generate transaction ID for optimistic update
    const transactionId = uuidv4();
    
    try {
      // Update state optimistically
      updateWorldInStore(worldId);
      updatePlayerCoins(player!.coins - world.price);
      
      // Execute transaction
      console.log(`📤 Executing unlock_world_store transaction for worldId ${worldId}...`);
      const tx = await client.game.unlockWorldStore(account as Account, worldId);
      
      console.log("📥 Transaction response:", tx);
      
      if (tx?.transaction_hash) {
        setTxHash(tx.transaction_hash);
      }
      
      if (tx && tx.code === "SUCCESS") {
        console.log("🎉 Map unlocked successfully!");
        setTxStatus('SUCCESS');
        
        // Confirm optimistic update
        state.confirmTransaction(transactionId);
        
        setIsProcessing(false);
        return { 
          success: true,
          transactionHash: tx.transaction_hash 
        };
      } else {
        // Revert optimistic update if transaction failed
        setTxStatus('REJECTED');
        state.revertOptimisticUpdate(transactionId);
        
        throw new Error("Transaction failed with code: " + tx?.code);
      }
    } catch (error) {
      console.error("❌ Error purchasing map:", error);
      
      // Revert optimistic update
      state.revertOptimisticUpdate(transactionId);
      setTxStatus('REJECTED');
      
      setIsProcessing(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Transaction failed" 
      };
    }
  }, [isProcessing, getWorldById, canAfford, account, player, updateWorldInStore, updatePlayerCoins, client.game, state]);

  return {
    // Data
    isProcessing,
    txHash,
    txStatus,
    
    // Methods
    canAfford,
    purchaseGolem,
    purchaseWorld,
    getGolemById,
    getWorldById
  };
};