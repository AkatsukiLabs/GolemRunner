import type { Golem } from "../components/types/golem"

// Idle frames
import IceIdle0   from "../assets/IceGolem/0_Golem_Idle_000.webp"
import MossyIdle0 from "../assets/MossyGolem/0_Golem_Idle_000.webp"
import LavaIdle0  from "../assets/LavaGolem/0_Golem_Idle_000.webp"

// Run animations (12 frames per golem)
// Ice Golem
import IceRun0  from "../assets/IceGolem/Run/0_Golem_Running_000.webp"
import IceRun1  from "../assets/IceGolem/Run/0_Golem_Running_001.webp"
import IceRun2  from "../assets/IceGolem/Run/0_Golem_Running_002.webp"
import IceRun3  from "../assets/IceGolem/Run/0_Golem_Running_003.webp"
import IceRun4  from "../assets/IceGolem/Run/0_Golem_Running_004.webp"
import IceRun5  from "../assets/IceGolem/Run/0_Golem_Running_005.webp"
import IceRun6  from "../assets/IceGolem/Run/0_Golem_Running_006.webp"
import IceRun7  from "../assets/IceGolem/Run/0_Golem_Running_007.webp"
import IceRun8  from "../assets/IceGolem/Run/0_Golem_Running_008.webp"
import IceRun9  from "../assets/IceGolem/Run/0_Golem_Running_009.webp"
import IceRun10 from "../assets/IceGolem/Run/0_Golem_Running_010.webp"
import IceRun11 from "../assets/IceGolem/Run/0_Golem_Running_011.webp"

// Mossy Golem
import MossyRun0  from "../assets/MossyGolem/Run/0_Golem_Running_000.webp"
import MossyRun1  from "../assets/MossyGolem/Run/0_Golem_Running_001.webp"
import MossyRun2  from "../assets/MossyGolem/Run/0_Golem_Running_002.webp"
import MossyRun3  from "../assets/MossyGolem/Run/0_Golem_Running_003.webp"
import MossyRun4  from "../assets/MossyGolem/Run/0_Golem_Running_004.webp"
import MossyRun5  from "../assets/MossyGolem/Run/0_Golem_Running_005.webp"
import MossyRun6  from "../assets/MossyGolem/Run/0_Golem_Running_006.webp"
import MossyRun7  from "../assets/MossyGolem/Run/0_Golem_Running_007.webp"
import MossyRun8  from "../assets/MossyGolem/Run/0_Golem_Running_008.webp"
import MossyRun9  from "../assets/MossyGolem/Run/0_Golem_Running_009.webp"
import MossyRun10 from "../assets/MossyGolem/Run/0_Golem_Running_010.webp"
import MossyRun11 from "../assets/MossyGolem/Run/0_Golem_Running_011.webp"

// Lava Golem
import LavaRun0  from "../assets/LavaGolem/Run/0_Golem_Running_000.webp"
import LavaRun1  from "../assets/LavaGolem/Run/0_Golem_Running_001.webp"
import LavaRun2  from "../assets/LavaGolem/Run/0_Golem_Running_002.webp"
import LavaRun3  from "../assets/LavaGolem/Run/0_Golem_Running_003.webp"
import LavaRun4  from "../assets/LavaGolem/Run/0_Golem_Running_004.webp"
import LavaRun5  from "../assets/LavaGolem/Run/0_Golem_Running_005.webp"
import LavaRun6  from "../assets/LavaGolem/Run/0_Golem_Running_006.webp"
import LavaRun7  from "../assets/LavaGolem/Run/0_Golem_Running_007.webp"
import LavaRun8  from "../assets/LavaGolem/Run/0_Golem_Running_008.webp"
import LavaRun9  from "../assets/LavaGolem/Run/0_Golem_Running_009.webp"
import LavaRun10 from "../assets/LavaGolem/Run/0_Golem_Running_010.webp"
import LavaRun11 from "../assets/LavaGolem/Run/0_Golem_Running_011.webp"

//jump animations
import IceJump0  from "../assets/IceGolem/Jump/0_Golem_Jump Loop_000.webp"
import MossyJump0 from "../assets/MossyGolem/Jump/0_Golem_Jump Loop_000.webp"
import LavaJump0 from "../assets/LavaGolem/Jump/0_Golem_Jump Loop_000.webp"

// Default golems data
export const defaultGolems: Golem[] = [
  {
    id: 1,
    name: "Stone Golem",
    rarity: "Common",
    description: "A sturdy elemental being",
    image: MossyIdle0,
    price: 100,
    owned: false,
    animations: {
      run: [
        MossyRun0, MossyRun1, MossyRun2, MossyRun3,
        MossyRun4, MossyRun5, MossyRun6, MossyRun7,
        MossyRun8, MossyRun9, MossyRun10, MossyRun11
      ],
      jump: [MossyJump0]
    }
  },
  {
    id: 2,
    name: "Fire Golem",
    rarity: "Uncommon",
    description: "A fiery elemental being",
    image: LavaIdle0,
    price: 300,
    owned: false,
    animations: {
      run: [
        LavaRun0, LavaRun1, LavaRun2, LavaRun3,
        LavaRun4, LavaRun5, LavaRun6, LavaRun7,
        LavaRun8, LavaRun9, LavaRun10, LavaRun11
      ],
      jump: [LavaJump0]
    }
  },
  {
    id: 3,
    name: "Ice Golem",
    rarity: "Rare",
    description: "A frosty elemental being",
    image: IceIdle0,
    price: 500,
    owned: false,
    animations: {
      run: [
        IceRun0, IceRun1, IceRun2, IceRun3,
        IceRun4, IceRun5, IceRun6, IceRun7,
        IceRun8, IceRun9, IceRun10, IceRun11
      ],
      jump: [IceJump0]
    }
  }
]
