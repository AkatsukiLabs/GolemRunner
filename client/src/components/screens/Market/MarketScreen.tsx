import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TopBar } from "../../layout/TopBar"
import { BackgroundParticles } from "../../shared/BackgroundParticles"
import { GolemGrid } from "./GolemGrid"
import { PurchaseAnimation } from "./PurchaseAnimation"
import { InsufficientBalanceAnimation } from "./InsufficientBalanceAnimation" // Nuevo componente
import golemSellerIcon from "../../../assets/icons/GolemSellerV2.png" 
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
  // Nuevo estado para el modal de saldo insuficiente
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false)
  const [selectedGolem, setSelectedGolem] = useState<Golem | null>(null)

  const handlePurchase = (golem: Golem) => {
    // Guardar el golem seleccionado
    setSelectedGolem(golem)
    
    // Verificar si el usuario puede pagar el golem
    if (coins >= golem.price) {
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
      }
    } else {
      // Mostrar el modal de saldo insuficiente
      setShowInsufficientBalance(true)
      
      // Ocultar después de un tiempo
      setTimeout(() => {
        setShowInsufficientBalance(false)
      }, 3000)
    }
  }

  const bannerVariant = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 }
  };
  const sellerVariant = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik">
      <BackgroundParticles />

      {/* Top Bar */}
      <TopBar coins={coins} level={level} title="MARKET" screen="market" />

      {/* Clash Royale style banner animado */}
      <motion.div
        className="relative mt-12 mb-3"
        initial="hidden"
        animate="visible"
        variants={bannerVariant}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Golem Seller animado */}
        <motion.div
          className="absolute -top-11 left-3 z-10 w-40 h-40"
          variants={sellerVariant}
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

      {/* Insufficient Balance Animation */}
      <AnimatePresence>
        {showInsufficientBalance && selectedGolem && (
          <InsufficientBalanceAnimation golem={selectedGolem} currentBalance={coins} />
        )}
      </AnimatePresence>
    </div>
  )
}