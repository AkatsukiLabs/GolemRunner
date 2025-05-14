import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { RankingRow } from "./RankingRow"

interface Player {
  id: string
  name: string
  score: number
  rank: number
}

export interface RankingTableProps {
  currentUser: Player
  mapId?: number
}

export function RankingTable({ currentUser, mapId }: RankingTableProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  // Generate placeholder data for top 20 players, adjusted per map
  const generatePlaceholderData = (): Player[] => {
    const names = [
      "StoneBreaker", "LavaLord", "IceMaster", "MossyKing", "GolemHunter",
      "RunnerPro", "MagicStone", "CrystalRunner", "EarthShaker", "FireWalker",
      "ShadowGolem", "RockSmasher", "GemCollector", "SpeedDemon", "MountainKing",
      "ValleyRunner", "DesertStrider", "ForestJumper", "CaveExplorer", "RuinRaider",
    ]
    // Base score modified by mapId (global = 0)
    const base = mapId ? 100000 - (mapId - 1) * 20000 : 120000

    return names.map((name, idx) => ({
      id: `player-${mapId ?? 0}-${idx + 1}`,
      name,
      score: base - idx * 3000 + Math.floor(Math.random() * 1000),
      rank: idx + 1,
    }))
  }

  
  // Prepare data: show top 10, plus current user if not in top 10
  const topPlayers = generatePlaceholderData()
  const MAX_TOP = 10
  const topTen = topPlayers.slice(0, MAX_TOP)
  const isUserInTop = topTen.some(p => p.id === currentUser.id)
  const displayPlayers: Player[] = isUserInTop
    ? topTen
    : [...topTen, { ...currentUser }]

  // Animation container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  return (
    <motion.div
      className="bg-surface rounded-xl shadow-md overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isLoading ? "hidden" : "visible"}
    >
      {/* Table Header */}
      <div className="flex justify-between items-center p-3 bg-golem-gradient border-b border-primary/30">
        <div className="font-bangers text-xl text-cream w-16 text-center drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] tracking-wide">Rank</div>
        <div className="font-bangers text-xl text-cream flex-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] tracking-wide">Player</div>
        <div className="font-bangers text-xl text-cream w-24 text-right drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] tracking-wide">Score</div>
      </div>

      {/* Table Rows */}
      <div className="flex flex-col">
        {displayPlayers.map((player, idx) => {
          const isCurrent = player.id === currentUser.id
          return (
            <div
              key={player.id}
              className={isCurrent ? "opacity-70 bg-secondary/10" : ""}
            >
              <RankingRow
                rank={player.rank}
                name={player.name}
                score={player.score}
                isTop3={player.rank <= 3}
                isCurrentUser={isCurrent}
                index={idx}
              />
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
