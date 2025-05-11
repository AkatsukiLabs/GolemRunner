import Image from "next/image"
import { motion } from "framer-motion"
import { Coins } from "lucide-react"
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
    show: { y: 0, opacity: 1 },
  }

  return (
    <motion.div
      className="bg-surface p-4 rounded-xl shadow-md flex flex-col items-center"
      variants={item}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2">
        <Image
          src={golem.image || "/placeholder.svg"}
          alt={golem.name}
          fill
          className="object-contain"
          // Fallback image if the golem image is not available
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=128&width=128"
          }}
        />
      </div>

      <h3 className="font-luckiest text-lg text-primary mb-1">{golem.name}</h3>

      <span className={`inline-block ${rarityColor} text-surface rounded-full px-2 py-0.5 text-sm mb-2`}>
        {golem.rarity}
      </span>

      <p className="font-rubik text-sm text-text-primary mb-3 text-center h-12 overflow-hidden">{golem.description}</p>

      {golem.owned ? (
        <div className="w-full py-2 rounded-lg font-medium text-surface bg-gray-500 text-center">Owned</div>
      ) : (
        <motion.button
          onClick={onPurchase}
          disabled={!canAfford}
          className={`w-full py-2 rounded-lg font-medium text-surface flex items-center justify-center gap-2 ${
            canAfford ? "bg-primary hover:bg-primary-hover active:bg-primary-active" : "bg-gray-500 cursor-not-allowed"
          } transition-colors`}
          whileTap={canAfford ? { scale: 0.95 } : {}}
        >
          <span>Buy for</span>
          <Coins className="h-4 w-4" />
          <span>{golem.price}</span>
        </motion.button>
      )}
    </motion.div>
  )
}
