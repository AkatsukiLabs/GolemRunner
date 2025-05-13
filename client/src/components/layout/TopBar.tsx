import { motion } from "framer-motion"
import coinIcon from "../../assets/icons/CoinIcon.png";
import levelIcon from "../../assets/icons/levelicon2.png";

interface TopBarProps {
  coins: number
  level: number
  title: string
  screen: "home" | "play" | "market" | "ranking" | "profile"
}

export function TopBar({ coins, level, title, screen }: TopBarProps) {
  const isHomeScreen = screen === "home";
  
  return (
    <div className="relative z-10 w-full px-4 py-3 flex items-center justify-between">
      <motion.div
        className="flex items-center bg-screen/80 backdrop-blur-sm px-3 py-1 rounded-full border border-surface/30"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <img
          src={coinIcon}
          alt="Coin Icon"
          className="h-5 w-5 mr-1"
        />
        <span className="text-surface font-bold">
          {coins}
        </span>
      </motion.div>

      <motion.h1
        className={`
          flex-1 text-center mx-4
          font-bangers font-bold text-3xl tracking-wide
          ${isHomeScreen 
            ? "bg-golem-gradient bg-clip-text text-transparent" 
            : "text-cream"}
          overflow-visible`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {title}
      </motion.h1>

      <motion.div
        className="flex items-center justify-center bg-secondary w-auto px-2 h-8 rounded-full text-surface font-bold space-x-1"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span>{level}</span>
        <img
          src={levelIcon}
          alt="Level Icon"
          className="h-7 w-7"
        />
      </motion.div>
    </div>
  )
}
