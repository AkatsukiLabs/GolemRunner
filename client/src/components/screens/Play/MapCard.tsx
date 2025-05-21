import { motion } from "framer-motion"
import type { Map } from "../../types/map"

interface MapCardProps {
  map: Map
  coins: number
  onUnlock: () => void
  onSelect: () => void
}

export function MapCard({ map, onSelect }: MapCardProps) {
  const isUnlocked = map.unlocked;

  return (
    <motion.div
      className="bg-surface rounded-xl shadow-md flex-shrink-0 w-full mx-auto p-4
      flex flex-col justify-between items-center
      border-2 border-primary/20 z-10"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      style={{ 
        marginTop: '10px', 
        marginBottom: '10px' 
      }}
    >
      {/* Map image */}
      <div className="relative w-full h-36 rounded-lg overflow-hidden mb-3">
        <img
          src={map.image}
          alt={`${map.name} map`}
          className={`w-full h-full object-cover ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}
        />
        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-dark bg-opacity-60 rounded-full p-2">
              <span className="text-cream text-2xl">🔒</span>
            </div>
          </div>
        )}
      </div>

      {/* Name and description */}
      <h3 className="font-luckiest text-lg text-primary mt-2">
        {map.name}
      </h3>
      <p className="text-dark text-sm text-center mt-1 mb-3 font-luckiest">
        {map.description}
      </p>

      {isUnlocked ? (
        <button
          onClick={() => {
            onSelect();
          }}
          className="btn-cr-yellow mt-auto text-center"
        >
          Select
        </button>
      ) : (
        <button
          className="btn-cr-gray mt-auto text-center"
          onClick={() => {
            onSelect(); 
          }}
        >
          Locked
        </button>
      )}
    </motion.div>
  )
}