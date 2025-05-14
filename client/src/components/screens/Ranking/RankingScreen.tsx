import { motion } from "framer-motion"
import { TopBar } from "../../layout/TopBar"
import { BackgroundParticles } from "../../shared/BackgroundParticles"
import { RankingTable } from "./RankingTable"
import rankingGolemIcon from "../../../assets/icons/RankingGolem.png"

interface RankingScreenProps {
  coins: number
  level: number
  // Optional: include if needed
  experience?: number
  nextLevelExperience?: number
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
  
  const bannerVariant = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 }
  }
  const sellerVariant = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1 }
  }

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik">
      <BackgroundParticles />

      {/* Top Bar */}
      <TopBar coins={coins} level={level} title="RANKING" screen="ranking" />

      {/* Clash Royale style banner animado */}
      <motion.div
        className="relative mt-12 mb-3"
        initial="hidden"
        animate="visible"
        variants={bannerVariant}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Ranking Golem animado */}
        <motion.div
          className="absolute -top-11 left-3 z-10 w-40 h-40"
          variants={sellerVariant}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
        >
          <img
            src={rankingGolemIcon}
            alt="Ranking Golem"
            className="object-contain"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              img.src = "/placeholder.svg?height=80&width=80"
            }}
          />
        </motion.div>

        {/* Banner */}
        <div className="bg-golem-gradient py-3 px-4 pl-40 relative rounded-[10px] mx-4 shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <h2 className="font-luckiest text-cream text-xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] tracking-wide">
              Global Ranking
            </h2>
            <p className="font-luckiest text-dark text-sm opacity-90 mt-1 sm:mt-0">
              Can you reach the #1 spot?
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 px-4 pt-4 h-[calc(100%-8rem)] overflow-y-auto pb-4">
        <RankingTable currentUser={currentUser} />
      </div>
    </div>
  )
}
