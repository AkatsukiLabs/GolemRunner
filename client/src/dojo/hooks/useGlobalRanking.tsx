import { useEffect, useState, useMemo, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { lookupAddresses } from '@cartridge/controller';

// Interface para el modelo Player simplificado
export interface GlobalRankingPlayer {
    address: string;
    total_points: number;
}

// Interface para el jugador formateado en el ranking
export interface GlobalRankingFormatted {
    id: string;
    name: string;
    score: number;
    rank: number;
    isCurrentUser: boolean;
}

// Return type del hook
interface UseGlobalRankingReturn {
    globalRankings: GlobalRankingFormatted[];
    currentUserGlobalRanking: GlobalRankingFormatted | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    hasData: boolean;
}

// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";

// ✅ CORREGIDO: GraphQL Query sin orderBy (sorting en JavaScript)
const GLOBAL_RANKING_QUERY = `
    query GetGlobalRanking {
        golemRunnerPlayerModels(first: 1000) {
            edges {
                node {
                    address
                    total_points
                }
            }
            totalCount
        }
    }
`;

/**
 * Normaliza una dirección para comparaciones consistentes
 */
const normalizeAddress = (address: string): string => {
    if (!address) return '';
    
    const paddedAddress = address.startsWith('0x') 
        ? addAddressPadding(address) 
        : addAddressPadding(`0x${address}`);
    
    return paddedAddress.toLowerCase();
};

/**
 * Convierte valor hexadecimal a número
 */
const hexToNumber = (hexValue: string): number => {
    if (!hexValue) return 0;
    
    if (hexValue.startsWith('0x')) {
        try {
            return parseInt(hexValue, 16);
        } catch (error) {
            console.error(`Error converting hex value ${hexValue}:`, error);
            return 0;
        }
    } else {
        return parseInt(hexValue, 10) || 0;
    }
};

/**
 * Formatea dirección a nombre corto (fallback)
 */
const formatAddressToName = (address: string): string => {
    if (!address || address.length < 10) return "Unknown";
    const start = address.slice(0, 6);
    const end = address.slice(-4);
    return `${start}...${end}`;
};

/**
 * Obtiene nombres reales usando Cartridge Controller
 */
const getUserNames = async (addresses: string[]): Promise<Map<string, string>> => {
    try {
        const uniqueAddresses = addresses.filter((address, index, self) =>
            address && 
            address.length > 0 && 
            self.indexOf(address) === index
        );

        if (uniqueAddresses.length === 0) {
            return new Map();
        }

        console.log("🔍 [GlobalRanking] Looking up usernames for addresses:", uniqueAddresses.length);
        
        const addressMap = await lookupAddresses(uniqueAddresses);
        
        console.log("📋 [GlobalRanking] Username lookup results:", Object.keys(Object.fromEntries(addressMap)).length, "found");
        return addressMap;
    } catch (error) {
        console.error("❌ [GlobalRanking] Error looking up usernames:", error);
        return new Map();
    }
};

/**
 * ✅ CORREGIDO: Fetch global ranking data from Player model
 */
const fetchGlobalRankingData = async (): Promise<GlobalRankingPlayer[]> => {
    console.log("📥 [GlobalRanking] Fetching global ranking data from Player model...");
    
    try {
        const response = await fetch(TORII_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: GLOBAL_RANKING_QUERY }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.errors) {
            console.error("❌ [GlobalRanking] GraphQL errors:", result.errors);
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }
        
        if (!result.data?.golemRunnerPlayerModels?.edges) {
            console.log("⚠️ [GlobalRanking] No global ranking data found");
            return [];
        }

        console.log(`📊 [GlobalRanking] Found ${result.data.golemRunnerPlayerModels.edges.length} total players`);

        // Convert raw data to GlobalRankingPlayer objects
        const players: GlobalRankingPlayer[] = result.data.golemRunnerPlayerModels.edges.map((edge: any, index: number) => {
            const node = edge.node;
            
            const totalPoints = hexToNumber(node.total_points);
            
            console.log(`📄 [GlobalRanking] Player ${index + 1}: ${formatAddressToName(node.address)}, Points: ${totalPoints} (hex: ${node.total_points})`);
            
            return {
                address: node.address,
                total_points: totalPoints
            };
        });
        
        // ✅ NUEVO: Filter players with points and sort by total_points descending
        const playersWithPoints = players.filter(player => player.total_points > 0);
        const sortedPlayers = playersWithPoints.sort((a, b) => b.total_points - a.total_points);
        
        console.log(`✅ [GlobalRanking] Filtered to ${playersWithPoints.length} players with points`);
        console.log(`🔄 [GlobalRanking] Sorted ${sortedPlayers.length} players by total_points (descending)`);
        
        if (sortedPlayers.length > 0) {
            console.log(`🏆 [GlobalRanking] Top 3: ${sortedPlayers.slice(0, 3).map((p, idx) => `${idx + 1}. ${formatAddressToName(p.address)}: ${p.total_points}pts`).join(', ')}`);
        } else {
            console.log("⚠️ [GlobalRanking] No players with points found");
        }
        
        return sortedPlayers;
        
    } catch (error) {
        console.error("❌ [GlobalRanking] Error fetching global ranking:", error);
        throw error;
    }
};

