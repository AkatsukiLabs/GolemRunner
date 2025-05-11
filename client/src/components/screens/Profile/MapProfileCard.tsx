import { motion } from "framer-motion"
import Image from "next/image"
import { Trophy } from "lucide-react"
import type { Map } from "../../types/map"

interface MapProfileCardProps {
  map: Map
}

export function MapProfileCard({ map }: MapProfileCardProps) {
  return (
    <motion.div
      className="bg-surface p-4 rounded-lg shadow-sm flex flex-col items-center"
      whileHover={{ y: -5, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="relative w-full h-24 rounded-lg overflow-hidden mb-2">
        <Image
          src={map.image || "/placeholder.svg"}
          alt={map.name}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=96&width=160"
          }}
        />
      </div>

      <h3 className="font-luckiest text-base text-primary mb-1 text-center">{map.name}</h3>

      {map.highScore !== undefined && (
        <div className="flex items-center text-secondary">
          <Trophy className="h-4 w-4 mr-1" />
          <span className="font-rubik text-sm">High Score: {map.highScore.toLocaleString()}</span>
        </div>
      )}
    </motion.div>
  )
}
