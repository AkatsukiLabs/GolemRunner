import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  golemData?: {
    name: string;
    description: string;
    level: number;
  };
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  golemData,
}) => {
  const [tweetMsg, setTweetMsg] = useState("");

  useEffect(() => {
    if (golemData) {
      setTweetMsg(
        `🎮 My Golem in Golem Runner:\n\n` +
        `🤖 ${golemData.name}\n` +
        `📝 ${golemData.description}\n` +
        `📊 Level ${golemData.level}\n\n` +
        `Join me in GolemRunner! 🚀\n` +
        `👉 https://golem-runner.up.railway.app/\n`
      );
    }
  }, [golemData]);

  if (!isOpen) return null;

  const tweetText = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetMsg)}`;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface w-[90%] max-w-md rounded-2xl shadow-[0_8px_0_rgba(0,0,0,0.2)] overflow-hidden border-4 border-primary/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary/10 p-4 border-b-4 border-primary/20 flex justify-between items-center">
          <h2 className="text-text-primary font-luckiest text-2xl tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
            Share on X
          </h2>
          <motion.button 
            onClick={onClose}
            className="text-text-primary hover:text-primary transition-colors text-3xl font-bangers w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ×
          </motion.button>
        </div>

        {/* Body */}
        <div className="p-6 bg-gradient-to-b from-surface to-surface/80">
          <div className="relative">
            <textarea
              value={tweetMsg}
              readOnly
              rows={6}
              className="w-full bg-white/5 rounded-xl p-4 text-text-primary font-rubik resize-none focus:outline-none 
                border-2 border-primary/20 shadow-inner backdrop-blur-sm
                placeholder:text-text-primary/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-primary/5 border-t-4 border-primary/20">
          <motion.a
            href={tweetText}
            target="_blank"
            rel="noreferrer"
            className="btn-cr-yellow w-full flex items-center justify-center gap-2 font-bangers text-lg py-3 px-6 
              shadow-[0_4px_0_rgba(0,0,0,0.2)] hover:shadow-[0_2px_0_rgba(0,0,0,0.2)] 
              active:shadow-none active:translate-y-1
              transition-all duration-150"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="drop-shadow-[1px_1px_0px_rgba(0,0,0,0.2)]">Share on X</span>
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
}; 