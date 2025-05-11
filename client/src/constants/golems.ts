import type { Golem } from "../components/types/golem"

// Sample golem data
export const defaultGolems: Golem[] = [
  {
    id: 1,
    name: "Ice Golem",
    rarity: "Epic",
    description: "A frosty brute with a heart of ice.",
    image: "/ice-golem.png",
    price: 1000,
    owned: true,
  },
  {
    id: 2,
    name: "Mossy Golem",
    rarity: "Rare",
    description: "Overgrown with ancient moss.",
    image: "/mossy-golem.png",
    price: 500,
    owned: true,
  },
  {
    id: 3,
    name: "Lava Golem",
    rarity: "Epic",
    description: "Forged from the depths of a volcano.",
    image: "/lava-golem.png",
    price: 1000,
    owned: false,
  },
  {
    id: 4,
    name: "Stone Golem",
    rarity: "Common",
    description: "Sturdy and reliable, the backbone of any team.",
    image: "/stone-golem.png",
    price: 250,
    owned: false,
  },
]
