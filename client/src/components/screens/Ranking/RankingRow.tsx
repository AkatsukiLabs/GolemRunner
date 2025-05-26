import { motion } from "framer-motion"
import GoldenTrophyIcon from "../../../assets/icons/GoldenTrophyIcon.webp"
import SilverTrophyIcon from "../../../assets/icons/SilverTrophyIcon.webp"
import BronzeTrophyIcon from "../../../assets/icons/BronzeTrophyIcon.webp"
import { defaultMaps } from "../../../constants/maps"

interface RankingRowProps {
  rank: number
  name: string
  score: number
  isTop3: boolean
  isCurrentUser: boolean
  index: number
  mapId?: number
}

export function RankingRow({
  rank,
  name,
  score,
  isTop3,
  isCurrentUser,
  index,
  mapId,
}: RankingRowProps) {
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, delay: index * 0.05 },
    },
  }

  const getRowClasses = () => {
    if (isCurrentUser) return "bg-secondary/10 font-medium border-secondary/20"
    if (isTop3)       return "bg-primary/10 font-bold border-primary/20"
    return "border-surface-dark/10"
  }

  // Get the appropriate gradient for text based on the map ID
  const getGradientTextClass = () => {
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

  const gradientText = isCurrentUser ? 
    `bg-clip-text text-transparent ${getGradientTextClass()}` : 
    "text-text-primary"
  const defaultText = "text-text-primary"

  const renderTrophy = () => {
    switch (rank) {
      case 1:
        return <img src={GoldenTrophyIcon} alt="Gold Trophy" className="h-10 w-10" />
      case 2:
        return <img src={SilverTrophyIcon} alt="Silver Trophy" className="h-10 w-10" />
      case 3:
        return <img src={BronzeTrophyIcon} alt="Bronze Trophy" className="h-10 w-10" />
      default:
        return null
    }
  }

  return (
    <motion.div
      className={`flex justify-between items-center p-3 border-b ${getRowClasses()}`}
      variants={rowVariants}
    >
      {/* Rank / Trophy */}
      <div className="font-luckiest text-xl w-16 flex items-center justify-center">
        {isTop3 ? (
          renderTrophy()
        ) : (
          <span className={isCurrentUser ? gradientText : defaultText}>
            {rank}
          </span>
        )}
      </div>

      {/* Name */}
      <div className={`font-rubik text-base flex-1 ${isCurrentUser ? gradientText : defaultText}`}>
        {name}
        {isCurrentUser && (
          <span className="ml-2 text-xs bg-secondary text-surface px-1 py-0.5 rounded">
            You
          </span>
        )}
      </div>

      {/* Score */}
      <div className={`font-rubik text-base w-24 text-right ${isCurrentUser ? gradientText : defaultText}`}>
        {score.toLocaleString()}
      </div>
    </motion.div>
  )
}