import type { Map } from "../components/types/map"
import ForestMap   from "../assets/Maps/Forest/ForestMap.webp"
import IceMap from "../assets/Maps/Ice/IceMap.webp"
import VolcanoMap  from "../assets/Maps/Volcano/VolcanoMap.webp"

export const defaultMaps: Map[] = [
  {
    id: 1, 
    name: "Forest",
    image: ForestMap,
    unlocked: false,
    price: 50,
    description: "A nice forest with old trees",
    highScore: 0,
    theme: "forest"
  },
  {
    id: 2, 
    name: "Volcano", 
    image: VolcanoMap,
    unlocked: false,
    price: 25,
    description: "A dangerous volcanic zone",
    highScore: 8750,
    theme: "volcano"
  },
  {
    id: 3, 
    name: "Ice",
    image: IceMap,
    unlocked: true,
    price: 0,
    description: "A slippery ice world",
    highScore: 12500,
    theme: "ice"
  }
]