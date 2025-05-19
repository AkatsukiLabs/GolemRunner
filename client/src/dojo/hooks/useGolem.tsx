import { useEffect, useState, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { Golem } from '../bindings';
import useAppStore from '../../zustand/store';

// Types
interface GolemEdge {
  node: Golem;
}

interface UseGolemsReturn {
  golems: Golem[];
  unlockedGolems: Golem[];
  starterGolems: Golem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const GOLEMS_QUERY = `
  query GetGolems($playerAddress: String!) {
    golemRunnerGolemModels(
      where: { player_id: $playerAddress }
      first: 1000
    ) {
      edges {
        node {
          id
          player_id
          name
          description
          price
          rarity
          is_starter
          is_unlocked
        }
      }
      totalCount
    }
  }
`;

// API Functions
const fetchGolemsData = async (playerAddress: string): Promise<Golem[]> => {
  try {
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query: GOLEMS_QUERY,
        variables: { playerAddress }
      }),
    });

    const result = await response.json();
    
    if (!result.data?.golemRunnerGolemModels?.edges) {
      return [];
    }

    return result.data.golemRunnerGolemModels.edges.map((edge: GolemEdge) => edge.node);
  } catch (error) {
    console.error("Error fetching golems:", error);
    throw error;
  }
};

// Hook
export const useGolems = (): UseGolemsReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { account } = useAccount();
  const { golems: storeGolems, setGolems } = useAppStore();

  // Memoize the formatted user address
  const userAddress = useMemo(() => 
    account ? addAddressPadding(account.address).toLowerCase() : '', 
    [account]
  );

  // Memoize filtered golems
  const filteredGolems = useMemo(() => {
    const unlocked = storeGolems.filter(golem => golem.is_unlocked);
    const starters = storeGolems.filter(golem => golem.is_starter);
    
    return {
      unlockedGolems: unlocked,
      starterGolems: starters
    };
  }, [storeGolems]);

  // Function to fetch and update golems data
  const refetch = async () => {
    if (!userAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const golemsData = await fetchGolemsData(userAddress);
      setGolems(golemsData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      setGolems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch golems data when address changes
  useEffect(() => {
    refetch();
  }, [userAddress]);

  // Effect to sync with account changes
  useEffect(() => {
    if (!account) {
      setGolems([]);
      setError(null);
      setIsLoading(false);
    }
  }, [account, setGolems]);

  return {
    golems: storeGolems,
    unlockedGolems: filteredGolems.unlockedGolems,
    starterGolems: filteredGolems.starterGolems,
    isLoading,
    error,
    refetch
  };
};