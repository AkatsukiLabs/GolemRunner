import CloseIcon from "../../../assets/icons/CloseIcon.png"
import { motion } from "framer-motion"
import { BackgroundParticles } from "../../shared/BackgroundParticles"
import { MapCarousel } from "./MapCarousel"
import { defaultMaps } from "../../../constants/maps"

interface PlayScreenProps {
  onClose: () => void
  coins: number
  onSpendCoins: (amount: number) => void
  onNavigation?: (screen: "home" | "play" | "market" | "profile" | "ranking") => void
}

export function PlayScreen({ onClose, coins, onSpendCoins, onNavigation }: PlayScreenProps) {
  const handleUnlockMap = (mapId: number, price: number) => {
    if (coins >= price) {
      onSpendCoins(price)
      // In a real app, you would update the map's unlocked status in your state management
      console.log(`Unlocked map ${mapId} for ${price} coins`)
    } else {
      console.log("Not enough coins!")
      // You could show a notification here
    }
  }

  const handlePlayMap = (mapId: number) => {
    console.log(`Starting game on map ${mapId}`)
    // Navigation logic to the actual gameplay screen would go here
  }

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik">
      <BackgroundParticles />

      {/* Top Bar */}
      <div className="relative z-10 w-full px-4 py-3 flex items-center justify-between">
        <motion.button
          className="bg-surface border-2 border-primary rounded-full p-2 text-primary hover:bg-surface/90 active:bg-surface/80 transition-colors"
          onClick={onClose}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          aria-label="Close"
        > 
          <img
            src={CloseIcon}
            alt="Close"
            className="h-8 w-8"
          />
        </motion.button>

        <motion.h1
          className="font-bangers text-5xl text-cream absolute left-1/2 transform -translate-x-1/2"
          style={{ 
            marginLeft: '-30px'
          }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Play
        </motion.h1>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center py-8 px-4">
        <motion.div
          className="w-full max-w-md bg-surface rounded-xl p-6 shadow-lg"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-luckiest text-3xl text-dark mb-4 text-center">Maps</h2>

          <MapCarousel maps={defaultMaps} coins={coins} onUnlock={handleUnlockMap} onSelect={handlePlayMap} />
        </motion.div>
      </div>
    </div>
  )
}
