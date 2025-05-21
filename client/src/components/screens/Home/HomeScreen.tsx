import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarCarouselFixed } from "./AvatarCarousel";
import { CharacterCard } from "./CharacterCard";
import BackgroundParticles from "../../shared/BackgroundParticles";
import { characters, getGolemVisualDataById } from "../../../constants/characters";
import { TopBar } from "../../layout/TopBar";
import TalkIconButton from "../../../assets/icons/TalkIconButton.png";
import { GolemTalkModal } from "./GolemTalkModal";
import { DropdownMenu } from "./DropDownMenu";
import useAppStore from "../../../zustand/store";
import toast, { Toaster } from 'react-hot-toast';

// Tipo para un personaje con estado de desbloqueo
export type CharacterWithUnlockStatus = (typeof characters)[0] & {
  isUnlocked: boolean;
};

export interface HomeScreenProps {
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

export const HomeScreen = memo(function HomeScreen({
  playerAddress,
  onPlayClick,
  coins,
  level,
  onNavigateLogin,
}: HomeScreenProps) {
  const { golems, isLoading, error } = useAppStore(state => ({
    golems: state.golems,
    isLoading: state.isLoading,
    error: state.error,
  }));

  // Memoizamos arrays derivados
  const unlockedGolems = useMemo(
    () => golems.filter(g => g.is_unlocked),
    [golems]
  );
  const golemCharacters = useMemo(
    () =>
      golems.map(golem => ({
        id: golem.id,
        ...getGolemVisualDataById(golem.id),
        isUnlocked: golem.is_unlocked,
      })),
    [golems]
  );

  // Estado y utilidades
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterWithUnlockStatus>(() => {
    if (unlockedGolems.length > 0) {
      const first = unlockedGolems[0];
      return { id: first.id, ...getGolemVisualDataById(first.id), isUnlocked: true };
    }
    if (golems.length > 0) {
      const first = golems[0];
      return { id: first.id, ...getGolemVisualDataById(first.id), isUnlocked: first.is_unlocked };
    }
    return { id: 1, ...getGolemVisualDataById(1), isUnlocked: false };
  });
  const [showTalkModal, setShowTalkModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  // Posición del toast
  const position = useMemo(
    () => (isMobile ? 'bottom-center' : 'top-right'),
    [isMobile]
  );

  // Effects de mouse y resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mantener seleccionado sincronizado con golems
  useEffect(() => {
    if (!isLoading && golems.length > 0) {
      // Si el golem actualmente seleccionado NO existe ya en la lista
      const exists = golems.some(g => g.id === selectedCharacter.id);
      if (!exists) {
        // Elegimos el primero desbloqueado o el primero en general
        const fallback = unlockedGolems.length > 0 ? unlockedGolems[0] : golems[0];
        setSelectedCharacter({
          id: fallback.id,
          ...getGolemVisualDataById(fallback.id),
          isUnlocked: fallback.is_unlocked,
        });
      }
    }
  }, [golems, unlockedGolems, isLoading]);

  // Handlers de character seleccionado
  const handleCharacterSelect = useCallback(
    (character: CharacterWithUnlockStatus) => {
      setSelectedCharacter(character);
    },
    []
  );

  const handlePlay = useCallback(() => {
    if (!selectedCharacter.isUnlocked) {
      toast.error(
        <div className="font-luckiest">
          <span className="text-xl text-dark">This Golem is locked!</span><br/>
          <button
            className="text-dark"
          >
            Go to Market to unlock it
          </button>
        </div>,
        { id: 'golem-locked-action-toast', position, duration: 3000, icon: '🔒' }
      );
    } else {
      onPlayClick(selectedCharacter);
    }
  }, [selectedCharacter, onPlayClick, position]);

  const openTalk = useCallback(() => setShowTalkModal(true), []);
  const closeTalk = useCallback(() => setShowTalkModal(false), []);

  // Datos compartidos memoizados
  const selectedGolemData = useMemo(
    () => ({
      name: selectedCharacter.name,
      description: selectedCharacter.description || 'A powerful golem ready for adventure',
      level,
    }),
    [selectedCharacter, level]
  );

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik flex flex-col">
      <BackgroundParticles />

      <motion.div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        animate={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1), transparent 40%)`,
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        <TopBar coins={coins} level={level} title="GOLEM RUNNER" screen="home" />

        <div className="w-full flex justify-between items-center px-6 mt-6">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <motion.button onClick={openTalk} title="Talk to Lord Golem" className="transform-none relative" whileHover={{ scale: 1.1 }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}>
              <img src={TalkIconButton} alt="Talk to Golem" className="w-12 h-12" />
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">1</div>
            </motion.button>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <DropdownMenu onNavigateLogin={onNavigateLogin} selectedGolem={selectedGolemData} />
          </motion.div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 space-y-8 pb-20 w-full">
          {isLoading ? (
            <div className="text-center text-white font-luckiest">Loading golems...</div>
          ) : error ? (
            <div className="text-center text-red-500 font-luckiest">Error loading golems: {error}</div>
          ) : golemCharacters.length === 0 ? (
            <div className="text-center text-white font-luckiest">No golems found</div>
          ) : (
            <>
              <motion.div className="w-full" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }}>
                <AvatarCarouselFixed characters={golemCharacters} selectedCharacter={selectedCharacter} onSelect={handleCharacterSelect} />
              </motion.div>

              <motion.div className="w-full max-w-xs" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                <CharacterCard character={selectedCharacter} onSelect={handlePlay} isUnlocked={selectedCharacter.isUnlocked} />
              </motion.div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showTalkModal && (
          <div className="absolute inset-0 z-50">
            <GolemTalkModal playerAddress={playerAddress} onClose={closeTalk} />
          </div>
        )}
      </AnimatePresence>

      <Toaster
        position={position}
        toastOptions={{
          className: 'font-luckiest bg-cream text-dark border border-dark rounded-[5px] shadow-lg p-4',
          error: { duration: 3000, className: 'font-luckiest bg-cream text-dark border border-dark rounded-[5px] shadow-lg p-4' },
          success: { duration: 3000 }
        }}
      />
    </div>
  );
});
