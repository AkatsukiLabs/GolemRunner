import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TopBar } from "../../layout/TopBar"
import { BackgroundParticles } from "../../shared/BackgroundParticles"
import { GolemGrid } from "./GolemGrid"
import { PurchaseAnimation } from "./PurchaseAnimation"
import golemSellerIcon from "../../../assets/icons/GolemSelller.png" 
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

      {/* Top Bar */}
      <TopBar coins={coins} level={level} title="MARKET" screen="market" />

      {/* Clash Royale style banner */}
      <div className="relative mt-12 mb-3">
        {/* Golem Seller - positioned above the banner */}
        <div className="absolute -top-11 left-3 z-10 w-40 h-40">
          <img 
            src={golemSellerIcon} 
            alt="Golem Seller" 
            className="object-contain"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              img.src = "/placeholder.svg?height=80&width=80"
            }}
          />
        </div>
        
        {/* Banner */}
        <div className="bg-golem-gradient py-3 px-4 pl-40 relative rounded-[10px] mx-4 shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <h2 className="font-luckiest text-cream text-xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] tracking-wide">
              Available Cards
            </h2>
            <p className="font-luckiest text-dark text-sm opacity-90 mt-1 sm:mt-0">
              What do you want to buy today?
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-[calc(100%-12rem)] overflow-y-auto pb-4">
        <div className="px-4 py-2">
          <GolemGrid 
            golems={defaultGolems} 
            coins={coins} 
            onPurchase={handlePurchase} 
          />
        </div>
      </div>

      {/* Purchase Animation */}
      <AnimatePresence>
        {showPurchaseAnimation && purchasedGolem && <PurchaseAnimation golem={purchasedGolem} />}
      </AnimatePresence>
    </div>
  )
}