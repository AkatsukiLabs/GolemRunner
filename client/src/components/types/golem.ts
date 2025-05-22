export interface Golem {
    id: number
    name: string
    rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary"
    description: string
    image: string
    price: number
    owned: boolean
    animations: {
      run: string[],
      jump: string[]
    }
  }