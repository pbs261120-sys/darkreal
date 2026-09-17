/**
 * 100 Days Below - Game Data & Definitions
 * 장비, 카드, 바이옴, 적 엔티티 데이터 정의
 */

const EQUIPMENT_DATA = {
  // 주무기 (Primary Weapons - 마우스 조준 방향으로 회전 결합)
  drill: {
    id: "drill",
    name: "휴대용 채굴 드릴",
    slot: "PRIMARY",
    cost: 90,
    desc: "초근접 초고속 연타 분쇄 무기. 적을 관통하며 강력한 넉백을 가합니다.",
    stats: { atk: 14, fireRate: 0.1, range: 75, knockback: 6, spread: 0.35, projectileType: "drill" },
    visual: {
      type: "drill",
      color: "#ffaa33",
      tipColor: "#cccccc",
      length: 26,
      width: 8
    }
  },
  flamethrower: {
    id: "flamethrower",
    name: "개조된 화염방사기",
    slot: "PRIMARY",
    cost: 140,
    desc: "전방 부채꼴로 지속적인 화염 입자를 방사하여 좁은 통로를 봉쇄합니다.",
    stats: { atk: 6, fireRate: 0.06, range: 180, knockback: 1, spread: 0.45, projectileType: "flame" },
    visual: {
      type: "flamethrower",
      color: "#dd4422",
      pilotColor: "#ff7700",
      length: 28,
      width: 7
    }
  },
  shotgun: {
    id: "shotgun",
    name: "압축 충격 샷건",
    slot: "PRIMARY",
    cost: 180,
    desc: "6발의 무거운 펠릿 탄환을 일제히 발사해 적을 날려버립니다.",
    stats: { atk: 28, fireRate: 0.75, range: 240, knockback: 12, spread: 0.5, pellets: 6, projectileType: "shotgun" },
    visual: {
      type: "shotgun",
      color: "#556677",
      tipColor: "#223344",
      length: 30,
      width: 9
    }
  },
  acid_gun: {
    id: "acid_gun",
    name: "생체 산성총",
    slot: "PRIMARY",
    cost: 220,
    desc: "괴물의 부식성 체액을 쏘아 바닥에 산성 웅덩이를 형성하고 방어구를 녹입니다.",
    stats: { atk: 18, fireRate: 0.35, range: 260, knockback: 2, spread: 0.15, projectileType: "acid" },
    visual: {
      type: "acid_gun",
      color: "#44bb22",
      vialColor: "#88ff33",
      length: 25,
      width: 8
    }
  },

  // 보조장비 (Sub-Equipment - 반대편 손/어깨 결합)
  flashlight: {
    id: "flashlight",
    name: "고출력 투광등",
    slot: "SUB",
    cost: 70,
    desc: "전방 시야각을 대폭 확장하고 어둠 속 적의 접근을 조기에 포착합니다.",
    stats: { lightBonus: 100, lightAngleBonus: 0.5 },
    visual: {
      type: "flashlight",
      color: "#ffffaa",
      bodyColor: "#444455"
    }
  },
  taser: {
    id: "taser",
    name: "강화 전기 충격기",
    slot: "SUB",
    cost: 130,
    desc: "근접한 적에게 자동으로 고전압 스파크를 방전하여 1초간 기절시킵니다.",
    stats: { zapDamage: 25, zapRange: 90, zapCooldown: 3.5 },
    visual: {
      type: "taser",
      color: "#33ddff",
      bodyColor: "#334455"
    }
  },

  // 방어구 (Body Armor - 몸통 오버레이 렌더링)
  heavy_welder: {
    id: "heavy_welder",
    name: "용접공 중장갑",
    slot: "ARMOR",
    cost: 160,
    desc: "두꺼운 철판으로 감싸 물리 피해를 35% 줄이고 피격 넉백에 완전 면역이 됩니다.",
    stats: { dmgReduction: 0.35, speedMult: 0.88, knockbackImmune: true },
    visual: {
      type: "heavy_welder",
      plateColor: "#667788",
      trimColor: "#ff9900"
    }
  },
  chitin_armor: {
    id: "chitin_armor",
    name: "키틴질 괴수 갑각",
    slot: "ARMOR",
    cost: 210,
    desc: "처치한 괴수의 껍질로 만든 흉측한 갑옷. 피격 시 주변에 날카로운 가시를 반사합니다.",
    stats: { dmgReduction: 0.2, thornDamage: 30, speedMult: 1.05 },
    visual: {
      type: "chitin_armor",
      plateColor: "#551133",
      trimColor: "#aa2266"
    }
  },

  // 코어 파츠 (Power Core - 등 뒤 발광 코어 및 오라)
  pulse_core: {
    id: "pulse_core",
    name: "방사능 펄스 코어",
    slot: "CORE",
    cost: 150,
    desc: "신경 펄스(카드 마나)의 회복 속도를 50% 가속시킵니다.",
    stats: { pulseRegenMult: 1.5 },
    visual: {
      type: "pulse_core",
      auraColor: "rgba(37, 226, 76, 0.4)",
      coreColor: "#25e24c"
    }
  },
  spark_battery: {
    id: "spark_battery",
    name: "스파크 절전 배터리",
    slot: "CORE",
    cost: 170,
    desc: "손상된 시설용 전지를 개조한 보조 코어. 배터리 소모량을 절반으로 줄입니다.",
    stats: { batteryDrainMult: 0.5 },
    visual: {
      type: "spark_battery",
      auraColor: "rgba(255, 190, 40, 0.35)",
      coreColor: "#ffbb33"
    }
  },
  charge_core: {
    id: "charge_core",
    name: "비상 급속 충전코어",
    slot: "CORE",
    cost: 160,
    desc: "예비 전력을 저장하는 코어. 배터리 소모를 30% 줄이고, 방전 시 배터리를 100% 즉시 자동 충전합니다.",
    stats: { batteryDrainMult: 0.7, autoRecharge: true },
    visual: {
      type: "charge_core",
      auraColor: "rgba(50, 200, 255, 0.45)",
      coreColor: "#33eeff"
    }
  },
  // [엔티티 고유 드롭 전용 특별 장비]
  miner_pickaxe: {
    id: "miner_pickaxe",
    name: "침식된 전기 곡괭이",
    slot: "PRIMARY",
    cost: 160,
    desc: "[침식된 광부 드롭] 암반을 부수던 고전압 곡괭이. 적을 강타할 때마다 연쇄 전기 충격파가 방전됩니다.",
    stats: { atk: 32, fireRate: 0.3, range: 90, knockback: 8, spread: 0.2, projectileType: "pickaxe" },
    visual: {
      type: "pickaxe",
      color: "#2288aa",
      tipColor: "#33eeff",
      length: 28,
      width: 7
    },
    isDropOnly: true
  },
  bio_gauntlet: {
    id: "bio_gauntlet",
    name: "생체 도약 건틀릿",
    slot: "PRIMARY",
    cost: 210,
    desc: "[도약 배양체 드롭] 괴수의 근섬유로 엮은 건틀릿. 초고속 연속 음파 펀치와 함께 캐릭터 이동속도가 15% 상승합니다.",
    stats: { atk: 22, fireRate: 0.08, range: 110, knockback: 4, spread: 0.25, projectileType: "gauntlet", speedBonus: 1.15 },
    visual: {
      type: "gauntlet",
      color: "#aa2266",
      tipColor: "#ff0066",
      length: 22,
      width: 10
    },
    isDropOnly: true
  },
  cutter_disc: {
    id: "cutter_disc",
    name: "고속 회전 톱날",
    slot: "PRIMARY",
    cost: 260,
    desc: "[폭주 절단 드론 드롭] 벽면에 튕기며 적을 절단하는 고속 회전 원형 톱날을 투척합니다.",
    stats: { atk: 36, fireRate: 0.45, range: 450, knockback: 5, spread: 0.1, projectileType: "cutter" },
    visual: {
      type: "cutter",
      color: "#8899aa",
      tipColor: "#ff2233",
      length: 24,
      width: 12
    },
    isDropOnly: true
  },
  titan_plating: {
    id: "titan_plating",
    name: "골렘 타이탄 장갑판",
    slot: "ARMOR",
    cost: 280,
    desc: "[폐철 골렘 드롭] 폐철 골렘의 흉부 장갑판. 물리 피해를 50% 줄이고 완전 넉백 면역을 부여합니다.",
    stats: { dmgReduction: 0.50, speedMult: 0.85, knockbackImmune: true },
    visual: {
      type: "titan_plating",
      plateColor: "#443828",
      trimColor: "#ffaa00"
    },
    isDropOnly: true
  },
  flesh_whip: {
    id: "flesh_whip",
    name: "피의 촉수 채찍",
    slot: "PRIMARY",
    cost: 320,
    desc: "[살점 추적자 드롭] 살아 꿈틀거리는 피의 촉수. 적을 타격하여 끌어당기고 HP를 2 흡혈합니다.",
    stats: { atk: 38, fireRate: 0.28, range: 160, knockback: -5, spread: 0.2, lifesteal: 2, projectileType: "whip" },
    visual: {
      type: "whip",
      color: "#990022",
      tipColor: "#ff2244",
      length: 30,
      width: 6
    },
    isDropOnly: true
  },
  void_cannon: {
    id: "void_cannon",
    name: "공허의 특이점 총",
    slot: "PRIMARY",
    cost: 450,
    desc: "[무형의 심연체 드롭] 현실을 일그러뜨리는 중력 특이점 탄환을 발사해 주변 적을 중심부로 빨아들이며 붕괴시킵니다.",
    stats: { atk: 65, fireRate: 0.8, range: 420, knockback: 0, spread: 0.05, blackhole: true, projectileType: "void" },
    visual: {
      type: "void_cannon",
      color: "#220533",
      tipColor: "#cc33ff",
      length: 32,
      width: 11
    },
    isDropOnly: true
  }
};

