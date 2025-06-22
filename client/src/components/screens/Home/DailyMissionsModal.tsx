import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useMemo } from "react"
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import GolemTalkIcon from "../../../assets/icons/GolemTalkIcon.webp"
import { ClaimMissionAnimation } from "./ClaimMissionAnimation"
import coinIcon from "../../../assets/icons/CoinIcon.webp";
import { useMissionsInit } from "../../../dojo/hooks/useMissions";
import { Mission } from "../../../dojo/bindings";
import { MissionDisplayData } from "../../types/missionTypes";

interface DailyMissionsModalProps {
  /** Callback to close the modal */
  onClose: () => void
}

/**
 * Converts Mission bindings to display data for UI
 */
const missionToDisplayData = (mission: Mission): MissionDisplayData => {
  // Determine difficulty based on target_coins
  let difficulty: 'Easy' | 'Mid' | 'Hard' = 'Easy';
  if (mission.target_coins >= 1000) difficulty = 'Hard';
  else if (mission.target_coins >= 500) difficulty = 'Mid';

  // Extract world and golem names
  const worldVariant = mission.required_world.activeVariant();
  const golemVariant = mission.required_golem.activeVariant();
  
  const requiredWorld = worldVariant.charAt(0).toUpperCase() + worldVariant.slice(1);
  const requiredGolem = golemVariant.charAt(0).toUpperCase() + golemVariant.slice(1);

  // Check if completed
  const completed = mission.status.activeVariant() === 'Completed';

  // Generate a title from description (first few words)
  const title = mission.description.split(' ').slice(0, 3).join(' ') || 'Daily Mission';

  return {
    id: mission.id.toString(), // Convert to string for compatibility
    title,
    description: mission.description,
    difficulty,
    reward: mission.target_coins,
    requiredWorld,
    requiredGolem,
    completed,
    claimed: false // UI state, will be managed locally
  };
};

export function DailyMissionsModal({ onClose }: DailyMissionsModalProps) {
  // Get account from Starknet directly
  const { account } = useAccount();
  
  // Memoize user address with proper formatting
  const playerAddress = useMemo(() => 
    account ? addAddressPadding(account.address) : null, 
    [account]
  );
  // Hook para manejo de misiones
  const {
    todayMissions,
    isLoading,
    isSpawning,
    error,
    hasData,
    initializeMissions
  } = useMissionsInit();

  // Estado local para UI
  const [showCelebration, setShowCelebration] = useState(false);
  const [claimedMission, setClaimedMission] = useState<MissionDisplayData | null>(null);
  const [claimedMissionIds, setClaimedMissionIds] = useState<Set<string>>(new Set());

  // Inicializar misiones cuando se abre el modal
  useEffect(() => {
    if (playerAddress) {
      console.log("🚀 Modal opened, initializing missions for:", playerAddress);
      initializeMissions();
    }
  }, [playerAddress, initializeMissions]);

  // Early return if no account connected
  if (!account || !playerAddress) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-cream rounded-xl p-6 shadow-md max-w-sm w-full text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="font-luckiest text-xl text-dark mb-4">Wallet Required</h2>
          <p className="font-rubik text-sm text-gray-600 mb-6">
            Please connect your wallet to view daily missions.
          </p>
          <motion.button
            onClick={onClose}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 font-luckiest text-sm rounded-[5px]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Close
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // Convertir misiones de bindings a display data
  const displayMissions: MissionDisplayData[] = todayMissions.map(mission => {
    const displayData = missionToDisplayData(mission);
    // Check if this mission was claimed in this session
    displayData.claimed = claimedMissionIds.has(mission.id.toString());
    return displayData;
  });

  const getDifficultyStyle = (difficulty: MissionDisplayData['difficulty']) => {
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
  };

  const handleClaimReward = (mission: MissionDisplayData) => {
    setClaimedMission(mission);
    setShowCelebration(true);
    
    // Mark as claimed in local state
    setClaimedMissionIds(prev => new Set(prev).add(mission.id));
    
    console.log(`Claiming reward for mission: ${mission.id}, reward: ${mission.reward}`);
    // TODO: Aquí irá la lógica de reward cuando implementemos ese feature
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
    setClaimedMission(null);
  };

  // Loading states
  const showLoading = isLoading || isSpawning;
  const loadingText = isSpawning 
    ? "Creating your daily missions..." 
    : isLoading 
    ? "Loading missions..." 
    : "";

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

            {/* Estados de carga y error */}
            {showLoading && (
              <div className="text-center py-8">
                <motion.div
                  className="inline-block w-6 h-6 border-2 border-yellow-600 border-t-transparent rounded-full mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="font-rubik text-sm text-gray-600">{loadingText}</p>
                {isSpawning && (
                  <p className="font-rubik text-xs text-gray-500 mt-2">
                    Generating missions with AI and storing on blockchain...
                  </p>
                )}
              </div>
            )}

            {error && !showLoading && (
              <div className="text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="font-rubik text-sm text-red-700">
                    Failed to load missions: {error}
                  </p>
                </div>
                <motion.button
                  onClick={() => initializeMissions()}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-[5px] font-luckiest text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
              </div>
            )}

            {/* Lista de misiones */}
            {!showLoading && !error && hasData && (
              <div className="space-y-3 sm:space-y-4">
                {displayMissions.map((mission: MissionDisplayData, index: number) => (
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
                      
                      {/* Información adicional del mundo y golem requerido */}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>🗺️ {mission.requiredWorld}</span>
                        <span>🧌 {mission.requiredGolem} Golem</span>
                      </div>
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
            )}

            {/* Estado cuando no hay misiones y no está cargando */}
            {!showLoading && !error && !hasData && (
              <div className="text-center py-8">
                <p className="font-rubik text-sm text-gray-600 mb-4">
                  No missions found for today
                </p>
                <motion.button
                  onClick={() => initializeMissions()}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-[5px] font-luckiest text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Generate Missions
                </motion.button>
              </div>
            )}

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