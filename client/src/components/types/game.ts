export type GameState = 'idle' | 'playing' | 'gameOver';
export type MapTheme = 'forest' | 'ice' | 'volcano';

export interface ObstacleBaseConfig { 
  src: string;
  width: number;
  height: number;
  colliderOffsetX?: number;
  colliderOffsetY?: number;
  colliderWidth?: number;
  colliderHeight?: number;
}

export interface SingleObstacleConfig extends ObstacleBaseConfig {
  type: 'single';
}

export interface GroupMemberObstacleConfig extends ObstacleBaseConfig {
  spacingAfter?: number;
}

export interface ObstacleGroupConfig {
  type: 'group';
  members: GroupMemberObstacleConfig[]; 
}

export type ObstacleConfig = SingleObstacleConfig | ObstacleGroupConfig;

export interface ObstacleInstance {
  id: string;
  baseConfig: ObstacleBaseConfig; 
  imageElement: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameThemeAssets {
  background: string;         
  ground: string; 
  obstacles: ObstacleConfig[];        
  playerRunFrames: string[];  
  playerJumpFrames: string[]; 
}

export interface GamePhysics {
  gravity: number;
  jumpForce: number;
  baseSpeed: number;
  playerGroundOffset?: number;
}
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