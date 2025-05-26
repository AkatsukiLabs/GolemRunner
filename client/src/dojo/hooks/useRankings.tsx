import { useEffect, useState, useMemo, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { Ranking } from '../bindings';
import { lookupAddresses } from '@cartridge/controller';

// Structure for a formatted player in the ranking
export interface RankingPlayer {
    id: string;       
    name: string;      
    score: number;     
    rank: number;      
    isCurrentUser: boolean;
}

// Hook return structure
interface UseRankingsReturn {
    globalRankings: RankingPlayer[];
    mapRankings: Record<number, RankingPlayer[]>;
    currentUserRanking: RankingPlayer | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    hasData: boolean;
}

// Torii GraphQL URL
const TORII_URL = dojoConfig.toriiUrl + "/graphql";

/**
 * Normalizes an address for consistent comparison
 */
const normalizeAddress = (address: string): string => {
    if (!address) return '';
    
    const paddedAddress = address.startsWith('0x') 
        ? addAddressPadding(address) 
        : addAddressPadding(`0x${address}`);
    
    return paddedAddress.toLowerCase();
};

/**
 * Converts a hexadecimal value to a number
 */
const hexToNumber = (hexValue: string): number => {
    if (!hexValue) return 0;
    
    // Handle both hex and decimal strings
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
        const uniqueAddresses = addresses.filter((address, index, self) =>
            address && 
            address.length > 0 && 
            self.indexOf(address) === index
        );

        if (uniqueAddresses.length === 0) {
            return new Map();
        }

        console.log("🔍 Looking up usernames for addresses:", uniqueAddresses);
        
        const addressMap = await lookupAddresses(uniqueAddresses);
        
        console.log("📋 Username lookup results:", Object.fromEntries(addressMap));
        return addressMap;
    } catch (error) {
        console.error("❌ Error looking up usernames:", error);
        return new Map();
    }
};

/**
 * Single fetch for ALL ranking data
 */
const fetchAllRankingsData = async (): Promise<Ranking[]> => {
    console.log("📥 Fetching ALL rankings data with single query...");
    
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
    
    try {
        const response = await fetch(TORII_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.errors) {
            console.error("GraphQL errors:", result.errors);
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }
        
        if (!result.data?.golemRunnerRankingModels?.edges) {
            console.log("No ranking data found");
            return [];
        }

        console.log(`📊 Found ${result.data.golemRunnerRankingModels.edges.length} total rankings`);

        // Convert all raw data to Ranking objects
        const rankings: Ranking[] = result.data.golemRunnerRankingModels.edges.map((edge: any, index: number) => {
            const node = edge.node;
            
            const worldId = hexToNumber(node.world_id);
            const points = hexToNumber(node.points);
            
            console.log(`📄 Ranking ${index + 1}: World ${worldId} (hex: ${node.world_id}), Player ${node.player}, Points ${points} (hex: ${node.points})`);
            
            return {
                world_id: worldId,
                player: node.player,
                points: points
            };
        });
        
        return rankings;
        
    } catch (error) {
        console.error("❌ Error fetching rankings:", error);
        throw error;
    }
};

/**
 * roperly group rankings by world_id and process with usernames
 */
