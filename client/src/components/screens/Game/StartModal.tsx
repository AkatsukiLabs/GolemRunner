import { motion } from 'framer-motion';

interface StartModalProps {
  onStart: () => void;
}

export function StartModal({ onStart }: StartModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-dark/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onStart}
    >
      <motion.div
        className="bg-surface rounded-xl border-4 border-primary w-full max-w-xs mx-4 p-6 flex flex-col items-center cursor-pointer"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
      >
        <span className="font-bangers text-4xl text-primary mb-2 tracking-wider">
          TAP TO START
        </span>
      </motion.div>
    </motion.div>
  );
}
