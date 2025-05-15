import { motion } from "framer-motion"
import GolemTalkIcon from "../../../assets/icons/GolemTalkIcon.png"

interface GolemTalkModalProps {
  /** Text that golem will display */
  text: string
  /** Callback to close the modal */
  onClose: () => void
}

export function GolemTalkModal({ text, onClose }: GolemTalkModalProps) {
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image of the golem above the card */}
        <img
          src={GolemTalkIcon}
          alt="Golem hablando"
          className="w-48 h-48 mx-auto -mt-16 mb-2"
        />
        {/* Dialogue card inspired by Clash of Clans */}
        <div className="bg-cream rounded-xl p-4 shadow-md">
          <p className="font-rubik text-center text-base leading-snug">
            {text}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
