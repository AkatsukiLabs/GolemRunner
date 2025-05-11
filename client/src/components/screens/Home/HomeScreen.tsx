import { useState } from "react"
import { motion } from "framer-motion"
import { Coins } from "lucide-react"
import { AvatarCarousel } from "./AvatarCarousel"
import { CharacterCard } from "./CharacterCard"
import { BackgroundParticles } from "../../shared/BackgroundParticles"
import { NavBar } from "../../layout/NavBar"
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
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik">
      <BackgroundParticles />

      {/* Top Bar */}
      <div className="relative z-10 w-full px-4 py-3 flex items-center justify-between">
        <motion.div
          className="flex items-center bg-screen/80 backdrop-blur-sm px-3 py-1 rounded-full border border-surface/30"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Coins className="text-primary mr-1 h-5 w-5" />
          <span className="text-surface font-bold">{coins}</span>
        </motion.div>

        <motion.h1
          className="font-bangers text-2xl text-surface"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Home
        </motion.h1>

        <motion.div
          className="flex items-center justify-center bg-secondary w-8 h-8 rounded-full text-surface font-bold"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {level}
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100%-8rem)] px-4">
        <motion.div
          className="w-full mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <AvatarCarousel
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

      {/* Navigation Bar */}
      <NavBar activeTab="home" onNavigation={onNavigation} />
    </div>
  )
}
