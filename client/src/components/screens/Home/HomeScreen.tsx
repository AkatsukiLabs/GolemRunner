import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AvatarCarouselFixed } from "./AvatarCarousel"
import { CharacterCard } from "./CharacterCard"
import { BackgroundParticles } from "../../shared/BackgroundParticles"
import { characters } from "../../../constants/characters"
import { TopBar } from "../../layout/TopBar"
import TalkIconButton from "../../../assets/icons/TalkIconButton.png"
import { GolemTalkModal } from "./GolemTalkModal"

const playerAddress = "0x1234567890abcdef1234567890abcdef12345678" // Placeholder for player's address

 interface HomeScreenProps {
   onPlayClick: (character: typeof characters[0]) => void
   onMarketClick: () => void
   coins: number
   level: number
   onNavigation: (screen: "home" | "play" | "market" | "ranking" | "profile") => void
 }

 export function HomeScreen({
   onPlayClick,
   coins,
   level,
 }: HomeScreenProps) {
   const [selectedCharacter, setSelectedCharacter] = useState(characters[0])
   const [showTalkModal, setShowTalkModal] = useState(false)

  const handleCharacterSelect = (character: (typeof characters)[0]) => {
    setSelectedCharacter(character)
  }

   const handlePlay = () => {
     console.log("Play clicked with character:", selectedCharacter)
     onPlayClick(selectedCharacter)
   }

  const openTalk = () => setShowTalkModal(true)
  const closeTalk = () => setShowTalkModal(false)

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik flex flex-col">
      <BackgroundParticles />
  
      {/* Main layout content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Top Bar with Lord Golem */}
        <TopBar 
          coins={coins} 
          level={level} 
          title="GOLEM RUNNER" 
          screen="home" 
        />
  
        {/* Talk Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-xs flex justify-start ml-6 mt-6"
        >
          <button onClick={openTalk} title="Talk to Lord Golem">
            <img
              src={TalkIconButton}
              alt="Talk to Golem"
              className="w-12 h-12 hover:scale-110 transition-transform duration-200"
            />
          </button>
        </motion.div>
  
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 space-y-8 pb-20 w-full">
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
  
      {/* Modal always above everything */}
      <AnimatePresence>
        {showTalkModal && (
          <div className="absolute inset-0 z-50">
            <GolemTalkModal
              playerAddress={playerAddress}
              onClose={closeTalk}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
