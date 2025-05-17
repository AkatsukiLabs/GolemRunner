// src/components/game/GameCanvas.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  GameState,
  GameAssets,
  GamePhysics,
  GameDifficulty,
  PlayerState,
  ObstacleState,
  ObstacleVariant,
  MapTheme
} from '../../types/game';
import audioManager from './AudioManager';

interface GameCanvasProps {
  assets: GameAssets;
  physics: GamePhysics;
  difficulty: GameDifficulty;
  theme: MapTheme;
  onGameOver: (score: number) => void;
  initialHighScore: number;
  canvasWidth: number; // Ancho del canvas (e.g., window.innerWidth)
  canvasHeight: number; // Alto del canvas (e.g., window.innerHeight)
}

// Constantes del juego (algunas podrían venir de props o ser ajustadas)
const PLAYER_ANIMATION_FRAME_TIME = 80; // ms por frame de animación del jugador (1000ms / 12fps ~ 83ms)
const PLAYER_BASE_WIDTH = 50; // Ancho base del jugador, se puede escalar
const PLAYER_BASE_HEIGHT = 70; // Alto base del jugador, se puede escalar
const GROUND_HEIGHT_RATIO = 0.15; // Proporción de la altura del canvas para el suelo (invisible)

const GameCanvas: React.FC<GameCanvasProps> = ({
  assets,
  physics,
  difficulty,
  theme,
  onGameOver,
  initialHighScore,
  canvasWidth,
  canvasHeight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(physics.initialSpeed);

  // Refs para estados mutables que no disparan re-renderizado en el bucle
  const playerStateRef = useRef<PlayerState | null>(null);
  const obstaclesRef = useRef<ObstacleState[]>([]);
  const gameTimeRef = useRef(0); // Tiempo total del juego
  const lastObstacleTimeRef = useRef(0);
  const nextObstacleIntervalRef = useRef(0);
  const backgroundXRef = useRef(0);

  // Refs para imágenes precargadas
  const playerRunImagesRef = useRef<HTMLImageElement[]>([]);
  const playerJumpImagesRef = useRef<HTMLImageElement[]>([]);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const obstacleImagesRef = useRef<Record<ObstacleVariant, HTMLImageElement>>({} as Record<ObstacleVariant, HTMLImageElement>);

  const groundY = canvasHeight * (1 - GROUND_HEIGHT_RATIO) - (physics.playerGroundOffset || 0);
  const playerWidth = PLAYER_BASE_WIDTH; // Ajustar si es necesario escalado
  const playerHeight = PLAYER_BASE_HEIGHT;


  // --- Pre-carga de Assets ---
  useEffect(() => {
    let mounted = true;
    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(`Failed to load image: ${src} - ${err}`);
      });

    const loadAllAssets = async () => {
      try {
        // Player run frames
        const runFrames = await Promise.all(assets.playerRunFrames.map(loadImage));
        if (mounted) playerRunImagesRef.current = runFrames;

        // Player jump frames
        const jumpFrames = await Promise.all(assets.playerJumpFrames.map(loadImage));
        if (mounted) playerJumpImagesRef.current = jumpFrames;
        
        // Background
        const bgImg = await loadImage(assets.background);
        if (mounted) backgroundImageRef.current = bgImg;

        // Obstacles
        const loadedObstacleImages: Record<ObstacleVariant, HTMLImageElement> = {} as Record<ObstacleVariant, HTMLImageElement>;
        for (const key of Object.keys(assets.obstacles) as ObstacleVariant[]) {
          const assetInfo = assets.obstacles[key];
          if (assetInfo) { // Chequeo extra
             loadedObstacleImages[key] = await loadImage(assetInfo.src);
          }
        }
        if (mounted) obstacleImagesRef.current = loadedObstacleImages;
        
        console.log('All assets loaded');
        if (mounted) resetGame(); // Resetear el juego una vez que los assets estén listos

      } catch (error) {
        console.error("Error loading assets:", error);
        // Podrías manejar un estado de error aquí
      }
    };

    loadAllAssets();
    return () => { mounted = false; };
  }, [assets, canvasWidth, canvasHeight]); // Recargar si cambian los assets o dimensiones

  // --- Lógica de Reseteo del Juego ---
  const resetGame = useCallback(() => {
    console.log("Resetting game state");
    // Posición inicial del jugador
    playerStateRef.current = {
      x: canvasWidth * 0.15,
      y: groundY - playerHeight,
      width: playerWidth,
      height: playerHeight,
      velocityY: 0,
      isJumping: false,
      currentFrame: 0,
      frameCount: assets.playerRunFrames.length,
      frameTime: PLAYER_ANIMATION_FRAME_TIME,
      currentFrameTime: 0,
    };
    obstaclesRef.current = [];
    setScore(0);
    setCurrentSpeed(physics.initialSpeed);
    gameTimeRef.current = 0;
    lastObstacleTimeRef.current = 0;
    nextObstacleIntervalRef.current = 
        Math.random() * (difficulty.obstacleFrequencyMax - difficulty.obstacleFrequencyMin) + difficulty.obstacleFrequencyMin;
    backgroundXRef.current = 0;
    setGameState('idle'); // Espera a que el usuario inicie
    audioManager.stopBackgroundMusic();
  }, [canvasWidth, groundY, playerHeight, playerWidth, physics, difficulty, assets.playerRunFrames.length]);

  useEffect(() => {
    // Llama a resetGame cuando el componente se monta o las dependencias clave cambian.
    // Esto es importante si, por ejemplo, el canvasWidth/Height cambia y el juego necesita recalcular posiciones.
    if (playerRunImagesRef.current.length > 0) { // Asegúrate que los assets básicos estén listos
        resetGame();
    }
  }, [resetGame, canvasWidth, canvasHeight]); // Dependencias de resetGame ya están incluidas en su useCallback

  // --- Manejo de Input ---
  const handleInteraction = useCallback(() => {
    if (gameState === 'idle') {
      setGameState('playing');
      audioManager.playBackgroundMusic();
      return;
    }

    if (gameState === 'playing' && playerStateRef.current && !playerStateRef.current.isJumping) {
      playerStateRef.current.isJumping = true;
      playerStateRef.current.velocityY = -physics.jumpForce;
      playerStateRef.current.currentFrame = 0; // Reiniciar animación de salto
      playerStateRef.current.currentFrameTime = 0;
      playerStateRef.current.frameCount = assets.playerJumpFrames.length;
      audioManager.playJumpSound();
    }
  }, [gameState, physics.jumpForce, assets.playerJumpFrames.length]);

  useEffect(() => {
    // Listeners para touch y click
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    canvasElement.addEventListener('touchstart', handleInteraction, { passive: false }); // passive false para prevenir scroll
    canvasElement.addEventListener('mousedown', handleInteraction);
    
    // Opcional: Salto con barra espaciadora para debugging en escritorio
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            e.preventDefault(); // Prevenir scroll de página si el canvas es enfocable
            handleInteraction();
        }
    };
    window.addEventListener('keydown', handleKeyDown);


    return () => {
      canvasElement.removeEventListener('touchstart', handleInteraction);
      canvasElement.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleInteraction]);


  // --- Bucle Principal del Juego ---
  useEffect(() => {
    if (!canvasRef.current || playerRunImagesRef.current.length === 0 || !backgroundImageRef.current || Object.keys(obstacleImagesRef.current).length === 0) {
      console.log("Canvas or assets not ready for game loop.");
      return; // No iniciar el bucle si el canvas o los assets no están listos
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      if (gameState === 'playing') {
        updateGame(deltaTime / 1000, ctx); // deltaTime en segundos
      }
      
      drawGame(ctx);

      if (gameState !== 'gameOver') { // Continuar el bucle si no es game over
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };
    
    // Iniciar el bucle solo si no estamos ya en game over (ej. después de un reinicio)
    if (gameState === 'playing' || gameState === 'idle') {
        animationFrameId = requestAnimationFrame(gameLoop);
    }


    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, assets, physics, difficulty, canvasWidth, canvasHeight]); // Reiniciar bucle si el estado o config cambia

  // --- Lógica de Actualización del Juego ---
  const updateGame = (dt: number, ctx: CanvasRenderingContext2D) => { // dt en segundos
    if (!playerStateRef.current) return;

    gameTimeRef.current += dt;

    // Actualizar Puntuación
    setScore((prevScore) => prevScore + currentSpeed * dt * 0.1); // Ajustar multiplicador de score

    // Actualizar Velocidad (Dificultad Progresiva)
    setCurrentSpeed((prevSpeed) => {
        const maxSpeed = difficulty.maxSpeed || Infinity;
        return Math.min(maxSpeed, prevSpeed + difficulty.speedIncrement * dt);
    });
    
    // Mover fondo
    backgroundXRef.current -= currentSpeed * dt;
    if (backgroundImageRef.current && backgroundXRef.current <= -backgroundImageRef.current.width) {
        backgroundXRef.current = 0;
    }


    // Actualizar Jugador
    const player = playerStateRef.current;
    player.currentFrameTime += dt * 1000; // frameTime está en ms

    if (player.currentFrameTime >= player.frameTime) {
      player.currentFrame = (player.currentFrame + 1) % player.frameCount;
      player.currentFrameTime = 0;
    }

    if (player.isJumping) {
      player.y += player.velocityY * dt * 100; // Escalar velocidad de salto si es necesario
      player.velocityY += physics.gravity * dt * 10; // Escalar gravedad si es necesario

      if (player.y >= groundY - player.height) {
        player.y = groundY - player.height;
        player.isJumping = false;
        player.velocityY = 0;
        player.currentFrame = 0; // Volver a animación de correr
        player.currentFrameTime = 0;
        player.frameCount = assets.playerRunFrames.length;
      }
    }

    // Actualizar Obstáculos
    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x + obs.width > 0); // Eliminar los que salen de pantalla
    obstaclesRef.current.forEach(obs => {
      obs.x -= currentSpeed * dt;
    });

    // Generar Nuevos Obstáculos
    lastObstacleTimeRef.current += dt * 1000; // en ms
    if (lastObstacleTimeRef.current >= nextObstacleIntervalRef.current) {
      createObstacle();
      lastObstacleTimeRef.current = 0;
      // Ajustar frecuencia basada en velocidad/score si es necesario
      const baseIntervalMin = difficulty.obstacleFrequencyMin;
      const baseIntervalMax = difficulty.obstacleFrequencyMax;
      // Ejemplo: reducir intervalo a medida que aumenta la velocidad, hasta un límite
      const speedFactor = Math.max(0.5, 1 - (currentSpeed - physics.initialSpeed) / ((difficulty.maxSpeed || currentSpeed * 2) - physics.initialSpeed)); 
      const currentIntervalMin = baseIntervalMin * speedFactor;
      const currentIntervalMax = baseIntervalMax * speedFactor;

      nextObstacleIntervalRef.current = Math.random() * (currentIntervalMax - currentIntervalMin) + currentIntervalMin;
    }
    
    // Detección de Colisiones
    checkCollisions();
  };
  
  const createObstacle = () => {
    if (Object.keys(obstacleImagesRef.current).length === 0) return;

    const obstacleVariants = Object.keys(assets.obstacles) as ObstacleVariant[];
    const variant = obstacleVariants[Math.floor(Math.random() * obstacleVariants.length)];
    const assetInfo = assets.obstacles[variant];
    if (!assetInfo) return;

    const obstacleImage = obstacleImagesRef.current[variant];
    if(!obstacleImage) return;

    // Escalar obstáculos si es necesario, por ahora usamos su tamaño intrínseco
    const obsWidth = assetInfo.width; 
    const obsHeight = assetInfo.height;

    obstaclesRef.current.push({
      id: `obs-${Date.now()}-${Math.random()}`,
      variant,
      x: canvasWidth,
      y: groundY - obsHeight, // Asume que todos los obstáculos están en el suelo
      width: obsWidth,
      height: obsHeight,
    });
  };

  const checkCollisions = () => {
    if (!playerStateRef.current) return;
    const player = playerStateRef.current;
    const playerRect = {
      x: player.x + player.width * 0.1, // Ajustar bounding box (ej. 80% del tamaño)
      y: player.y + player.height * 0.1,
      width: player.width * 0.8,
      height: player.height * 0.8,
    };

    for (const obs of obstaclesRef.current) {
      const obsRect = {
        x: obs.x + obs.width * 0.1,
        y: obs.y + obs.height * 0.1,
        width: obs.width * 0.8,
        height: obs.height * 0.8,
      };

      // Simple AABB collision detection
      if (
        playerRect.x < obsRect.x + obsRect.width &&
        playerRect.x + playerRect.width > obsRect.x &&
        playerRect.y < obsRect.y + obsRect.height &&
        playerRect.y + playerRect.height > obsRect.y
      ) {
        setGameState('gameOver');
        audioManager.stopBackgroundMusic();
        audioManager.playGameOverSound();
        onGameOver(score); // Notificar al componente padre
        return;
      }
    }
  };

  // --- Lógica de Dibujo ---
  const drawGame = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Limpiar canvas

    // Dibujar Fondo (con tile loop)
    if (backgroundImageRef.current) {
      const bg = backgroundImageRef.current;
      const bgRatio = bg.height / bg.width;
      const bgHeight = canvasHeight; // Hacer que el fondo ocupe toda la altura
      const bgWidth = bgHeight / bgRatio;


      let currentX = backgroundXRef.current;
      while (currentX < canvasWidth) {
        ctx.drawImage(bg, currentX, 0, bgWidth, bgHeight);
        currentX += bgWidth;
      }
       // Dibuja una segunda imagen para el bucle si es necesario
      if (backgroundXRef.current < 0 && backgroundXRef.current + bgWidth < canvasWidth) {
        ctx.drawImage(bg, backgroundXRef.current + bgWidth, 0, bgWidth, bgHeight);
      }
    } else { // Fondo de color si la imagen no carga
        ctx.fillStyle = theme === 'ice' ? '#ADD8E6' : theme === 'volcano' ? '#A52A2A' : '#228B22';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }


    // Dibujar Jugador
    if (playerStateRef.current && playerRunImagesRef.current.length > 0 && playerJumpImagesRef.current.length > 0) {
      const player = playerStateRef.current;
      const framesToUse = player.isJumping ? playerJumpImagesRef.current : playerRunImagesRef.current;
      const currentFrameImage = framesToUse[player.currentFrame];
      if (currentFrameImage) {
        ctx.drawImage(currentFrameImage, player.x, player.y, player.width, player.height);
      }
    }
    
    // Dibujar Obstáculos
    obstaclesRef.current.forEach(obs => {
      const obstacleImage = obstacleImagesRef.current[obs.variant];
      if (obstacleImage) {
        ctx.drawImage(obstacleImage, obs.x, obs.y, obs.width, obs.height);
      }
    });

    // Dibujar UI (Score, etc.) - Se hace con componentes DOM encima del canvas (ScoreDisplay)
    // Si estamos en idle y hay assets, dibujar "Tap to start"
    if (gameState === 'idle' && backgroundImageRef.current) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, canvasHeight / 2 - 30, canvasWidth, 60);
        ctx.font = "bold 30px 'Luckiest Guy', cursive"; // Asegúrate que la fuente esté cargada
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("Tap to Start", canvasWidth / 2, canvasHeight / 2 + 10);
    }
  };


  return (
    <div className="relative w-full h-full" style={{ width: canvasWidth, height: canvasHeight }}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="block"
        // El evento onClick/onTouch es manejado por los listeners globales para 'idle' state
      />
      {/* El ScoreDisplay y GameOverModal se renderizarán encima por el componente Map */}
    </div>
  );
};

export default GameCanvas;