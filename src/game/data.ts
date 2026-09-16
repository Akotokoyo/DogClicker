export type BuildingId =
  | 'paw'
  | 'sitter'
  | 'walker'
  | 'park'
  | 'groomer'
  | 'shop'
  | 'school'
  | 'shelter'
  | 'yacht'
  | 'timeMachine'
  | 'starship'
  | 'dogPlanet'
  | 'rainbowBridge'

export type Building = {
  id: BuildingId
  emoji: string
  baseCost: number
  cps: number
  unlockAt: number
}

export const BUILDINGS: Building[] = [
  { id: 'paw', emoji: '🐾', baseCost: 15, cps: 0.1, unlockAt: 0 },
  { id: 'sitter', emoji: '🧑‍🦱', baseCost: 100, cps: 1, unlockAt: 25 },
  { id: 'walker', emoji: '🦮', baseCost: 1_100, cps: 8, unlockAt: 500 },
  { id: 'park', emoji: '🌳', baseCost: 12_000, cps: 47, unlockAt: 5_000 },
  { id: 'groomer', emoji: '🫧', baseCost: 130_000, cps: 260, unlockAt: 50_000 },
  { id: 'shop', emoji: '🦴', baseCost: 1_400_000, cps: 1_400, unlockAt: 500_000 },
  { id: 'school', emoji: '🎓', baseCost: 20_000_000, cps: 7_800, unlockAt: 5_000_000 },
  { id: 'shelter', emoji: '🏡', baseCost: 330_000_000, cps: 44_000, unlockAt: 100_000_000 },
  { id: 'yacht', emoji: '🛥️', baseCost: 5_100_000_000, cps: 260_000, unlockAt: 1_000_000_000 },
  { id: 'timeMachine', emoji: '🕰️', baseCost: 75_000_000_000, cps: 1_600_000, unlockAt: 15_000_000_000 },
  { id: 'starship', emoji: '🚀', baseCost: 1_000_000_000_000, cps: 10_000_000, unlockAt: 200_000_000_000 },
  { id: 'dogPlanet', emoji: '🪐', baseCost: 14_000_000_000_000, cps: 65_000_000, unlockAt: 3_000_000_000_000 },
  { id: 'rainbowBridge', emoji: '🌈', baseCost: 200_000_000_000_000, cps: 430_000_000, unlockAt: 40_000_000_000_000 },
]

export const emptyBuildings = Object.fromEntries(
  BUILDINGS.map(({ id }) => [id, 0]),
) as Record<BuildingId, number>

export type Upgrade = {
  id: string
  emoji: string
  price: number
  unlockAt: number
  kind: 'click' | 'clickCps' | 'all' | 'building'
  multiplier: number
  buildingId?: BuildingId
  requiredOwned?: number
}

const CLICK_UPGRADES: Upgrade[] = [
  { id: 'soft-glove', emoji: '🧤', price: 100, unlockAt: 50, kind: 'click', multiplier: 2 },
  { id: 'magic-treat', emoji: '🥓', price: 100_000, unlockAt: 50_000, kind: 'click', multiplier: 5 },
]

const EXTRA_CLICK_UPGRADES: Upgrade[] = [
  { id: 'double-pat', emoji: '👐', price: 250, unlockAt: 500, kind: 'click', multiplier: 2 },
  { id: 'trained-hands', emoji: '🙌', price: 2_500, unlockAt: 5_000, kind: 'clickCps', multiplier: 0.01 },
  { id: 'turbo-pats', emoji: '⚡', price: 250_000, unlockAt: 500_000, kind: 'click', multiplier: 3 },
  { id: 'cuddle-technique', emoji: '🎯', price: 2_500_000, unlockAt: 5_000_000, kind: 'clickCps', multiplier: 0.02 },
  { id: 'four-paws-method', emoji: '🐾', price: 250_000_000, unlockAt: 500_000_000, kind: 'click', multiplier: 4 },
  { id: 'quantum-pat', emoji: '🔬', price: 2_500_000_000, unlockAt: 5_000_000_000, kind: 'clickCps', multiplier: 0.03 },
  { id: 'cosmic-hands', emoji: '🌌', price: 250_000_000_000, unlockAt: 500_000_000_000, kind: 'click', multiplier: 5 },
  { id: 'astral-caress', emoji: '✨', price: 25_000_000_000_000, unlockAt: 50_000_000_000_000, kind: 'clickCps', multiplier: 0.05 },
]