// 2단 강화 설정
const UPGRADE_CONFIG = {
  LEVEL_1: {
    suffix: "+",
    statMult: 1.45,
    costMult: 0.75,
    color: "#ffcc00",
    name: "1단 강화 (+)"
  },
  LEVEL_2: {
    suffix: "++",
    statMult: 2.10,
    costMult: 1.50,
    color: "#d044ff",
    name: "최대 2단 강화 (++)"
  }
};

const CARDS_DATA = [
  {
    id: "card_thrust",
    name: "급소 관통",
    type: "ASSAULT",
    pulseCost: 25,
    cooldown: 2.0,
    desc: "마우스 방향으로 고속 돌진 충격파를 날려 경로상의 모든 적을 관통합니다.",
    baseVal: 45,
    tier: 1
  },
  {
    id: "card_shield",
    name: "생체 방어막",
    type: "SURVIVAL",
    pulseCost: 35,
    cooldown: 6.0,
    desc: "4초간 피해를 흡수하는 방어막을 생성하고 주위 적을 강하게 밀쳐냅니다.",
    baseVal: 4,
    tier: 1
  },
  {
    id: "card_shock",
    name: "신경 마비 방전",
    type: "TACTICS",
    pulseCost: 40,
    cooldown: 5.0,
    desc: "자신을 중심으로 360도 강력한 EMP를 방출해 반경 내 모든 적을 2초간 기절시킵니다.",
    baseVal: 30,
    tier: 1
  },
  {
    id: "card_flesh_burst",
    name: "살점 과부하",
    type: "MUTATION",
    pulseCost: 15,
    hpCost: 10,
    cooldown: 3.5,
    desc: "자신의 HP 10을 희생하여 전방위로 폭발하는 12가닥의 피의 촉수를 발사합니다.",
    baseVal: 70,
    tier: 1
  },
  {
    id: "card_overcharge",
    name: "배터리 과충전",
    type: "SURVIVAL",
    pulseCost: 20,
    cooldown: 7.0,
    desc: "조명 배터리를 즉시 +40 충전하고, 눈이 멀 정도의 섬광으로 적을 실명시킵니다.",
    baseVal: 40,
    tier: 1
  }
];

