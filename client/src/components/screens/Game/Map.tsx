import React, { useState, useEffect, useMemo, useCallback } from 'react';
import GameCanvas from './GameCanvas';
import GameOverModal from './GameOverModal'; 
import { useGameRewards } from '../../../dojo/hooks/useGameRewards'; 
import { useCoinReward } from './CoinsRewardCalculator';
import type { GameThemeAssets, GamePhysics, GameDifficultyConfig, MapTheme, ObstacleConfig } from '../../types/game';

import { useMissionCompleter } from '../../../dojo/hooks/useMissionCompleter';
import { themeToWorldId } from '../../../utils/missionValidation';
import useAppStore from '../../../zustand/store';
import { useMissionQuery } from '../../../dojo/hooks/useMissionQuery';
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";

import forestBG from '../../../assets/Maps/Forest/ForestMap.webp'; 
import iceBG from '../../../assets/Maps/Ice/IceMap.webp';
import volcanoBG from '../../../assets/Maps/Volcano/VolcanoMap.webp';

import forestStumpAsset from '../../../assets/Maps/Forest/rock.webp'; 
import forestRockAsset from '../../../assets/Maps/Forest/forestLog.webp';     
import iceCrystalAsset from '../../../assets/Maps/Ice/stalagmite.webp';      
import iceSpikeAsset from '../../../assets/Maps/Ice/IceBlock.webp';        
import volcanoRockAsset from '../../../assets/Maps/Volcano/VolcanicRock.webp';   
import lavaPuddleAsset from '../../../assets/Maps/Volcano/geyser.webp';   
import forestGround from '../../../assets/Maps/Forest/ground.webp'; 
import iceGround from '../../../assets/Maps/Ice/ground.webp';
import volcanoGround from '../../../assets/Maps/Volcano/ground.webp';

const THEME_MAP_CONFIGS: Record<MapTheme, {
  assets: {
    background: string;
    ground: string;
    obstacles: ObstacleConfig[];
  };
  physics: GamePhysics;
  difficulty: GameDifficultyConfig;
}> = {
  forest: {
    assets: {
      background: forestBG,
      ground: forestGround,
      obstacles: [
        { type: 'single', src: forestStumpAsset, width: 90, height: 65 },
        { type: 'single', src: forestRockAsset, width: 110, height: 80 },
        { 
          type: 'group', 
          members: [
            { src: forestStumpAsset, width: 60, height: 50, spacingAfter: 1 },
            { src: forestRockAsset, width: 90, height: 65 },                         
          ]
        },
        {
          type: 'group',
          members: [
            { src: forestStumpAsset, width: 60, height: 50, spacingAfter: 0 },
            { src: forestRockAsset, width: 80, height: 50 },
            { src: forestStumpAsset, width: 60, height: 50 },
          ]
        },
      ],
    },
    physics: {
      gravity: 2300,
      jumpForce: 880,
      baseSpeed: 280,
      playerGroundOffset: 15,
    },
    difficulty: {
      speedScaleIncrementPerSecond: 0.008,
      initialMinSpawnIntervalMs: 2000,
      initialMaxSpawnIntervalMs: 4000,
      minOverallSpawnIntervalMs: 700,
      obstacleIntervalSpeedFactor: 0.06,
    },
  },
  ice: {
    assets: {
      background: iceBG,
      ground: iceGround,
      obstacles: [
        { type: 'single', src: iceCrystalAsset, width: 100, height: 75 },
        { type: 'single', src: iceSpikeAsset, width: 120, height: 90 },
        { 
          type: 'group', 
          members: [
            { src: iceSpikeAsset, width: 70, height: 60, spacingAfter: 1 }, 
            { src: iceCrystalAsset, width: 90, height: 75 },                       
          ]
        },
        {
          type: 'group',
          members: [
            { src: iceCrystalAsset, width: 60, height: 50, spacingAfter: 0 },
            { src: iceSpikeAsset, width: 80, height: 70, spacingAfter: 0 }, 
            { src: iceCrystalAsset, width: 60, height: 50 },
          ]
        },
      ],
    },
    physics: {
      gravity: 2200,
      jumpForce: 900,
      baseSpeed: 270,
      playerGroundOffset: 15,
    },
    difficulty: {
      speedScaleIncrementPerSecond: 0.01,
      initialMinSpawnIntervalMs: 2000,
      initialMaxSpawnIntervalMs: 3800,
      minOverallSpawnIntervalMs: 600,
      obstacleIntervalSpeedFactor: 0.7,
    },
  },
  volcano: {
    assets: {
      background: volcanoBG,
      ground: volcanoGround,
      obstacles: [
        { type: 'single', src: volcanoRockAsset, width: 100, height: 75 },
        { type: 'single', src: lavaPuddleAsset, width: 120, height: 90 },
        { 
          type: 'group', 
          members: [
            { src: volcanoRockAsset, width: 70, height: 60, spacingAfter: 1 }, 
            { src: lavaPuddleAsset, width: 100, height: 75 },                       
          ]
        },
        {
          type: 'group',
          members: [
            { src: volcanoRockAsset, width: 60, height: 50, spacingAfter: 0},
            { src: lavaPuddleAsset, width: 80, height: 70, spacingAfter: 0}, 
            { src: lavaPuddleAsset, width: 70, height: 50 },
          ]
        },
      ],
    },
    physics: {
      gravity: 2300,
      jumpForce: 950,
      baseSpeed: 300,
      playerGroundOffset: 15,
    },
    difficulty: {
      speedScaleIncrementPerSecond: 0.012,
      initialMinSpawnIntervalMs: 1900,
      initialMaxSpawnIntervalMs: 3600,
      minOverallSpawnIntervalMs: 550,
      obstacleIntervalSpeedFactor: 0.65,
    },
  },
};

