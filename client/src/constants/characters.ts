import IceIdle0   from "../assets/IceGolem/0_Golem_Idle_000.png"
import FireIdle0  from "../assets/LavaGolem/0_Golem_Idle_000.png"
import StoneIdle0 from "../assets/MossyGolem/0_Golem_Idle_000.png"

export const characters = [
  {
    id: 1,
    name: "Ice Golem",
    rarity: "Epic",
    description: "A frosty brute with a heart of ice.",
    image: IceIdle0,
  },
  {
    id: 2,
    name: "Mossy Golem",
    rarity: "Rare",
    description: "Overgrown with ancient moss",
    image: StoneIdle0,
  },
  {
    id: 3,
    name: "Lava Golem",
    rarity: "Common",
    description: "Born in the molten core",
    image: FireIdle0,
  },
]
