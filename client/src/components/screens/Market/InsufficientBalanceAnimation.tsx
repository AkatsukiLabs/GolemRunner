import { motion } from "framer-motion"
import coinIcon from "../../../assets/icons/CoinIcon.png";
import type { Golem } from "../../types/golem"

interface InsufficientBalanceAnimationProps {
  golem: Golem
  currentBalance: number
}

export function InsufficientBalanceAnimation({ golem, currentBalance }: InsufficientBalanceAnimationProps): JSX.Element {
  const missingAmount = golem.price - currentBalance;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Tarjeta de saldo insuficiente */}
      <motion.div
        className="bg-surface p-6 rounded-xl shadow-lg z-10 flex flex-col items-center max-w-xs w-full"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 15 } }}
      >
        {/* Imagen con sacudida para efecto de error */}
        <motion.div
          animate={{
            x: [0, -10, 10, -10, 0],
            transition: { duration: 0.5, ease: "easeInOut" }
          }}
          className="relative w-32 h-32 mb-4 flex items-center justify-center"
        >
          <img
            src={golem.image || "/placeholder.svg"}
            alt={golem.name}
            className="w-full h-full object-contain opacity-60"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              img.src = "/placeholder.svg?height=128&width=128"
            }}
          />
          {/* Overlay rojo para indicar error */}
          <div className="absolute inset-0 bg-red-500/20 rounded-full"></div>
        </motion.div>

        <h2 className="font-luckiest text-xl text-red-500 mb-2">
          Insufficient Balance!
        </h2>

        <div className="flex items-center justify-center gap-2 mb-3">
          <p className="font-luckiest text-text-primary">You have:</p>
          <div className="flex items-center">
            <img src={coinIcon} alt="Coin" className="h-5 w-5 mr-1" />
            <span className="font-bold">{currentBalance}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <p className="font-luckiest text-text-primary">You need:</p>
          <div className="flex items-center">
            <img src={coinIcon} alt="Coin" className="h-5 w-5 mr-1" />
            <span className="font-bold">{golem.price}</span>
          </div>
        </div>

        <motion.p
          className="text-red-500 font-bold text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          You need {missingAmount} more coins to purchase this golem!
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

export default InsufficientBalanceAnimation