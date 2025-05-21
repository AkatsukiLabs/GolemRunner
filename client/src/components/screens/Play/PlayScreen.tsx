import { useState, useEffect, useMemo, useCallback } from 'react';
import CloseIcon from "../../../assets/icons/CloseIcon.png"; 
import { motion } from "framer-motion";
import BackgroundParticles from "../../shared/BackgroundParticles"; 
import { MapCarousel } from "./MapCarousel"; 
import { getMapVisualDataById } from "../../../constants/mapVisualData"; 
import MapComponent from '../Game/Map'; 
import { MapTheme } from '../../types/game'; 
import { defaultGolems } from '../../../constants/golems'; 
import useAppStore from '../../../zustand/store';
import toast, { Toaster } from 'react-hot-toast';

interface PlayScreenProps {
  onClose: () => void;
  coins: number;
  onSpendCoins: (amount: number) => boolean; 
  onNavigation?: (screen: "home" | "play" | "market" | "profile" | "ranking") => void;
  selectedGolemId?: number; 
}

export function PlayScreen({ 
    onClose, 
    selectedGolemId = 1
}: PlayScreenProps) {
  const [showGame, setShowGame] = useState(false);
  const [selectedMapTheme, setSelectedMapTheme] = useState<MapTheme | null>(null);
  const [playerRunFrames, setCurrentPlayerRunFrames] = useState<string[]>([]);
  const [playerJumpFrames, setCurrentPlayerJumpFrames] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  
  // Get the worlds from Zustand store
  const { 
    worlds, 
    isLoading
  } = useAppStore();

  console.log("[PlayScreen] Worlds from Zustand:", worlds);
  
  // Toaster position based on screen size
  const position = useMemo(
    () => (isMobile ? 'bottom-center' : 'top-right'),
    [isMobile]
  );

  // Responsive design: update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Combine map data from dojo with visual data
  const mapData = useMemo(() => {
    if (!worlds || worlds.length === 0) return [];
    
    return worlds.map(world => ({
      id: world.id,
      ...getMapVisualDataById(world.id),
      unlocked: world.is_unlocked,
      price: world.price,
      is_starter: world.is_starter
    })).sort((a, b) => {
      // Show starter maps first
      if (a.is_starter && !b.is_starter) return -1;
      if (!a.is_starter && b.is_starter) return 1;
      return 0;
    });
  }, [worlds]);

  // Set player animation frames based on selected Golem ID
  useEffect(() => {
    const golemData = defaultGolems.find(g => g.id === selectedGolemId);
    if (golemData && golemData.animations?.run && golemData.animations?.jump) {
      setCurrentPlayerRunFrames(golemData.animations.run);
      setCurrentPlayerJumpFrames(golemData.animations.jump);
    } else {
      const fallbackGolem = defaultGolems[0];
      if (fallbackGolem?.animations?.run && fallbackGolem?.animations?.jump) {
          setCurrentPlayerRunFrames(fallbackGolem.animations.run);
          setCurrentPlayerJumpFrames(fallbackGolem.animations.jump);
      } else { 
          setCurrentPlayerRunFrames([]);
          setCurrentPlayerJumpFrames([]);
      }
    }
  }, [selectedGolemId]);

  // Select and play map
  const handlePlayMap = useCallback((mapData: any) => {

    if (mapData.unlocked) {
      const theme = mapData.theme; 

      if (theme && (playerRunFrames.length > 0 || playerJumpFrames.length > 0)) {
        setSelectedMapTheme(theme);
        setShowGame(true);
      } else {
        console.error("Map theme is not defined or player animation frames are missing for map:", mapData.name);
      }
    } else {
      toast.error(
        <div className="font-luckiest">
          <span className="text-xl text-dark">This Map is locked!</span><br/>
          <span className="text-dark">
            Go to Market to unlock it
          </span>
        </div>,
        { id: 'map-locked-action-toast', position, duration: 3000, icon: '🔒' }
      );
    }
  }, [playerRunFrames, playerJumpFrames, position]);

  const handleExitGame = () => {
    setShowGame(false);
    setSelectedMapTheme(null);
  };

  if (showGame && selectedMapTheme) {
    return (
      <MapComponent 
        theme={selectedMapTheme} 
        onExitGame={handleExitGame}
        selectedPlayerRunFrames={playerRunFrames}
        selectedPlayerJumpFrames={playerJumpFrames}
      />
    );
  }

  return (
    <div className="relative h-screen w-full bg-screen overflow-hidden font-rubik">
      <BackgroundParticles />

      {/* Top Bar */}
      <div className="relative z-10 w-full px-4 py-3 flex items-center justify-between">
        <motion.button
          className="bg-surface border-2 border-primary rounded-full p-2 text-primary hover:bg-surface/90 active:bg-surface/80 transition-colors"
          onClick={onClose}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          aria-label="Close"
        >
          <img src={CloseIcon} alt="Close" className="h-8 w-8" />
        </motion.button>

        <motion.h1
          className="font-bangers text-5xl text-cream absolute left-1/2 transform -translate-x-1/2"
          style={{ marginLeft: '-30px' }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Play
        </motion.h1>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center py-8 px-4">
        <motion.div
          className="w-full max-w-md bg-surface rounded-xl p-6 shadow-lg"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-luckiest text-3xl text-dark mb-4 text-center">Maps</h2>
          
          {isLoading ? (
            <div className="text-center py-8 text-dark font-luckiest">Loading maps...</div>
          ) : mapData.length === 0 ? (
            <div className="text-center py-8 text-dark font-luckiest">No maps available</div>
          ) : (
            <MapCarousel
              maps={mapData}
              coins={0} 
              onUnlock={() => {}} 
              onSelect={(mapId) => {
                const mapToPlay = mapData.find((m: any) => m.id === mapId);
                if (mapToPlay) {
                  handlePlayMap(mapToPlay);
                }
              }}
            />
          )}
        </motion.div>
      </div>

      <Toaster
        position={position}
        toastOptions={{
          className: 'font-luckiest bg-cream text-dark border border-dark rounded-[5px] shadow-lg p-4',
          error: { duration: 3000 }
        }}
      />
    </div>
  );
}
