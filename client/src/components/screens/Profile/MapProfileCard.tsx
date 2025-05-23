import { motion } from "framer-motion"
import GoldenTrophyIcon from "../../../assets/icons/GoldenTrophyIcon.webp"
import { ProfileMap } from "../../../dojo/hooks/useProfileData";

interface ProfileMapGridProps {
  maps: ProfileMap[] 
}

export function ProfileMapGrid({ maps }: ProfileMapGridProps) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
      initial="hidden"
      animate="show"
      className="px-4"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {maps.map((map) => (
          <div
            key={map.id}
            className="bg-surface p-5 rounded-xl shadow-md flex flex-col items-center"
          >
            <img
              src={map.image}
              alt={map.name}
              className="w-full h-32 object-cover rounded-md mb-2"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/placeholder.svg?height=128&width=192"
              }}
            />

            <h3 className="font-luckiest text-xl text-primary mb-1 text-center">
              {map.name}
            </h3>

            <div className="flex items-center">
              <img
                src={GoldenTrophyIcon}
                alt="Highscore"
                className="w-7 h-7 mr-1"
              />
              <span className="font-luckiest text-lg text-secondary">
                {map.highScore}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}