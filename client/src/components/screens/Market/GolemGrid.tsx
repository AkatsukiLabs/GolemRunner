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
    <motion.div variants={container} initial="hidden" animate="show">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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