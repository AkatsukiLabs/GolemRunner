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

  // Prepare data: show all rankings, plus current user if not in rankings
  const isUserInRankings = rankings.some(p => p.id === currentUser.id);
  const displayPlayers: RankingPlayer[] = isUserInRankings
    ? rankings
    : [...rankings, { ...currentUser }];

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

      {/* Empty State */}
      {!isLoading && displayPlayers.length === 0 && (
        <div className="text-center py-8 text-dark font-luckiest">
          No rankings available yet.
          <br />
          <span className="text-sm font-rubik mt-2 block">Be the first to set a high score!</span>
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