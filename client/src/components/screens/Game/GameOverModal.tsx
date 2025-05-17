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

const GameOverModal: React.FC<GameOverModalProps> = ({ score, record, onExit, onRestart, isOpen }) => {
  const isNewRecord = score > 0 && score === record;

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.7, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.7, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-golem-gradient p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md text-center font-rubik"
          >
            <h2 className="text-4xl sm:text-5xl font-bangers text-cream mb-4">GAME OVER</h2>
            
            <div className="bg-screen bg-opacity-80 p-4 rounded-lg mb-6">
              <p className="text-2xl font-luckiest text-primary mb-2">YOUR SCORE</p>
              <p className="text-5xl font-bangers text-cream mb-4">{Math.floor(score)}</p>
              
              {isNewRecord && (
                <p className="text-xl font-luckiest text-yellow-400 animate-pulse mb-1">NEW RECORD!</p>
              )}
              <p className="text-lg font-luckiest text-cream opacity-80">
                RECORD: {Math.floor(record)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-center gap-4">
              <button
                onClick={handleRestartClick}
                className="btn-cr-yellow py-3 px-6 text-xl w-full sm:w-auto" // Usando clase de global.css
              >
                RESTART
              </button>
              <button
                onClick={handleExitClick}
                className="btn-cr-blue py-3 px-6 text-xl w-full sm:w-auto" // Usando clase de global.css
              >
                EXIT
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameOverModal;