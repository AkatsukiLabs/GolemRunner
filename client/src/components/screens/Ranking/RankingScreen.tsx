import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { TopBar } from "../../layout/TopBar"
import BackgroundParticles from "../../shared/BackgroundParticles"
import { RankingTable } from "./RankingTable"
import { useRankings } from "../../../dojo/hooks/useRankings" 
import { useGlobalRanking } from "../../../dojo/hooks/useGlobalRanking"
import { getMapVisualDataById } from "../../../constants/mapVisualData"
import useAppStore from "../../../zustand/store";

import globalRankingGolem from "../../../assets/Ranking/global-ranking-golem.webp"
import forestRankingGolem from "../../../assets/Ranking/forest-ranking-golem.webp"
import iceRankingGolem from "../../../assets/Ranking/ice-ranking-golem.webp"
import lavaRankingGolem from "../../../assets/Ranking/lava-ranking-golem.webp"

interface RankingScreenProps {
  onNavigation: (screen: "home" | "play" | "market" | "profile" | "ranking") => void
}

//Create interface for enriched maps
interface EnrichedMap {
  id: number;
  name: string;
  image: string;
  description: string;
  theme: string;
  is_unlocked: boolean;
  price: number;
}

export function RankingScreen({ }: RankingScreenProps) {
  // Use blockchain worlds as source of truth
  const { player, worlds, isLoading: worldsLoading } = useAppStore(state => ({
    player: state.player,
    worlds: state.worlds,
    isLoading: state.isLoading
  }));
  
  // Separate hook for Global Ranking (Player model data)
  const { 
    globalRankings,
    currentUserGlobalRanking,
    isLoading: isGlobalLoading,
    refetch: refetchGlobal,
    error: globalError
  } = useGlobalRanking();
  
  // Original hook for Map Rankings (Ranking model data)
  const { 
    mapRankings, 
    isLoading: isMapLoading,
    hasData: hasMapData,
    refetch: refetchMaps,
    error: mapError
  } = useRankings();

  // Process maps from blockchain with visual data
  const enrichedMaps = useMemo((): EnrichedMap[] => {
    if (!worlds || worlds.length === 0) {
      console.log("⚠️ [RankingScreen] No worlds data available");
      return [];
    }

    const maps = worlds.map(world => {
      const visualData = getMapVisualDataById(world.id);
      
      return {
        id: world.id,
        name: world.name, 
        image: visualData.image,
        description: visualData.description,
        theme: visualData.theme,
        is_unlocked: world.is_unlocked,
        price: world.price
      };
    });

    // unlocked maps first, then by ID
    const sortedMaps = maps.sort((a, b) => {
      if (a.is_unlocked && !b.is_unlocked) return -1;
      if (!a.is_unlocked && b.is_unlocked) return 1;
      return a.id - b.id;
    });

    console.log("🗺️ [RankingScreen] Enriched maps:", sortedMaps.map(m => 
      `${m.id}: ${m.name} (${m.is_unlocked ? 'unlocked' : 'locked'})`
    ));

    return sortedMaps;
  }, [worlds]);
  
  // Loading and error states
  const hasError = globalError || mapError;
  const isLoading = worldsLoading || isGlobalLoading || isMapLoading;
  
  // Animation variants
  const bannerVariant = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 }
  }
  const golemVariant = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1 }
  }
  const textVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  }

  // Carousel state
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Refetch function that calls both hooks
  const refetch = useCallback(async () => {
    console.log("🔄 [RankingScreen] Refetching all ranking data...");
    try {
      await Promise.all([
        refetchGlobal(),
        refetchMaps()
      ]);
      console.log("✅ [RankingScreen] All ranking data refetched successfully");
    } catch (error) {
      console.error("❌ [RankingScreen] Error refetching ranking data:", error);
    }
  }, [refetchGlobal, refetchMaps]);

  // Single refetch on component mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Update active index on scroll
  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const onScroll = () => {
      const index = Math.round(el.scrollLeft / el.clientWidth)
      setActiveIndex(index)
    }
    el.addEventListener("scroll", onScroll)
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  //Fallback for global user
  const fallbackGlobalUser = useMemo(() => {
    if (currentUserGlobalRanking && globalRankings.some(r => r.isCurrentUser)) {
      return currentUserGlobalRanking;
    }
    
    return currentUserGlobalRanking || {
      id: "current-user-fallback-global",
      name: "You",
      score: 0,
      rank: globalRankings.length + 1,
      isCurrentUser: true
    };
  }, [currentUserGlobalRanking, globalRankings]);

  //Fallback for map users
  const getFallbackMapUser = useCallback((mapId: number) => {
    const mapRankingsForMap = mapRankings[mapId] || [];
    
    if (mapRankingsForMap.some(r => r.isCurrentUser)) {
      return null;
    }
    
    if (mapRankingsForMap.length > 0) {
      return {
        id: `current-user-fallback-map-${mapId}`,
        name: "You",
        score: 0,
        rank: mapRankingsForMap.length + 1,
        isCurrentUser: true
      };
    }
    
    return null;
  }, [mapRankings]);

  // Use getMapVisualDataById directly
  const getMapThemeForDisplay = (mapId: number): string => {
    const visualData = getMapVisualDataById(mapId);
    return visualData.theme;
  };

  //Get current map based on ALL available maps
  const isGlobal = activeIndex === 0
  const currentMapForAssets = isGlobal ? null : enrichedMaps[activeIndex - 1]
  
  const title = isGlobal ? "Global Ranking" : `${currentMapForAssets?.name || 'Map'} Ranking`
  const subtitle = isGlobal
    ? "Top runners worldwide by total points."
    : `Top runners on the ${currentMapForAssets?.name || 'selected'} map.`

  // Use currentMapForAssets for golem image
  const getGolemImage = () => {
    if (isGlobal) return globalRankingGolem
    
    if (!currentMapForAssets) return globalRankingGolem;
    
    const mapTheme = getMapThemeForDisplay(currentMapForAssets.id);
    
    console.log(`🎨 [RankingScreen] Map ${currentMapForAssets.name} (ID: ${currentMapForAssets.id}) has theme: ${mapTheme}`);
    
    switch (mapTheme) {
      case "forest": return forestRankingGolem;
      case "ice": return iceRankingGolem;
      case "volcano": return lavaRankingGolem;
      default: return globalRankingGolem;
    }
  }
  
  // Use currentMapForAssets for gradient
  const getGradientClass = () => {
    if (isGlobal) return "bg-golem-gradient"
    
    if (!currentMapForAssets) return "bg-golem-gradient";
    
    const mapTheme = getMapThemeForDisplay(currentMapForAssets.id);
    
    console.log(`🎨 [RankingScreen] Using gradient for theme: ${mapTheme}`);
    
    switch (mapTheme) {
      case "forest": return "bg-gradient-to-r from-green-900 to-emerald-700";
      case "ice": return "bg-gradient-to-r from-blue-700 to-cyan-500";
      case "volcano": return "bg-gradient-to-r from-red-800 to-amber-600";
      default: return "bg-golem-gradient";
    }
  }

  // Show loading state if there are no worlds
  if (worldsLoading && enrichedMaps.length === 0) {
    return (
      <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik">
        <BackgroundParticles />
        <TopBar 
          coins={player?.coins || 0} 
          level={player?.level || 1} 
          title="RANKING" 
        />
        <div className="flex items-center justify-center h-full">
          <div className="text-white font-luckiest text-xl">Loading maps...</div>
        </div>
      </div>
    );
  }

  // Show message only if there are no maps in blockchain
  if (!isLoading && enrichedMaps.length === 0) {
    return (
      <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik">
        <BackgroundParticles />
        <TopBar 
          coins={player?.coins || 0} 
          level={player?.level || 1} 
          title="RANKING" 
        />
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white font-luckiest">
            <div className="text-xl mb-2">No Maps Available</div>
            <div className="text-sm opacity-75">No worlds found in blockchain!</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik">
      <BackgroundParticles />

      {/* Top Bar with player data from Zustand */}
      <TopBar 
        coins={player?.coins || 0} 
        level={player?.level || 1} 
        title="RANKING" 
      />

      {/* ERROR DISPLAY: Show errors if any */}
      {hasError && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="font-semibold">Error loading rankings:</div>
          {globalError && <div className="text-sm">Global: {globalError.message}</div>}
          {mapError && <div className="text-sm">Maps: {mapError.message}</div>}
          <button 
            onClick={refetch}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Style banner */}
      <motion.div
        className="relative mt-12 mb-3"
        initial="hidden"
        animate="visible"
        variants={bannerVariant}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Ranking Golem */}
        <motion.div
          className="absolute -top-11 left-3 z-10 w-40 h-40"
          variants={golemVariant}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
        >
          <img
            src={getGolemImage()}
            alt="Ranking Golem"
            className="object-contain"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              img.src = "/placeholder.svg?height=80&width=80"
            }}
          />
        </motion.div>

        {/* Banner */}
        <div
          className={`${getGradientClass()} py-3 px-4 pl-40 relative rounded-[10px] mx-4 shadow-md`}
          style={{ height: '96px' }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <motion.h2
              className="font-luckiest text-cream text-xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] tracking-wide"
              variants={textVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {title}
            </motion.h2>
            <motion.p
              className="font-luckiest text-dark text-sm opacity-90 mt-1 sm:mt-0"
              variants={textVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              {subtitle}
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 pt-4 h-[calc(100%-16rem)] pb-16">
        <div
          ref={carouselRef}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth h-full"
        >
          {/* ✅ GLOBAL RANKING (always first) */}
          <div className="snap-center flex-shrink-0 w-full px-4 h-full overflow-y-auto">
            <RankingTable 
              currentUser={fallbackGlobalUser}
              rankings={globalRankings}
              isLoading={isGlobalLoading}
            />
          </div>

          {/* ✅ FIXED: MAP-SPECIFIC RANKINGS - use ALL maps */}
          {enrichedMaps.map((map, mapIndex) => {
            const mapSpecificRankings = mapRankings[map.id] || [];
            const showMapLoading = isMapLoading && !hasMapData;
            const fallbackMapUser = getFallbackMapUser(map.id);
            
            console.log(`🗺️ [Carousel] Rendering map ${map.name} (ID: ${map.id}, index: ${mapIndex}) with ${mapSpecificRankings.length} rankings`);
            
            return (
              <div key={map.id} className="snap-center flex-shrink-0 w-full px-4 h-full overflow-y-auto">
                <RankingTable 
                  currentUser={fallbackMapUser || {
                    id: "no-user",
                    name: "No User",
                    score: 0,
                    rank: 1,
                    isCurrentUser: false
                  }}
                  rankings={mapSpecificRankings}
                  mapId={map.id}
                  isLoading={showMapLoading}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}