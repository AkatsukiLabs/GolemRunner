import { useEffect, useState, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { Player } from '../../dojo/bindings';
import useAppStore from '../../zustand/store';

// Types
interface UsePlayerReturn {
  player: Player | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const PLAYER_QUERY = `
  query GetPlayer($playerAddress: ContractAddress!) {
    golemRunnerPlayerModels(where: { address: $playerAddress }) {
      edges {
        node {
          address
          coins
          total_points
          daily_streak
          last_active_day
          level
          experience
          creation_day
        }
      }
      totalCount
    }
  }
`;

// API Functions
const fetchPlayerData = async (playerAddress: string): Promise<Player | null> => {
  try {
    console.log("Fetching player with address:", playerAddress);
    
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query: PLAYER_QUERY,
        variables: { playerAddress }
      }),
    });

    const result = await response.json();
    console.log("GraphQL response:", result);
    
    if (!result.data?.golemRunnerPlayerModels?.edges?.length) {
      console.log("No player found in response");
      return null; // Player not found
    }

    // Extract player data
    const rawPlayerData = result.data.golemRunnerPlayerModels.edges[0].node;
    console.log("[usePlayer] Raw player data extracted:", rawPlayerData);
    
    // Convert hex values to numbers
    const playerData: Player = {
      address: rawPlayerData.address,
      coins: hexToNumber(rawPlayerData.coins),
      //coins: 999999,
      daily_streak: hexToNumber(rawPlayerData.daily_streak),
      last_active_day: hexToNumber(rawPlayerData.last_active_day),
      total_points: hexToNumber(rawPlayerData.total_points),
      level: hexToNumber(rawPlayerData.level),
      experience: hexToNumber(rawPlayerData.experience),
      creation_day: hexToNumber(rawPlayerData.creation_day)
    };
    
    console.log("Player data after conversion:", playerData);
    
    return playerData;
  } catch (error) {
    console.error("Error fetching player:", error);
    throw error;
  }
};

// Helper to convert hex strings to numbers
const hexToNumber = (hexValue: string | number): number => {
  // If it's already a number, return it
  if (typeof hexValue === 'number') return hexValue;
  
  // If it's a hex string, convert it
  if (typeof hexValue === 'string' && hexValue.startsWith('0x')) {
    return parseInt(hexValue, 16);
  }
  
  // If it's a string but not hex, try to parse it as number
  if (typeof hexValue === 'string') {
    return parseInt(hexValue, 10);
  }
  
  // Fallback
  return 0;
};

// Hook
export const usePlayer = (): UsePlayerReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { account } = useAccount();
  
  // Get and set player from/to store
  const storePlayer = useAppStore(state => state.player);
  const setPlayer = useAppStore(state => state.setPlayer);

  // Memoize the formatted user address
  const userAddress = useMemo(() => 
    account ? addAddressPadding(account.address).toLowerCase() : '', 
    [account]
  );

  // Function to fetch and update player data
  const refetch = async () => {
    if (!userAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const playerData = await fetchPlayerData(userAddress);
      console.log("Player data fetched:", playerData);
      
      // Update store with player data
      setPlayer(playerData);
      
      // Check if player was set in store
      const updatedPlayer = useAppStore.getState().player;
      console.log("Player in store after update:", updatedPlayer);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error("Error in refetch:", error);
      setError(error);
      setPlayer(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch player data when address changes
  useEffect(() => {
    if (userAddress) {
      console.log("Address changed, refetching player data");
      refetch();
    }
  }, [userAddress]);

  // Effect to sync with account changes
  useEffect(() => {
    if (!account) {
      console.log("No account, clearing player data");
      setPlayer(null);
      setError(null);
      setIsLoading(false);
    }
  }, [account, setPlayer]);

  return {
    player: storePlayer,
    isLoading,
    error,
    refetch
  };
};