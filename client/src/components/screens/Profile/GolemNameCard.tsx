import { motion } from "framer-motion"
import type { Golem } from "../../types/golem"

interface GolemNameCardProps {
  golem: Golem
  onClick: () => void
}

export function GolemNameCard({ golem, onClick }: GolemNameCardProps) {
  const rarityColors: Record<string, string> = {
    Common: "bg-gray-500",
    Rare: "bg-blue-500",
    Epic: "bg-purple-500",
    Legendary: "bg-yellow-500",
  }

  const rarityColor = rarityColors[golem.rarity] || "bg-gray-500"

  return (
    <motion.div
      className="bg-surface p-3 rounded-lg shadow-sm flex flex-col items-center cursor-pointer"
      whileHover={{ y: -5, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      <div className="relative w-20 h-20 mb-2">
        <img
          src={golem.image || "/placeholder.svg"}
          alt={golem.name}
          className="w-full h-full object-contain"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement
            img.src = "/placeholder.svg?height=80&width=80"
          }}
        />
      </div>

      <h3 className="font-luckiest text-base text-primary text-center">
        {golem.name}
      </h3>

      <span
        className={`inline-block ${rarityColor} text-surface rounded-full px-2 py-0.5 text-xs mt-1`}
      >
        {golem.rarity}
      </span>
    </motion.div>
  )
}
