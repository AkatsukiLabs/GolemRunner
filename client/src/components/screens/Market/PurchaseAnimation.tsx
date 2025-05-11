import { useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import Particles from "react-tsparticles"
import { loadFull } from "tsparticles"
import type { Container, Engine } from "tsparticles-engine"
import Image from "next/image"
import type { Golem } from "../../types/golem"

interface PurchaseAnimationProps {
  golem: Golem
}

export function PurchaseAnimation({ golem }: PurchaseAnimationProps) {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine)
  }, [])

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    console.log("Confetti particles loaded", container)
  }, [])

  // Auto-play the animation when component mounts
  useEffect(() => {
    const audio = new Audio("/purchase-success.mp3")
    audio.volume = 0.5
    audio.play().catch((err) => console.log("Audio play failed:", err))

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Particles
        id="purchaseParticles"
        init={particlesInit}
        loaded={particlesLoaded}
        className="absolute inset-0 z-0"
        options={{
          fullScreen: false,
          fpsLimit: 60,
          particles: {
            number: {
              value: 100,
              density: {
                enable: true,
                value_area: 800,
              },
            },
            color: {
              value: ["#FF8F3F", "#FF5722", "#5BB3DB", "#E6DCC7", "#26453D"],
            },
            shape: {
              type: "circle",
            },
            opacity: {
              value: 0.8,
              random: true,
              anim: {
                enable: true,
                speed: 1,
                opacity_min: 0.1,
                sync: false,
              },
            },
            size: {
              value: 10,
              random: true,
              anim: {
                enable: false,
              },
            },
            line_linked: {
              enable: false,
            },
            move: {
              enable: true,
              speed: 6,
              direction: "none",
              random: true,
              straight: false,
              out_mode: "out",
              bounce: false,
            },
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: {
                enable: false,
              },
              onclick: {
                enable: false,
              },
              resize: true,
            },
          },
          retina_detect: true,
        }}
      />

      <motion.div
        className="bg-surface p-6 rounded-xl shadow-lg z-10 flex flex-col items-center max-w-xs w-full"
        initial={{ scale: 0.8, y: 20 }}
        animate={{
          scale: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 15,
          },
        }}
      >
        <motion.div
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{
            rotate: [0, -5, 5, -5, 0],
            scale: [1, 1.05, 1, 1.05, 1],
            transition: {
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            },
          }}
          className="relative w-32 h-32 mb-4"
        >
          <Image
            src={golem.image || "/placeholder.svg"}
            alt={golem.name}
            fill
            className="object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=128&width=128"
            }}
          />

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                "0 0 20px rgba(255,143,63,0.5)",
                "0 0 40px rgba(255,143,63,0.7)",
                "0 0 20px rgba(255,143,63,0.5)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />
        </motion.div>

        <h2 className="font-luckiest text-xl text-primary mb-2">{golem.name} Acquired!</h2>

        <span
          className={`inline-block bg-${golem.rarity.toLowerCase()} text-surface rounded-full px-3 py-1 text-sm mb-3`}
        >
          {golem.rarity}
        </span>

        <p className="text-text-primary text-center mb-4">{golem.description}</p>

        <motion.p
          className="text-secondary font-bold"
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
