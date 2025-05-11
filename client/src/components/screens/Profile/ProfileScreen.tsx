import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Coins } from "lucide-react"
import { BackgroundParticles } from "../../shared/BackgroundParticles"
import { NavBar } from "../../layout/NavBar"
import { GolemCarouselProfile } from "./GolemCarouselProfile"
import { MapCarouselProfile } from "./MapCarouselProfile"
import { GolemDetailModal } from "./GolemDetailModal"
import type { Golem } from "../../types/golem"
import type { Map } from "../../types/map"

interface ProfileScreenProps {
  coins: number
  level: number
  experience: number
  nextLevelExperience: number
  ownedGolems: Golem[]
  unlockedMaps: Map[]
  onNavigation: (screen: "home" | "play" | "market" | "stats" | "profile") => void
}

export function ProfileScreen({
  coins,
  level,
  experience,
  nextLevelExperience,
  ownedGolems,
  unlockedMaps,
  onNavigation,
}: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<"golems" | "maps">("golems")
  const [selectedGolem, setSelectedGolem] = useState<Golem | null>(null)

  const handleGolemClick = (golem: Golem) => {
    setSelectedGolem(golem)
  }

  const handleCloseModal = () => {
    setSelectedGolem(null)
  }

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
          Profile
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

      {/* Tab Filter */}
      <div className="relative z-10 px-4 mt-2">
        <div className="flex bg-surface rounded-lg shadow-md overflow-hidden">
          <button
            className={`flex-1 py-2 text-center font-bangers text-lg transition-colors ${
              activeTab === "golems" ? "bg-primary text-surface" : "bg-surface/60 text-secondary"
            }`}
            onClick={() => setActiveTab("golems")}
          >
            Golems
          </button>
          <button
            className={`flex-1 py-2 text-center font-bangers text-lg transition-colors ${
              activeTab === "maps" ? "bg-primary text-surface" : "bg-surface/60 text-secondary"
            }`}
            onClick={() => setActiveTab("maps")}
          >
            Maps
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 px-4 pt-4 h-[calc(100%-12rem)] overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "golems" ? (
            <motion.div
              key="golems"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-luckiest text-xl text-surface mb-3">Your Golems Collection:</h2>
              {ownedGolems.length > 0 ? (
                <GolemCarouselProfile golems={ownedGolems} onGolemClick={handleGolemClick} />
              ) : (
                <div className="bg-surface/80 p-6 rounded-lg text-center">
                  <p className="text-text-primary">You don't have any golems yet.</p>
                  <button
                    className="mt-3 bg-primary text-surface px-4 py-2 rounded-lg font-medium"
                    onClick={() => onNavigation("market")}
                  >
                    Visit Market
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="maps"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-luckiest text-xl text-surface mb-3">Your Maps Collection:</h2>
              {unlockedMaps.length > 0 ? (
                <MapCarouselProfile maps={unlockedMaps} />
              ) : (
                <div className="bg-surface/80 p-6 rounded-lg text-center">
                  <p className="text-text-primary">You don't have any maps yet.</p>
                  <button
                    className="mt-3 bg-primary text-surface px-4 py-2 rounded-lg font-medium"
                    onClick={() => onNavigation("play")}
                  >
                    Visit Maps
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Golem Detail Modal */}
      <AnimatePresence>
        {selectedGolem && <GolemDetailModal golem={selectedGolem} onClose={handleCloseModal} />}
      </AnimatePresence>

      {/* Navigation Bar */}
      <NavBar activeTab="profile" onNavigation={onNavigation} />
    </div>
  )
}
