import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import type { Engine, Container, IOptions, RecursivePartial } from "@tsparticles/engine"
import { MoveDirection } from "@tsparticles/engine"
import { loadFull } from "tsparticles"
import type { Golem } from "../../types/golem"

interface PurchaseAnimationProps {
  golem: Golem
}

export function PurchaseAnimation({ golem }: PurchaseAnimationProps): JSX.Element | null {
  const [engineLoaded, setEngineLoaded] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadFull(engine)
    }).then(() => setEngineLoaded(true))
  }, [])

  useEffect(() => {
    const audio = new Audio("/purchase-success.mp3")
    audio.volume = 0.5
    audio.play().catch((err) => console.log("Audio play failed:", err))
    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [])

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log("Confetti particles loaded", container)
  }

  const options = useMemo<RecursivePartial<IOptions>>(
    () => ({
      fullScreen: { enable: false },
      fpsLimit: 60,
      particles: {
        number: { value: 100, density: { enable: true, area: 800 } },
        color: {
          value: ["#FF8F3F", "#FF5722", "#5BB3DB", "#E6DCC7", "#26453D"],
        },
        shape: { type: "circle" },
        opacity: {
          value: 0.8,
          random: true,
          animation: { enable: true, speed: 1, minimumValue: 0.1, sync: false },
        },
        size: { value: 10, random: true, animation: { enable: false } },
        links: { enable: false },
        move: {
          enable: true,
          speed: 6,
          direction: MoveDirection.none,
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
        collisions: { enable: false },
      },
      interactivity: {
        detectsOn: "canvas",
        events: {
          onHover: { enable: false },
          onClick: { enable: false },
          resize: { enable: true },
        },
      },
      detectRetina: true,
    }),
    []
  )

  if (!engineLoaded) return null

  const rarityColors: Record<string, string> = {
    common: "bg-gray-500",
    rare: "bg-blue-500",
    epic: "bg-purple-500",
    legendary: "bg-yellow-500",
  }
  const rarityClass = rarityColors[golem.rarity.toLowerCase()] || "bg-gray-500"

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Fondo de partículas */}
      <Particles
        id="purchaseParticles"
        className="absolute inset-0 z-0"
        options={options}
        particlesLoaded={particlesLoaded}
      />

      {/* Tarjeta de confirmación */}
      <motion.div
        className="bg-surface p-6 rounded-xl shadow-lg z-10 flex flex-col items-center max-w-xs w-full"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 15 } }}
      >
        {/* Imagen con glow */}
        <motion.div
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{
            rotate: [0, -5, 5, -5, 0],
            scale: [1, 1.05, 1, 1.05, 1],
            transition: { duration: 1.5, repeat: Infinity, repeatType: "reverse" },
          }}
          className="relative w-32 h-32 mb-4"
        >
          <img
            src={golem.image || "/placeholder.svg"}
            alt={golem.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              const img = e.currentTarget
              img.src = "/placeholder.svg?height=128&width=128"
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                "0 0 20px rgba(255,143,63,0.5)",
                "0 0 40px rgba(255,143,63,0.7)",
                "0 0 20px rgba(255,143,63,0.5)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          />
        </motion.div>

        <h2 className="font-luckiest text-xl text-primary mb-2">
          {golem.name} Acquired!
        </h2>

        <span
          className={`inline-block ${rarityClass} font-luckiest text-surface rounded-full px-3 py-1 text-sm mb-3`}
        >
          {golem.rarity}
        </span>

        <p className="text-text-primary font-luckiest text-center mb-4">
          {golem.description}
        </p>

        <motion.p
          className="text-secondary font-bold font-luckiest"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Added to your collection!
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

export default PurchaseAnimation
