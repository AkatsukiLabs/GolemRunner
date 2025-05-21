export interface Golem {
    id: number
    name: string
    rarity: "Common" | "Rare" | "Uncommon" | "Legendary"
    description: string
    image: string
    price: number
    owned: boolean
    animations: {
      run: string[],
      jump: string[]
    }
  }