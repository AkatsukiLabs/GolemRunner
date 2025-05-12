import type { Golem } from "../components/types/golem"

import IceIdle0   from "../assets/IceGolem/0_Golem_Idle_000.png"
import MossyIdle0 from "../assets/MossyGolem/0_Golem_Idle_000.png"
import LavaIdle0  from "../assets/LavaGolem/0_Golem_Idle_000.png"

// Sample golem data
export const defaultGolems: Golem[] = [
  {
    id: 1,
    name: "Ice Golem",
    rarity: "Epic",
    description: "A frosty brute with a heart of ice.",
    image: IceIdle0,
    price: 1000,
    owned: true,
  },
  {
    id: 2,
    name: "Mossy Golem",
    rarity: "Rare",
    description: "Overgrown with ancient moss.",
    image: MossyIdle0,
    price: 500,
    owned: true,
  },
  {
    id: 3,
    name: "Lava Golem",
    rarity: "Epic",
    description: "Forged from the depths of a volcano.",
    image: LavaIdle0,
    price: 1000,
    owned: false,
  },
  {
    id: 4,
    name: "Stone Golem",
    rarity: "Common",
    description: "Sturdy and reliable, the backbone of any team.",
    image: LavaIdle0,
    price: 250,
    owned: false,
  },
]
