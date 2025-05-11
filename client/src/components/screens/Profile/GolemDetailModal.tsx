import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import type { Golem } from "../../types/golem"

interface GolemDetailModalProps {
  golem: Golem
  onClose: () => void
}

export function GolemDetailModal({ golem, onClose }: GolemDetailModalProps) {
  const [frameIndex, setFrameIndex] = useState(0)

  // Construye las rutas de los frames basados en el nombre de la imagen
  const spriteFrames = [
    golem.image.replace(".png", "") + "_frame1.png",
    golem.image.replace(".png", "") + "_frame2.png",
    golem.image.replace(".png", "") + "_frame3.png",
    golem.image.replace(".png", "") + "_frame4.png",
  ]

  // Ciclo de animación de sprites
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % spriteFrames.length)
    }, 200)
    return () => clearInterval(interval)
  }, [spriteFrames.length])

  const rarityColors: Record<string, string> = {
    Common: "bg-gray-500",
    Rare: "bg-blue-500",
    Epic: "bg-purple-500",
    Legendary: "bg-yellow-500",
  }
  const rarityColor = rarityColors[golem.rarity] || "bg-gray-500"

  // Genera stats de ejemplo
  const stats = {
    strength: Math.floor(Math.random() * 100) + 1,
    speed: Math.floor(Math.random() * 100) + 1,
    defense: Math.floor(Math.random() * 100) + 1,
    special: Math.floor(Math.random() * 100) + 1,
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-surface rounded-xl p-4 mx-4 my-12 shadow-lg max-w-sm w-full"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-luckiest text-2xl text-primary">{golem.name}</h2>
          <button
            onClick={onClose}
            className="bg-screen/10 hover:bg-screen/20 rounded-full p-1 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-text-primary" />
          </button>
        </div>

        {/* Animación de sprite */}
        <div className="flex justify-center mb-4">
          <div className="relative w-40 h-40">
            <AnimatePresence mode="wait">
              <motion.div
                key={frameIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="absolute inset-0"
              >
                <img
                  src={spriteFrames[frameIndex] || golem.image || "/placeholder.svg"}
                  alt={`${golem.name} frame ${frameIndex + 1}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement
                    img.src = golem.image || "/placeholder.svg?height=160&width=160"
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Rareza */}
        <div className="flex justify-center mb-3">
          <span className={`inline-block ${rarityColor} text-surface rounded-full px-3 py-1 text-sm`}>
            {golem.rarity}
          </span>
        </div>

        {/* Descripción */}
        <p className="font-rubik text-text-primary text-center mb-4">
          {golem.description}
        </p>

        {/* Stats */}
        <div className="bg-screen/10 rounded-lg p-3 mb-4">
          <h3 className="font-bangers text-lg text-primary mb-2 text-center">Stats</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key}>
                <p className="text-sm text-text-secondary capitalize">{key}</p>
                <div className="h-2 bg-surface/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      key === "special"
                        ? "bg-accent-glow"
                        : key === "speed"
                        ? "bg-secondary"
                        : key === "defense"
                        ? "bg-text-secondary"
                        : "bg-primary"
                    }`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cerrar */}
        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg font-medium text-surface bg-primary hover:bg-primary-hover active:bg-primary-active transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  )
}
