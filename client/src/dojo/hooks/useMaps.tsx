import { useEffect, useState, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { World } from '../bindings';
import useAppStore from '../../zustand/store';

// Types
interface MapEdge {
  node: RawMapNode;
}

// Define the World interface for raw data
interface RawMapNode {
  id: string;
  player_id: string;
  name: string;
  description: string;
  price: string;
  is_starter: boolean | string;
  is_unlocked: boolean | string;
}

interface UseMapsReturn {
  maps: World[];
  unlockedMaps: World[];
  starterMaps: World[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const MAPS_QUERY = `
  query GetMaps($playerAddress: ContractAddress!) {
    golemRunnerWorldModels(
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
          is_starter
          is_unlocked
        }
      }
      totalCount
    }
  }
`;

// API Functions
const fetchMapsData = async (playerAddress: string): Promise<World[]> => {
  try {
    console.log("Fetching maps for player with address:", playerAddress);
    
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        query: MAPS_QUERY,
        variables: { playerAddress }
      }),
    });

    const result = await response.json();
    console.log("GraphQL maps response:", result);
    
    if (!result.data?.golemRunnerWorldModels?.edges) {
      console.log("No maps found in response");
      return [];
    }

    return result.data.golemRunnerWorldModels.edges.map((edge: MapEdge) => {
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
      
      // Generate new World object with converted values
      const convertedMap: World = {
        id: convertHexToInt(rawNode.id),
        player_id: rawNode.player_id,
        name: convertHexToString(rawNode.name),
        description: convertHexToString(rawNode.description),
        price: convertHexToInt(rawNode.price),
        is_starter: convertToBool(rawNode.is_starter),
        is_unlocked: convertToBool(rawNode.is_unlocked)
      };
      
      return convertedMap;
    });
  } catch (error) {
    console.error("Error fetching maps:", error);
    throw error;
  }
};

// Hook
export const useMaps = (): UseMapsReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { account } = useAccount();
const { 
    worlds: storeMaps, 
    setWorlds: setMaps, 
    setLoading, 
    setError: setStoreError 
  } = useAppStore();

  // Memoize the formatted user address
  const userAddress = useMemo(() => 
    account ? addAddressPadding(account.address).toLowerCase() : '', 
    [account]
  );

  // Memoize filtered maps
  const filteredMaps = useMemo(() => {
    const unlocked = storeMaps.filter(map => map.is_unlocked);
    const starters = storeMaps.filter(map => map.is_starter);
    
    return {
      unlockedMaps: unlocked,
      starterMaps: starters
    };
  }, [storeMaps]);

  // Function to fetch and update maps data
  const refetch = async () => {
    if (!userAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);  
      setStoreError(null); 
      
      console.log("Fetching maps data for address:", userAddress);
      const mapsData = await fetchMapsData(userAddress);
      console.log("Maps data fetched:", mapsData);
      
      setMaps(mapsData);
    } catch (err) {
      console.error("Error refetching maps:", err);
      setStoreError(err instanceof Error ? err.message : String(err));
      setMaps([]);
    } finally {
      setLoading(false);    
    }
  };

  // Effect to fetch maps data when address changes
  useEffect(() => {
    if (userAddress) {
      console.log("User address changed, refetching maps data");
      refetch();
    }
  }, [userAddress]);

  // Effect to sync with account changes
  useEffect(() => {
    if (!account) {
      console.log("No account, clearing maps data");
      setMaps([]);
      setError(null);
      setIsLoading(false);
    }
  }, [account, setMaps]);

  return {
    maps: storeMaps,
    unlockedMaps: filteredMaps.unlockedMaps,
    starterMaps: filteredMaps.starterMaps,
    isLoading,
    error,
    refetch
  };
};