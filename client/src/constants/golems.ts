import type { Golem } from "../components/types/golem"

// Idle frames
import IceIdle0   from "../assets/IceGolem/0_Golem_Idle_000.png"
import MossyIdle0 from "../assets/MossyGolem/0_Golem_Idle_000.png"
import LavaIdle0  from "../assets/LavaGolem/0_Golem_Idle_000.png"

// Run animations (12 frames per golem)
// Ice Golem
import IceRun0  from "../assets/IceGolem/Run/0_Golem_Running_000.png"
import IceRun1  from "../assets/IceGolem/Run/0_Golem_Running_001.png"
import IceRun2  from "../assets/IceGolem/Run/0_Golem_Running_002.png"
import IceRun3  from "../assets/IceGolem/Run/0_Golem_Running_003.png"
import IceRun4  from "../assets/IceGolem/Run/0_Golem_Running_004.png"
import IceRun5  from "../assets/IceGolem/Run/0_Golem_Running_005.png"
import IceRun6  from "../assets/IceGolem/Run/0_Golem_Running_006.png"
import IceRun7  from "../assets/IceGolem/Run/0_Golem_Running_007.png"
import IceRun8  from "../assets/IceGolem/Run/0_Golem_Running_008.png"
import IceRun9  from "../assets/IceGolem/Run/0_Golem_Running_009.png"
import IceRun10 from "../assets/IceGolem/Run/0_Golem_Running_010.png"
import IceRun11 from "../assets/IceGolem/Run/0_Golem_Running_011.png"

// Mossy Golem
import MossyRun0  from "../assets/MossyGolem/Run/0_Golem_Running_000.png"
import MossyRun1  from "../assets/MossyGolem/Run/0_Golem_Running_001.png"
import MossyRun2  from "../assets/MossyGolem/Run/0_Golem_Running_002.png"
import MossyRun3  from "../assets/MossyGolem/Run/0_Golem_Running_003.png"
import MossyRun4  from "../assets/MossyGolem/Run/0_Golem_Running_004.png"
import MossyRun5  from "../assets/MossyGolem/Run/0_Golem_Running_005.png"
import MossyRun6  from "../assets/MossyGolem/Run/0_Golem_Running_006.png"
import MossyRun7  from "../assets/MossyGolem/Run/0_Golem_Running_007.png"
import MossyRun8  from "../assets/MossyGolem/Run/0_Golem_Running_008.png"
import MossyRun9  from "../assets/MossyGolem/Run/0_Golem_Running_009.png"
import MossyRun10 from "../assets/MossyGolem/Run/0_Golem_Running_010.png"
import MossyRun11 from "../assets/MossyGolem/Run/0_Golem_Running_011.png"

// Lava Golem
import LavaRun0  from "../assets/LavaGolem/Run/0_Golem_Running_000.png"
import LavaRun1  from "../assets/LavaGolem/Run/0_Golem_Running_001.png"
import LavaRun2  from "../assets/LavaGolem/Run/0_Golem_Running_002.png"
import LavaRun3  from "../assets/LavaGolem/Run/0_Golem_Running_003.png"
import LavaRun4  from "../assets/LavaGolem/Run/0_Golem_Running_004.png"
import LavaRun5  from "../assets/LavaGolem/Run/0_Golem_Running_005.png"
import LavaRun6  from "../assets/LavaGolem/Run/0_Golem_Running_006.png"
import LavaRun7  from "../assets/LavaGolem/Run/0_Golem_Running_007.png"
import LavaRun8  from "../assets/LavaGolem/Run/0_Golem_Running_008.png"
import LavaRun9  from "../assets/LavaGolem/Run/0_Golem_Running_009.png"
import LavaRun10 from "../assets/LavaGolem/Run/0_Golem_Running_010.png"
import LavaRun11 from "../assets/LavaGolem/Run/0_Golem_Running_011.png"

// Default golems data
export const defaultGolems: Golem[] = [
  {
    id: 1,
    name: "Ice Golem",
    rarity: "Epic",
    description: "A frosty brute with a heart of ice",
    image: IceIdle0,
    price: 250,
    owned: false,
    animations: {
      run: [
        IceRun0, IceRun1, IceRun2, IceRun3,
        IceRun4, IceRun5, IceRun6, IceRun7,
        IceRun8, IceRun9, IceRun10, IceRun11
      ],
      jump: [IceRun0,IceRun1, IceRun2]
    }
  },
  {
    id: 2,
    name: "Mossy Golem",
    rarity: "Rare",
    description: "Overgrown with ancient moss",
    image: MossyIdle0,
    price: 100,
    owned: false,
    animations: {
      run: [
        MossyRun0, MossyRun1, MossyRun2, MossyRun3,
        MossyRun4, MossyRun5, MossyRun6, MossyRun7,
        MossyRun8, MossyRun9, MossyRun10, MossyRun11
      ],
      jump: [MossyRun0,MossyRun1, MossyRun2]
    }
  },
  {
    id: 3,
    name: "Lava Golem",
    rarity: "Epic",
    description: "Born in the molten core",
    image: LavaIdle0,
    price: 500,
    owned: false,
    animations: {
      run: [
        LavaRun0, LavaRun1, LavaRun2, LavaRun3,
        LavaRun4, LavaRun5, LavaRun6, LavaRun7,
        LavaRun8, LavaRun9, LavaRun10, LavaRun11
      ],
      jump: [LavaRun0,LavaRun1, LavaRun2]
    }
  },
  {
    id: 4,
    name: "Stone Golem",
    rarity: "Common",
    description: "Unbreakable rock shield",
    image: LavaIdle0, // placeholder, ajustar luego
    price: 100,
    owned: true,
    animations: {
      run: [],
      jump: []
    }
  }
]
