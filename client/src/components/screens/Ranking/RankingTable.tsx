import { motion } from "framer-motion"
import { RankingRow } from "./RankingRow"
import { getMapVisualDataById } from "../../../constants/mapVisualData"
import useAppStore from "../../../zustand/store"
import { GlobalRankingFormatted } from "../../../dojo/hooks/useGlobalRanking"
import { RankingPlayer } from "../../../dojo/hooks/useRankings"

export type RankingTablePlayer = GlobalRankingFormatted | RankingPlayer;

export interface RankingTableProps {
  currentUser: RankingTablePlayer;
  rankings?: RankingTablePlayer[];
  mapId?: number;
  isLoading?: boolean;
}

export function RankingTable({ 
  currentUser, 
  rankings = [], 
  mapId, 
  isLoading = false 
}: RankingTableProps) {
  // Get map data from blockchain
  const { worlds } = useAppStore(state => ({ worlds: state.worlds }));

  // Only use mapVisualData to get theme
  const getMapTheme = (mapId: number): string => {
    // Directly use mapVisualData which already has the correct mapping
    const visualData = getMapVisualDataById(mapId);
    
    console.log(`🗺️ [RankingTable] Map ID ${mapId} has theme: ${visualData.theme}`);
    
    return visualData.theme;
  };

  // Get gradient class based on theme
  const getGradientClass = () => {
    if (!mapId) return "bg-golem-gradient"; // Global ranking
    
    const theme = getMapTheme(mapId);
    
    switch (theme) {
      case "forest":
        return "bg-gradient-to-r from-green-900 to-emerald-700";
      case "ice":
        return "bg-gradient-to-r from-blue-700 to-cyan-500";
      case "volcano":
        return "bg-gradient-to-r from-red-800 to-amber-600";
      default:
        return "bg-golem-gradient";
    }
  };

  // Get display name from blockchain
  const getMapDisplayName = (): string => {
    if (!mapId) return "Global";
    
    const world = worlds.find(w => w.id === mapId);
    if (!world) return `Map ${mapId}`;
    
    return world.name; // Use blockchain name
  };

  const shouldShowCurrentUser = () => {
    const isFallbackUser = currentUser.id.includes('fallback') || currentUser.id === 'current-user' || currentUser.id === 'no-user';
    
    if (isFallbackUser) {
      console.log(`[RankingTable] ${mapId ? `Map ${mapId}` : 'Global'} - Fallback user detected, evaluating...`);
    }
    
    // 🌍 GLOBAL RANKING
    if (!mapId) {
      const isUserInRankings = rankings.some(p => p.isCurrentUser === true);
      return !isUserInRankings && isFallbackUser;
    }
    
    // 🗺️ MAP SPECIFIC
    if (rankings.length > 0) {
      const isUserInRankings = rankings.some(p => p.isCurrentUser === true);
      return !isUserInRankings && isFallbackUser;
    }
    
    return false;
  };

  const displayPlayers: RankingTablePlayer[] = shouldShowCurrentUser() 
    ? [...rankings, { ...currentUser }]
    : rankings;
  
  if (displayPlayers.length > 0) {
    console.log(`  Players to display: ${displayPlayers.map(p => `${p.name}(${p.score}pts, rank:${p.rank})`).slice(0, 5).join(', ')}${displayPlayers.length > 5 ? '...' : ''}`);
  }

  // Animation container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const getHeaders = () => {
    if (!mapId) {
      return {
        scoreLabel: "Total Points"
      }
    } else {
      return {
        subtitle: null,
        scoreLabel: "Best Score"
      }
    }
  };

  const headers = getHeaders();

  return (
    <motion.div
      className="bg-surface rounded-xl shadow-md overflow-hidden mb-12" 
      variants={containerVariants}
      initial="hidden"
      animate={isLoading ? "hidden" : "visible"}
    >
      {/* Table Header with blockchain information */}
      <div className={`p-3 ${getGradientClass()} border-b border-primary/30`}>
        {/* Main header row */}
        <div className="flex justify-between items-center mb-2">
          <div className="font-bangers text-xl text-cream w-16 text-center drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] tracking-wide">
            Rank
          </div>
          <div className="font-bangers text-xl text-cream flex-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] tracking-wide">
            Player
          </div>
          <div className="font-bangers text-xl text-cream w-24 text-right drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] tracking-wide">
            {headers.scoreLabel}
          </div>
        </div>
      </div>

      {/*  LOADING STATE with blockchain name */}
      {isLoading && (
        <div className="flex flex-col justify-center items-center p-8">
          <motion.div 
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-dark font-rubik text-sm">
            {!mapId ? "Loading global rankings..." : `Loading ${getMapDisplayName()} rankings...`}
          </p>
        </div>
      )}

      {/* EMPTY STATE with blockchain name */}
      {!isLoading && displayPlayers.length === 0 && (
        <div className="text-center py-8 text-dark font-luckiest">
          {mapId ? (
            <>
              No rankings available for this map yet.
              <br />
              <span className="text-sm font-rubik mt-2 block opacity-70">
                Be the first to set a high score on {getMapDisplayName()}!
              </span>
            </>
          ) : (
            <>
              No global rankings available yet.
              <br />
              <span className="text-sm font-rubik mt-2 block opacity-70">
                Start playing to earn total points and appear here!
              </span>
            </>
          )}
        </div>
      )}

      {/* TABLE ROWS */}
      {!isLoading && displayPlayers.length > 0 && (
        <div className="flex flex-col">
          {displayPlayers.map((player, idx) => (
            <div key={`${player.id}-${idx}-${mapId || 'global'}`}>
              <RankingRow
                rank={player.rank}
                name={player.name}
                score={player.score}
                isTop3={player.rank <= 3}
                isCurrentUser={player.isCurrentUser}
                index={idx}
                mapId={mapId}
                mapTheme={mapId ? getMapTheme(mapId) : "global"}
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}