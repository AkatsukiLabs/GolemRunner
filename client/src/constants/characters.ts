import IceIdle0 from "../assets/IceGolem/0_Golem_Idle_000.webp";
import FireIdle0 from "../assets/LavaGolem/0_Golem_Idle_000.webp";
import StoneIdle0 from "../assets/MossyGolem/0_Golem_Idle_000.webp";

export const golemVisualData: Record<number, {
  name: string;
  rarity: string;
  description: string;
  image: string;
}> = {
  // ID 1: Stone Golem - Starter, Unlocked (true, true)
  1: {
    name: "Stone Golem",
    rarity: "Common", 
    description: "A sturdy elemental being",
    image: StoneIdle0
  },
  // ID 2: Fire Golem - Not Starter, Locked (false, false)
  2: {
    name: "Fire Golem",
    rarity: "Uncommon", 
    description: "A fiery elemental being",
    image: FireIdle0
  },
  // ID 3: Ice Golem - Not Starter, Locked (false, false)
  3: {
    name: "Ice Golem",
    rarity: "Rare", 
    description: "A frosty elemental being",
    image: IceIdle0
  }
};

// For compatibility with existing code
export const characters = Object.entries(golemVisualData).map(([id, data]) => ({
  id: parseInt(id),
  ...data
}));

// Utility function to get the visual data of a golem by its ID
export const getGolemVisualDataById = (id: number) => {
  return golemVisualData[id] || {
    name: `Unknown Golem (ID: ${id})`,
    rarity: "Unknown",
    description: "This golem's details are missing",
    image: StoneIdle0 // Default image
  };
};
