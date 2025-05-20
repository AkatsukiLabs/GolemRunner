// En un archivo compartido (types.ts) o directamente en cada componente
export interface Character {
    id: number
    name: string
    rarity: string
    description: string
    image: string
    isUnlocked: boolean
  }