const BIOMES = [
  {
    range: [1, 25],
    name: "동굴 상층 침식 갱도 & 침수 구역",
    subTitle: "석회암 동굴 속에 묻힌 초기 채굴 시설",
    bgColor: "#0a0f0d",
    rockColor: "#18221b",
    concreteColor: "#223028",
    accentColor: "#3d5546",
    hazardColor: "#ffaa00",
    lampColor: "#ffaa33",
    enemyTypes: ["crawler_rat", "acid_slug", "miner_corpse"]
  },
  {
    range: [26, 50],
    name: "암반 균열 폐쇄 연구소",
    subTitle: "동굴 낙석으로 붕괴된 제4격리 생체 연구동",
    bgColor: "#091214",
    rockColor: "#152428",
    concreteColor: "#1c3238",
    accentColor: "#255a60",
    hazardColor: "#33ffaa",
    lampColor: "#19d4e6",
    enemyTypes: ["acid_slug", "bio_leaper", "exploder_specimen"]
  },
  {
    range: [51, 75],
    name: "동굴 심층 폐기 기계 구역",
    subTitle: "거대 지하 동공에 방치된 중장비 시설과 전력실",
    bgColor: "#120f0a",
    rockColor: "#282015",
    concreteColor: "#352b1e",
    accentColor: "#6e5230",
    hazardColor: "#ff8800",
    lampColor: "#ff9900",
    enemyTypes: ["cutter_drone", "scraptitan", "exploder_specimen"]
  },
  {
    range: [76, 99],
    name: "살점 침식 최심부 격벽 구역",
    subTitle: "기괴한 생체 조직에 집어삼켜진 최후의 방벽",
    bgColor: "#14090c",
    rockColor: "#2b1218",
    concreteColor: "#381820",
    accentColor: "#752230",
    hazardColor: "#ff2244",
    lampColor: "#ff3344",
    enemyTypes: ["flesh_stalker", "abyss_horror", "bio_leaper"]
  },
  {
    range: [100, 100],
    name: "심연의 핵 - 거대 동굴 공동",
    subTitle: "모든 지하시설을 붕괴시킨 거대 심연체의 둥지",
    bgColor: "#080306",
    rockColor: "#1f0a12",
    concreteColor: "#2e0e1a",
    accentColor: "#ff2233",
    lampColor: "#ff1122",
    isBossFloor: true
  }
];