const processAllRankings = async (
    allRankings: Ranking[],
    userAddress: string
): Promise<{
    byWorldId: Record<number, RankingPlayer[]>;
    globalRankings: RankingPlayer[];
}> => {
    console.log("🔄 Processing all rankings...");
    console.log("📊 Input rankings:", allRankings);
    
    if (allRankings.length === 0) {
        console.log("❌ No rankings to process");
        return { byWorldId: {}, globalRankings: [] };
    }
    
    // Get all unique addresses for username lookup
    const allAddresses = [...new Set(allRankings.map(r => r.player))];
    console.log("👥 Unique addresses found:", allAddresses);
    
    const usernameMap = await getUserNames(allAddresses);
    const normalizedUserAddress = normalizeAddress(userAddress);
    
    // Group rankings by world_id with better debugging
    const rankingsByWorld: Record<number, Ranking[]> = {};
    
    allRankings.forEach((ranking, index) => {
        console.log(`🔗 Processing ranking ${index + 1}: World ${ranking.world_id}, Player ${ranking.player}, Points ${ranking.points}`);
        
        if (!rankingsByWorld[ranking.world_id]) {
            rankingsByWorld[ranking.world_id] = [];
            console.log(`📁 Created new group for world ${ranking.world_id}`);
        }
        
        rankingsByWorld[ranking.world_id].push(ranking);
        console.log(`➕ Added to world ${ranking.world_id}, now has ${rankingsByWorld[ranking.world_id].length} rankings`);
    });
    
    // Sort each world's rankings by points (descending)
    Object.keys(rankingsByWorld).forEach(worldIdStr => {
        const worldId = parseInt(worldIdStr);
        const before = rankingsByWorld[worldId].length;
        rankingsByWorld[worldId].sort((a, b) => b.points - a.points);
        console.log(`🏆 Sorted world ${worldId}: ${before} rankings (highest: ${rankingsByWorld[worldId][0]?.points || 0})`);
    });
    
    console.log("🌍 Final rankings grouped by world:", Object.keys(rankingsByWorld).map(k => {
        const worldId = parseInt(k);
        const count = rankingsByWorld[worldId].length;
        const topScore = rankingsByWorld[worldId][0]?.points || 0;
        return `World ${worldId}: ${count} rankings (top: ${topScore})`;
    }));
    
    // Convert to RankingPlayer format by world - ONLY for worlds that have data
    const byWorldId: Record<number, RankingPlayer[]> = {};
    
    Object.keys(rankingsByWorld).forEach(worldIdStr => {
        const worldId = parseInt(worldIdStr);
        const worldRankings = rankingsByWorld[worldId];
        
        console.log(`🗺️ Processing world ${worldId} with ${worldRankings.length} rankings`);
        
        // Only process worlds that actually have data
        if (worldRankings.length > 0) {
            byWorldId[worldId] = worldRankings.map((ranking, index) => {
                const realName = usernameMap.get(ranking.player);
                const displayName = realName || formatAddressToName(ranking.player);
                
                const normalizedRankingAddress = normalizeAddress(ranking.player);
                const isCurrentUser = normalizedRankingAddress === normalizedUserAddress;
                
                const playerRanking = {
                    id: ranking.player,
                    name: displayName,
                    score: ranking.points,
                    rank: index + 1,
                    isCurrentUser
                };
                
                console.log(`👤 World ${worldId} - Player ${index + 1}: ${displayName} (${ranking.points} pts)`);
                
                return playerRanking;
            });
            
            console.log(`✅ World ${worldId}: ${byWorldId[worldId].length} processed rankings`);
        } else {
            console.log(`⚠️ World ${worldId}: No rankings to process`);
        }
    });
    
    const playerBestScores: Record<string, { score: number; name: string; isCurrentUser: boolean }> = {};
    
    Object.entries(byWorldId).forEach(([worldIdStr, worldRankings]) => {
        const worldId = parseInt(worldIdStr);
        console.log(`🏆 Processing world ${worldId} for global rankings: ${worldRankings.length} players`);
        
        worldRankings.forEach(ranking => {
            const existing = playerBestScores[ranking.id];
            if (!existing || ranking.score > existing.score) {
                console.log(`🔥 New/better score for ${ranking.name}: ${ranking.score} (was: ${existing?.score || 0})`);
                playerBestScores[ranking.id] = {
                    score: ranking.score,
                    name: ranking.name,
                    isCurrentUser: ranking.isCurrentUser
                };
            }
        });
    });
    
    // Convert to global rankings array and sort
    const globalRankings: RankingPlayer[] = Object.entries(playerBestScores)
        .map(([playerId, data]) => ({
            id: playerId,
            name: data.name,
            score: data.score,
            rank: 0, // Will be set below
            isCurrentUser: data.isCurrentUser
        }))
        .sort((a, b) => b.score - a.score)
        .map((ranking, index) => ({
            ...ranking,
            rank: index + 1
        }));
    
    console.log(`🏆 Global rankings: ${globalRankings.length} unique players`);
    console.log("🎯 Top 3 global:", globalRankings.slice(0, 3).map(p => `${p.name}: ${p.score}`));
    
    return { byWorldId, globalRankings };
};

