// src/components/game/types.ts
export type GameState = 'idle' | 'playing' | 'gameOver';
export type MapTheme = 'forest' | 'ice' | 'volcano';

// This type is for the actual instances of obstacles in the game state
export interface ObstacleConfig { // Nuevo tipo para configuración de obstáculos
  src: string;
  width: number;  // Ancho deseado en el juego
  height: number; // Alto deseado en el juego
  colliderOffsetX?: number; // Opcional: ajuste para el collider
  colliderOffsetY?: number;
  colliderWidth?: number;
  colliderHeight?: number;
}

// Representa un obstáculo activo EN EL JUEGO DENTRO DE GameCanvas
export interface ObstacleInstance { // <<< AÑADE Y EXPORTA ESTE TIPO
  id: string;
  config: ObstacleConfig; // Referencia a su configuración original (src, width, height definidos)
  imageElement: HTMLImageElement; // La imagen HTML precargada
  x: number;
  y: number;
  width: number;  // Ancho actual en el juego (tomado de config.width)
  height: number; // Alto actual en el juego (tomado de config.height)
}

// Defines the structure for assets in THEME_CONFIGS and passed to GameCanvas
export interface GameThemeAssets {
  background: string;         // Imported background image source string
  obstacles: ObstacleConfig[];        // Array of imported obstacle image source strings
  playerRunFrames: string[];  // Array of imported run frame source strings
  playerJumpFrames: string[]; // Array of imported jump frame source strings
}

export interface GamePhysics {
  gravity: number;
  jumpForce: number;
  initialSpeed: number;
  playerGroundOffset?: number;
}

// Matches the GameDifficultyConfig from your example Map.tsx
export interface GameDifficultyConfig {
  speedIncrement: number;
  initialMinSpawnIntervalMs: number;
  initialMaxSpawnIntervalMs: number;
  minOverallSpawnIntervalMs: number;
  obstacleIntervalSpeedFactor: number;
  maxSpeed?: number;
}

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isJumping: boolean;
  currentFrame: number;
  frameCount: number;
  frameTime: number;
  currentFrameTime: number;
}