/**
 * ✅ OPTIMIZADO: Process global ranking data with usernames
 */
const processGlobalRankingData = async (
    playersData: GlobalRankingPlayer[],
    userAddress: string
): Promise<GlobalRankingFormatted[]> => {
    console.log("🔄 [GlobalRanking] Processing global ranking data...");
    
    if (playersData.length === 0) {
        console.log("❌ [GlobalRanking] No players data to process");
        return [];
    }
    
    // Get all unique addresses for username lookup
    const allAddresses = playersData.map(p => p.address);
    console.log("👥 [GlobalRanking] Processing usernames for", allAddresses.length, "addresses");
    
    const usernameMap = await getUserNames(allAddresses);
    const normalizedUserAddress = normalizeAddress(userAddress);
    
    console.log("📊 [GlobalRanking] Data already sorted, processing rankings...");
    
    // Convert to GlobalRankingFormatted objects (data is already sorted)
    const formattedRankings: GlobalRankingFormatted[] = playersData.map((player, index) => {
        const realName = usernameMap.get(player.address);
        const displayName = realName || formatAddressToName(player.address);
        
        const normalizedPlayerAddress = normalizeAddress(player.address);
        const isCurrentUser = normalizedPlayerAddress === normalizedUserAddress;
        
        const rank = index + 1; // Rank based on sorted position
        
        const formattedPlayer = {
            id: player.address,
            name: displayName,
            score: player.total_points,
            rank: rank,
            isCurrentUser
        };
        
        if (isCurrentUser) {
            console.log(`🎯 [GlobalRanking] Current user found at rank ${rank}: ${displayName} (${player.total_points} pts)`);
        }
        
        console.log(`👤 [GlobalRanking] Rank ${rank}: ${displayName} (${player.total_points} pts)${isCurrentUser ? ' ← YOU' : ''}`);
        
        return formattedPlayer;
    });
    
    console.log(`✅ [GlobalRanking] Processed ${formattedRankings.length} formatted rankings`);
    
    if (formattedRankings.length > 0) {
        console.log(`🎯 [GlobalRanking] Top 5 global: ${formattedRankings.slice(0, 5).map(p => `${p.rank}. ${p.name}: ${p.score}pts`).join(', ')}`);
    }
    
    return formattedRankings;
};

/**
 * ✅ Hook principal para Global Ranking
 */
