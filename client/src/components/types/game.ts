// src/components/game/types.ts
export type GameState = 'idle' | 'playing' | 'gameOver';
export type MapTheme = 'forest' | 'ice' | 'volcano';

// Puedes expandir esto según los tipos de obstáculos que tengas por tema
export type ObstacleVariant = 'obstacle1' | 'obstacle2' | 'obstacle3';

export interface ObstacleAsset {
  src: string;
  width: number; // Ancho intrínseco de la imagen del obstáculo
  height: number; // Alto intrínseco de la imagen del obstáculo
}

export interface GameAssets {
  background: string;
  obstacles: Record<ObstacleVariant, ObstacleAsset>; // Usamos un objeto para diferentes obstáculos
  playerRunFrames: string[];
  playerJumpFrames: string[];
}

export interface GamePhysics {
  gravity: number;
  jumpForce: number;
  initialSpeed: number;
  playerGroundOffset?: number; // Píxeles desde la parte inferior del canvas hasta la base del jugador
}

export interface GameDifficulty {
  speedIncrement: number; // Cuánto aumenta la velocidad por segundo o por punto
  obstacleFrequencyMin: number; // Tiempo mínimo entre obstáculos (ms)
  obstacleFrequencyMax: number; // Tiempo máximo entre obstáculos (ms)
  maxSpeed?: number; // Velocidad máxima alcanzable
}

export interface PlayerState {
  x: number;
  y: number;
  width: number; // Ancho del jugador para colisiones y dibujo
  height: number; // Alto del jugador para colisiones y dibujo
  velocityY: number;
  isJumping: boolean;
  currentFrame: number;
  frameCount: number; // Total de frames en la animación actual
  frameTime: number; // Tiempo entre frames de animación (ms)
  currentFrameTime: number;
}

export interface ObstacleState {
  id: string;
  variant: ObstacleVariant;
  x: number;
  y: number;
  width: number;
  height: number;
}