import { motion } from "framer-motion"
import coinIcon from "../../../assets/icons/CoinIcon.png"
import type { Map } from "../../../components/types/map"

interface MapCardProps {
  map: Map
  canAfford: boolean
  onPurchase: () => void
}

export function MapCard({ map, canAfford, onPurchase }: MapCardProps) {
  return (
    <motion.div
      className="bg-surface p-5 rounded-xl shadow-md flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      {/* Imagen del mapa */}
      <div className="relative w-full h-32 mb-3">
        <img
          src={map.image}
          alt={map.name}
          className="w-full h-full object-cover rounded-md"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement
            img.src = "/placeholder.svg?height=128&width=192"
          }}
        />
      </div>

      {/* Nombre del mapa */}
      <h3 className="font-luckiest text-xl text-primary mb-2 text-center">
        {map.name}
      </h3>

      {/* Descripción */}
      <p className="font-luckiest text-sm text-text-primary mb-3 text-center h-12 overflow-hidden">
        {map.description}
      </p>

      {/* Botón de compra */}
      {map.unlocked ? (
        <div className="btn-cr-yellow w-full flex items-center justify-center opacity-50 cursor-not-allowed">
          Unlocked
        </div>
      ) : (
        <motion.button
          onClick={onPurchase}
          className={`btn-cr-yellow w-full flex items-center justify-center gap-2 ${
            !canAfford ? "opacity-50 cursor-not-allowed" : ""
          }`}
          whileTap={{ scale: canAfford ? 0.95 : 1 }}
          disabled={!canAfford}
        >
          <span>Buy</span>
          <img src={coinIcon} alt="Coin" className="h-5 w-5" />
          <span>{map.price}</span>
        </motion.button>
      )}
    </motion.div>
  )
}

export default MapCard 