export const useGlobalRanking = (): UseGlobalRankingReturn => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [rawPlayersData, setRawPlayersData] = useState<GlobalRankingPlayer[]>([]);
    const [processedRankings, setProcessedRankings] = useState<GlobalRankingFormatted[]>([]);
    
    const { account } = useAccount();
    
    // Current user's normalized address
    const userAddress = useMemo(() => {
        if (!account?.address) return '';
        
        const normalizedAddr = normalizeAddress(account.address);
        console.log("🎯 [GlobalRanking] Current user address:", {
            original: account.address,
            normalized: normalizedAddr
        });
        return normalizedAddr;
    }, [account]);

    // ✅ OPTIMIZADO: Fetch function with better error handling
    const refetch = useCallback(async () => {
        if (!account) {
            console.log("⚠️ [GlobalRanking] No account connected, skipping fetch");
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            
            console.log("🔄 [GlobalRanking] Starting global ranking fetch...");
            
            // Fetch raw data
            const playersData = await fetchGlobalRankingData();
            setRawPlayersData(playersData);
            
            console.log("✅ [GlobalRanking] Global ranking fetch completed");
            
        } catch (err) {
            console.error("❌ [GlobalRanking] Error in refetch:", err);
            const error = err instanceof Error ? err : new Error('Unknown error fetching global ranking');
            setError(error);
            setRawPlayersData([]);
        } finally {
            setIsLoading(false);
        }
    }, [account]);

    // ✅ OPTIMIZADO: Process data whenever raw data or user address changes
    useEffect(() => {
        const processData = async () => {
            if (rawPlayersData.length === 0 || !userAddress) {
                console.log("⚠️ [GlobalRanking] No data to process or no user address");
                setProcessedRankings([]);
                return;
            }

            try {
                console.log("🔄 [GlobalRanking] Processing rankings data...");
                const processed = await processGlobalRankingData(rawPlayersData, userAddress);
                setProcessedRankings(processed);
                console.log("✅ [GlobalRanking] Rankings processing completed");
                
            } catch (error) {
                console.error("❌ [GlobalRanking] Error processing rankings:", error);
                setProcessedRankings([]);
            }
        };

        processData();
    }, [rawPlayersData, userAddress]);

    // Load data on mount
    useEffect(() => {
        if (userAddress) {
            console.log("🚀 [GlobalRanking] Initializing with user address:", userAddress);
            refetch();
        } else {
            console.log("⚠️ [GlobalRanking] No user address, setting loading to false");
            setIsLoading(false);
        }
    }, [userAddress, refetch]);

    // ✅ OPTIMIZADO: Get current user's ranking with better fallback
    const currentUserGlobalRanking = useMemo((): GlobalRankingFormatted | null => {
        // Look for current user in processed rankings
        const globalUser = processedRankings.find(r => r.isCurrentUser);
        
        if (globalUser) {
            console.log("🎯 [GlobalRanking] Current user found in rankings:", globalUser.rank, globalUser.score);
            return globalUser;
        }
        
        // If user has no ranking, create a fallback
        if (userAddress) {
            const fallbackRank = processedRankings.length + 1;
            console.log("🎯 [GlobalRanking] Creating fallback user at rank:", fallbackRank);
            
            return {
                id: userAddress,
                name: "You",
                score: 0,
                rank: fallbackRank,
                isCurrentUser: true
            };
        }
        
        return null;
    }, [processedRankings, userAddress]);

    // Check if we have data
    const hasData = processedRankings.length > 0;

    // ✅ OPTIMIZADO: Debug log final hook return values
    useEffect(() => {
        console.log("🎮 [GlobalRanking] Hook state update:");
        console.log("  Rankings Count:", processedRankings.length);
        console.log("  Has Data:", hasData);
        console.log("  Is Loading:", isLoading);
        console.log("  Error:", error?.message || "None");
        console.log("  Current User Rank:", currentUserGlobalRanking?.rank || "Not found");
        console.log("  Current User Score:", currentUserGlobalRanking?.score || 0);
        
        if (processedRankings.length > 0) {
            console.log("  Top 3:", processedRankings.slice(0, 3).map(p => `${p.rank}. ${p.name}: ${p.score}pts`).join(', '));
        }
        
        if (error) {
            console.log("  Error Details:", error);
        }
    }, [processedRankings, hasData, isLoading, error, currentUserGlobalRanking]);

    return {
        globalRankings: processedRankings,
        currentUserGlobalRanking,
        isLoading,
        error,
        refetch,
        hasData
    };
};