import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TopBar } from "../../layout/TopBar"
import { ProfileGolemCard } from "./ProfileGolemCard";
import { ProfileMapGrid } from "./MapProfileCard";
import BackgroundParticles from "../../shared/BackgroundParticles"
import { GolemDetailModal } from "./GolemDetailModal"
import { useProfileData } from "../../../dojo/hooks/useProfileData";

interface ProfileScreenProps {
  onNavigation: (screen: "home" | "play" | "market" | "profile" | "ranking") => void
}

export function ProfileScreen({ onNavigation }: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<"golems" | "maps">("golems")
  const [selectedGolemId, setSelectedGolemId] = useState<number | null>(null)

  // Custom hook
  const {
    player,
    ownedGolems,
    unlockedMaps,
    stats,
    isLoading,
    error,
    getGolemById
  } = useProfileData();

  // Get selected golem for modal
  const selectedGolem = selectedGolemId ? getGolemById(selectedGolemId) : null;

  const handleGolemClick = (golemId: number) => {
    setSelectedGolemId(golemId)
  }

  const handleCloseModal = () => {
    setSelectedGolemId(null)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="relative h-screen w-full bg-screen overflow-hidden flex items-center justify-center">
        <BackgroundParticles />
        <div className="text-center">
          <div className="text-white font-luckiest text-2xl mb-4">Loading your collection...</div>
          <div className="text-surface font-luckiest text-sm">Fetching data from blockchain...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative h-screen w-full bg-screen overflow-hidden flex items-center justify-center">
        <BackgroundParticles />
        <div className="text-center max-w-md">
          <div className="text-red-500 font-luckiest text-xl mb-4">
            Oops! Something went wrong
          </div>
          <div className="text-surface font-luckiest text-sm mb-6">
            {error}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary text-surface px-6 py-3 rounded-lg font-luckiest hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden">
      <BackgroundParticles />

      {/* Top Bar with player data */}
      <TopBar 
        coins={player?.coins || 0} 
        level={player?.level || 1} 
        title="PROFILE" 
        screen="profile" 
      />

      {/* Stats Bar */}
      <div className="relative z-10 px-4 mt-2">
        <div className="bg-surface/20 backdrop-blur-sm rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center text-surface font-luckiest text-sm">
            <div className="text-center">
              <div className="text-lg">{stats.ownedGolemsCount}/{stats.totalGolems}</div>
              <div className="text-xs opacity-75">Golems</div>
            </div>
            <div className="text-center">
              <div className="text-lg">{stats.unlockedMapsCount}/{stats.totalMaps}</div>
              <div className="text-xs opacity-75">Maps</div>
            </div>
            <div className="text-center">
              <div className="text-lg">{player?.total_points || 0}</div>
              <div className="text-xs opacity-75">Total Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Filter with counts */}
      <div className="relative z-10 px-4">
        <div className="flex bg-golem-gradient rounded-[10px] overflow-hidden">
          <button
            className={`flex-1 py-3 text-center text-xl font-luckiest text-cream drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] transition-colors ${
              activeTab === "golems" ? "text-dark" : "opacity-80 hover:opacity-100"
            }`}
            onClick={() => setActiveTab("golems")}
          >
            Golems ({stats.ownedGolemsCount})
          </button>
          <button
            className={`flex-1 py-3 text-center text-xl font-luckiest text-cream drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] transition-colors ${
              activeTab === "maps" ? "text-dark" : "opacity-80 hover:opacity-100"
            }`}
            onClick={() => setActiveTab("maps")}
          >
            Maps ({stats.unlockedMapsCount})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 px-4 pt-4 h-[calc(100%-16rem)] overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "golems" ? (
            <motion.div
              key="golems"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-luckiest text-lg text-surface">
                  Your Golems Collection
                </h2>
                <div className="text-surface/60 font-luckiest text-sm">
                  {stats.completionPercentage.golems}% Complete
                </div>
              </div>
              
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
                        onView={() => handleGolemClick(golem.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="bg-surface/80 p-6 rounded-lg text-center">
                  <div className="text-6xl mb-4">🏺</div>
                  <p className="text-text-primary font-luckiest mb-2">No golems in your collection yet!</p>
                  <p className="text-text-primary/60 text-sm mb-4">Visit the market to unlock your first golem.</p>
                  <button
                    className="bg-primary text-surface px-6 py-2 rounded-lg font-luckiest hover:bg-primary/90 transition-colors"
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-luckiest text-lg text-surface">
                  Your Maps Collection
                </h2>
                <div className="text-surface/60 font-luckiest text-sm">
                  {stats.completionPercentage.maps}% Complete
                </div>
              </div>
              
              {unlockedMaps.length > 0 ? (
                <ProfileMapGrid maps={unlockedMaps} />
              ) : (
                <div className="bg-surface/80 p-6 rounded-lg text-center">
                  <div className="text-6xl mb-4">🗺️</div>
                  <p className="text-text-primary font-luckiest mb-2">No maps unlocked yet!</p>
                  <p className="text-text-primary/60 text-sm mb-4">Unlock maps to explore new worlds.</p>
                  <button
                    className="bg-primary text-surface px-6 py-2 rounded-lg font-luckiest hover:bg-primary/90 transition-colors"
                    onClick={() => onNavigation("market")}
                  >
                    Unlock Maps
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Golem Detail Modal */}
      <AnimatePresence>
        {selectedGolem && (
          <GolemDetailModal 
            golem={selectedGolem} 
            onClose={handleCloseModal} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}