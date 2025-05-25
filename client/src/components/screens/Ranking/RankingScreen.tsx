import { useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TopBar } from "../../layout/TopBar"
import BackgroundParticles from "../../shared/BackgroundParticles"
import { RankingTable } from "./RankingTable"
import { defaultMaps } from "../../../constants/maps"
import { useRankings } from "../../../dojo/hooks/useRankings" 
import useAppStore from "../../../zustand/store";
// Importar las imágenes de los gólems con trofeos
import globalRankingGolem from "../../../assets/Ranking/global-ranking-golem.webp"
import forestRankingGolem from "../../../assets/Ranking/forest-ranking-golem.webp"
import iceRankingGolem from "../../../assets/Ranking/ice-ranking-golem.webp"
import lavaRankingGolem from "../../../assets/Ranking/lava-ranking-golem.webp"

// RankingScreen now uses Zustand data - only onNavigation prop needed
interface RankingScreenProps {
  onNavigation: (screen: "home" | "play" | "market" | "profile" | "ranking") => void
}

export function RankingScreen({ }: RankingScreenProps) {
  // Get player data from Zustand store
  const { player } = useAppStore();
  
  // Use simplified hook
  const { 
    globalRankings, 
    mapRankings, 
    currentUserRanking, 
    isLoading,
    hasData,
    refetch
  } = useRankings();
  
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

  // Single refetch on component mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  // ✅ DEBUG: Log mapRankings to see what data we actually have
  useEffect(() => {
    console.log("🎮 [RankingScreen] Current mapRankings:", mapRankings);
    console.log("🎮 [RankingScreen] Available world IDs:", Object.keys(mapRankings));
    console.log("🎮 [RankingScreen] defaultMaps IDs:", defaultMaps.map(m => ({ id: m.id, name: m.name })));
    
    defaultMaps.forEach(map => {
      const hasRankingData = mapRankings[map.id] && mapRankings[map.id].length > 0;
      console.log(`🎮 [RankingScreen] Map "${map.name}" (ID: ${map.id}) has data: ${hasRankingData}`);
      if (hasRankingData) {
        console.log(`  └── ${mapRankings[map.id].length} rankings`);
      }
    });
  }, [mapRankings]);

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

  // Create fallback user if no ranking exists
  const fallbackUser = currentUserRanking || {
    id: "current-user",
    name: "You",
    score: 0,
    rank: globalRankings.length + 1,
    isCurrentUser: true
  };

  // Determine dynamic title and subtitle
  const isGlobal = activeIndex === 0
  const map = defaultMaps[activeIndex - 1]
  const title = isGlobal ? "Global Ranking" : `${map?.name || 'Map'} Ranking`
  const subtitle = isGlobal
    ? "Top runners worldwide."
    : `Top runners on the ${map?.name || 'selected'} map.`

  // Get the appropriate golem image based on the active index
  const getGolemImage = () => {
    if (activeIndex === 0) return globalRankingGolem
    
    const mapName = map?.name.toLowerCase() || '';
    if (mapName.includes("forest")) return forestRankingGolem
    if (mapName.includes("ice")) return iceRankingGolem
    if (mapName.includes("volcano")) return lavaRankingGolem
    
    // Fallback to global if no match
    return globalRankingGolem
  }
  
  // Get the appropriate gradient based on the active index
  const getGradientClass = () => {
    if (activeIndex === 0) return "bg-golem-gradient" // Default gold gradient
    
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

      {/* Clash Royale style banner animado */}
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

      {/* Main Content */}
      {/* Carousel for Rankings */}
      <div className="relative z-10 pt-4 h-[calc(100%-16rem)] pb-16">
        <div
          ref={carouselRef}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth h-full"
        >
          {/* Global Ranking */}
          <div className="snap-center flex-shrink-0 w-full px-4 h-full overflow-y-auto">
            <RankingTable 
              currentUser={fallbackUser} 
              rankings={globalRankings}
              isLoading={isLoading}
            />
          </div>

          {/* ✅ DEBUG: Map-specific Rankings with detailed logging */}
          {defaultMaps.map((m) => {
            // Get rankings for this specific map
            const mapSpecificRankings = mapRankings[m.id] || [];
            
            // Show loading only if we're still loading and no data exists yet
            const showLoading = isLoading && !hasData;
            
            // ✅ DEBUG: Log what we're showing for each map
            console.log(`🎮 [RankingScreen] Rendering map ${m.name} (ID: ${m.id}):`);
            console.log(`  └── Rankings found: ${mapSpecificRankings.length}`);
            console.log(`  └── Show loading: ${showLoading}`);
            if (mapSpecificRankings.length > 0) {
              console.log(`  └── Top player: ${mapSpecificRankings[0].name} with ${mapSpecificRankings[0].score} points`);
            }
            
            return (
              <div key={m.id} className="snap-center flex-shrink-0 w-full px-4 h-full overflow-y-auto">
                {/* ✅ DEBUG: Show data availability in UI temporarily */}
                {/* <div className="mb-4 p-2 bg-red-100 text-red-800 rounded text-sm">
                  DEBUG: Map {m.name} (ID: {m.id}) - 
                  Rankings: {mapSpecificRankings.length} - 
                  Available World IDs: {Object.keys(mapRankings).join(', ')}
                </div> */}
                
                <RankingTable 
                  currentUser={fallbackUser} 
                  rankings={mapSpecificRankings}
                  mapId={m.id}
                  isLoading={showLoading}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}