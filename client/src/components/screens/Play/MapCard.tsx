import { motion } from "framer-motion"
import coinIcon from "../../../assets/icons/CoinIcon.png";
import type { Map } from "../../types/map"

interface MapCardProps {
  map: Map
  coins: number
  onUnlock: () => void
  onSelect: () => void
}

export function MapCard({ map, coins, onUnlock, onSelect }: MapCardProps) {
  const canUnlock = map.price !== undefined && coins >= map.price

  return (
    <motion.div
      className="bg-surface rounded-xl shadow-md flex-shrink-0 w-full h-full mx-auto p-4
                    flex flex-col justify-between items-center
                    border-2 border-primary/20"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Imagen del mapa */}
      <div className="relative w-full h-36 rounded-lg overflow-hidden mb-3">
        <img
          src={map.image}
          alt={`${map.name} map`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Nombre y descripción */}
      <h3 className="font-luckiest text-lg text-primary mt-2">
        {map.name}
      </h3>
      <p className="text-dark text-sm text-center mt-1 mb-3 font-luckiest">
        {map.description}
      </p>

      {/* Botones de Play o Unlock */}
      {map.unlocked ? (
        <button
          onClick={onSelect}
          className="btn-cr-yellow mt-auto text-center"
        >
          Select
        </button>
      ) : (
        <button
          onClick={onUnlock}
          disabled={!canUnlock}
          className="btn-cr-yellow mt-auto inline-flex items-center justify-center gap-2"
        >
          <span>Unlock</span>
          <img src={coinIcon} alt="Coin" className="h-5 w-5" />
          <span>{map.price}</span>
        </button>
      )}
    </motion.div>
  )
}
