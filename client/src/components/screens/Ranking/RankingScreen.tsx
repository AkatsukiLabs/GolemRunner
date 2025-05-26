import { useRef, useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { TopBar } from "../../layout/TopBar"
import BackgroundParticles from "../../shared/BackgroundParticles"
import { RankingTable } from "./RankingTable"
import { defaultMaps } from "../../../constants/maps"
import { useRankings } from "../../../dojo/hooks/useRankings" 
import { useGlobalRanking } from "../../../dojo/hooks/useGlobalRanking"
import useAppStore from "../../../zustand/store";

import globalRankingGolem from "../../../assets/Ranking/global-ranking-golem.webp"
import forestRankingGolem from "../../../assets/Ranking/forest-ranking-golem.webp"
import iceRankingGolem from "../../../assets/Ranking/ice-ranking-golem.webp"
import lavaRankingGolem from "../../../assets/Ranking/lava-ranking-golem.webp"

interface RankingScreenProps {
  onNavigation: (screen: "home" | "play" | "market" | "profile" | "ranking") => void
}

export function RankingScreen({ }: RankingScreenProps) {
  // Get player data from Zustand store
  const { player } = useAppStore();
  
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
  
  // Loading and error states
  const hasError = globalError || mapError;
  
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

  // Smarter fallback users
  const fallbackGlobalUser = useCallback(() => {
    // If we already have the user in the rankings, don't create fallback
    if (currentUserGlobalRanking && globalRankings.some(r => r.isCurrentUser)) {
      return currentUserGlobalRanking;
    }
    
    // Only create fallback if user is not in rankings
    return currentUserGlobalRanking || {
      id: "current-user-fallback-global",
      name: "You",
      score: 0,
      rank: globalRankings.length + 1,
      isCurrentUser: true
    };
  }, [currentUserGlobalRanking, globalRankings])();

  const getFallbackMapUser = useCallback((mapId: number) => {
    const mapRankingsForMap = mapRankings[mapId] || [];
    
    // If user is already in map rankings, don't create fallback
    if (mapRankingsForMap.some(r => r.isCurrentUser)) {
      return null; // No fallback needed
    }
    
    // Only create fallback if there are rankings but user is not in them
    if (mapRankingsForMap.length > 0) {
      return {
        id: `current-user-fallback-map-${mapId}`,
        name: "You",
        score: 0,
        rank: mapRankingsForMap.length + 1,
        isCurrentUser: true
      };
    }
    
    return null; // No rankings = no fallback
  }, [mapRankings]);

  // Determine dynamic title and subtitle with better mapping
  const isGlobal = activeIndex === 0
  const map = isGlobal ? null : defaultMaps[activeIndex - 1]
  
  const title = isGlobal ? "Global Ranking" : `${map?.name || 'Map'} Ranking`
  const subtitle = isGlobal
    ? "Top runners worldwide by total points."
    : `Top runners on the ${map?.name || 'selected'} map.`

  //  Get the appropriate golem image based on the active index
  const getGolemImage = () => {
    if (isGlobal) return globalRankingGolem
    
    const mapName = map?.name.toLowerCase() || '';
    if (mapName.includes("forest")) return forestRankingGolem
    if (mapName.includes("ice")) return iceRankingGolem
    if (mapName.includes("volcano")) return lavaRankingGolem
    
    // Fallback to global if no match
    return globalRankingGolem
  }
  
  // Get the appropriate gradient based on the active index
  const getGradientClass = () => {
    if (isGlobal) return "bg-golem-gradient" // Default gold gradient
    
    const mapName = map?.name.toLowerCase() || '';
    if (mapName.includes("forest")) return "bg-gradient-to-r from-green-900 to-emerald-700"
    if (mapName.includes("ice")) return "bg-gradient-to-r from-blue-700 to-cyan-500"
    if (mapName.includes("volcano")) return "bg-gradient-to-r from-red-800 to-amber-600"
    
    // Fallback to default if no match
    return "bg-golem-gradient"
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
          {/* GLOBAL RANKING*/}
          <div className="snap-center flex-shrink-0 w-full px-4 h-full overflow-y-auto">
            <RankingTable 
              currentUser={fallbackGlobalUser}
              rankings={globalRankings}
              isLoading={isGlobalLoading}
            />
          </div>

          {/* 🗺️ MAP-SPECIFIC RANKINGS */}
          {defaultMaps.map((m, mapIndex) => {
            const mapSpecificRankings = mapRankings[m.id] || [];
            // Only show loading if we are loading AND there is no previous data
            const showMapLoading = isMapLoading && !hasMapData;
            const fallbackMapUser = getFallbackMapUser(m.id);
            
            // ✅ DEBUG: Log to verify mapping
            console.log(`🗺️ [Carousel] Rendering map ${m.name} (ID: ${m.id}, index: ${mapIndex}) with ${mapSpecificRankings.length} rankings`);
            
            return (
              <div key={m.id} className="snap-center flex-shrink-0 w-full px-4 h-full overflow-y-auto">
                <RankingTable 
                  currentUser={fallbackMapUser || {
                    id: "no-user",
                    name: "No User",
                    score: 0,
                    rank: 1,
                    isCurrentUser: false
                  }}
                  rankings={mapSpecificRankings}
                  mapId={m.id}
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