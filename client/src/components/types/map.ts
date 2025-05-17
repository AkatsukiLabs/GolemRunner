import { MapTheme } from "./game"

export interface Map {
    id: number
    name: string
    image: string
    unlocked?: boolean
    price?: number
    description?: string
    highScore?: number
    theme?: MapTheme;
  }
  