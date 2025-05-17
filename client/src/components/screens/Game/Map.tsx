// src/components/game/Map.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import GameCanvas from './GameCanvas';
import ScoreDisplay from './ScoreDisplay';
import GameOverModal from './GameOverModal';
import { GameState, GameAssets, GamePhysics, GameDifficulty, MapTheme } from '../../types/game'; // Asegúrate de que la ruta sea correcta
import audioManager from './AudioManager';

// Asumimos que las rutas de los assets del golem vienen de props
// o se determinan aquí basado en una selección previa.
// Para este ejemplo, usaremos assets de IceGolem de tu golems.ts
// Deberás hacer esto dinámico según el golem seleccionado.

// Ejemplo de rutas de assets (reemplaza con tus rutas reales)
// Estos deben coincidir con los 12 frames que tienes en golems.ts
const ICE_GOLEM_RUN_FRAMES = Array.from({ length: 12 }, (_, i) => `/assets/IceGolem/Run/0_Golem_Running_0${i.toString().padStart(2, '0')}.png`);
// Crea assets de salto para tu golem (11 o 12 frames)
const ICE_GOLEM_JUMP_FRAMES = Array.from({ length: 12 }, (_, i) => `/assets/IceGolem/Jump/0_Golem_Jumping_0${i.toString().padStart(2, '0')}.png`); // Placeholder paths

// Placeholder para assets de obstáculos (deberás crear estas imágenes)
// Ancho y alto son importantes para el dibujo y colisión.
const FOREST_OBSTACLES = {
    obstacle1: { src: '/assets/obstacles/forest/stump.png', width: 60, height: 40 },
    obstacle2: { src: '/assets/obstacles/forest/rock.png', width: 80, height: 60 },
    obstacle3: { src: '/assets/obstacles/forest/fallen_log.png', width: 120, height: 30 },
};
const ICE_OBSTACLES = {
    obstacle1: { src: '/assets/obstacles/ice/crystal_small.png', width: 50, height: 70 },
    obstacle2: { src: '/assets/obstacles/ice/ice_rock.png', width: 90, height: 50 },
    obstacle3: { src: '/assets/obstacles/ice/stalagmite.png', width: 40, height: 90 },
};
const VOLCANO_OBSTACLES = {
    obstacle1: { src: '/assets/obstacles/volcano/lava_rock.png', width: 70, height: 70 },
    obstacle2: { src: '/assets/obstacles/volcano/obsidian_shard.png', width: 60, height: 80 },
    obstacle3: { src: '/assets/obstacles/volcano/fire_geyser_placeholder.png', width: 50, height: 100 }, // Geyser podría ser animado
};

// Backgrounds de tus archivos maps.ts
import ForestBackground from '../../../assets/Maps/Forest/ForestMap.png'; // Ajusta la ruta según tu estructura
import IceBackground from '../../../assets/Maps/Ice/IceMap.png';
import VolcanoBackground from '../../../assets/Maps/Volcano/VolcanoMap.png';


export interface MapComponentProps {
  theme: MapTheme;
  // Las siguientes props se podrían pasar o definir aquí basado en el tema
  // Para este ejemplo, las definiremos internamente.
  // assets: GameAssets;
  // physics: GamePhysics;
  // difficulty: GameDifficulty;
  onExitGame: () => void; // Para volver a PlayScreen
  selectedPlayerRunFrames: string[]; // Pasado desde PlayScreen
  selectedPlayerJumpFrames: string[];// Pasado desde PlayScreen
}

