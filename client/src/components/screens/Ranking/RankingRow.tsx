import { motion } from "framer-motion"
import { Trophy } from "lucide-react"

interface RankingRowProps {
  rank: number
  name: string
  score: number
  isTop3: boolean
  isCurrentUser: boolean
  index: number
}

export function RankingRow({ rank, name, score, isTop3, isCurrentUser, index }: RankingRowProps) {
  // Row animation
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: index * 0.05, // Stagger based on index
      },
    },
  }

  // Trophy colors for top 3
  const trophyColors = ["text-yellow-500", "text-gray-400", "text-amber-700"]

  // Determine row styling based on props
  const getRowClasses = () => {
    if (isCurrentUser) return "bg-secondary/10 font-medium border-secondary/20"
    if (isTop3) return "bg-primary/10 font-bold border-primary/20"
    return "border-surface-dark/10"
  }

  return (
    <motion.div className={`flex justify-between items-center p-3 border-b ${getRowClasses()}`} variants={rowVariants}>
      <div className="font-luckiest text-lg w-16 flex items-center justify-center">
        {isTop3 ? (
          <Trophy className={`h-5 w-5 ${trophyColors[rank - 1]}`} />
        ) : (
          <span className={isCurrentUser ? "text-secondary" : "text-text-primary"}>{rank}</span>
        )}
      </div>

      <div className={`font-rubik text-base flex-1 ${isCurrentUser ? "text-secondary" : "text-text-primary"}`}>
        {name}
        {isCurrentUser && <span className="ml-2 text-xs bg-secondary text-surface px-1 py-0.5 rounded">You</span>}
      </div>

      <div className={`font-rubik text-base w-24 text-right ${isCurrentUser ? "text-secondary" : "text-text-primary"}`}>
        {score.toLocaleString()}
      </div>
    </motion.div>
  )
}
