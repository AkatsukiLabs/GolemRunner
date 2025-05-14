import { motion } from "framer-motion"
import coinIcon from "../../../assets/icons/CoinIcon.png";
import type { Golem } from "../../types/golem"

interface GolemCardProps {
  golem: Golem
  canAfford: boolean
  onPurchase: () => void
}

export function GolemCard({ golem, canAfford, onPurchase }: GolemCardProps) {
  const rarityColors = {
    Common: "bg-gray-500",
    Rare: "bg-blue-500",
    Epic: "bg-purple-500",
    Legendary: "bg-yellow-500",
  }
  const rarityColor = rarityColors[golem.rarity]

  const item = {
    hidden: { y: 20, opacity: 0 },
    show:   { y: 0,  opacity: 1 },
  }

  return (
    <motion.div
      className="bg-surface p-4 rounded-xl shadow-md flex flex-col items-center"
      variants={item}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Imagen del golem - Usando transform scale para hacerla más grande */}
      <div className="h-32 flex items-center justify-center mb-2 overflow-visible">
        <div className="transform scale-150">
          <img
            src={golem.image || "/placeholder.svg"}
            alt={golem.name}
            className="w-32 h-32 object-contain"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              img.src = "/placeholder.svg?height=128&width=128"
            }}
          />
        </div>
      </div>

      {/* Nombre */}
      <h3 className="font-luckiest text-lg text-primary mb-1">
        {golem.name}
      </h3>

      {/* Rareza */}
      <span
        className={`inline-block ${rarityColor} text-cream font-luckiest tracking-wide
          rounded-full px-2 py-0.5 text-sm mb-2`}
      >
        {golem.rarity}
      </span>

      {/* Descripción */}
      <p className="font-luckiest text-sm text-text-primary mb-3 text-center h-12 overflow-hidden">
        {golem.description}
      </p>

      {/* Botón o estado Owned */}
      {golem.owned ? (
        <div className="btn-cr-yellow w-full flex items-center justify-center opacity-50 cursor-not-allowed">
          Owned
        </div>
      ) : (
        <motion.button
          onClick={onPurchase}
          className="btn-cr-yellow w-full flex items-center justify-center gap-2"
          whileTap={{ scale: 0.95 }}
        >
          <span>Buy</span>
          <img src={coinIcon} alt="Coin" className="h-5 w-5" />
          <span>{golem.price}</span>
        </motion.button>
      )}
    </motion.div>
  )
}