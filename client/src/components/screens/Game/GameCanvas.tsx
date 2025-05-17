// src/components/game/GameCanvas.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  GameState,
  GameThemeAssets, // Using the updated type for assets configuration
  GamePhysics,
  GameDifficultyConfig,
  PlayerState,
  ObstacleInstance, // Using the updated type for obstacle instances
  MapTheme,
} from '../../types/game';
import audioManager from './AudioManager';
import ScoreDisplay from './ScoreDisplay';

interface GameCanvasProps {
  assetsConfig: GameThemeAssets; // Receives config with imported image source strings
  physicsConfig: GamePhysics;
  difficultyConfig: GameDifficultyConfig;
  theme: MapTheme;
  onGameOver: (score: number) => void;
  initialHighScore: number;
  canvasWidth: number;
  canvasHeight: number;
}

const PLAYER_ANIMATION_FRAME_TIME = 80; // ms per frame
const PLAYER_BASE_WIDTH = 60; // Adjust to your Golem sprite art
const PLAYER_BASE_HEIGHT = 80; // Adjust to your Golem sprite art
const GROUND_HEIGHT_RATIO = 0.15;

// Helper to load an image from an imported source string
const loadImageElement = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (!src || src.trim() === "") {
        const placeholderImg = new Image(1,1); // 1x1 transparent pixel
        placeholderImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        placeholderImg.onload = () => resolve(placeholderImg); // Resolve with placeholder
        placeholderImg.onerror = () => reject(new Error('Failed to load placeholder 1x1 image src')); // Should not happen for dataURL
        return;
    }
    const img = new Image();
    img.src = src; // src is now the result of an import statement (a path string)
    img.onload = () => resolve(img);
    img.onerror = (errEvent) => {
      console.error(`GameCanvas: Failed to load image from src: ${src}`, errEvent);
      reject(new Error(`Failed to load image: ${src}`));
    };
  });
};

