import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import CloseIcon from "../../../assets/icons/CloseIcon.webp"
import { ProfileGolem } from "../../../dojo/hooks/useProfileData";

interface GolemDetailModalProps {
  golem: ProfileGolem;
  onClose: () => void;
}

export function GolemDetailModal({ golem, onClose }: GolemDetailModalProps) {
  const [frameIndex, setFrameIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)
  
  const spriteFrames = golem.animations.run
  const hasMultipleFrames = spriteFrames.length > 1

  useEffect(() => {
    if (!hasMultipleFrames || !isAnimating) return;
    
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % spriteFrames.length)
    }, 85)
    
    return () => clearInterval(interval)
  }, [spriteFrames.length, hasMultipleFrames, isAnimating])

  const toggleAnimation = useCallback(() => {
    if (hasMultipleFrames) {
      setIsAnimating(prev => !prev)
    }
  }, [hasMultipleFrames])

  const rarityColors = {
    Common: "bg-gray-500",
    Rare: "bg-blue-500",
    Uncommon: "bg-purple-500", 
    Legendary: "bg-yellow-500",
  };
  
  const rarityColor = rarityColors[golem.rarity as keyof typeof rarityColors] || "bg-gray-500";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-surface rounded-xl p-6 mx-4 my-12 shadow-lg max-w-sm w-full"
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
            <img src={CloseIcon} alt="Close" className="h-9 w-9" />
          </button>
        </div>

        {/* Sprite animation */}
        <div className="flex justify-center mb-4">
          <div 
            className={`relative w-64 h-64 flex items-center justify-center ${
              hasMultipleFrames ? 'cursor-pointer' : ''
            }`}
            onClick={toggleAnimation}
            title={hasMultipleFrames ? (isAnimating ? 'Click to pause' : 'Click to animate') : ''}
          >
            <img
              src={spriteFrames[frameIndex] || golem.image}
              alt={`${golem.name} ${hasMultipleFrames ? `frame ${frameIndex}` : ''}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        {/* Rarity */}
        <div className="flex justify-center mb-4">
          <span className={`inline-block ${rarityColor} text-surface font-luckiest rounded-full px-3 py-1 text-sm`}>
            {golem.rarity}
          </span>
        </div>

        {/* Description */}
        <p className="text-text-primary font-luckiest text-center mb-4">
          {golem.description}
        </p>
      </motion.div>
    </motion.div>
  )
}