// Main hook
export const useRankings = (): UseRankingsReturn => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [allRankingsData, setAllRankingsData] = useState<Ranking[]>([]);
    const [processedData, setProcessedData] = useState<{
        byWorldId: Record<number, RankingPlayer[]>;
        globalRankings: RankingPlayer[];
    }>({ byWorldId: {}, globalRankings: [] });
    
    const { account } = useAccount();
    
    // Current user's normalized address
    const userAddress = useMemo(() => {
        if (!account?.address) return '';
        
        const normalizedAddr = normalizeAddress(account.address);
        console.log("🎯 Current user address:", {
            original: account.address,
            normalized: normalizedAddr
        });
        return normalizedAddr;
    }, [account]);

    // Single fetch function
    const refetch = useCallback(async () => {
        if (!account) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            
            console.log("🔄 Starting rankings fetch...");
            
            // Single fetch for all data
            const allRankings = await fetchAllRankingsData();
            setAllRankingsData(allRankings);
            
            console.log("✅ Rankings fetch completed");
            
        } catch (err) {
            console.error("❌ Error in refetch:", err);
            const error = err instanceof Error ? err : new Error('Unknown error fetching rankings');
            setError(error);
            setAllRankingsData([]);
        } finally {
            setIsLoading(false);
        }
    }, [account]);

    // Process data whenever raw data or user address changes
    useEffect(() => {
        const processData = async () => {
            if (allRankingsData.length === 0 || !userAddress) {
                console.log("⚠️ No data to process or no user address");
                setProcessedData({ byWorldId: {}, globalRankings: [] });
                return;
            }

            try {
                console.log("🔄 Processing rankings data...");
                const processed = await processAllRankings(allRankingsData, userAddress);
                setProcessedData(processed);
                console.log("✅ Rankings processing completed");
                
                // ✅ DEBUG: Final processed data
                console.log("📊 Final processed data structure:");
                console.log("Global Rankings:", processed.globalRankings.length);
                console.log("Map Rankings:", Object.keys(processed.byWorldId).map(k => `World ${k}: ${processed.byWorldId[parseInt(k)].length}`));
                
            } catch (error) {
                console.error("❌ Error processing rankings:", error);
                setProcessedData({ byWorldId: {}, globalRankings: [] });
            }
        };

        processData();
    }, [allRankingsData, userAddress]);

    // Load data on mount
    useEffect(() => {
        if (userAddress) {
            refetch();
        } else {
            setIsLoading(false);
        }
    }, [userAddress, refetch]);

    // Get current user's ranking (from global rankings)
    const currentUserRanking = useMemo((): RankingPlayer | null => {
        const globalUser = processedData.globalRankings.find(r => r.isCurrentUser);
        
        if (globalUser) {
            return globalUser;
        }
        
        // If user has no ranking, create a fallback
        if (userAddress) {
            return {
                id: userAddress,
                name: "You",
                score: 0,
                rank: processedData.globalRankings.length + 1,
                isCurrentUser: true
            };
        }
        
        return null;
    }, [processedData.globalRankings, userAddress]);

    // Check if we have any data
    const hasData = processedData.globalRankings.length > 0 || Object.keys(processedData.byWorldId).length > 0;

    // ✅ DEBUG: Log final hook return values
    useEffect(() => {
        console.log("🎮 Hook return values:");
        console.log("  Global Rankings:", processedData.globalRankings.length);
        console.log("  Map Rankings:");
        Object.entries(processedData.byWorldId).forEach(([worldId, rankings]) => {
            console.log(`    World ${worldId}: ${rankings.length} players`);
        });
        console.log("  Has Data:", hasData);
        console.log("  Is Loading:", isLoading);
    }, [processedData, hasData, isLoading]);

    return {
        globalRankings: processedData.globalRankings,
        mapRankings: processedData.byWorldId,
        currentUserRanking,
        isLoading,
        error,
        refetch,
        hasData
    };
};