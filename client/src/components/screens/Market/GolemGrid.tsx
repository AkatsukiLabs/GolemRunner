import { motion } from "framer-motion"
import { GolemCard } from "./GolemCard"
import type { Golem } from "../../types/golem"

interface GolemGridProps {
  golems: Golem[]
  coins: number
  onPurchase: (golem: Golem) => void
}

export function GolemGrid({ golems, coins, onPurchase }: GolemGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <motion.div className="px-4 pt-4" variants={container} initial="hidden" animate="show">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {golems.map((golem) => (
          <GolemCard
            key={golem.id}
            golem={golem}
            canAfford={coins >= golem.price}
            onPurchase={() => onPurchase(golem)}
          />
        ))}
      </div>
    </motion.div>
  )
}
