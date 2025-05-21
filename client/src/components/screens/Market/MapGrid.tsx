import { motion } from "framer-motion"
import { MapCard } from "./MapCard"
import type { Map } from "../../../components/types/map"

interface MapGridProps {
  maps: Map[]
  coins: number
  onPurchase: (map: Map) => void
}

export function MapGrid({ maps, coins, onPurchase }: MapGridProps) {
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
            canAfford={coins >= (map.price || 0)}
            onPurchase={() => onPurchase(map)}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default MapGrid 