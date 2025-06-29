import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import type { Engine, Container, IOptions, RecursivePartial } from "@tsparticles/engine"
import { MoveDirection } from "@tsparticles/engine"
import { loadFull } from "tsparticles"
import coinIcon from "../../../assets/icons/CoinIcon.webp";

interface Mission {
  id: string
  title: string
  description: string
  difficulty: 'Easy' | 'Mid' | 'Hard'
  reward: number
  completed: boolean
  claimed?: boolean // Añadimos esta propiedad para el estado de reclamado
}

interface ClaimMissionAnimationProps {
  mission: Mission;
  onClose: () => void;
}

export function ClaimMissionAnimation({ mission, onClose }: ClaimMissionAnimationProps): JSX.Element | null {
  const [engineLoaded, setEngineLoaded] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadFull(engine)
    }).then(() => setEngineLoaded(true))
  }, [])

  // Effect to automatically close after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  // Play success sound effect
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
    console.log("Claim particles loaded", container)
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

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      {/* Particle background */}
      <Particles
        id="claimParticles"
        className="absolute inset-0 z-0"
        options={options}
        particlesLoaded={particlesLoaded}
      />

      {/* Confirmation card */}
      <motion.div
        className="bg-cream p-6 rounded-xl shadow-lg z-10 flex flex-col items-center max-w-xs w-full"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ 
          scale: 1, 
          y: 0,
          transition: { 
            type: "spring", 
            stiffness: 300, 
            damping: 15
          } 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coin icon with glow animation */}
        <motion.div
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{
            rotate: [0, -5, 5, -5, 0],
            scale: [1, 1.05, 1, 1.05, 1],
            transition: { duration: 1.5, repeat: Infinity, repeatType: "reverse" },
          }}
          className="relative w-32 h-32 mb-4 flex items-center justify-center"
        >
          {/* Coin icon */}
          <img
            src={coinIcon}
            alt="Coin Icon"
            className="w-20 h-20"
          />
          
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                "0 0 20px rgba(255,193,7,0.5)",
                "0 0 40px rgba(255,193,7,0.7)",
                "0 0 20px rgba(255,193,7,0.5)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          />
        </motion.div>

        {/* Mission completed title */}
        <h2 className="font-luckiest text-xl text-dark mb-4 text-center">
          Mission Completed!
        </h2>

        {/* Reward amount */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="font-luckiest text-3xl text-yellow-600">
            +{mission.reward}
          </span>
          <img
            src={coinIcon}
            alt="Coin Icon"
            className="h-8 w-8"
          />
        </div>

        {/* Success message */}
        {/* <motion.p
          className="text-green-600 font-bold font-luckiest text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Coins added to your wallet!
        </motion.p> */}
      </motion.div>
    </motion.div>
  )
}

export default ClaimMissionAnimation