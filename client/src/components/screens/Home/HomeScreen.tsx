import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AvatarCarouselFixed } from "./AvatarCarousel"
import { CharacterCard } from "./CharacterCard"
import { BackgroundParticles } from "../../shared/BackgroundParticles"
import { characters } from "../../../constants/characters"
import { TopBar } from "../../layout/TopBar"
import TalkIconButton from "../../../assets/icons/TalkIconButton.png"
import { GolemTalkModal } from "./GolemTalkModal"
import { DropdownMenu } from "./DropDownMenu";

 interface HomeScreenProps {
   playerAddress: string
   onPlayClick: (character: typeof characters[0]) => void
   onMarketClick: () => void
   coins: number
   level: number
   onNavigation: (screen: "home" | "play" | "market" | "ranking" | "profile") => void
   onNavigateCover: () => void
 }

 export function HomeScreen({
   playerAddress,
   onPlayClick,
   coins,
   level,
   onNavigateCover,
 }: HomeScreenProps) {
   const [selectedCharacter, setSelectedCharacter] = useState(characters[0])
   const [showTalkModal, setShowTalkModal] = useState(false)
   const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

   useEffect(() => {
     const handleMouseMove = (e: MouseEvent) => {
       setMousePosition({ x: e.clientX, y: e.clientY })
     }
     window.addEventListener('mousemove', handleMouseMove)
     return () => window.removeEventListener('mousemove', handleMouseMove)
   }, [])

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
      
      {/* Spotlight effect */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        animate={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1), transparent 40%)`
        }}
      />
      
      {/* Top bar + buttons */}
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
          <motion.button
            onClick={openTalk}
            title="Talk to Lord Golem"
            className="transform-none relative"
            whileHover={{ scale: 1.1 }}
            animate={{
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            <img
              src={TalkIconButton}
              alt="Talk to Golem"
              className="w-12 h-12"
            />
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              1
            </div>
          </motion.button>
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