export const GENERATOR_UPGRADE_TIERS = [
  { requiredOwned: 10, priceMultiplier: 10, prefix: 'kit', emoji: '🧰' },
  { requiredOwned: 25, priceMultiplier: 100, prefix: 'squad', emoji: '⭐' },
  { requiredOwned: 50, priceMultiplier: 1_000, prefix: 'mastery', emoji: '🏅' },
] as const

export type GeneratorPrefix = (typeof GENERATOR_UPGRADE_TIERS)[number]['prefix']

const GENERATOR_UPGRADES: Upgrade[] = BUILDINGS.flatMap((building) =>
  GENERATOR_UPGRADE_TIERS.map((tier, index) => ({
    id:
      index === 0 && building.id === 'sitter'
        ? 'sitter-course'
        : index === 0 && building.id === 'walker'
          ? 'happy-leash'
          : `${building.id}-generator-${index + 1}`,
    emoji: tier.emoji,
    price: building.baseCost * tier.priceMultiplier,
    unlockAt: building.unlockAt,
    kind: 'building' as const,
    multiplier: 2,
    buildingId: building.id,
    requiredOwned: tier.requiredOwned,
  })),
)

const GLOBAL_UPGRADES: Upgrade[] = [
  { id: 'pack-spirit', emoji: '🐕', price: 500, unlockAt: 1_000, kind: 'all', multiplier: 1.05 },
  { id: 'cuddle-routine', emoji: '📅', price: 5_000, unlockAt: 10_000, kind: 'all', multiplier: 1.05 },
  { id: 'group-hug', emoji: '💞', price: 25_000, unlockAt: 10_000, kind: 'all', multiplier: 1.25 },
  { id: 'park-festival', emoji: '🎈', price: 50_000, unlockAt: 100_000, kind: 'all', multiplier: 1.07 },
  { id: 'dog-network', emoji: '📡', price: 500_000, unlockAt: 1_000_000, kind: 'all', multiplier: 1.1 },
  { id: 'national-day', emoji: '🎉', price: 5_000_000, unlockAt: 10_000_000, kind: 'all', multiplier: 1.1 },
  { id: 'legendary-pack', emoji: '👑', price: 50_000_000, unlockAt: 100_000_000, kind: 'all', multiplier: 1.15 },
  { id: 'endless-cuddles', emoji: '♾️', price: 2_500_000_000, unlockAt: 5_000_000_000, kind: 'all', multiplier: 1.1 },
  { id: 'astral-harmony', emoji: '🔮', price: 2_500_000_000_000, unlockAt: 5_000_000_000_000, kind: 'all', multiplier: 1.12 },
]

export const UPGRADES: Upgrade[] = [
  ...CLICK_UPGRADES,
  ...EXTRA_CLICK_UPGRADES,
  ...GENERATOR_UPGRADES,
  ...GLOBAL_UPGRADES,
]

export const NAMED_UPGRADE_IDS = [
  ...CLICK_UPGRADES,
  ...EXTRA_CLICK_UPGRADES,
  ...GLOBAL_UPGRADES,
].map((upgrade) => upgrade.id)

export const NEWS_COUNT = 7

export const getBuildingCost = (building: Building, owned: number, amount: number) => {
  const ratio = 1.15
  return building.baseCost * ratio ** owned * ((ratio ** amount - 1) / (ratio - 1))
}

export const getBuildingSellValue = (building: Building, owned: number, amount: number) => {
  const quantity = Math.min(owned, amount)
  if (quantity === 0) return 0
  return getBuildingCost(building, owned - quantity, quantity) * 0.5
}

export const getGeneratorPrefix = (requiredOwned?: number): GeneratorPrefix => {
  if (requiredOwned === 25) return 'squad'
  if (requiredOwned === 50) return 'mastery'
  return 'kit'
}
