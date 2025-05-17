// src/components/game/Map.tsx
import React, { useState, useEffect, useMemo } from 'react';
import GameCanvas from './GameCanvas';
import GameOverModal from './GameOverModal'; // Asegúrate que la ruta sea correcta
import type { GameThemeAssets, GamePhysics, GameDifficultyConfig, MapTheme } from '../../types/game';

// Importa SOLO assets específicos del TEMA (fondos, obstáculos del tema)
import forestBG from '../../../assets/Maps/Forest/ForestMap.png'; // Ajusta ruta si Map.tsx no está en src/components/game/
import iceBG from '../../../assets/Maps/Ice/IceMap.png';
import volcanoBG from '../../../assets/Maps/Volcano/VolcanoMap.png';

// DEFINE TUS PROPIOS ASSETS DE OBSTÁCULOS REALES E IMPÓRTALOS
import forestStumpAsset from '../../../assets/icons/GoldenTrophyIcon.png'; // EJEMPLO - CREA ESTE ASSET
import forestRockAsset from '../../../assets/icons/GoldenTrophyIcon.png';     // EJEMPLO - CREA ESTE ASSET
import iceCrystalAsset from '../../../assets/icons/GoldenTrophyIcon.png';       // EJEMPLO - CREA ESTE ASSET
import iceSpikeAsset from '../../../assets/icons/GoldenTrophyIcon.png';         // EJEMPLO - CREA ESTE ASSET
import volcanoRockAsset from '../../../assets/icons/GoldenTrophyIcon.png';   // EJEMPLO - CREA ESTE ASSET
import lavaPuddleAsset from '../../../assets/icons/GoldenTrophyIcon.png';   // EJEMPLO - CREA ESTE ASSET

// Configuración base de assets por tema (sin los frames del jugador)
interface ThemeMapAssets {
  background: string;
  obstacles: string[]; // Solo los src de los obstáculos
}

const THEME_MAP_CONFIGS: Record<MapTheme, {
  assets: ThemeMapAssets;
  physics: GamePhysics;
  difficulty: GameDifficultyConfig;
}> = {
  forest: {
    assets: { background: forestBG, obstacles: [forestStumpAsset, forestRockAsset] },
    physics: { gravity: 2300, jumpForce: 880, initialSpeed: 280, playerGroundOffset: 15 },
    difficulty: { speedIncrement: 12, initialMinSpawnIntervalMs: 2000, initialMaxSpawnIntervalMs: 3800, minOverallSpawnIntervalMs: 600, obstacleIntervalSpeedFactor: 0.04, maxSpeed: 800 },
  },
  ice: {
    assets: { background: iceBG, obstacles: [iceCrystalAsset, iceSpikeAsset] },
    physics: { gravity: 2200, jumpForce: 900, initialSpeed: 270, playerGroundOffset: 15 },
    difficulty: { speedIncrement: 11, initialMinSpawnIntervalMs: 2200, initialMaxSpawnIntervalMs: 4000, minOverallSpawnIntervalMs: 650, obstacleIntervalSpeedFactor: 0.035, maxSpeed: 750 },
  },
  volcano: {
    assets: { background: volcanoBG, obstacles: [volcanoRockAsset, lavaPuddleAsset] },
    physics: { gravity: 2400, jumpForce: 850, initialSpeed: 300, playerGroundOffset: 15 },
    difficulty: { speedIncrement: 14, initialMinSpawnIntervalMs: 1800, initialMaxSpawnIntervalMs: 3500, minOverallSpawnIntervalMs: 500, obstacleIntervalSpeedFactor: 0.05, maxSpeed: 850 },
  },
};

export interface MapComponentProps {
  theme: MapTheme;
  selectedPlayerRunFrames: string[];  // Estos vienen de PlayScreen
  selectedPlayerJumpFrames: string[]; // Estos vienen de PlayScreen
  onExitGame: () => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
  theme,
  selectedPlayerRunFrames,
  selectedPlayerJumpFrames,
  onExitGame,
}) => {
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem(`golemRunner_${theme}_highscore`) || '0', 10));
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameKey, setGameKey] = useState(Date.now());
  const [canvasDimensions, setCanvasDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const updateDimensions = () => setCanvasDimensions({ width: window.innerWidth, height: window.innerHeight });
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#0D2930'; // Color de tu tema 'screen'
    return () => {
      window.removeEventListener('resize', updateDimensions);
      document.body.style.overflow = 'auto';
      document.body.style.background = '';
    };
  }, []);

  // Combina los assets del tema con los frames del jugador seleccionado
  const finalAssetsForGameCanvas: GameThemeAssets = useMemo(() => {
    const themeAssets = THEME_MAP_CONFIGS[theme].assets;
    // Fallback por si las props de frames llegan vacías (PlayScreen debería asegurar que no)
    const runFrames = selectedPlayerRunFrames.length > 0 ? selectedPlayerRunFrames : [];
    const jumpFrames = selectedPlayerJumpFrames.length > 0 ? selectedPlayerJumpFrames : [];

    if (runFrames.length === 0 || jumpFrames.length === 0) {
        console.warn(`MapComponent: Player animation frames for theme '${theme}' are incomplete or missing. Gameplay might be affected.`);
    }

    return {
      ...themeAssets, // background, obstacles
      playerRunFrames: runFrames,
      playerJumpFrames: jumpFrames,
    };
  }, [theme, selectedPlayerRunFrames, selectedPlayerJumpFrames]);

  const activePhysicsConfig = THEME_MAP_CONFIGS[theme].physics;
  const activeDifficultyConfig = THEME_MAP_CONFIGS[theme].difficulty;

  const handleGameOver = (finalScore: number) => {
    setCurrentScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem(`golemRunner_${theme}_highscore`, finalScore.toString());
    }
    setShowGameOverModal(true);
  };

  const handleRestartGame = () => {
    setShowGameOverModal(false);
    setGameKey(Date.now()); // Cambia la key para forzar el re-montado de GameCanvas
  };

  const handleExitAndCloseModal = () => {
    setShowGameOverModal(false);
    onExitGame();
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-screen overflow-hidden">
      <GameCanvas
        key={gameKey}
        assetsConfig={finalAssetsForGameCanvas}
        physicsConfig={activePhysicsConfig}
        difficultyConfig={activeDifficultyConfig}
        onGameOver={handleGameOver}
        theme={theme}
        canvasWidth={canvasDimensions.width}
        canvasHeight={canvasDimensions.height}
        initialHighScore={highScore}
      />
      {showGameOverModal && (
        <GameOverModal
          isOpen={showGameOverModal}
          score={currentScore}
          record={highScore}
          onExit={handleExitAndCloseModal}
          onRestart={handleRestartGame}
        />
      )}
    </div>
  );
};

export default MapComponent;