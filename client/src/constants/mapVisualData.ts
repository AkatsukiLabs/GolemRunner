import ForestMap from "../assets/Maps/Forest/ForestMap.webp";
import IceMap from "../assets/Maps/Ice/IceMap.webp";
import VolcanoMap from "../assets/Maps/Volcano/VolcanoMap.webp";
import type { MapTheme } from "../components/types/game";

export const mapVisualData: Record<number, {
    name: string;
    image: string;
    description: string;
    theme: MapTheme;
}> = {
    // ID 1: Forest Map (associated with World ID 1 in the contract)
    1: {
        name: "Forest",
        image: ForestMap,
        description: "Charge through rocky woods, weaving past roots and boulders!",
        theme: "forest"
    },
    // ID 2: Volcano Map (associated with World ID 2 in the contract)
    2: {
        name: "Volcano",
        image: VolcanoMap,
        description: "Race lava flows and leap over erupting molten ground!",
        theme: "volcano"
    },
    // ID 3: Ice Map (associated with World ID 3 in the contract)
    3: {
        name: "Glacier",
        image: IceMap,
        description: "Dash through icy ruins, dodging crystals and frozen traps!",
        theme: "ice"
    }
};

// Utility function to get visual data of a map by its ID
export const getMapVisualDataById = (id: number) => {
    return mapVisualData[id] || {
        name: `Unknown Map (ID: ${id})`,
        image: ForestMap, // Default image
        description: "This map's details are missing",
        theme: "forest" as MapTheme // Default theme
    };
};