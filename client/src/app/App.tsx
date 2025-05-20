import { useState, useCallback, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { CoverScreen } from "../components/screens/Cover/cover-screen";
import { HomeScreen } from "../components/screens/Home/HomeScreen";
import { PlayScreen } from "../components/screens/Play/PlayScreen";
import { MarketScreen } from "../components/screens/Market/MarketScreen";
import { ProfileScreen } from "../components/screens/Profile/ProfileScreen";
import { RankingScreen } from "../components/screens/Ranking/RankingScreen";
import { LoginScreen } from "../components/screens/Login/LoginScreen"
import { NavBar } from "../components/layout/NavBar"
import type { Golem } from "../components/types/golem";
import type { Map } from "../components/types/map";
import { defaultGolems } from "../constants/golems";
import { defaultMaps } from "../constants/maps";
import { MusicProvider, useMusic } from "../context/MusicContext";

type Screen = "login" | "cover" | "home" | "play" | "market" | "ranking" | "profile";

function AppContent() {
  const { isConnected } = useAccount();
  const { setCurrentScreen } = useMusic();
  const [currentScreen, setCurrentScreenState] = useState<Screen>("login");
  const [coins, setCoins] = useState(385);
  const [level] = useState(3);
  const [experience] = useState(75);
  const [nextLevelExperience] = useState(100);
  const [playerAddress] = useState("0x123"); // Temporal address for testing
  const [ownedGolems, setOwnedGolems] = useState<Golem[]>([
    defaultGolems[0],
    defaultGolems[2],
  ]);
  const [unlockedMaps] = useState<Map[]>([
    defaultMaps[0],
    defaultMaps[1],
  ]);
  const [selectedGolemId, setSelectedGolemId] = useState<number | null>(null)

  const currentUser = {
    id: "current-user",
    name: "YourUsername",
    score: 7850,
    rank: 24,
  };

  // Add effect to handle disconnection
  useEffect(() => {
    if (!isConnected && currentScreen !== "login") {
      setCurrentScreen("login");
    }
  }, [isConnected, currentScreen, setCurrentScreen]);

  // Handlers
  const handleNavigation = (screen: Screen) => {
    setCurrentScreenState(screen);
    setCurrentScreen(screen);
  };
  const handleSpendCoins = (amount: number) => {
    if (coins >= amount) {
      setCoins((prev) => Math.max(0, prev - amount));
      return true;
    }
    return false;
  };
  const handleAddGolem = (golem: Golem) =>
    setOwnedGolems((prev) =>
      prev.some((g) => g.id === golem.id)
        ? prev
        : [...prev, { ...golem, owned: true }]
    );

  const handleLoadingComplete = useCallback(
    () => {
      setCurrentScreenState("home");
      setCurrentScreen("home");
    },
    [setCurrentScreen]
  );

  return (
    <div className="relative min-h-screen pb-16">
      {currentScreen === "login" && (
        <LoginScreen
          onLoginSuccess={() => handleNavigation("cover")}
        />
      )}

      {currentScreen === "cover" && (
        <CoverScreen onLoadingComplete={handleLoadingComplete} />
      )}

      {currentScreen === "home" && (
        <HomeScreen
        onPlayClick={(golem) => {
          setSelectedGolemId(golem.id);
          handleNavigation("play");}}
          onMarketClick={() => handleNavigation("market")}
          coins={coins}
          level={level}
          playerAddress={playerAddress}
          onNavigation={handleNavigation}
          onNavigateLogin={() => handleNavigation("login")}
        />
      )}

      {currentScreen === "play" && selectedGolemId != null && (
        <PlayScreen
          selectedGolemId={selectedGolemId}
          onClose={() => handleNavigation("home")}
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
          currentUser={currentUser}
          onNavigation={handleNavigation}
        />
      )}

      {/* NavBar*/}
      {currentScreen !== "cover" && currentScreen !== "play" && currentScreen !== "login" && (
        <NavBar
          activeTab={currentScreen as "market"|"home"|"ranking"|"profile"}
          onNavigation={handleNavigation}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <MusicProvider>
      <AppContent />
    </MusicProvider>
  );
}
