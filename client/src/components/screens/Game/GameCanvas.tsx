// src/components/game/GameCanvas.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  GameState,
  GameThemeAssets,
  GamePhysics, // Asegúrate que este tipo ahora use baseSpeed
  GameDifficultyConfig, // Asegúrate que este tipo ahora use speedScaleIncrementPerSecond y maxSpeedScale
  PlayerState,
  ObstacleInstance,
  MapTheme,
  ObstacleConfig, // Incluido por si acaso, aunque ObstacleInstance ya lo usa
} from '../../types/game'; // Ajusta la ruta si es necesario
import audioManager from './AudioManager'; // Ajusta la ruta si es necesario
import ScoreDisplay from './ScoreDisplay'; // Ajusta la ruta si es necesario

interface GameCanvasProps {
  assetsConfig: GameThemeAssets;
  physicsConfig: GamePhysics; // Debería contener baseSpeed
  difficultyConfig: GameDifficultyConfig; // Debería contener speedScaleIncrementPerSecond
  theme: MapTheme;
  onGameOver: (score: number) => void;
  initialHighScore: number;
  canvasWidth: number;
  canvasHeight: number;
}

const PLAYER_ANIMATION_FRAME_TIME = 80; // ms per frame
const PLAYER_BASE_WIDTH = 60;
const PLAYER_BASE_HEIGHT = 80;
const GROUND_HEIGHT_RATIO = 0.15;

