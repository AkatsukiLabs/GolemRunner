// src/components/game/types.ts
export type GameState = 'idle' | 'playing' | 'gameOver';
export type MapTheme = 'forest' | 'ice' | 'volcano';

// This type is for the actual instances of obstacles in the game state
export interface ObstacleInstance {
  id: string;
  imageSrc: string; // The imported image source string
  x: number;
  y: number;
  width: number;  // Determined from the loaded image
  height: number; // Determined from the loaded image
}

// Defines the structure for assets in THEME_CONFIGS and passed to GameCanvas
export interface GameThemeAssets {
  background: string;         // Imported background image source string
  obstacles: string[];        // Array of imported obstacle image source strings
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