import { useEffect, useState, useMemo, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { Ranking } from '../bindings';
import { lookupAddresses } from '@cartridge/controller';

// Structure for a formatted player in the ranking
export interface RankingPlayer {
    id: string;        // Player's address
    name: string;      // Real name obtained from Cartridge Controller
    score: number;     // Player's points
    rank: number;      // Position in the ranking
    isCurrentUser: boolean; // Indicates if it's the current user
}

// Hook return structure
interface UseRankingsReturn {
    globalRankings: RankingPlayer[];
    mapRankings: Record<number, RankingPlayer[]>;
    currentUserRanking: RankingPlayer | null;
    isLoading: boolean;
    isLoadingMap: Record<number, boolean>;
    error: Error | null;
    refetch: () => Promise<void>;
    fetchRankingForMap: (mapId: number) => Promise<void>;
}

// Torii GraphQL URL
const TORII_URL = dojoConfig.toriiUrl + "/graphql";

/**
 * Normalizes an address for consistent comparison
 */
const normalizeAddress = (address: string): string => {
    if (!address) return '';
    
    // Add padding if necessary and convert to lowercase
    const paddedAddress = address.startsWith('0x') 
        ? addAddressPadding(address) 
        : addAddressPadding(`0x${address}`);
    
    return paddedAddress.toLowerCase();
};

/**
 * Converts a hexadecimal value to a number
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
 * Converts a number to its hexadecimal representation
 */
const numberToHex = (num: number): string => {
    return `0x${num.toString(16)}`;
};

/**
 * Formats an address to a short username (fallback)
 */
const formatAddressToName = (address: string): string => {
    if (!address || address.length < 10) return "Unknown";
    const start = address.slice(0, 6);
    const end = address.slice(-4);
    return `${start}...${end}`;
};

/**
 * Retrieves real usernames using Cartridge Controller
 */
const getUserNames = async (addresses: string[]): Promise<Map<string, string>> => {
    try {
        // Filter unique and valid addresses (use ORIGINAL addresses)
        const uniqueAddresses = addresses.filter((address, index, self) =>
            address && 
            address.length > 0 && 
            self.indexOf(address) === index
        );

        if (uniqueAddresses.length === 0) {
            return new Map();
        }

        console.log("🔍 Looking up usernames for addresses (original format):", uniqueAddresses);
        
        // Use lookupAddresses from Cartridge Controller with ORIGINAL addresses
        const addressMap = await lookupAddresses(uniqueAddresses);
        
        console.log("📋 Username lookup results:", Object.fromEntries(addressMap));
        return addressMap;
    } catch (error) {
        console.error("❌ Error looking up usernames:", error);
        // Return an empty Map in case of error to use fallbacks
        return new Map();
    }
};

/**
 * Processes rankings and assigns usernames
 */
const processRankingsWithUsernames = async (
    rankingsByWorldId: Record<number, Ranking[]>,
    userAddress: string
): Promise<Record<number, RankingPlayer[]>> => {
    try {
        console.log("🎯 Processing rankings with usernames for user:", userAddress);

        // Extract all unique addresses from all rankings (WITHOUT normalizing)
        const allAddresses: string[] = [];
        Object.values(rankingsByWorldId).forEach(rankings => {
            rankings.forEach(ranking => {
                if (ranking.player && !allAddresses.includes(ranking.player)) {
                    allAddresses.push(ranking.player);
                }
            });
        });

        console.log("📝 All addresses found in rankings (original):", allAddresses);

        // Retrieve usernames using ORIGINAL addresses
        const usernameMap = await getUserNames(allAddresses);
        console.log("📋 Username map from Cartridge:", Object.fromEntries(usernameMap));

        // Normalize ONLY the user's address for comparisons
        const normalizedUserAddress = normalizeAddress(userAddress);
        console.log("🎯 Normalized user address for comparison:", normalizedUserAddress);

        // Process each world_id
        const result: Record<number, RankingPlayer[]> = {};
        
        Object.keys(rankingsByWorldId).forEach(worldIdStr => {
            const worldId = parseInt(worldIdStr);
            const rankings = rankingsByWorldId[worldId] || [];
            
            console.log(`🌍 Processing world ${worldId} with ${rankings.length} rankings`);
            
            result[worldId] = rankings.map((ranking, index) => {
                // Retrieve real name using the ORIGINAL address from the ranking
                const realName = usernameMap.get(ranking.player);
                const displayName = realName || formatAddressToName(ranking.player);
                
                // For current user comparison, normalize both addresses
                const normalizedRankingAddress = normalizeAddress(ranking.player);
                const isCurrentUser = normalizedRankingAddress === normalizedUserAddress;
                
                console.log(`👤 Player ${index + 1}:`, {
                    originalAddress: ranking.player,
                    realName,
                    displayName,
                    isCurrentUser,
                    normalizedRankingAddress,
                    normalizedUserAddress
                });
                
                return {
                    id: ranking.player, // Keep the original address as ID
                    name: displayName,
                    score: ranking.points,
                    rank: index + 1,
                    isCurrentUser
                };
            });
        });
        
        console.log("✅ Processed rankings result:", result);
        return result;
    } catch (error) {
        console.error("❌ Error processing rankings with usernames:", error);
        
        // In case of error, process without real names but with correct user identification
        const normalizedUserAddress = normalizeAddress(userAddress);
        const result: Record<number, RankingPlayer[]> = {};
        
        Object.keys(rankingsByWorldId).forEach(worldIdStr => {
            const worldId = parseInt(worldIdStr);
            const rankings = rankingsByWorldId[worldId] || [];
            
            result[worldId] = rankings.map((ranking, index) => {
                const normalizedRankingAddress = normalizeAddress(ranking.player);
                const isCurrentUser = normalizedRankingAddress === normalizedUserAddress;
                
                return {
                    id: ranking.player,
                    name: formatAddressToName(ranking.player),
                    score: ranking.points,
                    rank: index + 1,
                    isCurrentUser
                };
            });
        });
        
        return result;
    }
};

/**
 * Fetches all rankings
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
 * Fetches rankings for a specific map
 */
const fetchRankingsByWorldId = async (worldId: number): Promise<Record<number, Ranking[]>> => {
    // Convert the ID to hexadecimal format for the query
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
 * Executes a GraphQL query and processes the results
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

        // Group rankings by world_id
        const rankingsByWorldId: Record<number, Ranking[]> = {};
        
        // Process each ranking
        result.data.golemRunnerRankingModels.edges.forEach((edge: any) => {
            const node = edge.node;
            
            // Convert world_id and points from hex to number
            const worldId = hexToNumber(node.world_id);
            const points = hexToNumber(node.points);
            
            // Create ranking object
            const ranking: Ranking = {
                world_id: worldId,
                player: node.player,
                points: points
            };
            
            // Group by world_id
            if (!rankingsByWorldId[worldId]) {
                rankingsByWorldId[worldId] = [];
            }
            
            rankingsByWorldId[worldId].push(ranking);
        });
        
        // Sort each group by points (descending)
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

// Main hook
export const useRankings = (): UseRankingsReturn => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoadingMap, setIsLoadingMap] = useState<Record<number, boolean>>({});
    const [error, setError] = useState<Error | null>(null);
    const [rankingsByWorldId, setRankingsByWorldId] = useState<Record<number, Ranking[]>>({});
    const [processedRankings, setProcessedRankings] = useState<Record<number, RankingPlayer[]>>({});
    const { account } = useAccount();
    
    // Current user's formatted and normalized address
    const userAddress = useMemo(() => {
        if (!account?.address) return '';
        
        const normalizedAddr = normalizeAddress(account.address);
        console.log("🎯 Current user address:", {
            original: account.address,
            normalized: normalizedAddr
        });
        return normalizedAddr;
    }, [account]);

    // Process rankings with usernames when data changes
    useEffect(() => {
        const processRankings = async () => {
            if (Object.keys(rankingsByWorldId).length === 0 || !userAddress) {
                setProcessedRankings({});
                return;
            }

            console.log("🔄 Processing rankings with usernames...");
            const processed = await processRankingsWithUsernames(rankingsByWorldId, userAddress);
            setProcessedRankings(processed);
            console.log("✅ Rankings processed with usernames:", processed);
        };

        processRankings();
    }, [rankingsByWorldId, userAddress]);

    // Function to fetch all rankings
    const refetch = useCallback(async () => {
        if (!account) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            
            console.log("📥 Fetching all rankings data...");
            const rankings = await fetchAllRankings();
            console.log("📋 All rankings data fetched:", rankings);
            
            // Update state with new rankings (not processed yet)
            setRankingsByWorldId(prevRankings => ({
                ...prevRankings,
                ...rankings
            }));
        } catch (err) {
            console.error("❌ Error fetching all rankings:", err);
            const error = err instanceof Error ? err : new Error('Unknown error fetching rankings');
            setError(error);
        } finally {
            setIsLoading(false);
        }
    }, [account]);

    // Function to fetch rankings for a specific map
    const fetchRankingForMap = useCallback(async (mapId: number) => {
        if (!account) return;

        try {
            // Mark this specific map as loading
            setIsLoadingMap(prev => ({ ...prev, [mapId]: true }));
            
            console.log(`📥 Fetching rankings for map ID ${mapId}...`);
            const mapRankings = await fetchRankingsByWorldId(mapId);
            console.log(`📋 Rankings for map ID ${mapId} fetched:`, mapRankings);
            
            // Update only the rankings for this map
            setRankingsByWorldId(prevRankings => ({
                ...prevRankings,
                ...mapRankings
            }));
        } catch (err) {
            console.error(`❌ Error fetching rankings for map ID ${mapId}:`, err);
            // Do not update the global error to avoid interrupting the entire UI
        } finally {
            // Mark as no longer loading
            setIsLoadingMap(prev => ({ ...prev, [mapId]: false }));
        }
    }, [account]);

    // Effect to load initial rankings
    useEffect(() => {
        if (userAddress) {
            refetch();
        } else {
            setIsLoading(false);
        }
    }, [userAddress, refetch]);

    // Process global rankings (world_id = 1, which is 0x1 in hex)
    const globalRankings = useMemo((): RankingPlayer[] => {
        return processedRankings[1] || [];
    }, [processedRankings]);

    // Process rankings by map
    const mapRankings = useMemo((): Record<number, RankingPlayer[]> => {
        const result: Record<number, RankingPlayer[]> = {};
        
        Object.keys(processedRankings).forEach(worldIdStr => {
            const worldId = parseInt(worldIdStr);
            if (worldId === 1) return; // Skip global ranking
            
            result[worldId] = processedRankings[worldId] || [];
        });
        
        return result;
    }, [processedRankings]);

    // Get the current user's ranking
    const currentUserRanking = useMemo((): RankingPlayer | null => {
        // First look in the global ranking
        const globalUser = globalRankings.find(r => r.isCurrentUser);
        if (globalUser) return globalUser;
        
        // If not in the global ranking, look in the maps
        for (const worldId in mapRankings) {
            const mapUser = mapRankings[worldId].find(r => r.isCurrentUser);
            if (mapUser) return mapUser;
        }
        
        // If the user has no ranking, create a default one
        if (userAddress) {
            return {
                id: userAddress,
                name: formatAddressToName(userAddress), // Use fallback for the current user
                score: 0,
                rank: globalRankings.length + 1, // Last place
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