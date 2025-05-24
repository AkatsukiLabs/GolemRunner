import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StartModal } from './StartModal';
import {
  GameState,
  GameThemeAssets,
  GamePhysics, 
  GameDifficultyConfig, 
  PlayerState,
  ObstacleInstance,
  MapTheme,
  SingleObstacleConfig,
  ObstacleGroupConfig, 
} from '../../types/game'; 
import audioManager from './AudioManager'; 
import ScoreDisplay from './ScoreDisplay';

interface GameCanvasProps {
  assetsConfig: GameThemeAssets;
  physicsConfig: GamePhysics; 
  difficultyConfig: GameDifficultyConfig;
  theme: MapTheme;
  onGameOver: (score: number) => void;
  initialHighScore: number;
  canvasWidth: number;
  canvasHeight: number;
}

const PLAYER_ANIMATION_FRAME_TIME = 80; // ms per frame
const VISUAL_GROUND_DRAW_HEIGHT = 190; 
const PLAYER_BASE_WIDTH = 150;
const PLAYER_BASE_HEIGHT = 170;
const GROUND_HEIGHT_RATIO = 0.15;

const loadImageElement = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (!src || src.trim() === "") {
      const placeholderImg = new Image(1, 1);
      placeholderImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      placeholderImg.onload = () => resolve(placeholderImg);
      placeholderImg.onerror = () => reject(new Error('Failed to load placeholder 1x1 image src'));
      return;
    }
    const img = new Image();
    img.src = src;
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

  const speedScaleRef = useRef(1); 
  const currentActualSpeedRef = useRef(physicsConfig.baseSpeed);

  const playerStateRef = useRef<PlayerState | null>(null);
  const obstaclesRef = useRef<ObstacleInstance[]>([]);
  const gameTimeRef = useRef(0);
  const lastObstacleTimeRef = useRef(0);
  const nextObstacleIntervalRef = useRef(0);
  const backgroundXRef = useRef(0);
  const groundXRef = useRef(0);
  const scoreRef = useRef<number>(0);
  const loadedGroundImgRef = useRef<HTMLImageElement | null>(null); 

  const loadedRunFramesRef = useRef<HTMLImageElement[]>([]);
  const loadedJumpFramesRef = useRef<HTMLImageElement[]>([]);
  const loadedBackgroundImgRef = useRef<HTMLImageElement | null>(null);
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
        const runFrames = await Promise.all(assetsConfig.playerRunFrames.map(src => loadImageElement(src)));
        const jumpFrames = await Promise.all(assetsConfig.playerJumpFrames.map(src => loadImageElement(src)));
        const bgImg = await loadImageElement(assetsConfig.background);
        const groundImg = await loadImageElement(assetsConfig.ground); 

        const allIndividualObstacleSrcs: string[] = [];
        assetsConfig.obstacles.forEach(config => {
          if (config.type === 'single') {
            allIndividualObstacleSrcs.push(config.src);
          } else if (config.type === 'group') {
            config.members.forEach(memberConfig => {
              allIndividualObstacleSrcs.push(memberConfig.src);
            });
          }
        });

        const uniqueObstacleSrcStrings = Array.from(new Set(allIndividualObstacleSrcs));

        const obstacleImagePromises = uniqueObstacleSrcStrings.map(srcString => loadImageElement(srcString));
        const loadedImageElements = await Promise.all(obstacleImagePromises);

        const newObstacleCache = new Map<string, HTMLImageElement>();
        uniqueObstacleSrcStrings.forEach((srcString, index) => {
          newObstacleCache.set(srcString, loadedImageElements[index]);
        });

        if (mounted) {
          loadedRunFramesRef.current = runFrames.filter(img => img.naturalHeight !== 0);
          loadedJumpFramesRef.current = jumpFrames.filter(img => img.naturalHeight !== 0);
          loadedBackgroundImgRef.current = bgImg.naturalHeight !== 0 ? bgImg : null;
          loadedGroundImgRef.current = groundImg.naturalHeight !== 0 ? groundImg : null;
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
  }, [assetsConfig]);

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
      frameCount: loadedRunFramesRef.current.length || 1,
      frameTime: PLAYER_ANIMATION_FRAME_TIME,
      currentFrameTime: 0,
    };
    obstaclesRef.current = [];
    setScore(0);
    scoreRef.current = 0;

    speedScaleRef.current = 1; 
    currentActualSpeedRef.current = physicsConfig.baseSpeed * speedScaleRef.current;

    gameTimeRef.current = 0;
    lastObstacleTimeRef.current = 0;
    nextObstacleIntervalRef.current =
      Math.random() * (difficultyConfig.initialMaxSpawnIntervalMs - difficultyConfig.initialMinSpawnIntervalMs) +
      difficultyConfig.initialMinSpawnIntervalMs;
    backgroundXRef.current = 0;
    groundXRef.current = 0;
    setGameState('idle');
    audioManager.stopBackgroundMusic();
  }, [
    assetsCurrentlyLoaded,
    canvasWidth,
    groundY,
    playerHeight,
    playerWidth,
    physicsConfig.baseSpeed,
    difficultyConfig.initialMinSpawnIntervalMs,
    difficultyConfig.initialMaxSpawnIntervalMs,
  ]);

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

    const touchStartHandler = (e: TouchEvent) => { e.preventDefault(); handleInteraction(); };
    const mouseDownHandler = (e: MouseEvent) => { e.preventDefault(); handleInteraction(); };
    const keyDownHandler = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); handleInteraction(); } };

    canvasElement.addEventListener('touchstart', touchStartHandler, { passive: false });
    canvasElement.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('keydown', keyDownHandler);
    return () => {
      canvasElement.removeEventListener('touchstart', touchStartHandler);
      canvasElement.removeEventListener('mousedown', mouseDownHandler);
      window.removeEventListener('keydown', keyDownHandler);
    };
  }, [handleInteraction, assetsCurrentlyLoaded]);

  const updateGame = useCallback((dt: number) => { 
    if (!playerStateRef.current || gameState !== 'playing') return;

    gameTimeRef.current += dt;

    // 1. update speedScale
    if (speedScaleRef.current < (difficultyConfig.maxSpeedScale ?? Infinity)) {
      speedScaleRef.current += difficultyConfig.speedScaleIncrementPerSecond * dt;
      if (difficultyConfig.maxSpeedScale) {
        speedScaleRef.current = Math.min(speedScaleRef.current, difficultyConfig.maxSpeedScale);
      }
    }

    // 2. Calculate actual speed
    currentActualSpeedRef.current = physicsConfig.baseSpeed * speedScaleRef.current;
    const actualSpeed = currentActualSpeedRef.current;

    // 3. Update score using actual speed
    setScore((prevScore) => {
      const updated = prevScore + actualSpeed * dt * 0.1;
      scoreRef.current = updated; 
      return updated;
    });

    // 4. Move background using current speed
    if (loadedBackgroundImgRef.current) {
      const bgImg = loadedBackgroundImgRef.current;
      const bgDisplayHeight = canvasHeight; // Asumiendo que el fondo ocupa toda la altura
      const bgDisplayWidth = (bgImg.width / bgImg.height) * bgDisplayHeight;
  
      // ADJUST THIS FACTOR FOR BACKGROUND SPEED
      // 0 = Static
      // 0.1 - 0.5 = Slow
      // 1 = Same speed as the ground (not ideal for parallax)
      const backgroundSpeedFactor = 0.2; // Example: background moves at 20% of the game speed
      
      backgroundXRef.current -= actualSpeed * backgroundSpeedFactor * dt;
      if (bgDisplayWidth > 0 && backgroundXRef.current <= -bgDisplayWidth) {
        backgroundXRef.current += bgDisplayWidth; // or backgroundXRef.current %= bgDisplayWidth;
      }
        }

        // Move ground
      if (loadedGroundImgRef.current) {
        const groundImg = loadedGroundImgRef.current;
        // Assuming the ground is also drawn to appear continuous
        const groundDisplayHeight = canvasHeight * GROUND_HEIGHT_RATIO; // Or the actual height of your ground image
        const groundTileWidth = (groundImg.width / groundImg.height) * groundDisplayHeight; // Width of a "tile" of ground if the image isn't super wide

        groundXRef.current -= actualSpeed * dt; // The ground moves at the full game speed
        if (groundTileWidth > 0 && groundXRef.current <= -groundTileWidth) {
      groundXRef.current += groundTileWidth; // or groundXRef.current %= groundTileWidth;
        }
      }

        // Player animation update
    const player = playerStateRef.current;
    if (player.frameCount > 0) {
      player.currentFrameTime += dt * 1000; 
      if (player.currentFrameTime >= player.frameTime) {
        player.currentFrame = (player.currentFrame + 1) % player.frameCount;
        player.currentFrameTime = 0;
      }
    }

    // Jumo logic
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

    // 5. Move obstacles and filter out those that go off-screen
    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x + obs.width > 0);
    obstaclesRef.current.forEach(obs => { obs.x -= actualSpeed * dt; });

    // 6. Obstacle spawning logic
    lastObstacleTimeRef.current += dt * 1000;
    if (lastObstacleTimeRef.current >= nextObstacleIntervalRef.current) {
      createObstacle();
      lastObstacleTimeRef.current = 0;

      const currentSpeedScale = speedScaleRef.current;
      const maxScale = difficultyConfig.maxSpeedScale || 2.5; 
      const speedFactor = Math.min(1, currentSpeedScale / maxScale); 

      const reductionFactor = difficultyConfig.obstacleIntervalSpeedFactor;
      const spawnMultiplier = Math.max(0.1, 1 - speedFactor * reductionFactor);

      const minSpawn = difficultyConfig.initialMinSpawnIntervalMs * spawnMultiplier;
      const maxSpawn = difficultyConfig.initialMaxSpawnIntervalMs * spawnMultiplier;

      const newInterval = Math.random() * (Math.max(difficultyConfig.minOverallSpawnIntervalMs, maxSpawn) - Math.max(difficultyConfig.minOverallSpawnIntervalMs, minSpawn)) +
        Math.max(difficultyConfig.minOverallSpawnIntervalMs, minSpawn);
      nextObstacleIntervalRef.current = newInterval;
    }
    checkCollisions();
  }, [
    gameState,
    physicsConfig.baseSpeed,
    physicsConfig.gravity,
    physicsConfig.jumpForce,
    difficultyConfig, 
    canvasHeight,
    groundY,
  ]);

  const createObstacle = useCallback(() => {
    if (assetsConfig.obstacles.length === 0 || !assetsCurrentlyLoaded) return;

    // Choose an ObstacleConfig (can be Single or Group) at random
    const randomObstacleOrGroupCfg = assetsConfig.obstacles[Math.floor(Math.random() * assetsConfig.obstacles.length)];

    let currentX = canvasWidth; // Initial X position for the first obstacle (or the only one)

    if (randomObstacleOrGroupCfg.type === 'single') {
      // It's a single obstacle
      const obstacleCfg = randomObstacleOrGroupCfg as SingleObstacleConfig; // Type assertion
      const obstacleImageElement = loadedObstacleImageCacheRef.current.get(obstacleCfg.src);

      if (obstacleImageElement && obstacleImageElement.naturalHeight !== 0) {
      obstaclesRef.current.push({
        id: `obs-${Date.now()}-${Math.random()}`,
        baseConfig: obstacleCfg, // Save the base config of the obstacle
        imageElement: obstacleImageElement,
        x: currentX,
        y: groundY - obstacleCfg.height,
        width: obstacleCfg.width,
        height: obstacleCfg.height,
      });
      } else {
      console.warn("Attempted to create single obstacle, but its image was not found or is invalid:", obstacleCfg.src);
      }
    } else if (randomObstacleOrGroupCfg.type === 'group') {
      // It's a group of obstacles
      const groupCfg = randomObstacleOrGroupCfg as ObstacleGroupConfig; // Type assertion

      for (let i = 0; i < groupCfg.members.length; i++) {
      const memberCfg = groupCfg.members[i];
      const obstacleImageElement = loadedObstacleImageCacheRef.current.get(memberCfg.src);

      if (obstacleImageElement && obstacleImageElement.naturalHeight !== 0) {
        obstaclesRef.current.push({
        id: `obs-${Date.now()}-${Math.random()}-${i}`, // Unique ID for each member
        baseConfig: memberCfg, // Save the base config of the member
        imageElement: obstacleImageElement,
        x: currentX,
        y: groundY - memberCfg.height, // Height may vary per member
        width: memberCfg.width,
        height: memberCfg.height,
        });
        // Advance currentX for the next obstacle in the group
        currentX += memberCfg.width + (memberCfg.spacingAfter ?? 0);
      } else {
        console.warn("Attempted to create group member obstacle, but its image was not found or is invalid:", memberCfg.src);
      }
      }
    }
    }, [
    assetsConfig.obstacles,
    assetsCurrentlyLoaded,
    canvasWidth,
    groundY,
    ]);

  function getPlayerCollider(player: PlayerState) {
    const leftPadding = 0.35;
    const topPadding = 0.15;
    const widthRatio = 0.35;
    const heightRatio = 0.7;
  
    return {
      x: player.x + player.width * leftPadding,
      y: player.y + player.height * topPadding,
      width: player.width * widthRatio,
      height: player.height * heightRatio,
    };
  }


  function getObstacleCollider(obs: ObstacleInstance) {
    const paddingX = 0.2;
    const paddingY = 0.2;
    const widthRatio = 1 - paddingX * 2;  
    const heightRatio = 1 - paddingY * 2; 

    return {
      x: obs.x + obs.width * paddingX,
      y: obs.y + obs.height * paddingY,
      width: obs.width * widthRatio,
      height: obs.height * heightRatio,
    };
  }

  const checkCollisions = useCallback(() => {
    if (!playerStateRef.current) return;
    const player = playerStateRef.current;
    const playerRect = getPlayerCollider(player);

    for (const obs of obstaclesRef.current) {
      const obsRect = getObstacleCollider(obs);
      if (playerRect.x < obsRect.x + obsRect.width &&
        playerRect.x + playerRect.width > obsRect.x &&
        playerRect.y < obsRect.y + obsRect.height &&
        playerRect.y + playerRect.height > obsRect.y) {
        setGameState('gameOver');
        audioManager.stopBackgroundMusic();
        audioManager.playGameOverSound();
        const final = Math.floor(scoreRef.current);
        onGameOver(final); 
        return;
      }
    }
  }, [score, onGameOver]);

  const drawGame = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw Background
    if (loadedBackgroundImgRef.current) {
      const bg = loadedBackgroundImgRef.current;
      const bgDisplayHeight = canvasHeight;
      const bgDisplayWidth = (bg.width / bg.height) * bgDisplayHeight;
      let currentX = backgroundXRef.current % bgDisplayWidth;
      // Ensure currentX is negative or zero for looping
      if (currentX > 0 && bgDisplayWidth > 0) currentX -= bgDisplayWidth;

      if (bgDisplayWidth > 0) { // Avoid infinite loop if bgDisplayWidth is 0
        while (currentX < canvasWidth) {
          ctx.drawImage(bg, currentX, 0, bgDisplayWidth, bgDisplayHeight);
          currentX += bgDisplayWidth;
        }
      } else { // Fallback if the background cannot be sized
        ctx.fillStyle = theme === 'ice' ? '#87CEEB' : theme === 'volcano' ? '#B22222' : '#3B8E59';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
    } else {
      ctx.fillStyle = theme === 'ice' ? '#87CEEB' : theme === 'volcano' ? '#B22222' : '#3B8E59';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Draw Ground
    if (loadedGroundImgRef.current) {
      const groundImg = loadedGroundImgRef.current;
  
      // Determine the visual draw height for the ground
      const groundDrawHeight = VISUAL_GROUND_DRAW_HEIGHT; // Using the constant defined above
      // If using a ratio:
      // const groundDrawHeight = canvasHeight * VISUAL_GROUND_DRAW_HEIGHT_RATIO;
  
      // Y position to draw the ground (its top edge)
      // This aligns it with the base of the canvas.
      const groundYPos = canvasHeight - groundDrawHeight;
  
      // Calculate the width of a "tile" of the ground image to maintain its original aspect ratio
      // when drawn with the new groundDrawHeight.
      const groundImageAspectRatio = groundImg.naturalWidth / groundImg.naturalHeight;
      let groundTileWidth = groundDrawHeight * groundImageAspectRatio;
  
      // Ensure groundTileWidth is positive to avoid infinite loops or errors
      if (groundTileWidth <= 0) {
          groundTileWidth = groundImg.naturalWidth; // Fallback to natural width if the aspect ratio causes issues
      }
  
      let currentXGround = groundXRef.current;
      if (groundTileWidth > 0) {
          currentXGround %= groundTileWidth; // Ensure currentXGround is in the range [-groundTileWidth, 0]
          if (currentXGround > 0) currentXGround -= groundTileWidth; // Correction if positive after modulo
      } else {
          currentXGround = 0; // If groundTileWidth is invalid, no scrolling
      }
  
      if (groundTileWidth > 0) {
        for (let x = currentXGround; x < canvasWidth; x += groundTileWidth) {
          ctx.drawImage(groundImg, x, groundYPos, groundTileWidth, groundDrawHeight);
        }
      } else {
          // Fallback if the ground image cannot be sized (e.g., it didn't load or has invalid dimensions)
          // You could draw a placeholder rectangle
          ctx.fillStyle = '#556B2F'; // A generic ground color (dark green)
          ctx.fillRect(0, groundYPos, canvasWidth, groundDrawHeight);
      }
    }

    // Draw Player
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

    // Draw Obstacles
    obstaclesRef.current.forEach(obs => {
      if (obs.imageElement && obs.imageElement.complete && obs.imageElement.naturalHeight !== 0) {
        ctx.drawImage(obs.imageElement, obs.x, obs.y, obs.width, obs.height);
      }
    });

    const DEBUG_COLLIDERS = false; // Change to true to see hitboxes

    if (DEBUG_COLLIDERS && playerStateRef.current) {
      const playerRectDebug = getPlayerCollider(playerStateRef.current);
      ctx.strokeStyle = 'green';
      ctx.lineWidth = 2;
      ctx.strokeRect(playerRectDebug.x, playerRectDebug.y, playerRectDebug.width, playerRectDebug.height);
    }

    if (DEBUG_COLLIDERS) {
      obstaclesRef.current.forEach(obs => {
        const obsRectDebug = getObstacleCollider(obs);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(obsRectDebug.x, obsRectDebug.y, obsRectDebug.width, obsRectDebug.height);
      });
    }
  }, [gameState, assetsCurrentlyLoaded, canvasWidth, canvasHeight, theme /*, playerStateRef, obstaclesRef, loadedRunFramesRef, loadedJumpFramesRef, loadedBackgroundImgRef, backgroundXRef ... */]);


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
      const dtSeconds = deltaTimeMs / 1000;

      if (gameState === 'playing') {
        updateGame(dtSeconds);
      }
      drawGame(ctx); // Always draw, even if idle or gameOver

      if (gameState !== 'gameOver') { // Continue the loop if not gameOver
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    if (gameState === 'playing' || gameState === 'idle') { // Start loop if playing or waiting to start
      animationFrameId = requestAnimationFrame(gameLoop);
    } else if (gameState === 'gameOver') { // If the state is gameOver at the start of this effect (e.g., after a quick restart)
      drawGame(ctx); // Draw the gameOver state once
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, assetsCurrentlyLoaded, updateGame, drawGame]);

  if (!assetsCurrentlyLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700 text-2xl p-4 text-center">
        Loading Game Assets...
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
      <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="block" />
  
      {gameState === 'idle' && assetsCurrentlyLoaded && (
        <StartModal onStart={handleInteraction} />
      )}
  
      {gameState !== 'gameOver' && score > 0 && (
        <ScoreDisplay score={score} highScore={initialHighScore} />
      )}
    </div>
  );
  
};

export default GameCanvas;