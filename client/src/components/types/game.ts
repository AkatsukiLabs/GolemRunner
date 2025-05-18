// src/components/game/types.ts
export type GameState = 'idle' | 'playing' | 'gameOver';
export type MapTheme = 'forest' | 'ice' | 'volcano';

export interface ObstacleBaseConfig { // Configuración base de un obstáculo visual
  src: string;
  width: number;
  height: number;
  colliderOffsetX?: number;
  colliderOffsetY?: number;
  colliderWidth?: number;
  colliderHeight?: number;
}

// Configuración para un solo obstáculo
export interface SingleObstacleConfig extends ObstacleBaseConfig {
  type: 'single';
}

// Configuración para un obstáculo que es parte de un grupo (con espaciado relativo)
export interface GroupMemberObstacleConfig extends ObstacleBaseConfig {
  spacingAfter?: number; // Espacio horizontal después de este obstáculo antes del siguiente en el grupo (en píxeles)
}

// Configuración para un grupo de obstáculos
export interface ObstacleGroupConfig {
  type: 'group';
  members: GroupMemberObstacleConfig[]; // Los obstáculos que componen el grupo
}

// ObstacleConfig ahora puede ser uno de estos dos
export type ObstacleConfig = SingleObstacleConfig | ObstacleGroupConfig;


// Representa un obstáculo activo EN EL JUEGO DENTRO DE GameCanvas
export interface ObstacleInstance {
  id: string;
  // 'config' podría referirse a ObstacleBaseConfig si normalizamos al crear la instancia
  baseConfig: ObstacleBaseConfig; // La configuración visual del obstáculo individual
  imageElement: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Defines the structure for assets in THEME_CONFIGS and passed to GameCanvas
export interface GameThemeAssets {
  background: string;         // Imported background image source string
  ground: string; 
  obstacles: ObstacleConfig[];        // Array of imported obstacle image source strings
  playerRunFrames: string[];  // Array of imported run frame source strings
  playerJumpFrames: string[]; // Array of imported jump frame source strings
}

export interface GamePhysics {
  gravity: number;
  jumpForce: number;
  baseSpeed: number;
  playerGroundOffset?: number;
}

// Matches the GameDifficultyConfig from your example Map.tsx
export interface GameDifficultyConfig {
  speedScaleIncrementPerSecond: number;
  initialMinSpawnIntervalMs: number;
  initialMaxSpawnIntervalMs: number;
  minOverallSpawnIntervalMs: number;
  obstacleIntervalSpeedFactor: number;
  maxSpeedScale?: number;
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