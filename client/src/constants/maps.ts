import type { Map } from "../components/types/map"

import ForestMap   from "../assets/Maps/Forest/ForestMap.png"
import IceMap from "../assets/Maps/Ice/IceMap.png"
import VolcanoMap  from "../assets/Maps/Volcano/VolcanoMap.png"

export const defaultMaps: Map[] = [
  {
    id: 1,
    name: "Ice",
    image: IceMap,
    unlocked: true,
    price: 0,
    description: "Dash through icy ruins, dodging crystals and frozen traps!",
    highScore: 12500,
    theme: "ice"
  },
  {
    id: 2,
    name: "Volcano",
    image: VolcanoMap,
    unlocked: false,
    price: 25,
    description: "Race lava flows and leap over erupting molten ground!",
    highScore: 8750,
    theme: "volcano"
  },
  {
    id: 3,
    name: "Forest",
    image: ForestMap,
    unlocked: false,
    price: 50,
    description: "Charge through rocky woods, weaving past roots and boulders!",
    highScore: 0,
    theme: "forest"
  },
]
