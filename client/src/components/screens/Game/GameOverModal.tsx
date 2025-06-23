import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import audioManager from './AudioManager';
import { useCoinReward } from './CoinsRewardCalculator';
import { usePlayer } from '../../../dojo/hooks/usePlayer';
import coinIcon from "../../../assets/icons/CoinIcon.webp";

interface GameOverModalProps {
  score: number;
  record: number;
  onExit: () => void;
  onRestart: () => void;
  isOpen: boolean;
  // Props for transaction state
  isProcessingReward?: boolean;
  rewardError?: string | null;
  rewardTxStatus?: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
  
  // Props for mission feedback
  isMissionCompleting?: boolean;
  missionError?: string | null;
  completedMissions?: Array<{
    mission: { id: number; description: string };
    reason: string;
  }>;
  worldId?: number;
  golemId?: number;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  record,
  onExit,
  onRestart,
  isOpen,
  isProcessingReward = false,
  rewardError = null,
  rewardTxStatus = null,
  isMissionCompleting = false,
  missionError = null,
  completedMissions = [],
}) => {
  const isNewRecord = score > record;
  
  const { refetch: refetchPlayer } = usePlayer();
  const coinReward = useCoinReward(score);

  // Calculated variables
  const isProcessing = isProcessingReward || isMissionCompleting;
  const hasErrors = rewardError || missionError;
  const hasCompletedMissions = completedMissions.length > 0;



  const handleRestartClick = async () => {
    audioManager.playClickSound();
    
    if (rewardTxStatus === 'SUCCESS') {
      try {
        await refetchPlayer();
      } catch (err) {
        // Silently handle refresh error
      }
    }
    
    onRestart();
  };

  const handleExitClick = async () => {
    audioManager.playClickSound();
    
    if (rewardTxStatus === 'SUCCESS') {
      try {
        await refetchPlayer();
      } catch (err) {
        // Silently handle refresh error
      }
    }
    
    onExit();
  };

  const getTransactionStatusMessage = () => {
    if (rewardError) {
      return `Error: ${rewardError}`;
    }
    
    if (isProcessingReward) {
      if (rewardTxStatus === 'PENDING') {
        return 'Sending rewards to blockchain...';
      }
      if (rewardTxStatus === 'SUCCESS') {
        return 'Rewards successfully sent!';
      }
      if (rewardTxStatus === 'REJECTED') {
        return 'Transaction failed. Your rewards will be retried later.';
      }
      return 'Processing rewards...';
    }
    
    return null;
  };
  
  const getMissionStatusMessage = () => {
    if (missionError) {
      return `Mission Error: ${missionError}`;
    }
    
    if (isMissionCompleting) {
      return 'Checking mission completion...';
    }
    
    return null;
  };
  
  const getStatusColor = () => {
    if (rewardError) return 'bg-red-500 text-white';
    if (rewardTxStatus === 'SUCCESS') return 'bg-green-500 text-white';
    if (rewardTxStatus === 'REJECTED') return 'bg-orange-500 text-white';
    return 'bg-blue-500 text-white';
  };

  const getMissionStatusColor = () => {
    if (missionError) return 'bg-red-500 text-white';
    if (hasCompletedMissions) return 'bg-green-500 text-white';
    return 'bg-blue-500 text-white';
  };

  const transactionStatusMessage = getTransactionStatusMessage();
  const missionStatusMessage = getMissionStatusMessage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-surface rounded-xl border-4 border-primary w-full max-w-xs mx-4 p-6 flex flex-col items-center max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          >
            <h2 className="font-bangers text-4xl text-primary mb-6 tracking-wider">
              GAME OVER
            </h2>

            <div className="w-full mb-6">
              {/* Current Score */}
              <div className="flex justify-between items-center mb-3">
                <span className="font-luckiest text-dark text-xl">SCORE</span>
                <span className="font-luckiest text-primary text-2xl">
                  {Math.floor(score)}
                </span>
              </div>

              {/* High Score */}
              <div className="flex justify-between items-center mb-3">
                <span className="font-luckiest text-dark text-xl">RECORD</span>
                <motion.span
                  className={`font-luckiest text-2xl ${
                    isNewRecord
                      ? 'bg-golem-gradient text-transparent bg-clip-text'
                      : 'text-dark'
                  }`}
                  animate={isNewRecord ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: 2, duration: 0.5 }}
                >
                  {isNewRecord ? Math.floor(score) : Math.floor(record)}
                </motion.span>
              </div>

              {/* Coins Earned */}
              <motion.div 
                className="flex justify-between items-center mb-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="font-luckiest text-dark text-xl">COINS</span>
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                >
                  <span className="font-luckiest text-yellow-500 text-2xl">
                    +{coinReward.coins}
                  </span>
                  <img 
                    src={coinIcon} 
                    alt="Coin" 
                    className="w-6 h-6"
                  />
                </motion.div>
              </motion.div>

              {/* Tier Badge */}
              <motion.div
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-dark text-center py-1 px-3 rounded-[5px] mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <span className="font-luckiest text-sm">{coinReward.range.label}</span>
              </motion.div>

              {/* Progress to next tier (if not max tier) */}
              {!coinReward.isMaxTier && (
                <motion.div
                  className="text-center text-xs text-dark/70 mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="mb-1">
                    {coinReward.pointsToNextTier} points to {coinReward.nextTier?.label}
                  </div>
                  <div className="w-full bg-dark/20 rounded-[5px] h-2">
                    <motion.div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-[5px]"
                      initial={{ width: 0 }}
                      animate={{ width: `${coinReward.percentage}%` }}
                      transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              )}

              {/* New Record Banner */}
              {isNewRecord && (
                <motion.div
                  className="bg-golem-gradient text-cream text-center py-2 rounded-[5px] mt-4 font-luckiest"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  NEW RECORD!
                </motion.div>
              )}
              
              {/* Processing Status Messages */}
              {transactionStatusMessage && (
                <motion.div
                  className={`${getStatusColor()} text-center py-2 px-3 rounded-[5px] mt-3 font-luckiest text-sm`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {transactionStatusMessage}
                </motion.div>
              )}

              {/* Mission Status */}
              {missionStatusMessage && (
                <motion.div
                  className={`${getMissionStatusColor()} text-center py-2 px-3 rounded-[5px] mt-2 font-luckiest text-sm`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {missionStatusMessage}
                </motion.div>
              )}

              {/* Mission Completion Success */}
              {hasCompletedMissions && (
                <motion.div
                  className="bg-green-50 border-2 border-green-200 rounded-[5px] p-3 mt-3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                >
                  <div className="text-center mb-2">
                    <span className="font-luckiest text-green-800 text-sm">
                      🎉 {completedMissions.length} Mission{completedMissions.length > 1 ? 's' : ''} Completed!
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {completedMissions.map((cm, index) => (
                      <motion.div
                        key={cm.mission.id}
                        className="bg-white rounded-[5px] p-2 border-green-100"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-rubik text-xs text-green-600 leading-relaxed flex-1">
                            {cm.reason}
                          </p>
                          <span className="text-green-500 font-bold text-sm flex-shrink-0">✓</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <motion.div
                    className="text-center mt-2 p-2 bg-yellow-100 rounded border border-yellow-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <p className="text-xs text-yellow-700 font-luckiest">
                      💰 Check Daily Missions to claim rewards!
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {/* Error Messages */}
              {hasErrors && !isProcessing && (
                <motion.div
                  className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mt-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="font-luckiest text-red-800 text-sm mb-2 text-center">
                    ⚠️ Processing Issues
                  </h3>
                  {rewardError && (
                    <p className="font-rubik text-xs text-red-700 mb-1">
                      Reward Error: {rewardError}
                    </p>
                  )}
                  {missionError && (
                    <p className="font-rubik text-xs text-red-700">
                      Mission Error: {missionError}
                    </p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex w-full gap-4">
              <motion.button
                className="flex-1 bg-dark text-cream py-3 font-luckiest rounded-[5px] disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!isProcessing ? { scale: 1.05 } : {}}
                whileTap={!isProcessing ? { scale: 0.95 } : {}}
                onClick={handleExitClick}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      className="w-3 h-3 border border-cream border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="text-xs">WAIT</span>
                  </div>
                ) : (
                  'EXIT'
                )}
              </motion.button>
              <motion.button
                className="flex-1 btn-cr-yellow py-3 font-luckiest rounded-[5px] disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!isProcessing ? { scale: 1.05 } : {}}
                whileTap={!isProcessing ? { scale: 0.95 } : {}}
                onClick={handleRestartClick}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      className="w-3 h-3 border border-dark border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="text-xs">WAIT</span>
                  </div>
                ) : (
                  'RESTART'
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameOverModal;