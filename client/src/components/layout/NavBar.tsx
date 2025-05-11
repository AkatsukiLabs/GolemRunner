import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ShoppingBag, Play, Trophy, User } from "lucide-react"

interface NavBarProps {
  onNavigation?: (screen: "home" | "play" | "market" | "stats" | "profile" | "ranking") => void
  activeTab?: string
}

export function NavBar({ onNavigation, activeTab = "home" }: NavBarProps) {
  const [active, setActive] = useState(activeTab)

  // Update active tab when prop changes
  useEffect(() => {
    setActive(activeTab)
  }, [activeTab])

  const navItems = [
    { id: "market", icon: ShoppingBag, label: "Market" },
    { id: "play", icon: Play, label: "Play" },
    { id: "ranking", icon: Trophy, label: "Ranking" },
    { id: "profile", icon: User, label: "Profile" },
  ]

  const handleClick = (id: string) => {
    setActive(id)
    if (onNavigation) {
      onNavigation(id as any)
    }
  }

  return (
    <motion.div
      className="fixed bottom-0 inset-x-0 bg-screen/80 backdrop-blur-md py-2 px-4 flex justify-around z-20"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 20 }}
    >
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = active === item.id

        return (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`relative flex items-center justify-center bg-surface p-3 rounded-full shadow-sm transition-colors duration-200 ${
              isActive ? "bg-primary text-surface" : "text-text-primary hover:bg-surface/80"
            }`}
            aria-label={item.label}
          >
            <Icon className="h-5 w-5" />
            {isActive && (
              <motion.span
                className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full"
                layoutId="navIndicator"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        )
      })}
    </motion.div>
  )
}
