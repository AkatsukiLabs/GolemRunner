import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import audioManager from './AudioManager';
import { useCoinReward } from './CoinsRewardCalculator';
import coinIcon from "../../../assets/icons/CoinIcon.webp";

interface GameOverModalProps {
  score: number;
  record: number;
  onExit: () => void;
  onRestart: () => void;
  isOpen: boolean;
  // Props para el estado de la transacción
  isProcessingReward?: boolean;
  rewardError?: string | null;
  rewardTxStatus?: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
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
}) => {
  const isNewRecord = score > record;
  
  // Calculate coin reward based on score
  const coinReward = useCoinReward(score);
  console.log('Coin Reward:', coinReward);

  const handleRestartClick = () => {
    audioManager.playClickSound();
    onRestart();
  };

  const handleExitClick = () => {
    audioManager.playClickSound();
    onExit();
  };

  // Determinar el mensaje de estado de la transacción
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
  
  // Determinar el color del estado de la transacción
  const getStatusColor = () => {
    if (rewardError) return 'bg-red-500 text-white';
    if (rewardTxStatus === 'SUCCESS') return 'bg-green-500 text-white';
    if (rewardTxStatus === 'REJECTED') return 'bg-orange-500 text-white';
    return 'bg-blue-500 text-white';
  };

  const transactionStatusMessage = getTransactionStatusMessage();

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
            className="bg-surface rounded-xl border-4 border-primary w-full max-w-xs mx-4 p-6 flex flex-col items-center"
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
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-dark text-center py-1 px-3 rounded-lg mb-3"
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
                  <div className="w-full bg-dark/20 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full"
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
                  className="bg-golem-gradient text-cream text-center py-2 rounded-lg mt-4 font-luckiest"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  NEW RECORD!
                </motion.div>
              )}
              
              {/* Transaction Status Message */}
              {transactionStatusMessage && (
                <motion.div
                  className={`${getStatusColor()} text-center py-2 px-3 rounded-lg mt-3 font-luckiest text-sm`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {transactionStatusMessage}
                </motion.div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex w-full gap-4">
              <motion.button
                className="flex-1 bg-dark text-cream py-3 font-luckiest rounded-[5px]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExitClick}
                disabled={isProcessingReward && rewardTxStatus === 'PENDING'}
              >
                EXIT
              </motion.button>
              <motion.button
                className="flex-1 btn-cr-yellow py-3 font-luckiest rounded-[5px]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRestartClick}
                disabled={isProcessingReward && rewardTxStatus === 'PENDING'}
              >
                RESTART
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameOverModal;