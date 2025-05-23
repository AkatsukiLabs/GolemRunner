import { useEffect, useState } from "react"
import CoverImgMobile from "../../../assets/cover-mobile.webp"
import CoverImgWeb from "../../../assets/cover-web.webp"


interface CoverScreenProps {
  onLoadingComplete: () => void
}

export function CoverScreen({ onLoadingComplete }: CoverScreenProps) {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const startTime = Date.now()
    const duration = 5000 // ms

    const animateLoading = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setLoadingProgress(progress * 100)

      if (progress < 1) {
        requestAnimationFrame(animateLoading)
      } else {
        setTimeout(onLoadingComplete, 500)
      }
    }

    requestAnimationFrame(animateLoading)
  }, [onLoadingComplete])

  return (
    <div className="fixed inset-0 bg-screen flex items-center justify-center overflow-hidden">
      {/* Background cover */}
      <img
        src={isMobile ? CoverImgMobile : CoverImgWeb}
        alt="GolemRunner Cover"
        className="absolute inset-0 w-full h-full object-cover object-center"
        onError={(e) => {
          ;(e.currentTarget as HTMLImageElement).src =
            "/placeholder.svg?height=800&width=450"
        }}
      />
      {/* Progress bar */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="relative h-5 bg-surface/30 rounded-full overflow-hidden">
          {/* Animated fill - With gradient */}
          <div
            className="absolute left-0 top-0 bottom-0 z-0"
            style={{ 
              width: `${loadingProgress}%`,
              transition: 'width 100ms linear',
              background: 'linear-gradient(90deg, #FF6B00, #FFC800)'
            }}
          />
          {/* Centered text */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <span className="font-bold font-rubik text-sm text-surface">
              {Math.round(loadingProgress)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
