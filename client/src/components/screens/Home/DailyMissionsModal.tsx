import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import GolemTalkIcon from "../../../assets/icons/GolemTalkIcon.webp"
import { ClaimMissionAnimation } from "./ClaimMissionAnimation"
import coinIcon from "../../../assets/icons/CoinIcon.webp";
import { Mission } from "../../../dojo/bindings";
import { MissionDisplayData } from "../../types/missionTypes";
import { useMissionQuery } from "../../../dojo/hooks/useMissionQuery";
import { useMissionSpawner } from "../../../dojo/hooks/useMissionSpawner";
import { useMissionData } from "../../../dojo/hooks/useMissionData";

interface DailyMissionsModalProps {
  /** Callback to close the modal */
  onClose: () => void
}

/**
 * Safe function to extract enum variant 
 */
const getEnumVariant = (enumObj: any, defaultValue: string): string => {
  if (!enumObj) return defaultValue;
  
  if (typeof enumObj.activeVariant === 'function') {
    try {
      return enumObj.activeVariant();
    } catch (error) {
      console.warn("activeVariant failed:", error);
    }
  }
  
  if (enumObj.variant && typeof enumObj.variant === 'object') {
    const keys = Object.keys(enumObj.variant);
    if (keys.length > 0) {
      return keys[0];
    }
  }
  
  if (typeof enumObj === 'object') {
    const keys = Object.keys(enumObj);
    if (keys.length > 0) {
      return keys[0];
    }
  }
  
  return defaultValue;
};

/**
 * NEW FUNCTION: Determines if a mission is completed based on its status
 */
const isMissionCompleted = (mission: Mission): boolean => {
  const statusVariant = getEnumVariant(mission.status, 'Pending');
  return statusVariant === 'Completed';
};

/**
 * Converts Mission bindings to display data for UI
 */
const missionToDisplayData = (mission: Mission, claimedMissionIds: Set<string>): MissionDisplayData => {
  let difficulty: 'Easy' | 'Mid' | 'Hard' = 'Easy';
  if (mission.target_coins >= 1000) difficulty = 'Hard';
  else if (mission.target_coins >= 500) difficulty = 'Mid';

  const worldVariant = getEnumVariant(mission.required_world, 'Forest');
  const golemVariant = getEnumVariant(mission.required_golem, 'Fire');
  const completed = isMissionCompleted(mission);
  const claimed = claimedMissionIds.has(mission.id.toString());
  
  const requiredWorld = worldVariant.charAt(0).toUpperCase() + worldVariant.slice(1);
  const requiredGolem = golemVariant.charAt(0).toUpperCase() + golemVariant.slice(1);
  const title = mission.description.split(' ').slice(0, 3).join(' ') || 'Daily Mission';

  const displayData: MissionDisplayData = {
    id: mission.id.toString(),
    title,
    description: mission.description,
    difficulty,
    reward: mission.target_coins,
    requiredWorld,
    requiredGolem,
    completed,
    claimed
  };
  
  return displayData;
};