export interface MapComponentProps {
  theme: MapTheme;
  selectedPlayerRunFrames: string[];
  selectedPlayerJumpFrames: string[];
  onExitGame: () => void;
  selectedGolemId?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({
  theme,
  selectedPlayerRunFrames,
  selectedPlayerJumpFrames,
  onExitGame,
  selectedGolemId = 1,
}) => {
  if (!theme || !THEME_MAP_CONFIGS[theme]) {
    return <div className="text-center text-red-500">Invalid theme: {String(theme)}</div>;
  }

  const themeConfig = THEME_MAP_CONFIGS[theme];

  // Hooks for mission loading
  const { account } = useAccount();
  const { fetchTodayMissions } = useMissionQuery();
  
  const playerAddress = useMemo(() => 
    account ? addAddressPadding(account.address) : null, 
    [account]
  );

  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(() =>
    parseInt(localStorage.getItem(`golemRunner_${theme}_highscore`) || '0', 10)
  );
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameKey, setGameKey] = useState(Date.now());
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  
  // Game rewards hook
  const { 
    submitGameResults, 
    isProcessing: isProcessingReward, 
    error: rewardError, 
    txStatus: rewardTxStatus 
  } = useGameRewards();
  
  const [rewardSubmitted, setRewardSubmitted] = useState(false);
  
  // Mission completion hooks and state
  const {
    isCompleting: isMissionCompleting,
    error: missionError,
    completedMissions,
    checkAndCompleteMissions,
    clearCompletedMissions
  } = useMissionCompleter();
  
  const [missionCompletionSubmitted, setMissionCompletionSubmitted] = useState(false);
  const [missionsLoaded, setMissionsLoaded] = useState(false);
  
  // Store access
  const { currentGolem, missions: storeMissions, setMissions } = useAppStore();

  const coinReward = useCoinReward(currentScore);
  const worldId = useMemo(() => themeToWorldId(theme), [theme]);
  
  const currentGolemId = useMemo(() => {
    return currentGolem?.id || selectedGolemId || 1;
  }, [currentGolem, selectedGolemId]);

  // Load today's missions for mission completion validation
  const loadTodayMissions = useCallback(async () => {
    if (!playerAddress || missionsLoaded) return;
    
    try {
      const todayMissions = await fetchTodayMissions(playerAddress);
      
      if (todayMissions.length > 0) {
        setMissions(todayMissions);
        setMissionsLoaded(true);
      }
    } catch (error) {
      // Silently handle error - missions will be empty
      // User can still play, just won't complete missions
    }
  }, [playerAddress, missionsLoaded, fetchTodayMissions, setMissions]);

