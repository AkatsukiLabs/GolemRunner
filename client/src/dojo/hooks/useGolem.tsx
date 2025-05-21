import { useEffect, useState, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding, CairoCustomEnum } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { Golem } from '../bindings';
import useAppStore from '../../zustand/store';

// Types
interface GolemEdge {
  node: RawGolemNode;
}

// Define the Golem interface 
interface RawGolemNode {
  id: string;
  player_id: string;
  name: string;
  description: string;
  price: string;
  rarity: string;
  is_starter: boolean | string;
  is_unlocked: boolean | string;
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
  query GetGolems($playerAddress: ContractAddress!) {
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

    return result.data.golemRunnerGolemModels.edges.map((edge: GolemEdge) => {
      const rawNode = edge.node;
      
      const convertHexToString = (hex: string): string => {
        // If not a hex string, return as is
        if (!hex || !hex.startsWith('0x')) {
          return hex;
        }
        
        // Delete the '0x' prefix and convert hex to string
        const hexWithoutPrefix = hex.slice(2);
        let string = '';
        
        for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
          const hexPair = hexWithoutPrefix.substring(i, i + 2);
          const char = String.fromCharCode(parseInt(hexPair, 16));
          string += char;
        }
        
        return string;
      };
      
      const convertHexToInt = (hex: string): number => {
        if (!hex || !hex.startsWith('0x')) {
          return parseInt(hex, 10) || 0;
        }
        return parseInt(hex, 16) || 0;
      };
      
      // Convert boolean strings to boolean values
      const convertToBool = (value: boolean | string): boolean => {
        if (typeof value === 'boolean') return value;
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value.startsWith('0x')) return parseInt(value, 16) !== 0;
        return Boolean(value);
      };

      // Create a custom enum for rarity
      const convertToRarityEnum = (rarityString: string): CairoCustomEnum => {
        return new CairoCustomEnum({
          Basic: rarityString === "Basic" ? rarityString : undefined,
          Common: rarityString === "Common" ? rarityString : undefined,
          Uncommon: rarityString === "Uncommon" ? rarityString : undefined,
          Rare: rarityString === "Rare" ? rarityString : undefined,
          VeryRare: rarityString === "VeryRare" ? rarityString : undefined,
          Epic: rarityString === "Epic" ? rarityString : undefined,
          Unique: rarityString === "Unique" ? rarityString : undefined,
        });
      };
      
      // Generate new Golem object with converted values
      const convertedGolem: Golem = {
        id: convertHexToInt(rawNode.id),
        player_id: rawNode.player_id,
        name: convertHexToString(rawNode.name),
        description: convertHexToString(rawNode.description),
        price: convertHexToInt(rawNode.price),
        rarity: convertToRarityEnum(rawNode.rarity),
        is_starter: convertToBool(rawNode.is_starter),
        is_unlocked: convertToBool(rawNode.is_unlocked)
      };
      
      return convertedGolem;
    });
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
  const { golems: storeGolems, setGolems, setLoading, setError: setStoreError } = useAppStore();

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
      setLoading(false);
      return;
    }

    try {
      setLoading(true);  
      setStoreError(null); 
      
      const golemsData = await fetchGolemsData(userAddress);
      setGolems(golemsData);
    } catch (err) {
      setStoreError(err instanceof Error ? err.message : String(err));
      setGolems([]);
    } finally {
      setLoading(false);    
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