export function DailyMissionsModal({ onClose }: DailyMissionsModalProps) {
  const { account } = useAccount();
  
  const playerAddress = useMemo(() => 
    account ? addAddressPadding(account.address) : null, 
    [account]
  );

  // Hooks modulares
  const { fetchTodayMissions, isLoading: isQuerying, error: queryError } = useMissionQuery();
  const { spawnMissions, isSpawning, error: spawnError } = useMissionSpawner();
  
  // Estado local
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [claimedMission, setClaimedMission] = useState<MissionDisplayData | null>(null);
  const [claimedMissionIds, setClaimedMissionIds] = useState<Set<string>>(new Set());
  
  // NEW STATE: For claim reward process
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  
  // Procesar data
  const { todayMissions, hasData } = useMissionData(missions);

  // Estados combinados
  const isLoading = isQuerying || isSpawning;
  const error = queryError || spawnError || claimError;

  // NEW FUNCTION: Refresh missions after claim
  const refreshMissionsAfterClaim = useCallback(async () => {
    if (!playerAddress) return;
    
    try {
      console.log("🔄 Refreshing missions after claim...");
      const refreshedMissions = await fetchTodayMissions(playerAddress);
      setMissions(refreshedMissions);
      console.log("✅ Missions refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing missions:", error);
    }
  }, [playerAddress, fetchTodayMissions]);

  // NEW FUNCTION: Handle claim reward (placeholder for future implementation)
  const handleClaimReward = useCallback(async (mission: MissionDisplayData) => {
    console.log(`🎯 Claiming reward for mission ${mission.id}:`, mission);
    
    setClaimingMissionId(mission.id);
    setClaimError(null);
    
    try {
      // TODO: Implement actual claim reward transaction
      // This would call a hook like useMissionRewardClaimer
      // For now, we'll simulate the process
      
      console.log("🔄 Processing claim reward transaction...");
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, just mark as claimed locally
      // In the real implementation, this would be handled by the blockchain transaction
      setClaimedMission(mission);
      setShowCelebration(true);
      setClaimedMissionIds(prev => new Set(prev).add(mission.id));
      
      // Refresh missions from blockchain after successful claim
      await refreshMissionsAfterClaim();
      
      console.log("✅ Mission reward claimed successfully");
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to claim reward";
      setClaimError(errorMessage);
      console.error("❌ Error claiming mission reward:", error);
    } finally {
      setClaimingMissionId(null);
    }
  }, [refreshMissionsAfterClaim]);

  // 🎯 ORQUESTACIÓN PRINCIPAL
  const initializeMissions = useCallback(async () => {
    if (!playerAddress || isInitialized) return;

    try {
      console.log("📡 Checking for existing missions...");
      const existingMissions = await fetchTodayMissions(playerAddress);
      
      if (existingMissions.length > 0) {
        console.log(`✅ Found ${existingMissions.length} existing missions`);
        setMissions(existingMissions);
      } else {
        console.log("🎲 No missions found, creating new ones...");
        const spawnSuccess = await spawnMissions(playerAddress);
        
        if (spawnSuccess) {
          const newMissions = await fetchTodayMissions(playerAddress);
          setMissions(newMissions);
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error("❌ Error initializing missions:", error);
    }
  }, [playerAddress, isInitialized, fetchTodayMissions, spawnMissions]);

  // Ejecutar al abrir modal
  useEffect(() => {
    if (playerAddress) {
      initializeMissions();
    }
  }, [playerAddress, initializeMissions]);

  // Reset cuando cambia de usuario
  useEffect(() => {
    setMissions([]);
    setIsInitialized(false);
    setClaimedMissionIds(new Set()); // NEW: Reset claimed missions
    setClaimError(null); // NEW: Reset claim errors
  }, [playerAddress]);

  // Early return if no account
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

  // Convertir misiones - UPDATED to pass claimedMissionIds
  const displayMissions: MissionDisplayData[] = todayMissions.map(mission => {
    return missionToDisplayData(mission, claimedMissionIds);
  });

  // NEW FUNCTION: Get mission card styling based on status
  const getMissionCardStyling = (mission: MissionDisplayData) => {
    if (mission.completed) {
      if (mission.claimed) {
        return {
          borderColor: 'border-gray-300',
          backgroundColor: 'bg-gray-50',
          opacity: 'opacity-75'
        };
      } else {
        return {
          borderColor: 'border-green-200',
          backgroundColor: 'bg-green-50',
          opacity: 'opacity-100'
        };
      }
    }
    return {
      borderColor: 'border-gray-200 hover:border-gray-300',
      backgroundColor: 'bg-white',
      opacity: 'opacity-100'
    };
  };

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

  const handleCloseCelebration = () => {
    setShowCelebration(false);
    setClaimedMission(null);
  };

  // Loading states
  const showLoading = isLoading;
  const loadingText = isSpawning 
    ? "Creating your daily missions..." 
    : isQuerying 
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
        <motion.div
          className="flex flex-col items-center w-full max-w-md min-h-fit"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ delay: 0.1 }}
          onClick={(e) => e.stopPropagation()}
        >
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

          <div className="bg-cream rounded-xl p-4 sm:p-6 shadow-md w-full max-h-[70vh] overflow-y-auto">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="font-luckiest text-xl sm:text-2xl text-dark mb-2">Daily Missions</h2>
              <p className="font-rubik text-xs sm:text-sm text-gray-600">Complete missions to earn rewards!</p>
            </div>

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

            {!showLoading && !error && hasData && (
              <div className="space-y-3 sm:space-y-4">
                {displayMissions.map((mission: MissionDisplayData, index: number) => {
                  const styling = getMissionCardStyling(mission);
                  const isClaimingThis = claimingMissionId === mission.id;
                  
                  return (
                    <motion.div
                      key={mission.id}
                      className={`relative rounded-[10px] p-3 sm:p-4 border-2 shadow-sm ${styling.borderColor} ${styling.backgroundColor} ${styling.opacity}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      whileHover={{ scale: mission.completed && !mission.claimed ? 1.02 : 1 }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-bold ${getDifficultyStyle(mission.difficulty)}`}
                          >
                            {mission.difficulty}
                          </span>
                          
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
                        
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span>🗺️ {mission.requiredWorld}</span>
                          <span>🧌 {mission.requiredGolem} Golem</span>
                        </div>
                      </div>

                      {/* NEW SECTION: Action Buttons */}
                      {mission.completed && !mission.claimed && (
                        <div className="flex justify-end">
                          <motion.button
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-[5px] font-luckiest text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            whileHover={!isClaimingThis ? { scale: 1.05 } : {}}
                            whileTap={!isClaimingThis ? { scale: 0.95 } : {}}
                            onClick={() => handleClaimReward(mission)}
                            disabled={isClaimingThis || claimingMissionId !== null}
                          >
                            {isClaimingThis ? (
                              <>
                                <motion.div
                                  className="w-3 h-3 border border-white border-t-transparent rounded-full"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                                <span>Claiming...</span>
                              </>
                            ) : (
                              'Claim Reward'
                            )}
                          </motion.button>
                        </div>
                      )}

                      {/* Status indicator overlay */}
                      {mission.completed && (
                        <div className={`absolute inset-0 rounded-lg pointer-events-none ${
                          mission.claimed 
                            ? 'bg-gray-500/10'
                            : 'bg-green-500/5'
                        }`} />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

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