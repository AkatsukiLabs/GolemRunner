import { motion } from "framer-motion"
import { Coins } from "lucide-react"
import { BackgroundParticles } from "../../shared/BackgroundParticles"
import { RankingTable } from "./RankingTable"

interface RankingScreenProps {
  coins: number
  level: number
  experience: number
  nextLevelExperience: number
  currentUser: {
    id: string
    name: string
    score: number
    rank: number
  }
  onNavigation: (screen: "home" | "play" | "market" | "profile" | "ranking") => void
}

export function RankingScreen({
  coins,
  level,
  experience,
  nextLevelExperience,
  currentUser,
  onNavigation,
}: RankingScreenProps) {
  const progressPercentage = (experience / nextLevelExperience) * 100

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik">
      <BackgroundParticles />

      {/* Top Bar */}
      <div className="relative z-10 w-full px-4 py-3 flex items-center justify-between">
        <motion.div
          className="flex items-center bg-screen/80 backdrop-blur-sm px-3 py-1 rounded-full border border-surface/30"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Coins className="text-primary mr-1 h-5 w-5" />
          <span className="text-surface font-bold">{coins}</span>
        </motion.div>

        <motion.h1
          className="font-bangers text-2xl text-surface"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Ranking
        </motion.h1>

        <motion.div
          className="flex items-center justify-center"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative w-16 h-4 bg-surface/30 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-secondary"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 pt-4 h-[calc(100%-8rem)] overflow-y-auto pb-4">
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-luckiest text-xl text-surface mb-2">Global Leaderboard</h2>
          <p className="text-surface/80 text-sm">Top runners from around the world. Can you reach the #1 spot?</p>
        </motion.div>

        <RankingTable currentUser={currentUser} />
      </div>
    </div>
  )
}