const GameCanvas: React.FC<GameCanvasProps> = ({
  assetsConfig,
  physicsConfig,
  difficultyConfig,
  theme,
  onGameOver,
  initialHighScore,
  canvasWidth,
  canvasHeight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(physicsConfig.initialSpeed);

  const playerStateRef = useRef<PlayerState | null>(null);
  const obstaclesRef = useRef<ObstacleInstance[]>([]); // Array of ObstacleInstance
  const gameTimeRef = useRef(0);
  const lastObstacleTimeRef = useRef(0);
  const nextObstacleIntervalRef = useRef(0);
  const backgroundXRef = useRef(0);

  // Store loaded HTMLImageElement instances
  const loadedRunFramesRef = useRef<HTMLImageElement[]>([]);
  const loadedJumpFramesRef = useRef<HTMLImageElement[]>([]);
  const loadedBackgroundImgRef = useRef<HTMLImageElement | null>(null);
  // Store loaded obstacle images, mapped by their original source string for lookup
  const loadedObstacleImageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [assetsCurrentlyLoaded, setAssetsCurrentlyLoaded] = useState(false);

  const groundY = canvasHeight * (1 - GROUND_HEIGHT_RATIO) - (physicsConfig.playerGroundOffset || 0);
  const playerWidth = PLAYER_BASE_WIDTH;
  const playerHeight = PLAYER_BASE_HEIGHT;

  useEffect(() => {
    let mounted = true;
    setAssetsCurrentlyLoaded(false);

    const loadAllGameAssets = async () => {
      try {
        // Load player frames
        const runFrames = await Promise.all(assetsConfig.playerRunFrames.map(src => loadImageElement(src)));
        const jumpFrames = await Promise.all(assetsConfig.playerJumpFrames.map(src => loadImageElement(src)));
        
        // Load background
        const bgImg = await loadImageElement(assetsConfig.background);
        
        // Load all unique obstacle images specified in assetsConfig.obstacles (which is string[])
        const uniqueObstacleSrcs = Array.from(new Set(assetsConfig.obstacles));
        const obstacleImagePromises = uniqueObstacleSrcs.map(src => loadImageElement(src));
        const loadedObstacles = await Promise.all(obstacleImagePromises);

        const newObstacleCache = new Map<string, HTMLImageElement>();
        uniqueObstacleSrcs.forEach((src, index) => {
          newObstacleCache.set(src, loadedObstacles[index]);
        });

        if (mounted) {
          loadedRunFramesRef.current = runFrames.filter(img => img.naturalHeight !== 0); // Filter out failed placeholders
          loadedJumpFramesRef.current = jumpFrames.filter(img => img.naturalHeight !== 0);
          loadedBackgroundImgRef.current = bgImg.naturalHeight !== 0 ? bgImg : null;
          loadedObstacleImageCacheRef.current = newObstacleCache;
          
          if (loadedRunFramesRef.current.length === 0 && assetsConfig.playerRunFrames.length > 0) {
            console.error("GameCanvas: Failed to load ANY player run frames.");
          }
          setAssetsCurrentlyLoaded(true);
        }
      } catch (error) {
        console.error("GameCanvas: Critical error loading visual assets:", error);
        if (mounted) setAssetsCurrentlyLoaded(false);
      }
    };

    loadAllGameAssets();
    return () => { mounted = false; };
  }, [assetsConfig]); // Reload assets if config changes

  const resetGame = useCallback(() => {
    if (!assetsCurrentlyLoaded) return;

    playerStateRef.current = {
      x: canvasWidth * 0.15,
      y: groundY - playerHeight,
      width: playerWidth,
      height: playerHeight,
      velocityY: 0,
      isJumping: false,
      currentFrame: 0,
      frameCount: loadedRunFramesRef.current.length || 1, // Avoid division by zero if no frames
      frameTime: PLAYER_ANIMATION_FRAME_TIME,
      currentFrameTime: 0,
    };
    obstaclesRef.current = [];
    setScore(0);
    setCurrentSpeed(physicsConfig.initialSpeed);
    gameTimeRef.current = 0;
    lastObstacleTimeRef.current = 0;
    nextObstacleIntervalRef.current =
      Math.random() * (difficultyConfig.initialMaxSpawnIntervalMs - difficultyConfig.initialMinSpawnIntervalMs) +
      difficultyConfig.initialMinSpawnIntervalMs;
    backgroundXRef.current = 0;
    setGameState('idle');
    audioManager.stopBackgroundMusic();
  }, [assetsCurrentlyLoaded, canvasWidth, groundY, playerHeight, playerWidth, physicsConfig, difficultyConfig]);

  useEffect(() => {
    if (assetsCurrentlyLoaded) resetGame();
  }, [assetsCurrentlyLoaded, resetGame]);

  const handleInteraction = useCallback(() => {
    if (!assetsCurrentlyLoaded) return;
    if (gameState === 'idle') {
      setGameState('playing');
      audioManager.playBackgroundMusic();
    } else if (gameState === 'playing' && playerStateRef.current && !playerStateRef.current.isJumping) {
      playerStateRef.current.isJumping = true;
      playerStateRef.current.velocityY = -physicsConfig.jumpForce;
      playerStateRef.current.currentFrame = 0;
      playerStateRef.current.currentFrameTime = 0;
      playerStateRef.current.frameCount = loadedJumpFramesRef.current.length || 1;
      audioManager.playJumpSound();
    }
  }, [gameState, assetsCurrentlyLoaded, physicsConfig.jumpForce]);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement || !assetsCurrentlyLoaded) return;
    canvasElement.addEventListener('touchstart', handleInteraction, { passive: true });
    canvasElement.addEventListener('mousedown', handleInteraction);
    const handleKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); handleInteraction(); }};
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      canvasElement.removeEventListener('touchstart', handleInteraction);
      canvasElement.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleInteraction, assetsCurrentlyLoaded]);

  useEffect(() => {
    if (!assetsCurrentlyLoaded || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    const gameLoop = (currentTime: number) => {
      const deltaTimeMs = currentTime - lastTime;
      lastTime = currentTime;
      if (gameState === 'playing') updateGame(deltaTimeMs / 1000, ctx); // dt in seconds
      drawGame(ctx);
      if (gameState !== 'gameOver') animationFrameId = requestAnimationFrame(gameLoop);
    };
    if (gameState === 'playing' || gameState === 'idle') animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, assetsCurrentlyLoaded, canvasWidth, canvasHeight, difficultyConfig, physicsConfig]);


  const updateGame = (dt: number, ctx: CanvasRenderingContext2D) => { // dt is in seconds
    if (!playerStateRef.current) return;
    gameTimeRef.current += dt;
    setScore((prevScore) => prevScore + currentSpeed * dt * 0.1);
    setCurrentSpeed((prevSpeed) => {
      const maxSpeed = difficultyConfig.maxSpeed ?? Infinity;
      return Math.min(maxSpeed, prevSpeed + difficultyConfig.speedIncrement * dt);
    });

    if (loadedBackgroundImgRef.current) {
        const bgImg = loadedBackgroundImgRef.current;
        const bgDisplayHeight = canvasHeight;
        const bgDisplayWidth = (bgImg.width / bgImg.height) * bgDisplayHeight;
        backgroundXRef.current -= currentSpeed * dt;
        if (backgroundXRef.current <= -bgDisplayWidth) {
            backgroundXRef.current += bgDisplayWidth;
        }
    }


    const player = playerStateRef.current;
    if (player.frameCount > 0) { // Only animate if there are frames
        player.currentFrameTime += dt * 1000; // dt to ms
        if (player.currentFrameTime >= player.frameTime) {
        player.currentFrame = (player.currentFrame + 1) % player.frameCount;
        player.currentFrameTime = 0;
        }
    }


    if (player.isJumping) {
      player.y += player.velocityY * dt;
      player.velocityY += physicsConfig.gravity * dt;
      if (player.y >= groundY - player.height) {
        player.y = groundY - player.height;
        player.isJumping = false;
        player.velocityY = 0;
        player.currentFrame = 0;
        player.currentFrameTime = 0;
        player.frameCount = loadedRunFramesRef.current.length || 1;
      }
    }

    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x + obs.width > 0);
    obstaclesRef.current.forEach(obs => { obs.x -= currentSpeed * dt; });

    lastObstacleTimeRef.current += dt * 1000; // dt to ms
    if (lastObstacleTimeRef.current >= nextObstacleIntervalRef.current) {
      createObstacle();
      lastObstacleTimeRef.current = 0;
      const speedFactor = currentSpeed / (difficultyConfig.maxSpeed || (physicsConfig.initialSpeed * 2.5)); // Normalized speed factor (0 to 1)
      const reductionFactor = difficultyConfig.obstacleIntervalSpeedFactor; // How much speed reduces interval
      const minSpawn = difficultyConfig.initialMinSpawnIntervalMs * (1 - speedFactor * reductionFactor);
      const maxSpawn = difficultyConfig.initialMaxSpawnIntervalMs * (1 - speedFactor * reductionFactor);
      nextObstacleIntervalRef.current = Math.random() * (Math.max(difficultyConfig.minOverallSpawnIntervalMs, maxSpawn) - Math.max(difficultyConfig.minOverallSpawnIntervalMs, minSpawn)) + Math.max(difficultyConfig.minOverallSpawnIntervalMs, minSpawn);
    }
    checkCollisions();
  };

  const createObstacle = () => {
    if (assetsConfig.obstacles.length === 0) return;
    const randomObstacleSrc = assetsConfig.obstacles[Math.floor(Math.random() * assetsConfig.obstacles.length)];
    const obstacleImage = loadedObstacleImageCacheRef.current.get(randomObstacleSrc);

    if (obstacleImage && obstacleImage.naturalHeight !== 0) { // Image is loaded and valid
      obstaclesRef.current.push({
        id: `obs-${Date.now()}-${Math.random()}`,
        imageSrc: randomObstacleSrc,
        x: canvasWidth,
        y: groundY - obstacleImage.naturalHeight, // Use natural height for y-pos
        width: obstacleImage.naturalWidth,       // Use natural width
        height: obstacleImage.naturalHeight,     // Use natural height
      });
    } else {
        console.warn("Attempted to create obstacle with unloaded or invalid image:", randomObstacleSrc);
    }
  };

  const checkCollisions = () => {
    if (!playerStateRef.current) return;
    const player = playerStateRef.current;
    const playerRect = { x: player.x + player.width * 0.15, y: player.y + player.height * 0.1, width: player.width * 0.7, height: player.height * 0.8 };
    for (const obs of obstaclesRef.current) {
      const obsRect = { x: obs.x + obs.width * 0.1, y: obs.y + obs.height * 0.1, width: obs.width * 0.8, height: obs.height * 0.8 };
      if (playerRect.x < obsRect.x + obsRect.width && playerRect.x + playerRect.width > obsRect.x && playerRect.y < obsRect.y + obsRect.height && playerRect.y + playerRect.height > obsRect.y) {
        setGameState('gameOver');
        audioManager.stopBackgroundMusic();
        audioManager.playGameOverSound();
        onGameOver(score);
        return;
      }
    }
  };

  const drawGame = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (loadedBackgroundImgRef.current) {
      const bg = loadedBackgroundImgRef.current;
      const bgDisplayHeight = canvasHeight;
      const bgDisplayWidth = (bg.width / bg.height) * bgDisplayHeight;
      let currentX = backgroundXRef.current % bgDisplayWidth;
      if (currentX > 0) currentX -= bgDisplayWidth;
      while (currentX < canvasWidth) {
        ctx.drawImage(bg, currentX, 0, bgDisplayWidth, bgDisplayHeight);
        currentX += bgDisplayWidth;
      }
    } else {
        ctx.fillStyle = theme === 'ice' ? '#87CEEB' : theme === 'volcano' ? '#B22222' : '#3B8E59'; // Brighter defaults
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    if (playerStateRef.current) {
      const player = playerStateRef.current;
      const framesToUse = player.isJumping ? loadedJumpFramesRef.current : loadedRunFramesRef.current;
      if (framesToUse.length > 0 && player.frameCount > 0) {
        const currentFrameImage = framesToUse[player.currentFrame % framesToUse.length];
        if (currentFrameImage && currentFrameImage.complete && currentFrameImage.naturalHeight !== 0) {
          ctx.drawImage(currentFrameImage, player.x, player.y, player.width, player.height);
        }
      }
    }
    
    obstaclesRef.current.forEach(obs => {
      const obstacleImage = loadedObstacleImageCacheRef.current.get(obs.imageSrc);
      if (obstacleImage && obstacleImage.complete && obstacleImage.naturalHeight !== 0) {
        ctx.drawImage(obstacleImage, obs.x, obs.y, obs.width, obs.height);
      }
    });

    if (gameState === 'idle' && assetsCurrentlyLoaded) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(canvasWidth * 0.5 - 150, canvasHeight * 0.5 - 40, 300, 80);
      ctx.font = "bold 32px 'Luckiest Guy', cursive";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText("Tap to Start", canvasWidth * 0.5, canvasHeight * 0.5 + 10);
    }
  };

  if (!assetsCurrentlyLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-screen text-cream font-luckiest text-2xl p-4 text-center">
        Loading Game Assets... <br/> Make sure all images are in your /public folder or handled by your bundler.
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
      <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="block" />
      {(gameState === 'playing' || gameState === 'gameOver' || (gameState === 'idle' && score > 0)) && (
        <ScoreDisplay score={score} highScore={initialHighScore} />
      )}
    </div>
  );
};

export default GameCanvas;