const MapComponent: React.FC<MapComponentProps> = ({ 
    theme, 
    onExitGame,
    selectedPlayerRunFrames,
    selectedPlayerJumpFrames
}) => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0); // Podrías cargarlo de localStorage
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  
  // Canvas dimensions - idealmente deberían ocupar la pantalla disponible
  // Para mobile first 9:16, puedes calcular esto basado en window.innerWidth y window.innerHeight
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 360, height: 640 });


  useEffect(() => {
    const updateDimensions = () => {
      // Sencillo: tomar el menor entre el ancho real y un alto basado en 9:16, o viceversa.
      // O simplemente usar window.innerWidth y window.innerHeight para pantalla completa.
      const aspectRatio = 9 / 16; // Por ejemplo
      let w = window.innerWidth;
      let h = window.innerHeight;

      // Si quieres forzar aspect ratio (esto puede crear barras negras si el contenedor no lo maneja)
      // if (w / h > aspectRatio) { // Más ancho que alto (landscape o tablet)
      //   w = h * aspectRatio;
      // } else { // Más alto que ancho (portrait)
      //   h = w / aspectRatio;
      // }
      // Por ahora, usemos full screen para el canvas.
      setCanvasDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);


  // Cargar high score al montar
  useEffect(() => {
    const storedHighScore = localStorage.getItem(`golem_runner_hs_${theme}`);
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }
  }, [theme]);

  const gameAssets = useMemo((): GameAssets => {
    let backgroundSrc = '';
    let obstaclesData = FOREST_OBSTACLES; // default

    switch (theme) {
      case 'ice':
        backgroundSrc = IceBackground;
        obstaclesData = ICE_OBSTACLES;
        break;
      case 'volcano':
        backgroundSrc = VolcanoBackground;
        obstaclesData = VOLCANO_OBSTACLES;
        break;
      case 'forest':
      default:
        backgroundSrc = ForestBackground;
        obstaclesData = FOREST_OBSTACLES;
        break;
    }
    return {
      background: backgroundSrc,
      obstacles: obstaclesData,
      playerRunFrames: selectedPlayerRunFrames.length > 0 ? selectedPlayerRunFrames : ICE_GOLEM_RUN_FRAMES, // Fallback
      playerJumpFrames: selectedPlayerJumpFrames.length > 0 ? selectedPlayerJumpFrames : ICE_GOLEM_JUMP_FRAMES, // Fallback
    };
  }, [theme, selectedPlayerRunFrames, selectedPlayerJumpFrames]);

  const gamePhysics: GamePhysics = useMemo(() => ({
    gravity: 2200, // Aumentado para un salto más rápido y pesado (unidades por s^2)
    jumpForce: 850, // Fuerza inicial del salto (unidades por s)
    initialSpeed: 250, // Velocidad de scroll inicial (unidades por s)
    playerGroundOffset: 10, // Pequeño offset del jugador desde el borde inferior
  }), []);

  const gameDifficulty: GameDifficulty = useMemo(() => ({
    speedIncrement: 10, // Aumento de velocidad por segundo
    obstacleFrequencyMin: 1500, // ms
    obstacleFrequencyMax: 3500, // ms
    maxSpeed: 700, // Velocidad máxima
  }), []);


  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem(`golem_runner_hs_${theme}`, finalScore.toString());
    }
    setIsGameOverModalOpen(true);
    audioManager.stopBackgroundMusic(); // Asegurarse que la música pare
  }, [highScore, theme]);

  const handleRestartGame = () => {
    setIsGameOverModalOpen(false);
    setScore(0); 
    // El GameCanvas internamente llamará a resetGame() cuando su key cambie o se remonte.
    // Para forzar un reseteo completo y reinicio de su estado interno,
    // podemos cambiar la `key` del componente GameCanvas.
    setGameCanvasKey(prev => prev + 1);
  };
  
  const [gameCanvasKey, setGameCanvasKey] = useState(0);


  return (
    <div className="relative w-screen h-screen bg-screen overflow-hidden"> {/* Contenedor principal */}
      <GameCanvas
        key={gameCanvasKey} // Cambiar key para forzar re-montado y reseteo
        assets={gameAssets}
        physics={gamePhysics}
        difficulty={gameDifficulty}
        theme={theme}
        onGameOver={handleGameOver}
        initialHighScore={highScore}
        canvasWidth={canvasDimensions.width}
        canvasHeight={canvasDimensions.height}
      />
      <ScoreDisplay score={score} highScore={highScore} />
      <GameOverModal
        isOpen={isGameOverModalOpen}
        score={score}
        record={highScore}
        onExit={onExitGame}
        onRestart={handleRestartGame}
      />
    </div>
  );
};

export default MapComponent;