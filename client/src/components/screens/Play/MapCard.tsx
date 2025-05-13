import { motion } from "framer-motion"
import { Coins } from "lucide-react"
import type { Map } from "../../types/map"

interface MapCardProps {
  map: Map
  coins: number
  onUnlock: () => void
  onPlay: () => void
}

export function MapCard({ map, coins, onUnlock, onPlay }: MapCardProps) {
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
      <p className="text-text-primary text-sm text-center mt-1 mb-3 font-rubik">
        {map.description}
      </p>

      {/* Botones de Play o Unlock */}
      {map.unlocked ? (
        <button
          onClick={onPlay}
          className="bg-primary text-surface px-6 py-2 rounded-lg font-medium mt-auto w-full text-center hover:bg-primary-hover active:bg-primary-active transition-colors"
        >
          Play
        </button>
      ) : (
        <button
          onClick={onUnlock}
          disabled={!canUnlock}
          className={`
            flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium
            mt-auto w-full text-center transition-colors
            ${canUnlock
              ? "bg-secondary text-surface hover:bg-secondary-hover active:bg-secondary/90"
              : "bg-secondary/50 text-surface/70 cursor-not-allowed"}
          `}
        >
          <span>Unlock for</span>
          <Coins className="h-4 w-4" />
          <span>{map.price}</span>
        </button>
      )}
    </motion.div>
  )
}
