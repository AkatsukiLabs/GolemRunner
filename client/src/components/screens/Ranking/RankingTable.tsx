import { motion } from "framer-motion"
import { RankingRow } from "./RankingRow"
import { defaultMaps } from "../../../constants/maps"
import { RankingPlayer } from "../../../dojo/hooks/useRankings"

export interface RankingTableProps {
  currentUser: RankingPlayer;
  rankings?: RankingPlayer[];
  mapId?: number;
  isLoading?: boolean;
}

export function RankingTable({ 
  currentUser, 
  rankings = [], 
  mapId, 
  isLoading = false 
}: RankingTableProps) {

  // Get the appropriate gradient class based on the map ID
  const getGradientClass = () => {
    if (!mapId) return "bg-golem-gradient" // Default gold gradient for global ranking
    
    const map = defaultMaps.find(m => m.id === mapId)
    if (!map) return "bg-golem-gradient"
    
    const mapName = map.name.toLowerCase()
    if (mapName.includes("forest")) return "bg-gradient-to-r from-green-900 to-emerald-700"
    if (mapName.includes("ice")) return "bg-gradient-to-r from-blue-700 to-cyan-500"
    if (mapName.includes("volcano")) return "bg-gradient-to-r from-red-800 to-amber-600"
    
    // Fallback to default if no match
    return "bg-golem-gradient"
  }

  // ✅ FIXED: Only show currentUser if there are actual rankings OR it's the global ranking (no mapId)
  const shouldShowCurrentUser = () => {
    // For global ranking (no mapId), always show current user if not in rankings
    if (!mapId) {
      const isUserInRankings = rankings.some(p => p.id === currentUser.id);
      return !isUserInRankings;
    }
    
    // For specific maps, only show current user if there are rankings AND user is not in them
    if (rankings.length > 0) {
      const isUserInRankings = rankings.some(p => p.id === currentUser.id);
      return !isUserInRankings;
    }
    
    // If no rankings for this map, don't show current user
    return false;
  };

  // ✅ FIXED: Prepare data with correct fallback logic
  const displayPlayers: RankingPlayer[] = shouldShowCurrentUser() 
    ? [...rankings, { ...currentUser }]
    : rankings;

  // ✅ DEBUG: Log what we're displaying
  console.log(`🎮 [RankingTable] Map ${mapId || 'Global'}:`);
  console.log(`  └── Input rankings: ${rankings.length}`);
  console.log(`  └── Should show current user: ${shouldShowCurrentUser()}`);
  console.log(`  └── Display players: ${displayPlayers.length}`);
  if (displayPlayers.length > 0) {
    console.log(`  └── Players: ${displayPlayers.map(p => `${p.name}(${p.score})`).join(', ')}`);
  }

  // Animation container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  return (
    <motion.div
      className="bg-surface rounded-xl shadow-md overflow-hidden mb-12" 
      variants={containerVariants}
      initial="hidden"
      animate={isLoading ? "hidden" : "visible"}
    >
      {/* Table Header */}
      <div className={`flex justify-between items-center p-3 ${getGradientClass()} border-b border-primary/30`}>
        <div className="font-bangers text-xl text-cream w-16 text-center drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] tracking-wide">Rank</div>
        <div className="font-bangers text-xl text-cream flex-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] tracking-wide">Player</div>
        <div className="font-bangers text-xl text-cream w-24 text-right drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] tracking-wide">Score</div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <motion.div 
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* ✅ FIXED: Empty State - Only show when not loading AND no display players */}
      {!isLoading && displayPlayers.length === 0 && (
        <div className="text-center py-8 text-dark font-luckiest">
          {mapId ? (
            <>
              No rankings available for this map yet.
              <br />
              <span className="text-sm font-rubik mt-2 block">Be the first to set a high score!</span>
            </>
          ) : (
            <>
              No rankings available yet.
              <br />
              <span className="text-sm font-rubik mt-2 block">Be the first to set a high score!</span>
            </>
          )}
        </div>
      )}

      {/* Table Rows */}
      {!isLoading && displayPlayers.length > 0 && (
        <div className="flex flex-col">
          {displayPlayers.map((player, idx) => (
            <div key={`${player.id}-${idx}`}>
              <RankingRow
                rank={player.rank}
                name={player.name}
                score={player.score}
                isTop3={player.rank <= 3}
                isCurrentUser={player.isCurrentUser}
                index={idx}
                mapId={mapId}
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}