// 몬스터 등급 체계 (식물/나무 컨셉)
const MONSTER_GRADES = {
  FRUIT: { id: "FRUIT", name: "열매", rank: 1, desc: "가장 쉬움", color: "#66dd77", badgeBg: "rgba(60, 200, 80, 0.25)" },
  LEAF: { id: "LEAF", name: "잎", rank: 2, desc: "쉬움", color: "#44ccbb", badgeBg: "rgba(40, 190, 170, 0.25)" },
  BRANCH: { id: "BRANCH", name: "나뭇가지", rank: 3, desc: "보통", color: "#ffaa33", badgeBg: "rgba(240, 160, 40, 0.25)" },
  ROOT: { id: "ROOT", name: "뿌리", rank: 4, desc: "어려움", color: "#ff4444", badgeBg: "rgba(230, 50, 50, 0.25)" },
  TREE_OF_LIFE: { id: "TREE_OF_LIFE", name: "생명의 나무", rank: 5, desc: "매우 어려움", color: "#d044ff", badgeBg: "rgba(190, 50, 240, 0.3)" }
};

const ENEMY_DEFS = {
  crawler_rat: {
    name: "감염된 쥐 떼",
    grade: MONSTER_GRADES.FRUIT, // 가장쉬움 > 열매
    hp: 25,
    speed: 130,
    size: 12,
    color: "#6b7762",
    eyeColor: "#ff2200",
    damage: 8,
    attackPattern: 'swarm',
    scrapDrop: 12,
    dropItemKey: null,
    dropRate: 0
  },
  acid_slug: {
    name: "부식 유충",
    grade: MONSTER_GRADES.LEAF, // 쉬움 > 잎
    hp: 40,
    speed: 60,
    size: 16,
    color: "#448833",
    eyeColor: "#88ff33",
    damage: 14,
    spitsAcid: true,
    attackPattern: 'acid',
    scrapDrop: 18,
    dropItemKey: null,
    dropRate: 0
  },
  miner_corpse: {
    name: "침식된 광부",
    grade: MONSTER_GRADES.LEAF, // 쉬움 > 잎
    hp: 75,
    speed: 85,
    size: 18,
    color: "#3a4a50",
    eyeColor: "#00ffcc",
    damage: 18,
    attackPattern: 'charge',
    scrapDrop: 25,
    dropItemKey: "miner_pickaxe",
    dropRate: 0.35 // 35% 확률로 특별 전기 곡괭이 드롭!
  },
  bio_leaper: {
    name: "도약 배양체",
    grade: MONSTER_GRADES.BRANCH, // 보통 > 나뭇가지
    hp: 95,
    speed: 150,
    size: 20,
    color: "#773355",
    eyeColor: "#ff0066",
    damage: 22,
    attackPattern: 'leap',
    scrapDrop: 32,
    dropItemKey: "bio_gauntlet",
    dropRate: 0.30 // 30% 확률로 생체 도약 건틀릿 드롭!
  },
  exploder_specimen: {
    name: "자폭 포자체",
    grade: MONSTER_GRADES.BRANCH, // 보통 > 나뭇가지
    hp: 50,
    speed: 110,
    size: 17,
    color: "#aa6600",
    eyeColor: "#ffff00",
    damage: 45,
    explodesOnDeath: true,
    attackPattern: 'explode',
    scrapDrop: 28,
    dropItemKey: null,
    dropRate: 0
  },
  cutter_drone: {
    name: "폭주 절단 드론",
    grade: MONSTER_GRADES.ROOT, // 어려움 > 뿌리
    hp: 110,
    speed: 140,
    size: 19,
    color: "#8899aa",
    eyeColor: "#ff1122",
    damage: 26,
    attackPattern: 'ranged',
    scrapDrop: 40,
    dropItemKey: "cutter_disc",
    dropRate: 0.35 // 35% 확률로 회전 톱날 발사기 드롭!
  },
  scraptitan: {
    name: "폐철 골렘",
    grade: MONSTER_GRADES.ROOT, // 어려움 > 뿌리
    hp: 220,
    speed: 50,
    size: 28,
    color: "#554433",
    eyeColor: "#ffaa00",
    damage: 38,
    attackPattern: 'shockwave',
    scrapDrop: 60,
    dropItemKey: "titan_plating",
    dropRate: 0.40 // 40% 확률로 타이탄 장갑판 방어구 드롭!
  },
  flesh_stalker: {
    name: "살점 추적자",
    grade: MONSTER_GRADES.ROOT, // 어려움 > 뿌리
    hp: 180,
    speed: 160,
    size: 22,
    color: "#881133",
    eyeColor: "#ff0044",
    damage: 32,
    attackPattern: 'dash',
    scrapDrop: 55,
    dropItemKey: "flesh_whip",
    dropRate: 0.35 // 35% 확률로 피의 촉수 채찍 드롭!
  },
  abyss_horror: {
    name: "무형의 심연체",
    grade: MONSTER_GRADES.TREE_OF_LIFE, // 매우어려움 > 생명의 나무
    hp: 260,
    speed: 95,
    size: 26,
    color: "#1c0a28",
    eyeColor: "#cc33ff",
    damage: 42,
    attackPattern: 'ranged',
    scrapDrop: 75,
    dropItemKey: "void_cannon",
    dropRate: 0.50 // 50% 확률로 공허의 특이점 총 드롭!
  }
};

