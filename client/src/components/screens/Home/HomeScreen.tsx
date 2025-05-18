import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AvatarCarouselFixed } from "./AvatarCarousel"
import { CharacterCard } from "./CharacterCard"
import { BackgroundParticles } from "../../shared/BackgroundParticles"
import { characters } from "../../../constants/characters"
import { TopBar } from "../../layout/TopBar"
import TalkIconButton from "../../../assets/icons/TalkIconButton.png"
import { GolemTalkModal } from "./GolemTalkModal"

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

       {/* Top Bar */}
       <TopBar 
         coins={coins} 
         level={level} 
         title="GOLEM RUNNER" 
         screen="home" 
       />

       {/* Main Content */}
       <div className="z-10 flex-1 flex flex-col items-center justify-center px-4 space-y-8 pb-20 w-full">
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

        {/* Talk Button */}
        <div className="w-full max-w-xs flex justify-start">
          <button onClick={openTalk} className="mt-10">
            <img
              src={TalkIconButton}
              alt="Talk to Golem"
              className="w-12 h-12"
            />
          </button>
        </div>
       </div>

      {/* Dialogue modal */}
      <AnimatePresence>
        {showTalkModal && (
          <GolemTalkModal
            text="Hello runner! I'm ready to guide you on your next adventure."
            onClose={closeTalk}
          />
        )}
      </AnimatePresence>
     </div>
   )
 }
