import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TopBar } from "../../layout/TopBar"
import { BackgroundParticles } from "../../shared/BackgroundParticles"
import { GolemGrid } from "./GolemGrid"
import { PurchaseAnimation } from "./PurchaseAnimation"
import type { Golem } from "../../types/golem"
import { defaultGolems } from "../../../constants/golems"

interface MarketScreenProps {
  coins: number
  level: number
  onPurchase: (price: number) => boolean
  onAddGolem: (golem: Golem) => void
  onNavigation?: (screen: "home" | "play" | "market" | "profile" | "ranking") => void
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

      <TopBar coins={coins} level={level} title="MARKET" screen="market" />

      {/* Main Content */}
      <div className="relative z-10 h-[calc(100%-8rem)] overflow-y-auto pb-4">
        <GolemGrid golems={defaultGolems} coins={coins} onPurchase={handlePurchase} />
      </div>

      {/* Purchase Animation */}
      <AnimatePresence>
        {showPurchaseAnimation && purchasedGolem && <PurchaseAnimation golem={purchasedGolem} />}
      </AnimatePresence>
    </div>
  )
}