// 괴물 생태 도감 / 조사 노트 (Research Notes Database)
const BESTIARY_DATA = {
  crawler_rat: {
    id: "crawler_rat",
    name: "감염된 쥐 떼",
    grade: MONSTER_GRADES.FRUIT,
    biome: "상층 침식 갱도 (Day 1~25)",
    desc: "검은 피에 절어 흉포하게 굶주린 지하 설치류. 무리를 지어 빠르게 돌진해오며 물어뜯습니다.",
    weakness: "단발 체력은 극도로 낮으므로 범위 화염방사기나 관통 공격으로 한 번에 소탕하는 것이 유리합니다.",
    dropInfo: "고유 장비 없음 (고철 소량 드롭)"
  },
  acid_slug: {
    id: "acid_slug",
    name: "부식 유충",
    grade: MONSTER_GRADES.LEAF,
    biome: "상층 침식 갱도 / 연구소 (Day 1~50)",
    desc: "동굴 축축한 암반 바닥을 기어 다니며 원거리에서 부식성 산성 체액을 뱉어내는 끈적한 유충.",
    weakness: "이동속도가 매우 느립니다. 거리를 벌려 조준 사격하거나 관통 스킬로 안전하게 제압하십시오.",
    dropInfo: "고유 장비 없음 (부식액 샘플)"
  },
  miner_corpse: {
    id: "miner_corpse",
    name: "침식된 광부",
    grade: MONSTER_GRADES.LEAF,
    biome: "상층 침식 갱도 (Day 1~25)",
    desc: "지하 갱도에 갇혀 죽어간 광부의 시신에 기계 전선과 유기물이 엉겨 붙어 다시 일어난 괴물.",
    weakness: "손에 쥔 고전압 채굴 공구로 강타해옵니다. 측면 회피 후 등을 공격하십시오.",
    dropInfo: "★ 특별 전리품: [침식된 전기 곡괭이] (35% 확률 드롭)"
  },
  bio_leaper: {
    id: "bio_leaper",
    name: "도약 배양체",
    grade: MONSTER_GRADES.BRANCH,
    biome: "폐쇄 연구소 / 살점 동굴 (Day 26~99)",
    desc: "강화된 근육 섬유를 가진 인공 배양 변이체. 거리를 좁히며 폭발적인 도약 돌진 공격을 가합니다.",
    weakness: "도약 직전 짧은 준비 모션이 있습니다. 타이밍에 맞춰 방어막 카드를 켜거나 기절을 거십시오.",
    dropInfo: "★ 특별 전리품: [생체 도약 건틀릿] (30% 확률 드롭)"
  },
  exploder_specimen: {
    id: "exploder_specimen",
    name: "자폭 포자체",
    grade: MONSTER_GRADES.BRANCH,
    biome: "폐쇄 연구소 / 기계 묘지 (Day 26~75)",
    desc: "불안정한 가스를 체내에 응축한 팽창체. 체력이 바닥나면 8방향으로 날카로운 가시를 뿜으며 자폭합니다.",
    weakness: "절대 근접에서 처치하지 마십시오! 원거리 사격으로 제거 후 튀는 가시를 회피하십시오.",
    dropInfo: "고유 장비 없음 (위험 자폭 물질)"
  },
  cutter_drone: {
    id: "cutter_drone",
    name: "폭주 절단 드론",
    grade: MONSTER_GRADES.ROOT,
    biome: "동굴 심층 기계 묘지 (Day 51~75)",
    desc: "채굴용 산업 드론이 오염되어 회전 톱날을 고속으로 돌리며 생존자를 무자비하게 쫓아옵니다.",
    weakness: "기계류 특성상 [신경 마비 방전 (EMP)] 및 전기 속성에 치명적인 스턴 피해를 입습니다.",
    dropInfo: "★ 특별 전리품: [고속 회전 톱날] (35% 확률 드롭)"
  },
  scraptitan: {
    id: "scraptitan",
    name: "폐철 골렘",
    grade: MONSTER_GRADES.ROOT,
    biome: "동굴 심층 기계 묘지 (Day 51~75)",
    desc: "버려진 중장비 차체와 철골이 융합한 육중한 기계 골렘. 넉백에 면역이며 강력한 펀치를 내리칩니다.",
    weakness: "공격 속도와 선회력이 매우 느립니다. 주변을 원형으로 돌며 지속 화력을 쏟아부으십시오.",
    dropInfo: "★ 특별 전리품: [골렘 타이탄 장갑판] (40% 확률 드롭)"
  },
  flesh_stalker: {
    id: "flesh_stalker",
    name: "살점 추적자",
    grade: MONSTER_GRADES.ROOT,
    biome: "살점 침식 최심부 격벽 (Day 76~99)",
    desc: "생체 조직으로 이루어진 날렵하고 거대한 육식 맹수. 뱀처럼 빠르게 기어와 촉수로 생체 에너지를 갈취합니다.",
    weakness: "화염과 산성에 매우 취약합니다. 화염방사기나 지속 피해 장판을 깔아 이동 경로를 차단하십시오.",
    dropInfo: "★ 특별 전리품: [피의 촉수 채찍] (35% 확률 드롭)"
  },
  abyss_horror: {
    id: "abyss_horror",
    name: "무형의 심연체",
    grade: MONSTER_GRADES.TREE_OF_LIFE,
    biome: "살점 침식 최심부 격벽 (Day 76~99)",
    desc: "시공간을 왜곡시키는 최고위 위험 엔티티. 주변의 빛을 흡수하며 치명적인 암흑 중력탄을 방출합니다.",
    weakness: "모든 최고 티어 공격 카드와 강화된 주무기를 총동원하여 빠르게 점사하지 않으면 제압이 불가능합니다.",
    dropInfo: "★ 전설 전리품: [공허의 특이점 총] (50% 확률 드롭)"
  },
  boss_behemoth: {
    id: "boss_behemoth",
    name: "심연의 지배자 - 베히모스",
    grade: MONSTER_GRADES.TREE_OF_LIFE,
    biome: "심연의 핵 (Day 100)",
    desc: "100일간 지하로 파고든 끝에 도달한 최하층 전체를 집어삼킨 고대 심연체. 3단계에 걸쳐 분쇄 공격을 가합니다.",
    weakness: "Phase 1에서 양팔 관절을 먼저 파괴하고, Phase 2에서 노출된 기계 심장 코어를 집중 공격하십시오.",
    dropInfo: "심연의 비밀 데이터 회수 및 100일 생존 완료"
  }
};

