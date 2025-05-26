import type { Map } from "../components/types/map"
import ForestMap   from "../assets/Maps/Forest/ForestMap.webp"
import IceMap from "../assets/Maps/Ice/IceMap.webp"
import VolcanoMap  from "../assets/Maps/Volcano/VolcanoMap.webp"

// ✅ CORREGIR: maps.ts - Reordenar por ID
// ✅ CORREGIR: maps.ts - Ordenar por ID para que coincida con la lógica
export const defaultMaps: Map[] = [
  {
    id: 1, // ← Primera posición = Forest
    name: "Forest",
    image: ForestMap,
    unlocked: false,
    price: 50,
    description: "Charge through rocky woods, weaving past roots and boulders!",
    highScore: 0,
    theme: "forest"
  },
  {
    id: 2, // ← Segunda posición = Volcano
    name: "Volcano", 
    image: VolcanoMap,
    unlocked: false,
    price: 25,
    description: "Race lava flows and leap over erupting molten ground!",
    highScore: 8750,
    theme: "volcano"
  },
  {
    id: 3, // ← Tercera posición = Ice
    name: "Ice",
    image: IceMap,
    unlocked: true,
    price: 0,
    description: "Dash through icy ruins, dodging crystals and frozen traps!",
    highScore: 12500,
    theme: "ice"
  }
]