  // Load missions when player connects
  useEffect(() => {
    if (playerAddress) {
      loadTodayMissions();
    }
  }, [playerAddress, loadTodayMissions]);

  // Reset mission state when player changes
  useEffect(() => {
    setMissionsLoaded(false);
  }, [playerAddress]);

  useEffect(() => {
    const updateDimensions = () =>
      setCanvasDimensions({ width: window.innerWidth, height: window.innerHeight });

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#0D2930';

    return () => {
      window.removeEventListener('resize', updateDimensions);
      document.body.style.overflow = 'auto';
      document.body.style.background = '';
    };
  }, []);

  useEffect(() => {
    setHighScore(parseInt(localStorage.getItem(`golemRunner_${theme}_highscore`) || '0', 10));
  }, [theme]);
  
  // Handle mission completion after successful game rewards
  const handleMissionCompletion = useCallback(async (
    coinsCollected: number,
    worldId: number, 
    golemId: number
  ) => {
    if (missionCompletionSubmitted) return;

    // If no missions in store, try to load them
    if (storeMissions.length === 0) {
      try {
        await loadTodayMissions();
        // Wait for store to update
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        return;
      }
    }
    
    try {
      const gameData = {
        coinsCollected,
        worldId,
        golemId
      };
      
      await checkAndCompleteMissions(gameData);
      setMissionCompletionSubmitted(true);
      
    } catch (error) {
      // Silently handle mission completion errors
      // Game rewards are already processed successfully
    }
  }, [missionCompletionSubmitted, checkAndCompleteMissions, storeMissions.length, loadTodayMissions]);
  
  // Process game rewards and trigger mission completion
  useEffect(() => {
    if (showGameOverModal && !rewardSubmitted && currentScore > 0) {
      submitGameResults(currentScore, coinReward.coins, worldId)
        .then(result => {
          if (result.success) {
            setRewardSubmitted(true);
            handleMissionCompletion(coinReward.coins, worldId, currentGolemId);
          }
        });
    }
  }, [showGameOverModal, rewardSubmitted, currentScore, coinReward.coins, worldId, submitGameResults, currentGolemId, handleMissionCompletion]);

  const finalAssetsForGameCanvas: GameThemeAssets = useMemo(() => {
    const runFrames = selectedPlayerRunFrames.length > 0 ? selectedPlayerRunFrames : [];
    const jumpFrames = selectedPlayerJumpFrames.length > 0 ? selectedPlayerJumpFrames : [];

    if (runFrames.length === 0 || jumpFrames.length === 0) {
      console.warn(
        `MapComponent: Missing run or jump frames for theme '${theme}'. Check PlayScreen props.`
      );
    }

    return {
      background: themeConfig.assets.background,
      ground: themeConfig.assets.ground,
      obstacles: themeConfig.assets.obstacles,
      playerRunFrames: runFrames,
      playerJumpFrames: jumpFrames,
    };
  }, [theme, themeConfig, selectedPlayerRunFrames, selectedPlayerJumpFrames]);

  const handleGameOver = (finalScore: number) => {
    setCurrentScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem(`golemRunner_${theme}_highscore`, finalScore.toString());
    }
    setShowGameOverModal(true);
    setRewardSubmitted(false);
    setMissionCompletionSubmitted(false);
  };

  const handleCloseModal = useCallback(() => {
    setShowGameOverModal(false);
    setRewardSubmitted(false);
    setMissionCompletionSubmitted(false);
    clearCompletedMissions();
  }, [clearCompletedMissions]);

  const handleRestartGame = () => {
    handleCloseModal();
    setGameKey(Date.now());
  };

  const handleExitAndCloseModal = () => {
    handleCloseModal();
    onExitGame();
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-screen overflow-hidden">
      <GameCanvas
        key={gameKey}
        assetsConfig={finalAssetsForGameCanvas}
        physicsConfig={themeConfig.physics}
        difficultyConfig={themeConfig.difficulty}
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
          isProcessingReward={isProcessingReward}
          rewardError={rewardError}
          rewardTxStatus={rewardTxStatus}
          isMissionCompleting={isMissionCompleting}
          missionError={missionError}
          completedMissions={completedMissions}
          worldId={worldId}
          golemId={currentGolemId}
        />
      )}
    </div>
  );
};

export default MapComponent;