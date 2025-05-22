import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player, Golem, World, Ranking } from '../dojo/bindings';

// Define application state interface
interface AppState {
  // Player data
  player: Player | null;
  
  // Game entities
  golems: Golem[];
  worlds: World[];
  rankings: Ranking[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Game state
  currentGolem: Golem | null;
  currentWorld: World | null;
  gameStarted: boolean;
}

// Define actions interface
interface AppActions {
  // Player actions
  setPlayer: (player: Player | null) => void;
  updatePlayerCoins: (coins: number) => void;
  updatePlayerLevel: (level: number) => void;
  updatePlayerExperience: (experience: number) => void;
  
  // Golem actions
  setGolems: (golems: Golem[]) => void;
  addGolem: (golem: Golem) => void;
  unlockGolem: (golemId: number) => void;
  setCurrentGolem: (golem: Golem | null) => void;
  
  // World actions
  setWorlds: (worlds: World[]) => void;
  addWorld: (world: World) => void;
  unlockWorld: (worldId: number) => void;
  setCurrentWorld: (world: World | null) => void;
  
  // Ranking actions
  setRankings: (rankings: Ranking[]) => void;
  updateRanking: (ranking: Ranking) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Game actions
  startGame: () => void;
  endGame: () => void;
  resetGame: () => void;
  
  // Utility actions
  resetStore: () => void;
}

// Combine state and actions
type AppStore = AppState & AppActions;

// Initial state
const initialState: AppState = {
  player: null,
  golems: [],
  worlds: [],
  rankings: [],
  isLoading: false,
  error: null,
  currentGolem: null,
  currentWorld: null,
  gameStarted: false,
};

// Create the store
const useAppStore = create<AppStore>()(
  persist(
    (set, _get) => ({
      // Initial state
      ...initialState,

      // Player actions
      setPlayer: (player) => set({ player }),
      
      updatePlayerCoins: (coins) => set((state) => ({
        player: state.player ? { ...state.player, coins } : null
      })),
      
      updatePlayerLevel: (level) => set((state) => ({
        player: state.player ? { ...state.player, level } : null
      })),
      
      updatePlayerExperience: (experience) => set((state) => ({
        player: state.player ? { ...state.player, experience } : null
      })),

      // Golem actions
      setGolems: (golems) => set({ golems }),
      
      addGolem: (golem) => set((state) => ({
        golems: [...state.golems, golem]
      })),
      
      unlockGolem: (golemId) => set((state) => ({
        golems: state.golems.map(golem => 
          golem.id === golemId 
            ? { ...golem, is_unlocked: true }
            : golem
        )
      })),
      
      setCurrentGolem: (golem) => set({ currentGolem: golem }),

      // World actions
      setWorlds: (worlds) => set({ worlds }),
      
      addWorld: (world) => set((state) => ({
        worlds: [...state.worlds, world]
      })),
      
      unlockWorld: (worldId) => set((state) => ({
        worlds: state.worlds.map(world => 
          world.id === worldId 
            ? { ...world, is_unlocked: true }
            : world
        )
      })),
      
      setCurrentWorld: (world) => set({ currentWorld: world }),

      // Ranking actions
      setRankings: (rankings) => set({ rankings }),
      
      updateRanking: (ranking) => set((state) => {
        const existingIndex = state.rankings.findIndex(
          r => r.world_id === ranking.world_id && r.player === ranking.player
        );
        
        if (existingIndex !== -1) {
          // Update existing ranking
          const newRankings = [...state.rankings];
          newRankings[existingIndex] = ranking;
          return { rankings: newRankings };
        } else {
          // Add new ranking
          return { rankings: [...state.rankings, ranking] };
        }
      }),

      // UI actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Game actions
      startGame: () => set({ gameStarted: true }),
      endGame: () => set({ gameStarted: false }),
      resetGame: () => set({ 
        currentGolem: null,
        currentWorld: null,
        gameStarted: false 
      }),

      // Utility actions
      resetStore: () => set(initialState),
    }),
    {
      name: 'golem-runner-store', // Unique name for localStorage
      partialize: (state) => ({
        // Only persist certain parts of the state
        player: state.player,
        golems: state.golems,
        worlds: state.worlds,
        currentGolem: state.currentGolem,
        currentWorld: state.currentWorld,
      }),
    }
  )
);

export default useAppStore;