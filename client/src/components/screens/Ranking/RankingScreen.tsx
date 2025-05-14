import { motion } from "framer-motion"
import { TopBar } from "../../layout/TopBar"
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
  currentUser,
  onNavigation,
}: RankingScreenProps) {

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik">
      <BackgroundParticles />

      {/* Top Bar */}
      <TopBar coins={coins} level={level} title="RANKING" screen="ranking" />

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
