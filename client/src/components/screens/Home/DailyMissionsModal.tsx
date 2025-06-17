import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import GolemTalkIcon from "../../../assets/icons/GolemTalkIcon.webp"
import { ClaimMissionAnimation } from "./ClaimMissionAnimation"
import coinIcon from "../../../assets/icons/CoinIcon.webp";

interface Mission {
  id: string
  title: string
  description: string
  difficulty: 'Easy' | 'Mid' | 'Hard'
  reward: number
  completed: boolean
  claimed?: boolean
}

interface DailyMissionsModalProps {
  /** Player's address for context */
  playerAddress: string
  /** Callback to close the modal */
  onClose: () => void
}

export function DailyMissionsModal({ onClose }: DailyMissionsModalProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [claimedMission, setClaimedMission] = useState<Mission | null>(null)
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: "mission_1",
      title: "First Steps",
      description: "Complete 3 runs in any level",
      difficulty: "Easy",
      reward: 100,
      completed: false,
      claimed: false
    },
    {
      id: "mission_2", 
      title: "Speed Runner",
      description: "Finish a run in under 2 minutes",
      difficulty: "Mid",
      reward: 250,
      completed: false,
      claimed: false
    },
    {
      id: "mission_3",
      title: "Coin Master",
      description: "Collect 1000 coins in a single run",
      difficulty: "Hard", 
      reward: 500,
      completed: true,
      claimed: false
    }
  ])

  const getDifficultyStyle = (difficulty: Mission['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-500 text-white'
      case 'Mid':
        return 'bg-orange-500 text-white'
      case 'Hard':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const handleClaimReward = (mission: Mission) => {
    setClaimedMission(mission)
    setShowCelebration(true)
    
    setMissions(prevMissions => 
      prevMissions.map(m => 
        m.id === mission.id ? { ...m, claimed: true } : m
      )
    )
    
    console.log(`Claiming reward for mission: ${mission.id}, reward: ${mission.reward}`)
  }

  const handleCloseCelebration = () => {
    setShowCelebration(false)
    setClaimedMission(null)
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-8 pb-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Container principal con flex column */}
        <motion.div
          className="flex flex-col items-center w-full max-w-md min-h-fit"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ delay: 0.1 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Imagen del golem - ahora dentro del flujo normal */}
          <motion.img
            src={GolemTalkIcon}
            alt="Golem hablando"
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mb-4 flex-shrink-0"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Card del modal con las misiones */}
          <div className="bg-cream rounded-xl p-4 sm:p-6 shadow-md w-full max-h-[70vh] overflow-y-auto">
            {/* Título del modal */}
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="font-luckiest text-xl sm:text-2xl text-dark mb-2">Daily Missions</h2>
              <p className="font-rubik text-xs sm:text-sm text-gray-600">Complete missions to earn rewards!</p>
            </div>

            {/* Lista de misiones */}
            <div className="space-y-3 sm:space-y-4">
              {missions.map((mission: Mission, index: number) => (
                <motion.div
                  key={mission.id}
                  className={`relative bg-white rounded-[10px] p-3 sm:p-4 border-2 shadow-sm ${
                    mission.completed 
                      ? mission.claimed 
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: mission.completed ? 1 : 1.02 }}
                >
                  {/* Header: Dificultad, Recompensa y Estado */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {/* Etiqueta de dificultad */}
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-bold ${getDifficultyStyle(mission.difficulty)}`}
                      >
                        {mission.difficulty}
                      </span>
                      
                      {/* Recompensa */}
                      <div className="flex items-center space-x-1">
                        <span className={`font-luckiest text-sm sm:text-lg ${
                          mission.completed 
                            ? mission.claimed 
                              ? 'text-gray-500'
                              : 'text-green-600'
                            : 'text-yellow-600'
                        }`}>
                          {mission.reward}
                        </span>
                        <img
                          src={coinIcon}
                          alt="Coin Icon"
                          className={`h-4 w-4 sm:h-5 sm:w-5 ${
                            mission.completed && mission.claimed ? 'opacity-50' : ''
                          }`}
                        />
                      </div>
                    </div>
                    
                    {/* Indicador de completado */}
                    {mission.completed && (
                      <div className={`rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center ${
                        mission.claimed 
                          ? 'bg-gray-500 text-white'
                          : 'bg-green-500 text-white'
                      }`}>
                        <span className="text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Título y descripción */}
                  <div className="mb-3">
                    <h3 className={`font-luckiest text-sm sm:text-base mb-1 ${
                      mission.completed 
                        ? mission.claimed 
                          ? 'text-gray-500'
                          : 'text-green-700'
                        : 'text-dark'
                    }`}>
                      {mission.title}
                    </h3>
                    <p className={`font-rubik text-xs sm:text-sm ${
                      mission.completed 
                        ? mission.claimed 
                          ? 'text-gray-400'
                          : 'text-green-600'
                        : 'text-gray-600'
                    }`}>
                      {mission.description}
                    </p>
                  </div>

                  {/* Botón de reclamar */}
                  {mission.completed && !mission.claimed && (
                    <div className="flex justify-end">
                      <motion.button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-[5px] font-luckiest text-xs sm:text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleClaimReward(mission)}
                      >
                        Claim Reward
                      </motion.button>
                    </div>
                  )}

                  {/* Overlay para misiones completadas */}
                  {mission.completed && (
                    <div className={`absolute inset-0 rounded-lg pointer-events-none ${
                      mission.claimed 
                        ? 'bg-gray-500/10'
                        : 'bg-green-500/5'
                    }`} />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Botón para cerrar */}
            <motion.button
              onClick={onClose}
              className="w-full mt-4 sm:mt-6 btn-cr-yellow hover:bg-gray-600 text-white py-2 px-4 font-luckiest text-sm sm:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Animación de celebración */}
      <AnimatePresence>
        {showCelebration && claimedMission && (
          <ClaimMissionAnimation
            mission={claimedMission}
            onClose={handleCloseCelebration}
          />
        )}
      </AnimatePresence>
    </>
  )
}