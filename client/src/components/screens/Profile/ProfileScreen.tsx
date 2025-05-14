import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TopBar } from "../../layout/TopBar"
import { ProfileGolemCard } from "./ProfileGolemCard";
import { BackgroundParticles } from "../../shared/BackgroundParticles"
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
  onNavigation: (screen: "home" | "play" | "market" | "profile" | "ranking") => void
}

export function ProfileScreen({
  coins,
  level,
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

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden">
      <BackgroundParticles />

      {/* Top Bar */}
      <TopBar coins={coins} level={level} title="PROFILE" screen="profile" />

      {/* Tab Filter */}
      <div className="relative z-10 px-4 mt-2">
        <div className="flex bg-golem-gradient rounded-[10px] overflow-hidden">
          <button
            className={`flex-1 py-2 text-center text-2xl font-luckiest text-cream drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] transition-colors ${
              activeTab === "golems" ? "text-dark" : "opacity-80 hover:opacity-100"
            }`}
            onClick={() => setActiveTab("golems")}
          >
            Golems
          </button>
          <button
            className={`flex-1 py-2 text-center text-2xl font-luckiest text-cream drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] transition-colors ${
              activeTab === "maps" ? "text-dark" : "opacity-80 hover:opacity-100"
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
              <h2 className="font-luckiest text-xl text-surface mb-3">
                Your Golems Collection:
              </h2>
              {ownedGolems.length > 0 ? (
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                  }}
                  initial="hidden"
                  animate="show"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {ownedGolems.map((golem) => (
                      <ProfileGolemCard
                        key={golem.id}
                        golem={golem}
                        onView={() => handleGolemClick(golem)}
                      />
                    ))}
                  </div>
                </motion.div>
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
    </div>
  )
}
