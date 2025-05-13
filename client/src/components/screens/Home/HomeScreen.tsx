import { useState } from "react"
import { motion } from "framer-motion"
import coinIcon from "../../../assets/icons/CoinIcon.png";
import levelIcon from "../../../assets/icons/levelicon2.png";
import { AvatarCarouselFixed } from "./AvatarCarousel"
import { CharacterCard } from "./CharacterCard"
import { BackgroundParticles } from "../../shared/BackgroundParticles"
import { characters } from "../../../constants/characters"

interface HomeScreenProps {
  onPlayClick: () => void
  onMarketClick: () => void
  coins: number
  level: number
  onNavigation: (screen: "home" | "play" | "market" | "ranking" | "profile") => void
}

export function HomeScreen({ onPlayClick, onMarketClick, coins, level, onNavigation }: HomeScreenProps) {
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0])

  const handleCharacterSelect = (character: (typeof characters)[0]) => {
    setSelectedCharacter(character)
  }

  const handlePlay = () => {
    console.log(`Starting game with ${selectedCharacter.name}`)
    onPlayClick()
  }

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik flex flex-col">
      <BackgroundParticles />

      {/* Top Bar */}
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
        className="
          flex-1 text-center mx-4
          font-bangers font-bold text-3xl tracking-wide
          bg-golem-gradient bg-clip-text text-transparent
          overflow-visible"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        GOLEM RUNNER
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

      {/* Main Content */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center px-4 space-y-20 pb-20 w-full">
        <motion.div
          className="w-full" 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <AvatarCarouselFixed
            characters={characters}
            selectedCharacter={selectedCharacter}
            onSelect={handleCharacterSelect}
          />
        </motion.div>

        <motion.div
          className="w-full max-w-xs"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <CharacterCard character={selectedCharacter} onSelect={handlePlay} />
        </motion.div>
      </div>
    </div>
  )
}