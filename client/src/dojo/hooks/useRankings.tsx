import { useEffect, useState, useMemo, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { Ranking } from '../bindings';

// Estructura para el jugador formateado en el ranking
export interface RankingPlayer {
  id: string;        // Dirección del jugador (address)
  name: string;      // Nombre para mostrar (derivado de la dirección)
  score: number;     // Puntos del jugador
  rank: number;      // Posición en el ranking
  isCurrentUser: boolean; // Indica si es el usuario actual
}

// Estructura de retorno del hook
interface UseRankingsReturn {
  globalRankings: RankingPlayer[];
  mapRankings: Record<number, RankingPlayer[]>;
  currentUserRanking: RankingPlayer | null;
  isLoading: boolean;
  isLoadingMap: Record<number, boolean>; // Estado de carga por mapa
  error: Error | null;
  refetch: () => Promise<void>;
  fetchRankingForMap: (mapId: number) => Promise<void>; // Nueva función para cargar un mapa específico
}

// URL de Torii GraphQL
const TORII_URL = dojoConfig.toriiUrl + "/graphql";

/**
 * Convierte un valor hexadecimal a número
 */
const hexToNumber = (hexValue: string): number => {
  if (!hexValue || !hexValue.startsWith('0x')) {
    return 0;
  }
  
  try {
    return parseInt(hexValue, 16);
  } catch (error) {
    console.error(`Error converting hex value ${hexValue} to number:`, error);
    return 0;
  }
};

/**
 * Convierte un número a su representación hexadecimal
 */
const numberToHex = (num: number): string => {
  return `0x${num.toString(16)}`;
};

/**
 * Formatea una dirección a un nombre de usuario corto
 */
const formatAddressToName = (address: string): string => {
  if (!address || address.length < 10) return "Unknown";
  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return `${start}...${end}`;
};

/**
 * Consulta todos los rankings
 */
const fetchAllRankings = async (): Promise<Record<number, Ranking[]>> => {
  const query = `
    query GetAllRankings {
      golemRunnerRankingModels(first: 1000) {
        edges {
          node {
            world_id
            player
            points
          }
        }
        totalCount
      }
    }
  `;
  
  return executeRankingQuery(query);
};

/**
 * Consulta rankings para un mapa específico
 */
const fetchRankingsByWorldId = async (worldId: number): Promise<Record<number, Ranking[]>> => {
  // Convertir el ID a formato hexadecimal para la consulta
  const worldIdHex = numberToHex(worldId);
  
  const query = `
    query GetRankingsForWorld {
      golemRunnerRankingModels(
        where: { world_id: "${worldIdHex}" }
        first: 100
      ) {
        edges {
          node {
            world_id
            player
            points
          }
        }
        totalCount
      }
    }
  `;
  
  return executeRankingQuery(query);
};

/**
 * Ejecuta una consulta GraphQL y procesa los resultados
 */
const executeRankingQuery = async (query: string): Promise<Record<number, Ranking[]>> => {
  try {
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();
    
    if (!result.data?.golemRunnerRankingModels?.edges) {
      console.log("No ranking data found in query result");
      return {};
    }

    // Agrupar rankings por world_id
    const rankingsByWorldId: Record<number, Ranking[]> = {};
    
    // Procesar cada ranking
    result.data.golemRunnerRankingModels.edges.forEach((edge: any) => {
      const node = edge.node;
      
      // Convertir world_id y points de hex a número
      const worldId = hexToNumber(node.world_id);
      const points = hexToNumber(node.points);
      
      // Crear objeto de ranking
      const ranking: Ranking = {
        world_id: worldId,
        player: node.player,
        points: points
      };
      
      // Agrupar por world_id
      if (!rankingsByWorldId[worldId]) {
        rankingsByWorldId[worldId] = [];
      }
      
      rankingsByWorldId[worldId].push(ranking);
    });
    
    // Ordenar cada grupo por puntos (de mayor a menor)
    Object.keys(rankingsByWorldId).forEach((worldIdStr) => {
      const numWorldId = parseInt(worldIdStr);
      rankingsByWorldId[numWorldId].sort((a, b) => b.points - a.points);
    });
    
    return rankingsByWorldId;
  } catch (error) {
    console.error("Error executing ranking query:", error);
    throw error;
  }
};

// Hook principal
export const useRankings = (): UseRankingsReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMap, setIsLoadingMap] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<Error | null>(null);
  const [rankingsByWorldId, setRankingsByWorldId] = useState<Record<number, Ranking[]>>({});
  const { account } = useAccount();
  
  // Dirección del usuario actual formateada
  const userAddress = useMemo(() => 
    account ? addAddressPadding(account.address).toLowerCase() : '', 
    [account]
  );

  // Función para obtener todos los rankings
  const refetch = useCallback(async () => {
    if (!account) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Fetching all rankings data...");
      const rankings = await fetchAllRankings();
      console.log("All rankings data fetched:", rankings);
      
      // Actualizar el estado con los nuevos rankings
      setRankingsByWorldId(prevRankings => ({
        ...prevRankings,
        ...rankings
      }));
    } catch (err) {
      console.error("Error fetching all rankings:", err);
      const error = err instanceof Error ? err : new Error('Error desconocido al obtener rankings');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  // Función para obtener rankings de un mapa específico
  const fetchRankingForMap = useCallback(async (mapId: number) => {
    if (!account) return;

    try {
      // Marcar este mapa específico como cargando
      setIsLoadingMap(prev => ({ ...prev, [mapId]: true }));
      
      console.log(`Fetching rankings for map ID ${mapId}...`);
      const mapRankings = await fetchRankingsByWorldId(mapId);
      console.log(`Rankings for map ID ${mapId} fetched:`, mapRankings);
      
      // Actualizar solo los rankings de este mapa
      setRankingsByWorldId(prevRankings => ({
        ...prevRankings,
        ...mapRankings
      }));
    } catch (err) {
      console.error(`Error fetching rankings for map ID ${mapId}:`, err);
      // No actualizamos el error global para no interrumpir la UI completa
    } finally {
      // Marcar como ya no cargando
      setIsLoadingMap(prev => ({ ...prev, [mapId]: false }));
    }
  }, [account]);

  // Efecto para cargar rankings iniciales
  useEffect(() => {
    if (userAddress) {
      refetch();
    } else {
      setIsLoading(false);
    }
  }, [userAddress, refetch]);

  // Procesar los rankings globales (world_id = 1, que es 0x1 en hex)
  const globalRankings = useMemo((): RankingPlayer[] => {
    const rankings = rankingsByWorldId[1] || []; // Usamos 1 porque 0x1 es el global
    
    return rankings.map((ranking, index) => ({
      id: ranking.player,
      name: formatAddressToName(ranking.player),
      score: ranking.points,
      rank: index + 1,
      isCurrentUser: ranking.player.toLowerCase() === userAddress.toLowerCase()
    }));
  }, [rankingsByWorldId, userAddress]);

  // Procesar los rankings por mapa
  const mapRankings = useMemo((): Record<number, RankingPlayer[]> => {
    const result: Record<number, RankingPlayer[]> = {};
    
    Object.keys(rankingsByWorldId).forEach(worldIdStr => {
      const worldId = parseInt(worldIdStr);
      if (worldId === 1) return; // Omitir el ranking global
      
      const rankings = rankingsByWorldId[worldId] || [];
      
      result[worldId] = rankings.map((ranking, index) => ({
        id: ranking.player,
        name: formatAddressToName(ranking.player),
        score: ranking.points,
        rank: index + 1,
        isCurrentUser: ranking.player.toLowerCase() === userAddress.toLowerCase()
      }));
    });
    
    return result;
  }, [rankingsByWorldId, userAddress]);

  // Obtener el ranking del usuario actual
  const currentUserRanking = useMemo((): RankingPlayer | null => {
    // Buscar primero en el ranking global
    const globalUser = globalRankings.find(r => r.isCurrentUser);
    if (globalUser) return globalUser;
    
    // Si no está en el global, buscar en los mapas
    for (const worldId in mapRankings) {
      const mapUser = mapRankings[worldId].find(r => r.isCurrentUser);
      if (mapUser) return mapUser;
    }
    
    // Si no tiene ranking, crear uno predeterminado
    if (userAddress) {
      return {
        id: userAddress,
        name: formatAddressToName(userAddress),
        score: 0,
        rank: globalRankings.length + 1, // Último lugar
        isCurrentUser: true
      };
    }
    
    return null;
  }, [globalRankings, mapRankings, userAddress]);

  return {
    globalRankings,
    mapRankings,
    currentUserRanking,
    isLoading,
    isLoadingMap,
    error,
    refetch,
    fetchRankingForMap
  };
};
