import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import CloseIcon from "../../../assets/icons/CloseIcon.png"
import type { Golem } from "../../types/golem"

interface GolemDetailModalProps {
  golem: Golem
  onClose: () => void
}

export function GolemDetailModal({ golem, onClose }: GolemDetailModalProps) {
  const [frameIndex, setFrameIndex] = useState(0)
  const spriteFrames = golem.animations.run

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((i) => (i + 1) % spriteFrames.length)
    }, 100)     // velocidad un poco más rápida
    return () => clearInterval(interval)
  }, [spriteFrames.length])

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
            className="rounded-full p-1 transition-colors"
            aria-label="Close"
          >
            <img
            src={CloseIcon}
            alt="Close"
            className="h-9 w-9"
            />
          </button>
        </div>

        {/* Animación de sprite */}
        <div className="flex justify-center mb-4">
        <div className="relative w-64 h-64">
            <img
              src={spriteFrames[frameIndex]}
              alt={`${golem.name} frame ${frameIndex}`}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Rareza */}
        <div className="flex justify-center mb-3">
          <span className={`inline-block ${rarityColor} text-surface font-luckiest rounded-full px-3 py-1 text-sm`}>
            {golem.rarity}
          </span>
        </div>

        {/* Descripción */}
        <p className="text-text-primary font-luckiest text-center mb-4">
          {golem.description}
        </p>

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
