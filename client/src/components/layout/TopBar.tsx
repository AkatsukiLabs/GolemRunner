import { motion } from "framer-motion"
import coinIcon from "../../assets/icons/CoinIcon.webp";
import levelIcon from "../../assets/icons/levelicon2.webp";
import { DropdownMenu } from "../screens/Home/DropDownMenu";
import TalkIconButton from "../../assets/icons/TalkIconButton.webp";
import strikeIcon from "../../assets/icons/strike.webp";

interface TopBarProps {
  coins: number
  level: number
  title: string
  onNavigateLogin?: () => void
  selectedGolemData?: {
    name: string;
    description: string;
    level: number;
  }
  onOpenTalk?: () => void
}

export function TopBar({ coins, level, title, onNavigateLogin, selectedGolemData, onOpenTalk }: TopBarProps) {
  return (
    <div className="relative z-10 w-full px-4 py-3">
      <div className="flex items-center justify-between">
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
            text-cream
            overflow-visible`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {title}
        </motion.h1>

        <div className="relative">
          {/* Fila superior: Level y Daily Streak */}
          <div className="flex items-center space-x-2">
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
            
            <motion.div 
              className="flex items-center justify-center bg-secondary w-auto px-2 h-8 rounded-full text-surface font-bold space-x-1"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span>3</span>
              <img
                src={strikeIcon}
                alt="Strike Icon"
                className="h-8 w-8"
              />
            </motion.div>
          </div>
          
          {/* Fila inferior: Golem Talk y Dropdown Menu */}
          <div className="absolute -bottom-20 left-0 flex items-center space-x-6">
            {onOpenTalk && (
              <motion.div 
                className="mt-2"
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: 0.4 }}
              >
                <motion.button 
                  onClick={onOpenTalk} 
                  title="Talk to Lord Golem" 
                  className="transform-none relative"
                  whileHover={{ scale: 1.1 }} 
                  animate={{ scale: [1, 1.05, 1] }} 
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                >
                  <img src={TalkIconButton} alt="Talk to Golem" className="w-12 h-12" />
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">1</div>
                </motion.button>
              </motion.div>
            )}
            
            {onNavigateLogin && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <DropdownMenu 
                  onNavigateLogin={onNavigateLogin} 
                  selectedGolem={selectedGolemData}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
