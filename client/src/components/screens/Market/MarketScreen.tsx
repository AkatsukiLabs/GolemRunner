import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Coins } from "lucide-react"
import { BackgroundParticles } from "../../shared/BackgroundParticles"
import { NavBar } from "../../layout/NavBar"
import { GolemGrid } from "./GolemGrid"
import { PurchaseAnimation } from "./PurchaseAnimation"
import type { Golem } from "../../types/golem"
import { defaultGolems } from "../../../constants/golems"

interface MarketScreenProps {
  coins: number
  level: number
  onPurchase: (price: number) => boolean
  onAddGolem: (golem: Golem) => void
  onNavigation?: (screen: "home" | "play" | "market" | "stats" | "profile" | "ranking") => void
}

export function MarketScreen({ coins, level, onPurchase, onAddGolem, onNavigation }: MarketScreenProps) {
  const [showPurchaseAnimation, setShowPurchaseAnimation] = useState(false)
  const [purchasedGolem, setPurchasedGolem] = useState<Golem | null>(null)

  const handlePurchase = (golem: Golem) => {
    // Attempt to purchase the golem
    const success = onPurchase(golem.price)

    if (success) {
      // Show purchase animation
      setPurchasedGolem(golem)
      setShowPurchaseAnimation(true)

      // Add golem to collection
      onAddGolem(golem)

      // Hide animation after a delay
      setTimeout(() => {
        setShowPurchaseAnimation(false)
      }, 3000)
    } else {
      // Could show an error message here
      console.log("Not enough coins to purchase this golem!")
    }
  }

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
          Market
        </motion.h1>

        <motion.div
          className="flex items-center justify-center bg-secondary w-8 h-8 rounded-full text-surface font-bold"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {level}
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-[calc(100%-8rem)] overflow-y-auto pb-4">
        <GolemGrid golems={defaultGolems} coins={coins} onPurchase={handlePurchase} />
      </div>

      {/* Purchase Animation */}
      <AnimatePresence>
        {showPurchaseAnimation && purchasedGolem && <PurchaseAnimation golem={purchasedGolem} />}
      </AnimatePresence>

      {/* Navigation Bar */}
      <NavBar activeTab="market" onNavigation={onNavigation} />
    </div>
  )
}
