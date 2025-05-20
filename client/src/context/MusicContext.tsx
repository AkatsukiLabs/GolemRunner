import React, { createContext, useState, useContext, useEffect } from 'react';
import useSound from 'use-sound';

// Assets
import backgroundMusic from '../assets/audio/music-rest.mp3';

// Types
type Screen = "login" | "cover" | "home" | "play" | "market" | "ranking" | "profile";

interface MusicContextType {
  isMuted: boolean;
  toggleMute: () => void;
  isPlaying: boolean;
  togglePlay: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
}

const MusicContext = createContext<MusicContextType>({
  isMuted: false,
  toggleMute: () => {},
  isPlaying: false,
  togglePlay: () => {},
  volume: 0.4,
  setVolume: () => {},
  currentScreen: "login",
  setCurrentScreen: () => {},
});

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");

  // Setup for background music
  const [playBackgroundMusic, { stop: stopBackgroundMusic }] = useSound(backgroundMusic, {
    loop: true,
    volume: isMuted ? 0 : volume,
    interrupt: true,
  });

  // Effect to control music based on screen
  useEffect(() => {
    const screensWithoutMusic: Screen[] = ["login", "cover", "play"];
    
    if (screensWithoutMusic.includes(currentScreen)) {
      stopBackgroundMusic();
      setIsPlaying(false);
    } else if (!isPlaying && !screensWithoutMusic.includes(currentScreen)) {
      playBackgroundMusic();
      setIsPlaying(true);
    }
  }, [currentScreen, isPlaying, playBackgroundMusic, stopBackgroundMusic]);

  // Effect to handle mute/unmute
  useEffect(() => {
    if (isPlaying) {
      if (isMuted) {
        stopBackgroundMusic();
      } else {
        playBackgroundMusic();
      }
    }
  }, [isMuted, isPlaying, playBackgroundMusic, stopBackgroundMusic]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <MusicContext.Provider
      value={{
        isMuted,
        toggleMute,
        isPlaying,
        togglePlay,
        volume,
        setVolume,
        currentScreen,
        setCurrentScreen,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
} 