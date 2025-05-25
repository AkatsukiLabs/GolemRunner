import { motion } from "framer-motion"
import { ProfileMap } from "../../../dojo/hooks/useProfileData";

interface ProfileMapGridProps {
  maps: ProfileMap[] 
}

export function ProfileMapGrid({ maps }: ProfileMapGridProps) {
  
  // Helper function to get trophy icon based on rank
  // To do

  // Helper function to get rank display text
  const getRankDisplay = (_rank?: number, score: number = 0) => {
    if (score === 0) {
      return "No Score";
    }
    
    // Only show the score, not the rank number
    return `${score.toLocaleString()}`;
  };

  // Helper function to get rank styling
  const getRankStyling = (rank?: number, score: number = 0) => {
    if (score === 0) {
      return "text-dark/60"; // Muted for no score
    }
    
    if (!rank) {
      return "text-dark"; // Default styling
    }
    
    // Special styling for top 3
    switch (rank) {
      case 1:
        return "text-dark font-bold"; // Gold
      case 2:
        return "text-dark font-bold"; // Silver
      case 3:
        return "text-dojo font-bold"; // Bronze
      default:
        return "text-dark"; // Regular styling
    }
  };

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
      initial="hidden"
      animate="show"
      className="px-4"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {maps.map((map) => (
          <motion.div
            key={map.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
            className="bg-surface p-5 rounded-xl shadow-md flex flex-col items-center hover:shadow-lg transition-shadow"
          >
            <img
              src={map.image}
              alt={map.name}
              className="w-full h-32 object-cover rounded-md mb-3"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/placeholder.svg?height=128&width=192"
              }}
            />

            <h3 className="font-luckiest text-xl text-primary mb-2 text-center">
              {map.name}
            </h3>

            {/* ✅ Enhanced score display with rank information */}
            <div className="flex items-center justify-center">

              <div className="text-center">
                <span className={`font-luckiest text-lg ${getRankStyling(map.userRank, map.highScore)}`}>
                  {getRankDisplay(map.userRank, map.highScore)}
                </span>
                {/* ✅ Show encouragement if no score */}
                {map.highScore === 0 && (
                  <div className="text-xs text-dark/60 font-rubik">
                    Play to set score!
                  </div>
                )}
              </div>
            </div>

            {/* ✅ Optional: Add a subtle background glow for top 3 */}
            {map.userRank && map.userRank <= 3 && map.highScore > 0 && (
              <div className="absolute inset-0 rounded-xl opacity-20 pointer-events-none">
                <div className={`w-full h-full rounded-xl ${
                  map.userRank === 1 ? 'bg-gradient-to-br from-yellow-400/30 to-yellow-600/30' :
                  map.userRank === 2 ? 'bg-gradient-to-br from-gray-300/30 to-gray-500/30' :
                  'bg-gradient-to-br from-amber-400/30 to-amber-600/30'
                }`} />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}