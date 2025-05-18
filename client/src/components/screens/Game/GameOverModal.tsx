// src/components/game/GameOverModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import audioManager from './AudioManager';

interface GameOverModalProps {
  score: number;
  record: number;
  onExit: () => void;
  onRestart: () => void;
  isOpen: boolean;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  record,
  onExit,
  onRestart,
  isOpen,
}) => {
  const isNewRecord = score > record;

  const handleRestartClick = () => {
    audioManager.playClickSound();
    onRestart();
  };

  const handleExitClick = () => {
    audioManager.playClickSound();
    onExit();
  };

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
              {/* Puntuación actual */}
              <div className="flex justify-between items-center mb-3">
                <span className="font-luckiest text-dark text-xl">SCORE</span>
                <span className="font-luckiest text-primary text-2xl">
                  {Math.floor(score)}
                </span>
              </div>

              {/* Récord */}
              <div className="flex justify-between items-center">
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

              {/* Mensaje de nuevo récord (condicional) */}
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
            </div>

            {/* Botones */}
            <div className="flex w-full gap-4">
              <motion.button
                className="flex-1 bg-dark text-cream py-3 font-luckiest rounded-[5px]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExitClick}
              >
                EXIT
              </motion.button>
              <motion.button
                className="flex-1 btn-cr-yellow py-3 font-luckiest rounded-[5px]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRestartClick}
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
