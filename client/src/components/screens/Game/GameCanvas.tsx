// src/components/game/GameCanvas.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StartModal } from './StartModal';
import {
  GameState,
  GameThemeAssets,
  GamePhysics, // Asegúrate que este tipo ahora use baseSpeed
  GameDifficultyConfig, // Asegúrate que este tipo ahora use speedScaleIncrementPerSecond y maxSpeedScale
  PlayerState,
  ObstacleInstance,
  MapTheme,
  SingleObstacleConfig,
  ObstacleGroupConfig, // Incluido por si acaso, aunque ObstacleInstance ya lo usa
} from '../../types/game'; // Ajusta la ruta si es necesario
import audioManager from './AudioManager'; // Ajusta la ruta si es necesario
import ScoreDisplay from './ScoreDisplay'; // Ajusta la ruta si es necesario
import GameOverModal from './GameOverModal';

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
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const speedScaleRef = useRef(1); // Multiplicador de velocidad, comienza en 1
  const currentActualSpeedRef = useRef(physicsConfig.baseSpeed); // Velocidad calculada: baseSpeed * speedScale

  const playerStateRef = useRef<PlayerState | null>(null);
  const obstaclesRef = useRef<ObstacleInstance[]>([]);
  const gameTimeRef = useRef(0);
  const lastObstacleTimeRef = useRef(0);
  const nextObstacleIntervalRef = useRef(0);
  const backgroundXRef = useRef(0);
  const groundXRef = useRef(0);
  const scoreRef = useRef<number>(0);
  const loadedGroundImgRef = useRef<HTMLImageElement | null>(null); // NUEVA REF para el suelo

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

    speedScaleRef.current = 1; // Resetear speedScale
    currentActualSpeedRef.current = physicsConfig.baseSpeed * speedScaleRef.current; // Recalcular velocidad actual

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
    setScore((prevScore) => {
      const updated = prevScore + actualSpeed * dt * 0.1;
      scoreRef.current = updated; // 👈 sincronizamos aquí
      return updated;
    });

    // 4. Mover fondo usando la velocidad actual
    if (loadedBackgroundImgRef.current) {
      const bgImg = loadedBackgroundImgRef.current;
      const bgDisplayHeight = canvasHeight; // Asumiendo que el fondo ocupa toda la altura
      const bgDisplayWidth = (bgImg.width / bgImg.height) * bgDisplayHeight;
  
      // AJUSTA ESTE FACTOR PARA LA VELOCIDAD DEL FONDO
      // 0 = Estático
      // 0.1 - 0.5 = Lento
      // 1 = Misma velocidad que el suelo (no es lo que quieres para parallax)
      const backgroundSpeedFactor = 0.2; // Ejemplo: fondo se mueve al 20% de la velocidad del juego
  
      backgroundXRef.current -= actualSpeed * backgroundSpeedFactor * dt;
      if (bgDisplayWidth > 0 && backgroundXRef.current <= -bgDisplayWidth) {
        backgroundXRef.current += bgDisplayWidth; // o backgroundXRef.current %= bgDisplayWidth;
      }
    }

    // NUEVO: Mover suelo
  if (loadedGroundImgRef.current) {
    const groundImg = loadedGroundImgRef.current;
    // Asumiendo que el suelo también se dibuja para que parezca continuo
    const groundDisplayHeight = canvasHeight * GROUND_HEIGHT_RATIO; // O la altura real de tu imagen de suelo
    const groundTileWidth = (groundImg.width / groundImg.height) * groundDisplayHeight; // Ancho de una "baldosa" de suelo si la imagen no es super ancha

    groundXRef.current -= actualSpeed * dt; // El suelo se mueve con la velocidad completa del juego
    if (groundTileWidth > 0 && groundXRef.current <= -groundTileWidth) {
      groundXRef.current += groundTileWidth; // o groundXRef.current %= groundTileWidth;
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

    // Elige una ObstacleConfig (puede ser Single u Group) al azar
    const randomObstacleOrGroupCfg = assetsConfig.obstacles[Math.floor(Math.random() * assetsConfig.obstacles.length)];

    let currentX = canvasWidth; // Posición X inicial para el primer obstáculo (o el único)

    if (randomObstacleOrGroupCfg.type === 'single') {
      // Es un solo obstáculo
      const obstacleCfg = randomObstacleOrGroupCfg as SingleObstacleConfig; // Type assertion
      const obstacleImageElement = loadedObstacleImageCacheRef.current.get(obstacleCfg.src);

      if (obstacleImageElement && obstacleImageElement.naturalHeight !== 0) {
        obstaclesRef.current.push({
          id: `obs-${Date.now()}-${Math.random()}`,
          baseConfig: obstacleCfg, // Guardamos la config base del obstáculo
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
      // Es un grupo de obstáculos
      const groupCfg = randomObstacleOrGroupCfg as ObstacleGroupConfig; // Type assertion

      for (let i = 0; i < groupCfg.members.length; i++) {
        const memberCfg = groupCfg.members[i];
        const obstacleImageElement = loadedObstacleImageCacheRef.current.get(memberCfg.src);

        if (obstacleImageElement && obstacleImageElement.naturalHeight !== 0) {
          obstaclesRef.current.push({
            id: `obs-${Date.now()}-${Math.random()}-${i}`, // ID único para cada miembro
            baseConfig: memberCfg, // Guardamos la config base del miembro
            imageElement: obstacleImageElement,
            x: currentX,
            y: groundY - memberCfg.height, // La altura puede variar por miembro
            width: memberCfg.width,
            height: memberCfg.height,
          });
          // Avanzar currentX para el siguiente obstáculo del grupo
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
    // loadedObstacleImageCacheRef.current no es una dependencia estable para useCallback,
    // pero la función createObstacle depende de su contenido.
    // Esto es un compromiso común con refs que contienen datos dinámicos.
    // Si loadedObstacleImageCacheRef se reconstruyera, este callback no se actualizaría
    // a menos que assetsCurrentlyLoaded o assetsConfig.obstacles cambien.
    // Podrías pasar loadedObstacleImageCacheRef.current como dependencia si cambia de forma controlada,
    // o aceptar que createObstacle siempre usa la versión más reciente de la ref.
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
    const widthRatio = 1 - paddingX * 2;  // 60%
    const heightRatio = 1 - paddingY * 2; // 60%

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
    // Ajustar estos valores de hitbox según sea necesario
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
        setFinalScore(final);
        setShowGameOverModal(true);
        onGameOver(final); 
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

      if (bgDisplayWidth > 0) { // Evitar bucle infinito si bgDisplayWidth es 0
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

    // Dibujar Suelo (Ground)
    if (loadedGroundImgRef.current) {
      const groundImg = loadedGroundImgRef.current;
  
      // Determinar la altura de dibujado para el suelo visual
      const groundDrawHeight = VISUAL_GROUND_DRAW_HEIGHT; // Usando la constante definida arriba
      // Si usas un ratio:
      // const groundDrawHeight = canvasHeight * VISUAL_GROUND_DRAW_HEIGHT_RATIO;
  
      // Posición Y para dibujar el suelo (su borde superior)
      // Esto lo alinea con la base del canvas.
      const groundYPos = canvasHeight - groundDrawHeight;
  
      // Calcular el ancho de "una baldosa" de la imagen del suelo para mantener su proporción original
      // al ser dibujada con la nueva groundDrawHeight.
      const groundImageAspectRatio = groundImg.naturalWidth / groundImg.naturalHeight;
      let groundTileWidth = groundDrawHeight * groundImageAspectRatio;
  
      // Asegurarse de que groundTileWidth sea positivo para evitar bucles infinitos o errores
      if (groundTileWidth <= 0) {
          groundTileWidth = groundImg.naturalWidth; // Fallback al ancho natural si el aspect ratio da problemas
      }
  
  
      let currentXGround = groundXRef.current;
      if (groundTileWidth > 0) {
          currentXGround %= groundTileWidth; // Asegura que currentXGround esté en el rango [-groundTileWidth, 0]
          if (currentXGround > 0) currentXGround -= groundTileWidth; // Corrección si es positivo después del módulo
      } else {
          currentXGround = 0; // Si groundTileWidth no es válido, no hay scroll
      }
  
  
      if (groundTileWidth > 0) {
        for (let x = currentXGround; x < canvasWidth; x += groundTileWidth) {
          ctx.drawImage(groundImg, x, groundYPos, groundTileWidth, groundDrawHeight);
        }
      } else {
          // Fallback si la imagen del suelo no se puede dimensionar (ej. no cargó o dimensiones inválidas)
          // Podrías dibujar un rectángulo de color como placeholder
          ctx.fillStyle = '#556B2F'; // Un color de suelo genérico (verde oscuro)
          ctx.fillRect(0, groundYPos, canvasWidth, groundDrawHeight);
      }
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
  
      {gameState === 'idle' && assetsCurrentlyLoaded && (
        <StartModal onStart={handleInteraction} />
      )}
  
      {gameState !== 'gameOver' && score > 0 && (
        <ScoreDisplay score={score} highScore={initialHighScore} />
      )}
  
      <GameOverModal
        score={finalScore}
        record={initialHighScore}
        isOpen={showGameOverModal}
        onExit={() => {
          setShowGameOverModal(false);
          onGameOver(finalScore);
        }}
        onRestart={() => {
          setShowGameOverModal(false);
          resetGame();
        }}
      />
    </div>
  );
  
};

export default GameCanvas;