import { motion } from "framer-motion"
import { MapCard } from "./MapCard"

interface MarketMap {
  id: number;
  name: string;
  description: string;
  image: string;
  theme: string;
  price: number;
  unlocked: boolean;
}

interface MapGridProps {
  maps: MarketMap[]
  onPurchase: (map: MarketMap) => void
}

export function MapGrid({ maps, onPurchase }: MapGridProps) {
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
        {maps.map((map) => (
          <MapCard
            key={map.id}
            map={map}
            onPurchase={() => onPurchase(map)}
          />
        ))}
      </div>
    </motion.div>
  )
}