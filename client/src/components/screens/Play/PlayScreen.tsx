import { useState, useEffect } from 'react';
import CloseIcon from "../../../assets/icons/CloseIcon.png"; 
import { motion } from "framer-motion";
import { BackgroundParticles } from "../../shared/BackgroundParticles"; 
import { MapCarousel } from "./MapCarousel"; 
import { defaultMaps } from "../../../constants/maps"; 
import type { Map as MapDataType } from '../../types/map'; 
import MapComponent from '../Game/Map'; 
import { MapTheme } from '../../types/game'; 

// Asumiendo que tienes acceso a los datos de golems (ej. de golems.ts)
// Deberías tener un Golem seleccionado de HomeScreen.
// Por ahora, vamos a hardcodear las animaciones de un golem para el ejemplo.
import { defaultGolems } from '../../../constants/golems'; // Ajusta ruta

interface PlayScreenProps {
  onClose: () => void;
  coins: number;
  onSpendCoins: (amount: number) => void;
  onNavigation?: (screen: "home" | "play" | "market" | "profile" | "ranking") => void;
  // Necesitas pasar el Golem seleccionado o sus assets
  selectedGolemId?: number; // ID del golem seleccionado en HomeScreen
}

export function PlayScreen({ 
    onClose, 
    coins, 
    onSpendCoins, 
    selectedGolemId = 1 // Default a Ice Golem (ID 1 en tu defaultGolems)
}: PlayScreenProps) {
  const [showGame, setShowGame] = useState(false);
  const [selectedMapTheme, setSelectedMapTheme] = useState<MapTheme | null>(null);

  // Obtener los frames de animación del Golem seleccionado
  // Esto es un ejemplo, idealmente el objeto Golem completo o sus assets se pasarían como prop
  const [playerRunFrames, setCurrentPlayerRunFrames] = useState<string[]>([]);
  const [playerJumpFrames, setCurrentPlayerJumpFrames] = useState<string[]>([]);

  useEffect(() => {
    const golemData = defaultGolems.find(g => g.id === selectedGolemId);
    if (golemData && golemData.animations?.run && golemData.animations?.jump) {
      setCurrentPlayerRunFrames(golemData.animations.run);
      setCurrentPlayerJumpFrames(golemData.animations.jump);
    } else {
      // Fallback si el golem no se encuentra o no tiene frames (IMPORTANTE)
      console.warn(`Selected Golem (ID: ${selectedGolemId}) not found or missing animations. Using first Golem as fallback.`);
      const fallbackGolem = defaultGolems[0];
      if (fallbackGolem?.animations?.run && fallbackGolem?.animations?.jump) {
          setCurrentPlayerRunFrames(fallbackGolem.animations.run);
          setCurrentPlayerJumpFrames(fallbackGolem.animations.jump);
      } else { // Si ni el fallback funciona
          setCurrentPlayerRunFrames([]); // Enviar arrays vacíos, GameCanvas debe manejarlo
          setCurrentPlayerJumpFrames([]);
      }
    }
  }, [selectedGolemId]);


  const handleUnlockMap = (mapId: number, price: number) => {
    if (coins >= price) {
      onSpendCoins(price)
      // In a real app, you would update the map's unlocked status in your state management
      console.log(`Unlocked map ${mapId} for ${price} coins`)
    } else {
      console.log("Not enough coins!")
      // You could show a notification here
    }
  }

  const handlePlayMap = (mapData: MapDataType) => {
    if (mapData.unlocked) {
      const theme = mapData.theme; // Asegúrate que 'theme' exista y sea del tipo correcto
      if (theme && (playerRunFrames.length > 0 || playerJumpFrames.length > 0)) {
        setSelectedMapTheme(theme);
        setShowGame(true);
        console.log(`Starting game on map ${mapData.name} with theme ${theme}`);
      } else {
        console.error("Map theme is not defined or player animation frames are missing for map:", mapData.name);
        // Podrías mostrar una notificación al usuario aquí.
      }
    } else {
        console.log("Map is locked. Unlock it first.");
        // Podrías mostrar una notificación para desbloquear.
    }
  };

  const handleExitGame = () => {
    setShowGame(false);
    setSelectedMapTheme(null);
    // Considera si necesitas llamar a onClose aquí o si el usuario debe hacerlo manualmente
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
          style={{ marginLeft: '-30px' }} // Ajuste como en tu original
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
          <MapCarousel
            maps={defaultMaps} // Asume que defaultMaps tiene la info de 'unlocked' actualizada
            coins={coins}
            onUnlock={handleUnlockMap}
            onSelect={(mapId) => {
                const mapToPlay = defaultMaps.find(m => m.id === mapId);
                if (mapToPlay) {
                    handlePlayMap(mapToPlay);
                }
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}