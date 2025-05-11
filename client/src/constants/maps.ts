import type { Map } from "../components/types/map"

// Sample maps data
export const defaultMaps: Map[] = [
  {
    id: 1,
    name: "Forest",
    image: "/forest-map.png",
    unlocked: true,
    price: 0,
    description: "A peaceful forest with hidden treasures.",
    highScore: 12500,
  },
  {
    id: 2,
    name: "Desert",
    image: "/desert-map.png",
    unlocked: true,
    price: 5,
    description: "Vast dunes hide ancient ruins and dangers.",
    highScore: 8750,
  },
  {
    id: 3,
    name: "Volcano",
    image: "/volcano-map.png",
    unlocked: false,
    price: 10,
    description: "Treacherous paths through molten lava.",
    highScore: 0,
  },
]
