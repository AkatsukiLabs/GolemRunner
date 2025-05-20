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

// Definimos una interfaz para los datos crudos de la API
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
      
      // Convertir los valores hexadecimales a texto
      const convertHexToString = (hex: string): string => {
        // Si no es un valor hexadecimal, devolverlo tal cual
        if (!hex || !hex.startsWith('0x')) {
          return hex;
        }
        
        // Eliminar el prefijo 0x y convertir cada par de caracteres a un carácter
        const hexWithoutPrefix = hex.slice(2);
        let string = '';
        
        for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
          const hexPair = hexWithoutPrefix.substring(i, i + 2);
          const char = String.fromCharCode(parseInt(hexPair, 16));
          string += char;
        }
        
        return string;
      };
      
      // Convertir el valor hexadecimal a entero
      const convertHexToInt = (hex: string): number => {
        if (!hex || !hex.startsWith('0x')) {
          return parseInt(hex, 10) || 0;
        }
        return parseInt(hex, 16) || 0;
      };
      
      // Convertir el valor a booleano
      const convertToBool = (value: boolean | string): boolean => {
        if (typeof value === 'boolean') return value;
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value.startsWith('0x')) return parseInt(value, 16) !== 0;
        return Boolean(value);
      };

      // Función para convertir string a CairoCustomEnum para Rarity
      const convertToRarityEnum = (rarityString: string): CairoCustomEnum => {
        // Creamos un nuevo CairoCustomEnum con todos los posibles valores
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
      
      // Generar un nuevo objeto con los valores convertidos
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