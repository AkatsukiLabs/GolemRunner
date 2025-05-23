import { motion } from "framer-motion";
import { ProfileGolem } from "../../../dojo/hooks/useProfileData";
import EyeIcon from "../../../assets/icons/EyeIcon.webp";

interface ProfileGolemCardProps {
  golem: ProfileGolem;
  onView: () => void;
}

export function ProfileGolemCard({ golem, onView }: ProfileGolemCardProps) {
  const rarityColors = {
    Common: "bg-gray-500",
    Rare: "bg-blue-500", 
    Uncommon: "bg-purple-500",
    Legendary: "bg-yellow-500",
  };

  const rarityColor = rarityColors[golem.rarity as keyof typeof rarityColors] || "bg-gray-500";

  return (
    <motion.div
      className="bg-surface p-4 rounded-xl shadow-md flex flex-col items-center"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="h-32 flex items-center justify-center mb-2 overflow-visible">
        <div className="transform scale-150">
          <img
            src={golem.image || "/placeholder.svg"}
            alt={golem.name}
            className="w-32 h-32 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/placeholder.svg?height=128&width=128";
            }}
          />
        </div>
      </div>

      <h3 className="font-luckiest text-lg text-primary mb-1">
        {golem.name}
      </h3>
      
      <span
        className={`inline-block ${rarityColor} text-cream font-luckiest tracking-wide rounded-full px-2 py-0.5 text-sm mb-2`}
      >
        {golem.rarity}
      </span>

      <motion.button
        onClick={onView}
        className="btn-cr-yellow w-full flex items-center justify-center gap-2"
        whileTap={{ scale: 1 }}
      >
        <img src={EyeIcon} alt="View" className="h-6 w-6"/>
        <span>View</span>
      </motion.button>
    </motion.div>
  );
}