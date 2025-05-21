import { motion } from "framer-motion"
import { GolemCard } from "./GolemCard"

// Definir el tipo específico para el marketplace
interface MarketGolem {
  id: number;
  name: string;
  description: string;
  image: string;
  rarity: string;
  price: number;
  owned: boolean;
}

interface GolemGridProps {
  golems: MarketGolem[]
  onPurchase: (golem: MarketGolem) => void
}

export function GolemGrid({ golems, onPurchase }: GolemGridProps) {
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
        {golems.map((golem) => (
          <GolemCard
            key={golem.id}
            golem={golem}
            onPurchase={() => onPurchase(golem)}
          />
        ))}
      </div>
    </motion.div>
  )
}