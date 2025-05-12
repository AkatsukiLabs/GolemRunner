import { motion } from "framer-motion"

interface Character {
  id: number
  name: string
  rarity: string
  description: string
  image: string
}

interface CharacterCardProps {
  character: Character
  onSelect: () => void
}

export function CharacterCard({ character, onSelect }: CharacterCardProps) {
  const rarityColors = {
    Common: "bg-gray-500",
    Rare: "bg-blue-500",
    Epic: "bg-purple-500",
    Legendary: "bg-yellow-500",
  }

  const rarityColor =
    rarityColors[character.rarity as keyof typeof rarityColors] || "bg-secondary"

  return (
    <motion.div
      className="bg-surface p-4 rounded-xl shadow-md text-center"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      key={character.id}
    >
      <h2 className="font-luckiest text-xl text-dark mb-1">
        {character.name}
      </h2>
      <span
        className={`
          inline-block ${rarityColor} text-cream font-luckiest tracking-wide
          rounded-full px-2 py-0.5 text-sm mb-2
        `}
      >
        {character.rarity}
      </span>
      <p className="font-luckiest text-base text-text-primary mb-4">
        {character.description}
      </p>

      <button
        onClick={onSelect}
        className="btn-cr-yellow"
      >
        Select
      </button>
    </motion.div>
  )
}

