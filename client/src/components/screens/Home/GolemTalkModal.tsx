import { motion } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import GolemTalkIcon from "../../../assets/icons/GolemTalkIcon.png"
import { AIAgentService } from "../../../services/aiAgent"

interface GolemTalkModalProps {
  /** Player's address for fetching personalized missions */
  playerAddress: string
  /** Callback to close the modal */
  onClose: () => void
}

export function GolemTalkModal({ playerAddress, onClose }: GolemTalkModalProps) {
  const [missionText, setMissionText] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
  
    const fetchMission = async () => {
      try {
        const mission = await AIAgentService.getDailyMission(playerAddress)
        if (isMounted.current) {
          setMissionText(mission)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error fetching mission:", error)
        if (isMounted.current) {
          setMissionText("I'm having trouble remembering your mission. Please try again later!")
          setIsLoading(false)
        }
      }
    }
  
    fetchMission()
  
    return () => {
      isMounted.current = false
    }
  }, [playerAddress])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Dialog and image container (prevents clicking from closing the internal one) */}
      <motion.div
        className="relative w-full max-w-xs"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ delay: 0.1 }}
        onClick={(e: { stopPropagation: () => any }) => e.stopPropagation()}
      >
        {/* Image of the golem above the card */}
        <img
          src={GolemTalkIcon}
          alt="Golem hablando"
          className="w-48 h-48 mx-auto -mt-16 mb-2"
        />
        {/* Dialogue card inspired by Clash of Clans */}
        <div className="bg-cream rounded-xl p-4 shadow-md">
          {isLoading ? (
            <p className="font-rubik text-center text-base leading-snug animate-pulse">
              Loading your daily mission...
            </p>
          ) : (
            <p className="font-rubik text-center text-base leading-snug">
              {missionText}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
