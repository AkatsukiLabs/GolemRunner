import { useEffect, useState } from "react"
import { motion, useAnimation } from "framer-motion"
import Image from "next/image"

interface CoverScreenProps {
  onLoadingComplete: () => void
}

export function CoverScreen({ onLoadingComplete }: CoverScreenProps) {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const controls = useAnimation()

  useEffect(() => {
    // Start the loading animation
    const startTime = Date.now()
    const duration = 2000 // 2 seconds

    const animateLoading = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setLoadingProgress(progress * 100)

      if (progress < 1) {
        requestAnimationFrame(animateLoading)
      } else {
        // Loading complete, wait a moment before navigating
        setTimeout(() => {
          onLoadingComplete()
        }, 500)
      }
    }

    requestAnimationFrame(animateLoading)

    // Animate the loading bar
    controls.start({
      width: "100%",
      transition: { duration: 2, ease: "easeInOut" },
    })
  }, [controls, onLoadingComplete])

  return (
    <div className="fixed inset-0 bg-screen flex flex-col items-center justify-center">
      {/* Cover Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/cover.png"
          alt="GolemRunner"
          fill
          className="object-cover object-center"
          priority
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=800&width=450"
          }}
        />
      </div>

      {/* Game Title */}
      <motion.div
        className="z-10 text-center mb-auto mt-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h1 className="font-luckiest text-5xl text-surface drop-shadow-lg mb-2">
          Golem<span className="text-primary">Runner</span>
        </h1>
        <p className="font-bangers text-xl text-surface/90 drop-shadow-md">The Magical Stone Realms</p>
      </motion.div>

      {/* Loading Bar */}
      <div className="absolute bottom-8 left-4 right-4 z-10">
        <div className="mb-2 flex justify-between items-center">
          <p className="font-rubik text-sm text-surface">Loading game assets...</p>
          <p className="font-rubik text-sm text-surface">{Math.round(loadingProgress)}%</p>
        </div>
        <div className="h-2 bg-surface/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full origin-left"
            initial={{ width: "0%" }}
            animate={controls}
          />
        </div>
      </div>
    </div>
  )
}
