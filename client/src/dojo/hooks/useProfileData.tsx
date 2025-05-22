import { useMemo } from 'react';
import useAppStore from '../../zustand/store';
import { getGolemVisualDataById } from '../../constants/characters';
import { getMapVisualDataById } from '../../constants/mapVisualData';
import { defaultGolems } from '../../constants/golems'; 
import { CairoCustomEnum } from 'starknet';
import type { MapTheme } from '../../components/types/game';

// Helper to extract string from CairoCustomEnum
const extractRarityString = (rarity: CairoCustomEnum | string): string => {
  if (typeof rarity === 'string') return rarity;
  
  // Search for the active variant
  const activeVariant = Object.entries(rarity.variant)
    .find(([_, value]) => value !== undefined)?.[0];
  
  return activeVariant || 'Common';
};

// Extended types for the hook
export interface ProfileGolem {
  id: number;
  player_id: string;
  name: string;
  description: string;
  price: number;
  rarity: string; // Converted to string for ease of use
  is_starter: boolean;
  is_unlocked: boolean;
  // Added visual data
  image: string;
  animations: {
    run: string[];
    jump: string[];
  };
}

export interface ProfileMap {
  id: number;
  name: string;
  description: string;
  price: number;
  is_unlocked: boolean;
  // Added visual data
  image: string;
  theme: MapTheme; // Use the correct type
  highScore: number; // TODO: Implement from blockchain
}

interface UseProfileDataReturn {
  // Player data
  player: {
    address: string;
    coins: number;
    level: number;
    experience: number;
    total_points: number;
  } | null;
  
  // Collections
  ownedGolems: ProfileGolem[];
  unlockedMaps: ProfileMap[];
  
  // Stats
  stats: {
    totalGolems: number;
    ownedGolemsCount: number;
    totalMaps: number;
    unlockedMapsCount: number;
    completionPercentage: {
      golems: number;
      maps: number;
    };
  };
  
  // States
  isLoading: boolean;
  error: string | null;
  hasData: boolean;
  
  // Actions
  getGolemById: (id: number) => ProfileGolem | undefined;
  getMapById: (id: number) => ProfileMap | undefined;
}

export const useProfileData = (): UseProfileDataReturn => {
  // Zustand store selectors - optimized subscriptions
  const { 
    player, 
    golems, 
    worlds, 
    isLoading, 
    error 
  } = useAppStore(state => ({
    player: state.player,
    golems: state.golems,
    worlds: state.worlds,
    isLoading: state.isLoading,
    error: state.error
  }));

  // Memoized owned golems with visual data AND real animations
  const ownedGolems = useMemo((): ProfileGolem[] => {
    return golems
      .filter(golem => golem.is_unlocked)
      .map(golem => {
        const visualData = getGolemVisualDataById(golem.id);
        const defaultGolem = defaultGolems.find(dg => dg.id === golem.id);
        
        const animations = defaultGolem?.animations || {
          run: [visualData.image],
          jump: [visualData.image]
        };

        return {
          ...golem,
          rarity: extractRarityString(golem.rarity),
          image: visualData.image,
          animations: animations
        };
      })
      .sort((a, b) => {
        // Simple sorting based on owned rarities
        const rarityOrder: Record<string, number> = {
          'Common': 1,     
          'Uncommon': 2,   
          'Rare': 3,       
          'Legendary': 4 
        };
        
        const aRarity = rarityOrder[a.rarity] || 0;
        const bRarity = rarityOrder[b.rarity] || 0;
        
        if (aRarity !== bRarity) return bRarity - aRarity;
        return a.id - b.id;
      });
  }, [golems]);

  // Memoized unlocked maps with visual data
  const unlockedMaps = useMemo((): ProfileMap[] => {
    return worlds
      .filter(world => world.is_unlocked)
      .map(world => {
        const visualData = getMapVisualDataById(world.id);
        return {
          id: world.id,
          name: world.name,
          description: world.description,
          price: world.price,
          is_unlocked: world.is_unlocked,
          // Visual data
          image: visualData.image,
          theme: visualData.theme,
          highScore: 0, // TODO: Implement high scores from blockchain
        };
      })
      .sort((a, b) => a.id - b.id); // Sort by ID
  }, [worlds]);

  // Memoized stats
  const stats = useMemo(() => {
    const totalGolems = golems.length;
    const ownedGolemsCount = ownedGolems.length;
    const totalMaps = worlds.length;
    const unlockedMapsCount = unlockedMaps.length;

    return {
      totalGolems,
      ownedGolemsCount,
      totalMaps,
      unlockedMapsCount,
      completionPercentage: {
        golems: totalGolems > 0 ? Math.round((ownedGolemsCount / totalGolems) * 100) : 0,
        maps: totalMaps > 0 ? Math.round((unlockedMapsCount / totalMaps) * 100) : 0,
      }
    };
  }, [golems.length, ownedGolems.length, worlds.length, unlockedMaps.length]);

  // Helper functions
  const getGolemById = (id: number): ProfileGolem | undefined => {
    return ownedGolems.find(golem => golem.id === id);
  };

  const getMapById = (id: number): ProfileMap | undefined => {
    return unlockedMaps.find(map => map.id === id);
  };

  // Check if we have data
  const hasData = !isLoading && !error && (ownedGolems.length > 0 || unlockedMaps.length > 0);

  return {
    // Player data
    player,
    
    // Collections
    ownedGolems,
    unlockedMaps,
    
    // Stats
    stats,
    
    // States
    isLoading,
    error,
    hasData,
    
    // Actions
    getGolemById,
    getMapById,
  };
};
