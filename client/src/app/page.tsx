import { useState } from "react"
import { CoverScreen } from "../components/screens/Cover/cover-screen"
import { HomeScreen } from "../components/screens/Home/HomeScreen"
import { PlayScreen } from "../components/screens/Play/PlayScreen"
import { MarketScreen } from "../components/screens/Market/MarketScreen"
import { ProfileScreen } from "../components/screens/Profile/ProfileScreen"
import { RankingScreen } from "../components/screens/Ranking/RankingScreen"
import type { Golem } from "../components/types/golem"
import type { Map } from "../components/types/map"
import { defaultGolems } from "../constants/golems"
import { defaultMaps } from "../constants/maps"

type Screen = "cover" | "home" | "play" | "market" | "ranking" | "profile" | "stats"

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("cover")
  const [coins, setCoins] = useState(385)
  const [level, setLevel] = useState(3)
  const [experience, setExperience] = useState(75)
  const [nextLevelExperience, setNextLevelExperience] = useState(100)
  const [ownedGolems, setOwnedGolems] = useState<Golem[]>([defaultGolems[0], defaultGolems[1]])
  const [unlockedMaps, setUnlockedMaps] = useState<Map[]>([defaultMaps[0], defaultMaps[1]])

  // Current user data for ranking
  const currentUser = {
    id: "current-user",
    name: "YourUsername",
    score: 7850,
    rank: 24,
  }

  const handleLoadingComplete = () => {
    setCurrentScreen("home")
  }

  const handlePlayClick = () => {
    setCurrentScreen("play")
  }

  const handleMarketClick = () => {
    setCurrentScreen("market")
  }

  const handleBackToHome = () => {
    setCurrentScreen("home")
  }

  const handleSpendCoins = (amount: number) => {
    if (coins >= amount) {
      setCoins((prev) => Math.max(0, prev - amount))
      return true
    }
    return false
  }

  const handleAddGolem = (golem: Golem) => {
    setOwnedGolems((prev) => {
      // Check if golem is already owned
      if (prev.some((g) => g.id === golem.id)) {
        return prev
      }
      // Add the golem with owned status set to true
      return [...prev, { ...golem, owned: true }]
    })
  }

  // Update NavBar to handle navigation
  const handleNavigation = (screen: Screen) => {
    setCurrentScreen(screen)
  }

  return (
    <>
      {currentScreen === "cover" && <CoverScreen onLoadingComplete={handleLoadingComplete} />}

      {currentScreen === "home" && (
        <HomeScreen
          onPlayClick={handlePlayClick}
          onMarketClick={handleMarketClick}
          coins={coins}
          level={level}
          onNavigation={handleNavigation}
        />
      )}

      {currentScreen === "play" && (
        <PlayScreen
          onClose={handleBackToHome}
          coins={coins}
          onSpendCoins={handleSpendCoins}
          onNavigation={handleNavigation}
        />
      )}

      {currentScreen === "market" && (
        <MarketScreen
          coins={coins}
          level={level}
          onPurchase={handleSpendCoins}
          onAddGolem={handleAddGolem}
          onNavigation={handleNavigation}
        />
      )}

      {currentScreen === "profile" && (
        <ProfileScreen
          coins={coins}
          level={level}
          experience={experience}
          nextLevelExperience={nextLevelExperience}
          ownedGolems={ownedGolems}
          unlockedMaps={unlockedMaps}
          onNavigation={handleNavigation}
        />
      )}

      {currentScreen === "ranking" && (
        <RankingScreen
          coins={coins}
          level={level}
          experience={experience}
          nextLevelExperience={nextLevelExperience}
          currentUser={currentUser}
          onNavigation={handleNavigation}
        />
      )}
    </>
  )
}