const loadImageElement = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (!src || src.trim() === "") {
        const placeholderImg = new Image(1,1);
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

  const speedScaleRef = useRef(1); // Multiplicador de velocidad, comienza en 1
  const currentActualSpeedRef = useRef(physicsConfig.baseSpeed); // Velocidad calculada: baseSpeed * speedScale

  const playerStateRef = useRef<PlayerState | null>(null);
  const obstaclesRef = useRef<ObstacleInstance[]>([]);
  const gameTimeRef = useRef(0);
  const lastObstacleTimeRef = useRef(0);
  const nextObstacleIntervalRef = useRef(0);
  const backgroundXRef = useRef(0);

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
        
        const uniqueObstacleSrcStrings = Array.from(new Set(assetsConfig.obstacles.map(config => config.src)));
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

    speedScaleRef.current = 1; // Resetear speedScale
    currentActualSpeedRef.current = physicsConfig.baseSpeed * speedScaleRef.current; // Recalcular velocidad actual

    gameTimeRef.current = 0;
    lastObstacleTimeRef.current = 0;
    nextObstacleIntervalRef.current =
      Math.random() * (difficultyConfig.initialMaxSpawnIntervalMs - difficultyConfig.initialMinSpawnIntervalMs) +
      difficultyConfig.initialMinSpawnIntervalMs;
    backgroundXRef.current = 0;
    setGameState('idle');
    audioManager.stopBackgroundMusic();
  }, [
    assetsCurrentlyLoaded, 
    canvasWidth, 
    groundY, 
    playerHeight, 
    playerWidth, 
    physicsConfig.baseSpeed, // Usar baseSpeed
    difficultyConfig.initialMinSpawnIntervalMs, // Incluir todas las dependencias de difficultyConfig usadas
    difficultyConfig.initialMaxSpawnIntervalMs,
    // Asegúrate de incluir todas las dependencias de los hooks
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
    const keyDownHandler = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); handleInteraction(); }};

    canvasElement.addEventListener('touchstart', touchStartHandler, { passive: false });
    canvasElement.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('keydown', keyDownHandler);
    return () => {
      canvasElement.removeEventListener('touchstart', touchStartHandler);
      canvasElement.removeEventListener('mousedown', mouseDownHandler);
      window.removeEventListener('keydown', keyDownHandler);
    };
  }, [handleInteraction, assetsCurrentlyLoaded]);

  const updateGame = useCallback((dt: number) => { // ctx ya no es necesario como argumento si no se usa directamente
    if (!playerStateRef.current || gameState !== 'playing') return;
    
    gameTimeRef.current += dt;

    // 1. Actualizar speedScale
    if (speedScaleRef.current < (difficultyConfig.maxSpeedScale ?? Infinity)) {
      speedScaleRef.current += difficultyConfig.speedScaleIncrementPerSecond * dt;
      if (difficultyConfig.maxSpeedScale) {
        speedScaleRef.current = Math.min(speedScaleRef.current, difficultyConfig.maxSpeedScale);
      }
    }

    // 2. Calcular la velocidad actual real
    currentActualSpeedRef.current = physicsConfig.baseSpeed * speedScaleRef.current;
    const actualSpeed = currentActualSpeedRef.current;

    // Log para depuración (opcional)
    // console.log(`[GameCanvas] speedScale: ${speedScaleRef.current.toFixed(3)}, actualSpeed: ${actualSpeed.toFixed(2)}`);

    // 3. Actualizar puntuación usando la velocidad actual
    setScore((prevScore) => prevScore + actualSpeed * dt * 0.1);

    // 4. Mover fondo usando la velocidad actual
    if (loadedBackgroundImgRef.current) {
        const bgImg = loadedBackgroundImgRef.current;
        const bgDisplayHeight = canvasHeight;
        const bgDisplayWidth = (bgImg.width / bgImg.height) * bgDisplayHeight;
        backgroundXRef.current -= actualSpeed * dt;
        if (backgroundXRef.current <= -bgDisplayWidth) {
            backgroundXRef.current += bgDisplayWidth; // o backgroundXRef.current %= bgDisplayWidth; si es siempre negativo
        }
    }

    // Actualización de animación del jugador
    const player = playerStateRef.current;
    if (player.frameCount > 0) {
        player.currentFrameTime += dt * 1000; // dt a ms
        if (player.currentFrameTime >= player.frameTime) {
          player.currentFrame = (player.currentFrame + 1) % player.frameCount;
          player.currentFrameTime = 0;
        }
    }

    // Lógica de salto
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

    // 5. Mover obstáculos y filtrar los que salen de pantalla
    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x + obs.width > 0);
    obstaclesRef.current.forEach(obs => { obs.x -= actualSpeed * dt; });

    // 6. Lógica de aparición de obstáculos
    lastObstacleTimeRef.current += dt * 1000; // dt a ms
    if (lastObstacleTimeRef.current >= nextObstacleIntervalRef.current) {
      createObstacle();
      lastObstacleTimeRef.current = 0;
      
      const currentSpeedScale = speedScaleRef.current;
      const maxScale = difficultyConfig.maxSpeedScale || 2.5; // Usar un default si no está definido
      const speedFactor = Math.min(1, currentSpeedScale / maxScale); // Normalizar speedScale (0 a 1), asegurando que no pase de 1
      
      const reductionFactor = difficultyConfig.obstacleIntervalSpeedFactor;
      // Asegurar que el factor de reducción no invierta los intervalos
      const spawnMultiplier = Math.max(0.1, 1 - speedFactor * reductionFactor); // Evitar que sea 0 o negativo

      const minSpawn = difficultyConfig.initialMinSpawnIntervalMs * spawnMultiplier;
      const maxSpawn = difficultyConfig.initialMaxSpawnIntervalMs * spawnMultiplier;
      
      const newInterval = Math.random() * (Math.max(difficultyConfig.minOverallSpawnIntervalMs, maxSpawn) - Math.max(difficultyConfig.minOverallSpawnIntervalMs, minSpawn)) + 
        Math.max(difficultyConfig.minOverallSpawnIntervalMs, minSpawn);
      
      // console.log(`[GameCanvas] New obstacle interval: ${newInterval.toFixed(0)}ms (actualSpeed: ${actualSpeed.toFixed(2)}, speedScale: ${currentSpeedScale.toFixed(2)}, speedFactor: ${speedFactor.toFixed(2)})`);
      nextObstacleIntervalRef.current = newInterval;
    }
    checkCollisions();
  }, [
      gameState, 
      physicsConfig.baseSpeed, 
      physicsConfig.gravity, 
      physicsConfig.jumpForce,
      difficultyConfig, // Dependencia completa de difficultyConfig
      canvasHeight, 
      groundY,
      // playerHeight ya está en groundY, pero por claridad
  ]);
  
  const createObstacle = useCallback(() => {
    if (assetsConfig.obstacles.length === 0 || !assetsCurrentlyLoaded) return;

    const randomObstacleCfg = assetsConfig.obstacles[Math.floor(Math.random() * assetsConfig.obstacles.length)];
    const obstacleImageElement = loadedObstacleImageCacheRef.current.get(randomObstacleCfg.src);

    if (obstacleImageElement && obstacleImageElement.naturalHeight !== 0) {
      obstaclesRef.current.push({
        id: `obs-${Date.now()}-${Math.random()}`,
        config: randomObstacleCfg,
        imageElement: obstacleImageElement,
        x: canvasWidth,
        y: groundY - randomObstacleCfg.height,
        width: randomObstacleCfg.width,
        height: randomObstacleCfg.height,
      });
    } else {
      console.warn("Attempted to create obstacle, but its image was not found in cache or is invalid:", randomObstacleCfg.src);
    }
  }, [assetsConfig.obstacles, assetsCurrentlyLoaded, canvasWidth, groundY /* ... loadedObstacleImageCacheRef ... */]);

  const checkCollisions = useCallback(() => {
    if (!playerStateRef.current) return;
    const player = playerStateRef.current;
    // Ajustar estos valores de hitbox según sea necesario
    const playerRect = { x: player.x + player.width * 0.15, y: player.y + player.height * 0.1, width: player.width * 0.7, height: player.height * 0.8 };
    
    for (const obs of obstaclesRef.current) {
      const obsRect = { x: obs.x + obs.width * 0.1, y: obs.y + obs.height * 0.1, width: obs.width * 0.8, height: obs.height * 0.8 };
      if (playerRect.x < obsRect.x + obsRect.width &&
        playerRect.x + playerRect.width > obsRect.x &&
        playerRect.y < obsRect.y + obsRect.height &&
        playerRect.y + playerRect.height > obsRect.y) {
        setGameState('gameOver');
        audioManager.stopBackgroundMusic();
        audioManager.playGameOverSound();
        onGameOver(score); // score es el estado de React, ya está actualizado
        return;
      }
    }
  }, [score, onGameOver /* playerStateRef, obstaclesRef ... */]);

  const drawGame = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Dibujar Fondo
    if (loadedBackgroundImgRef.current) {
      const bg = loadedBackgroundImgRef.current;
      const bgDisplayHeight = canvasHeight;
      const bgDisplayWidth = (bg.width / bg.height) * bgDisplayHeight;
      let currentX = backgroundXRef.current % bgDisplayWidth;
      // Asegurar que currentX sea negativo o cero para el bucle
      if (currentX > 0 && bgDisplayWidth > 0) currentX -= bgDisplayWidth; 
      
      if(bgDisplayWidth > 0){ // Evitar bucle infinito si bgDisplayWidth es 0
          while (currentX < canvasWidth) {
            ctx.drawImage(bg, currentX, 0, bgDisplayWidth, bgDisplayHeight);
            currentX += bgDisplayWidth;
          }
      } else { // Fallback si el fondo no se puede dimensionar
        ctx.fillStyle = theme === 'ice' ? '#87CEEB' : theme === 'volcano' ? '#B22222' : '#3B8E59';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
    } else {
        ctx.fillStyle = theme === 'ice' ? '#87CEEB' : theme === 'volcano' ? '#B22222' : '#3B8E59';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Dibujar Jugador
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
    
    // Dibujar Obstáculos
    obstaclesRef.current.forEach(obs => {
      if (obs.imageElement && obs.imageElement.complete && obs.imageElement.naturalHeight !== 0) {
        ctx.drawImage(obs.imageElement, obs.x, obs.y, obs.width, obs.height);
      }
    });

    const DEBUG_COLLIDERS = false; // Cambia a true para ver hitboxes

    if (DEBUG_COLLIDERS && playerStateRef.current) {
      const player = playerStateRef.current;
      const playerRectDebug = { 
        x: player.x + player.width * 0.15,
        y: player.y + player.height * 0.1,
        width: player.width * 0.7,
        height: player.height * 0.8,
      };
      ctx.strokeStyle = 'green';
      ctx.lineWidth = 2;
      ctx.strokeRect(playerRectDebug.x, playerRectDebug.y, playerRectDebug.width, playerRectDebug.height);
    }

    if (DEBUG_COLLIDERS) {
      obstaclesRef.current.forEach(obs => {
        const obsRectDebug = { 
          x: obs.x + obs.width * 0.1,
          y: obs.y + obs.height * 0.1,
          width: obs.width * 0.8,
          height: obs.height * 0.8,
        };
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(obsRectDebug.x, obsRectDebug.y, obsRectDebug.width, obsRectDebug.height);
      });
    }

    // Mensaje de "Tap to Start"
    if (gameState === 'idle' && assetsCurrentlyLoaded) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(canvasWidth * 0.5 - 150, canvasHeight * 0.5 - 40, 300, 80);
      ctx.font = "bold 32px 'Luckiest Guy', cursive"; // Asegúrate que esta fuente esté cargada
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText("Tap to Start", canvasWidth * 0.5, canvasHeight * 0.5 + 10);
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
      drawGame(ctx); // Dibujar siempre, incluso si está en idle o gameOver
      
      if (gameState !== 'gameOver') { // Continuar el bucle si no es gameOver
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    if (gameState === 'playing' || gameState === 'idle') { // Iniciar bucle si jugando o esperando inicio
        animationFrameId = requestAnimationFrame(gameLoop);
    } else if (gameState === 'gameOver') { // Si el estado es gameOver al inicio de este efecto (ej. después de un reinicio rápido)
        drawGame(ctx); // Dibujar el estado de gameOver una vez
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
      {(gameState === 'playing' || gameState === 'gameOver' || (gameState === 'idle' && score > 0)) && (
        <ScoreDisplay score={score} highScore={initialHighScore} />
      )}
    </div>
  );
};

export default GameCanvas;