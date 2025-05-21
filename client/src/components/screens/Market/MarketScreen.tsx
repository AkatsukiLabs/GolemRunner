import { useState } from "react"
import { motion } from "framer-motion"
import { TopBar } from "../../layout/TopBar"
import BackgroundParticles from "../../shared/BackgroundParticles"
import { GolemGrid } from "./GolemGrid"
import { MapGrid } from "./MapGrid"
import { PurchaseAnimation } from "./PurchaseAnimation"
import { InsufficientBalanceAnimation } from "./InsufficientBalanceAnimation"
import golemSellerIcon from "../../../assets/icons/GolemSellerV2.png"
import type { Golem } from "../../../components/types/golem"
import type { Map } from "../../../components/types/map"
import { defaultGolems } from "../../../constants/golems"
import { defaultMaps } from "../../../constants/maps"

interface MarketScreenProps {
  coins: number
  level: number
  onCoinsChange: (newCoins: number) => void
  onGolemPurchase: (golem: Golem) => void
  onMapPurchase: (map: Map) => void
}

export function MarketScreen({ 
  coins, 
  level, 
  onCoinsChange, 
  onGolemPurchase, 
  onMapPurchase
}: MarketScreenProps) {
  const [selectedItem, setSelectedItem] = useState<Golem | Map | null>(null)
  const [showPurchaseAnimation, setShowPurchaseAnimation] = useState(false)
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false)

  const handlePurchase = (item: Golem | Map) => {
    if (coins >= (item.price || 0)) {
      setSelectedItem(item)
      setShowPurchaseAnimation(true)
      onCoinsChange(coins - (item.price || 0))

      // Actualizar el estado del item comprado
      if ('animations' in item) {
        // Es un golem
        const golem = item as Golem
        onGolemPurchase({ ...golem, owned: true })
      } else {
        // Es un mapa
        const map = item as Map
        onMapPurchase({ ...map, unlocked: true })
      }
    } else {
      setSelectedItem(item)
      setShowInsufficientBalance(true)
    }
  }

  const handleCloseAnimation = () => {
    setShowPurchaseAnimation(false)
    setShowInsufficientBalance(false)
    setSelectedItem(null)
  }

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik">
      <BackgroundParticles />
      
      {/* Top Bar */}
      <TopBar coins={coins} level={level} title="MARKET" screen="market" />

      {/* Clash Royale style banner animado */}
      <motion.div
        className="relative mt-12 mb-3"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Golem Seller animado */}
        <motion.div
          className="absolute -top-11 left-3 z-10 w-40 h-40"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
        >
          <img 
            src={golemSellerIcon}
            alt="Golem Seller"
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
              Available Cards
            </h2>
            <p className="font-luckiest text-dark text-sm opacity-90 mt-1 sm:mt-0">
              What do you want to buy today?
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 h-[calc(100%-16rem)] overflow-y-auto pb-16">
        <div className="px-4 py-2">
          {/* Golems Section */}
          <div className="mb-8 mt-8">
            <h3 className="font-luckiest text-cream text-lg mb-4">Golems</h3>
            <GolemGrid 
              golems={defaultGolems} 
              coins={coins} 
              onPurchase={handlePurchase} 
            />
          </div>

          {/* Maps Section */}
          <div>
            <h3 className="font-luckiest text-cream text-lg mb-4">Maps</h3>
            <MapGrid 
              maps={defaultMaps} 
              coins={coins} 
              onPurchase={handlePurchase} 
            />
          </div>
        </div>
      </div>

      {/* Animaciones */}
      {selectedItem && (
        <>
          {showPurchaseAnimation && (
            <PurchaseAnimation
              item={selectedItem}
              onClose={handleCloseAnimation}
            />
          )}
          {showInsufficientBalance && (
            <InsufficientBalanceAnimation
              item={selectedItem}
              currentBalance={coins}
              onClose={handleCloseAnimation}
            />
          )}
        </>
      )}
    </div>
  )
}

export default MarketScreen