const ENTITY_COMBAT_DATA = {
  crawler_rat: { name: '군집 돌진', guide: '짧은 간격으로 물어뜯습니다. 여러 마리가 붙기 전 관통 공격으로 정리하십시오.' },
  acid_slug: { name: '산성 침', guide: '거리를 두면 산성 탄환을 발사합니다. 탄환을 옆으로 피하고 계속 이동하십시오.' },
  miner_corpse: { name: '전기 곡괭이 돌진', guide: '중거리에서 직선 돌진합니다. 준비 동작이 보이면 측면으로 벗어나십시오.' },
  bio_leaper: { name: '도약 강습', guide: '일정 거리에서 빠르게 도약합니다. 방어막 또는 EMP로 도약을 끊을 수 있습니다.' },
  exploder_specimen: { name: '사망 자폭', guide: '처치 순간 8방향 가시가 퍼집니다. 마지막 타격 전 거리를 벌리십시오.' },
  cutter_drone: { name: '절단 디스크', guide: '원거리에서 회전 절단탄을 발사합니다. EMP로 기절시킨 뒤 접근하십시오.' },
  scraptitan: { name: '지면 분쇄', guide: '근거리에서 충격파를 일으킵니다. 느린 이동속도를 이용해 원을 그리며 공격하십시오.' },
  flesh_stalker: { name: '혈육 질주', guide: '중거리에서 급가속 돌진합니다. 돌진 경로를 피한 직후가 반격 기회입니다.' },
  abyss_horror: { name: '심연 탄막', guide: '주기적으로 어둠 탄환을 발사합니다. 계속 움직이며 집중 화력으로 빠르게 제거하십시오.' },
  boss_behemoth: { name: '3단계 심연 붕괴', guide: '양팔을 먼저 파괴하고, 노출된 코어를 집중 공격하십시오.' }
};

