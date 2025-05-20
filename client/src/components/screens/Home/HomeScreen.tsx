import { useState, useEffect } from "react"; 
import { motion, AnimatePresence } from "framer-motion";
import { AvatarCarouselFixed } from "./AvatarCarousel";
import { CharacterCard } from "./CharacterCard";
import { BackgroundParticles } from "../../shared/BackgroundParticles";
import { characters, getGolemVisualDataById } from "../../../constants/characters";
import { TopBar } from "../../layout/TopBar";
import TalkIconButton from "../../../assets/icons/TalkIconButton.png";
import { GolemTalkModal } from "./GolemTalkModal";
import { DropdownMenu } from "./DropDownMenu"; 
import useAppStore from "../../../zustand/store";
import toast, { Toaster } from 'react-hot-toast';

// Tipo para un personaje con estado de desbloqueo
type CharacterWithUnlockStatus = (typeof characters)[0] & {
  isUnlocked: boolean;
};

interface HomeScreenProps {
  playerAddress: string;
  onPlayClick: (character: typeof characters[0]) => void;
  onMarketClick: () => void;
  coins: number;
  level: number;
  onNavigation: (
    screen: "home" | "play" | "market" | "ranking" | "profile"
  ) => void;
  onNavigateLogin: () => void;
}

export function HomeScreen({
  playerAddress,
  onPlayClick,
  coins,
  level,
  onNavigateLogin,
  onNavigation,
}: HomeScreenProps) {
  // Accedemos directamente a Zustand para obtener los golems
  const { golems, isLoading, error } = useAppStore(state => ({
    golems: state.golems,
    isLoading: state.isLoading,
    error: state.error
  }));

  // Filtramos los golems desbloqueados
  const unlockedGolems = golems.filter(golem => golem.is_unlocked);

  // Preparamos todos los golems con sus datos visuales y estado de desbloqueo
  const golemCharacters = golems.map(golem => {
    const visualData = getGolemVisualDataById(golem.id);
    return {
      id: golem.id,
      ...visualData,
      isUnlocked: golem.is_unlocked
    };
  });

  // Estado inicial - seleccionamos el primer golem desbloqueado o el primer golem si no hay ninguno desbloqueado
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterWithUnlockStatus>(() => {
    // Si tenemos golems desbloqueados, seleccionamos el primero
    if (unlockedGolems.length > 0) {
      const firstUnlockedGolem = unlockedGolems[0];
      const visualData = getGolemVisualDataById(firstUnlockedGolem.id);
      return {
        id: firstUnlockedGolem.id,
        ...visualData,
        isUnlocked: true
      };
    }
    
    // Si no hay golems desbloqueados pero hay golems, seleccionamos el primero (bloqueado)
    if (golems.length > 0) {
      const firstGolem = golems[0];
      const visualData = getGolemVisualDataById(firstGolem.id);
      return {
        id: firstGolem.id,
        ...visualData,
        isUnlocked: firstGolem.is_unlocked
      };
    }
    
    // Si no hay datos de golems todavía, usamos un valor predeterminado
    return {
      id: 1, // Stone Golem es el ID 1
      ...getGolemVisualDataById(1),
      isUnlocked: false // Asumimos bloqueado hasta que sepamos lo contrario
    };
  });
  
  const [showTalkModal, setShowTalkModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); 
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  const position = isMobile ? 'bottom-center' : 'top-right';

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Responsive toast positioning
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Actualizar el personaje seleccionado cuando cambian los datos de golems
  useEffect(() => {
    // Si tenemos golems cargados y aún no hemos seleccionado uno desbloqueado
    if (!isLoading && golems.length > 0) {
      // Si hay golems desbloqueados y el seleccionado no está desbloqueado, seleccionamos el primero desbloqueado
      if (unlockedGolems.length > 0 && !selectedCharacter.isUnlocked) {
        const firstUnlockedGolem = unlockedGolems[0];
        const visualData = getGolemVisualDataById(firstUnlockedGolem.id);
        setSelectedCharacter({
          id: firstUnlockedGolem.id,
          ...visualData,
          isUnlocked: true
        });
      } 
      // Si no hay desbloqueados, asegurémonos de que el seleccionado tenga datos actualizados
      else if (selectedCharacter) {
        const currentGolem = golems.find(g => g.id === selectedCharacter.id);
        if (currentGolem) {
          const visualData = getGolemVisualDataById(currentGolem.id);
          setSelectedCharacter({
            id: currentGolem.id,
            ...visualData,
            isUnlocked: currentGolem.is_unlocked
          });
        }
      }
    }
  }, [golems, unlockedGolems, isLoading]);

  const handleCharacterSelect = (character: CharacterWithUnlockStatus) => {
    setSelectedCharacter(character);
    
    // Si el golem seleccionado está bloqueado, mostramos un toast
    if (!character.isUnlocked) {
      toast.error(
        <div className="font-luckiest">
          <span className="text-xl text-dark">Golem Locked!</span>
          <br />
          <span className="text-sm text-dark">Visit the Market to unlock it.</span>
        </div>, 
        { 
          id: 'golem-locked-toast',
          position,
          duration: 3000,
          icon: '🔒'
        }
      );
    }
  };

  const handlePlay = () => {
    // Solo permitimos jugar si el golem está desbloqueado
    if (selectedCharacter.isUnlocked) {
      console.log("Play clicked with character:", selectedCharacter);
      onPlayClick(selectedCharacter);
    } else {
      // Mostrar toast con opción para ir al mercado
      toast(
        <div className="font-luckiest">
          <span className="text-xl text-dark">This Golem is locked!</span>
          <br />
          <button 
            className="text-dark underline mt-1"
            onClick={() => onNavigation("market")}
          >
            Go to Market to unlock it
          </button>
        </div>,
        { 
          id: 'golem-locked-action-toast',
          position,
          duration: 5000,
          icon: '🔒'
        }
      );
    }
  };

  const openTalk = () => setShowTalkModal(true);
  const closeTalk = () => setShowTalkModal(false);

  // Prepare golem data for sharing
  const selectedGolemData = {
    name: selectedCharacter.name,
    description: selectedCharacter.description || "A powerful golem ready for adventure",
    level: level
  };

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik flex flex-col">
      <BackgroundParticles />

      {/* Spotlight effect */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        animate={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1), transparent 40%)`,
        }}
      />
      
      {/* Main Containner */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* TopBar */}
        <TopBar 
          coins={coins} 
          level={level} 
          title="GOLEM RUNNER" 
          screen="home" 
        />
  
        {/* TALK + MENU */}
        <div className="w-full flex justify-between items-center px-6 mt-6">
          {/* Talk button*/}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              onClick={openTalk}
              title="Talk to Lord Golem"
              className="transform-none relative" 
              whileHover={{ scale: 1.1 }} 
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            >
              <img
                src={TalkIconButton}
                alt="Talk to Golem"
                className="w-12 h-12" 
              />
              {/* Notification tag */}
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                1 
              </div>
            </motion.button>
          </motion.div>

          {/* DropDown Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <DropdownMenu 
              onNavigateLogin={onNavigateLogin} 
              selectedGolem={selectedGolemData}
            />
          </motion.div>
        </div>
  
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 space-y-8 pb-20 w-full">
          {isLoading ? (
            <div className="text-center text-white font-luckiest">Loading golems...</div>
          ) : error ? (
            <div className="text-center text-red-500 font-luckiest">Error loading golems: {error}</div>
          ) : golemCharacters.length === 0 ? (
            <div className="text-center text-white font-luckiest">No golems found</div>
          ) : (
            <>
              <motion.div
                className="w-full" 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <AvatarCarouselFixed
                  characters={golemCharacters}
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
                <CharacterCard 
                  character={selectedCharacter} 
                  onSelect={handlePlay} 
                  isUnlocked={selectedCharacter.isUnlocked}
                />
              </motion.div>
            </>
          )}
        </div>
      </div>
  
      {/* Modal  */}
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

      {/* React Hot Toast container with Tailwind styles */}
      <Toaster
        position={position}
        toastOptions={{
          className: 'font-luckiest bg-cream text-dark border border-dark rounded-[5px] shadow-lg p-4',
          error: { 
            duration: 3000,
            className: 'font-luckiest bg-cream text-dark border border-dark rounded-[5px] shadow-lg p-4'
          },
          success: { duration: 3000 }
        }}
      />
    </div>
  );
}