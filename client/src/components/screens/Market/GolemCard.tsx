import { motion } from "framer-motion"
import coinIcon from "../../../assets/icons/CoinIcon.webp";
import { useMarketStore } from "../../../dojo/hooks/useMarketStore";

// Specific type for the marketplace
interface MarketGolem {
  id: number;
  name: string;
  description: string;
  image: string;
  rarity: string;
  price: number;
  owned: boolean;
}

interface GolemCardProps {
  golem: MarketGolem
  onPurchase: () => void
}

export function GolemCard({ golem, onPurchase }: GolemCardProps) {
  const { canAfford } = useMarketStore();
  const isAffordable = canAfford(golem.price);
  
  const rarityColors: Record<string, string> = {
    Common: "bg-gray-500",
    Rare: "bg-blue-500",
    Epic: "bg-purple-500",
    Legendary: "bg-yellow-500",
  }
  const rarityColor = rarityColors[golem.rarity] || "bg-gray-500";

  const item = {
    hidden: { y: 20, opacity: 0 },
    show:   { y: 0,  opacity: 1 },
  }

  return (
    <motion.div
      className="bg-surface p-4 rounded-xl shadow-md flex flex-col items-center"
      variants={item}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Golem image - Using transform scale to enlarge it */}
      <div className="h-32 flex items-center justify-center mb-2 overflow-visible">
        <div className="transform scale-150">
          <img
            src={golem.image || "/placeholder.svg"}
            alt={golem.name}
            className="w-32 h-32 object-contain"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              img.src = "/placeholder.svg?height=128&width=128"
            }}
          />
        </div>
      </div>

      {/* Name */}
      <h3 className="font-luckiest text-lg text-primary mb-1">
        {golem.name}
      </h3>

      {/* Rarity */}
      <span
        className={`inline-block ${rarityColor} text-cream font-luckiest tracking-wide
          rounded-full px-2 py-0.5 text-sm mb-2`}
      >
        {golem.rarity}
      </span>

      {/* Description */}
      <p className="font-luckiest text-sm text-text-primary mb-3 text-center h-12 overflow-hidden">
        {golem.description}
      </p>

      {/* Button or Owned state */}
      {golem.owned ? (
        <div className="btn-cr-yellow w-full flex items-center justify-center opacity-50 cursor-not-allowed">
          Owned
        </div>
      ) : (
        <motion.button
          onClick={onPurchase}
          disabled={!isAffordable}
          className={`btn-cr-yellow w-full flex items-center justify-center gap-2 ${
            !isAffordable ? "opacity-50 cursor-not-allowed" : ""
          }`}
          whileTap={{ scale: isAffordable ? 0.95 : 1 }}
        >
          <span>Buy</span>
          <img src={coinIcon} alt="Coin" className="h-5 w-5" />
          <span>{golem.price}</span>
        </motion.button>
      )}
    </motion.div>
  )
}