Object.keys(BESTIARY_DATA).forEach((id) => {
  BESTIARY_DATA[id].guideKills = id === 'boss_behemoth' ? 1 : 3;
  BESTIARY_DATA[id].pattern = ENTITY_COMBAT_DATA[id];
});

const LORE_DATA = [
  { title: '심연 하강 기록 01', unlockDay: 1, text: '지상 관제는 폐광 아래에서 비정상적인 생체 신호를 포착했다. 구조대는 돌아오지 않았고, 하강 장비만 녹슨 채 회수되었다.' },
  { title: '폐쇄 연구소의 유산', unlockDay: 26, text: '연구소는 지하 생명체를 무기화하려 했다. 격리 문은 안에서부터 찢겼으며, 실험 기록의 마지막 문장은 “나무가 자란다”였다.' },
  { title: '기계 묘지의 전력', unlockDay: 51, text: '시설 전체가 멈춘 뒤에도 일부 채굴기는 움직였다. 전력은 케이블이 아니라, 벽 너머의 살아 있는 조직에서 공급되고 있었다.' },
  { title: '생명의 나무', unlockDay: 76, text: '최심부의 살점은 뿌리처럼 모든 구역을 연결한다. 괴물들은 서로 다른 종이 아니라, 하나의 거대한 의식이 만든 가지일지 모른다.' },
  { title: '심연의 핵', unlockDay: 100, text: '최하층에는 나무의 심장이 있다. 그것을 파괴하면 하강은 끝나지만, 지상에 남은 뿌리까지 죽는지는 알 수 없다.' }
];
