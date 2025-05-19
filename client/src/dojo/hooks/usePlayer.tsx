import { useEffect, useState, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { Player } from '../bindings';
import useAppStore from '../../zustand/store';

// Types
interface PlayerEdge {
  node: Player;
}

interface UsePlayerReturn {
  player: Player | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const PLAYER_QUERY = `
  query GetPlayer($playerAddress: String!) {
    golemRunnerPlayerModels(where: { address: $playerAddress }) {
      edges {
        node {
          address
          coins
          total_points
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
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query: PLAYER_QUERY,
        variables: { playerAddress }
      }),
    });

    const result = await response.json();
    
    if (!result.data?.golemRunnerPlayerModels?.edges?.length) {
      return null; // Player not found
    }

    return result.data.golemRunnerPlayerModels.edges[0].node;
  } catch (error) {
    console.error("Error fetching player:", error);
    throw error;
  }
};

// Hook
export const usePlayer = (): UsePlayerReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { account } = useAccount();
  const { player: storePlayer, setPlayer } = useAppStore();

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
      setPlayer(playerData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      setPlayer(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch player data when address changes
  useEffect(() => {
    refetch();
  }, [userAddress]);

  // Effect to sync with account changes
  useEffect(() => {
    if (!account) {
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