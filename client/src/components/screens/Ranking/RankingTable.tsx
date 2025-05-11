import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { RankingRow } from "./RankingRow"

interface Player {
  id: string
  name: string
  score: number
  rank: number
}

interface RankingTableProps {
  currentUser: Player
}

export function RankingTable({ currentUser }: RankingTableProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Generate placeholder data for top 20 players
  const generatePlaceholderData = (): Player[] => {
    const names = [
      "StoneBreaker",
      "LavaLord",
      "IceMaster",
      "MossyKing",
      "GolemHunter",
      "RunnerPro",
      "MagicStone",
      "CrystalRunner",
      "EarthShaker",
      "FireWalker",
      "ShadowGolem",
      "RockSmasher",
      "GemCollector",
      "SpeedDemon",
      "MountainKing",
      "ValleyRunner",
      "DesertStrider",
      "ForestJumper",
      "CaveExplorer",
      "RuinRaider",
    ]

    // Create top 20 players with descending scores
    return names.map((name, index) => ({
      id: `player-${index + 1}`,
      name,
      score: 100000 - index * 4250 + Math.floor(Math.random() * 1000),
      rank: index + 1,
    }))
  }

  const topPlayers = generatePlaceholderData()

  // Check if current user is in top 20
  const isCurrentUserInTop20 = topPlayers.some((player) => player.id === currentUser.id)

  // If not in top 20, prepare to append current user at bottom
  const displayPlayers = [...topPlayers]
  if (!isCurrentUserInTop20) {
    displayPlayers.push(currentUser)
  }

  // Container animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <motion.div
      className="bg-surface rounded-xl shadow-md overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isLoading ? "hidden" : "visible"}
    >
      {/* Table Header */}
      <div className="flex justify-between items-center p-3 bg-primary/20 border-b border-primary/30">
        <div className="font-bangers text-lg text-primary w-16 text-center">Rank</div>
        <div className="font-bangers text-lg text-primary flex-1">Player</div>
        <div className="font-bangers text-lg text-primary w-24 text-right">Score</div>
      </div>

      {/* Table Rows */}
      <div className="flex flex-col">
        {displayPlayers.map((player, index) => (
          <RankingRow
            key={player.id}
            rank={player.rank}
            name={player.name}
            score={player.score}
            isTop3={player.rank <= 3}
            isCurrentUser={player.id === currentUser.id}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  )
}
