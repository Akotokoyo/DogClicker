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
  name: string
  emoji: string
  description: string
  baseCost: number
  cps: number
  unlockAt: number
}

export const BUILDINGS: Building[] = [
  { id: 'paw', name: 'Zampetta', emoji: '🐾', description: 'Una zampetta instancabile.', baseCost: 15, cps: 0.1, unlockAt: 0 },
  { id: 'sitter', name: 'Dog sitter', emoji: '🧑‍🦱', description: 'Coccole professionali.', baseCost: 100, cps: 1, unlockAt: 25 },
  { id: 'walker', name: 'Dog walker', emoji: '🦮', description: 'Passeggiate senza fine.', baseCost: 1_100, cps: 8, unlockAt: 500 },
  { id: 'park', name: 'Parco cani', emoji: '🌳', description: 'Il paradiso delle code.', baseCost: 12_000, cps: 47, unlockAt: 5_000 },
  { id: 'groomer', name: 'Toelettatore', emoji: '🫧', description: 'Puliti, soffici, felici.', baseCost: 130_000, cps: 260, unlockAt: 50_000 },
  { id: 'shop', name: 'Pet shop', emoji: '🦴', description: 'Snack e giochi in quantità.', baseCost: 1_400_000, cps: 1_400, unlockAt: 500_000 },
  { id: 'school', name: 'Scuola cinofila', emoji: '🎓', description: 'Laureati in coccolologia.', baseCost: 20_000_000, cps: 7_800, unlockAt: 5_000_000 },
  { id: 'shelter', name: 'Rifugio felice', emoji: '🏡', description: 'Una casa per ogni cagnetto.', baseCost: 330_000_000, cps: 44_000, unlockAt: 100_000_000 },
  { id: 'yacht', name: 'Yacht dei cani', emoji: '🛥️', description: 'Coccole di lusso in alto mare.', baseCost: 5_100_000_000, cps: 260_000, unlockAt: 1_000_000_000 },
  { id: 'timeMachine', name: 'Macchina del tempo', emoji: '🕰️', description: 'Coccole da ogni epoca.', baseCost: 75_000_000_000, cps: 1_600_000, unlockAt: 15_000_000_000 },
  { id: 'starship', name: 'Astronave canina', emoji: '🚀', description: 'Trasporta cani tra le stelle.', baseCost: 1_000_000_000_000, cps: 10_000_000, unlockAt: 200_000_000_000 },
  { id: 'dogPlanet', name: 'Pianeta dei cani', emoji: '🪐', description: 'Un intero mondo che scodinzola.', baseCost: 14_000_000_000_000, cps: 65_000_000, unlockAt: 3_000_000_000_000 },
  { id: 'rainbowBridge', name: 'Ponte arcobaleno', emoji: '🌈', description: 'Coccole eterne nei mondi astrali.', baseCost: 200_000_000_000_000, cps: 430_000_000, unlockAt: 40_000_000_000_000 },
]

export type Upgrade = {
  id: string
  name: string
  emoji: string
  description: string
  price: number
  unlockAt: number
  kind: 'click' | 'clickCps' | 'all' | 'building'
  multiplier: number
  buildingId?: BuildingId
  requiredOwned?: number
}

const CLICK_UPGRADES: Upgrade[] = [
  { id: 'soft-glove', name: 'Guanto morbido', emoji: '🧤', description: 'Coccole per click ×2', price: 100, unlockAt: 50, kind: 'click', multiplier: 2 },
  { id: 'magic-treat', name: 'Snack magico', emoji: '🥓', description: 'Coccole per click ×5', price: 100_000, unlockAt: 50_000, kind: 'click', multiplier: 5 },
]

const EXTRA_CLICK_UPGRADES: Upgrade[] = [
  { id: 'double-pat', name: 'Doppia carezza', emoji: '👐', description: 'Coccole per click ×2', price: 250, unlockAt: 500, kind: 'click', multiplier: 2 },
  { id: 'trained-hands', name: 'Mani allenate', emoji: '🙌', description: 'Ogni click ottiene anche l’1% della produzione/s', price: 2_500, unlockAt: 5_000, kind: 'clickCps', multiplier: 0.01 },
  { id: 'turbo-pats', name: 'Coccole turbo', emoji: '⚡', description: 'Coccole per click ×3', price: 250_000, unlockAt: 500_000, kind: 'click', multiplier: 3 },
  { id: 'cuddle-technique', name: 'Tecnica perfetta', emoji: '🎯', description: 'Ogni click ottiene anche il 2% della produzione/s', price: 2_500_000, unlockAt: 5_000_000, kind: 'clickCps', multiplier: 0.02 },
  { id: 'four-paws-method', name: 'Metodo quattro zampe', emoji: '🐾', description: 'Coccole per click ×4', price: 250_000_000, unlockAt: 500_000_000, kind: 'click', multiplier: 4 },
  { id: 'quantum-pat', name: 'Carezza quantica', emoji: '🔬', description: 'Ogni click ottiene anche il 3% della produzione/s', price: 2_500_000_000, unlockAt: 5_000_000_000, kind: 'clickCps', multiplier: 0.03 },
  { id: 'cosmic-hands', name: 'Mani cosmiche', emoji: '🌌', description: 'Coccole per click ×5', price: 250_000_000_000, unlockAt: 500_000_000_000, kind: 'click', multiplier: 5 },
  { id: 'astral-caress', name: 'Carezza astrale', emoji: '✨', description: 'Ogni click ottiene anche il 5% della produzione/s', price: 25_000_000_000_000, unlockAt: 50_000_000_000_000, kind: 'clickCps', multiplier: 0.05 },
]

const GENERATOR_UPGRADE_TIERS = [
  { requiredOwned: 10, priceMultiplier: 10, prefix: 'Kit', emoji: '🧰' },
  { requiredOwned: 25, priceMultiplier: 100, prefix: 'Squadra', emoji: '⭐' },
  { requiredOwned: 50, priceMultiplier: 1_000, prefix: 'Maestria', emoji: '🏅' },
] as const

const GENERATOR_UPGRADES: Upgrade[] = BUILDINGS.flatMap((building) =>
  GENERATOR_UPGRADE_TIERS.map((tier, index) => ({
    id:
      index === 0 && building.id === 'sitter'
        ? 'sitter-course'
        : index === 0 && building.id === 'walker'
          ? 'happy-leash'
          : `${building.id}-generator-${index + 1}`,
    name: `${tier.prefix} ${building.name}`,
    emoji: tier.emoji,
    description: `${building.name}: produzione ×2 (richiede ${tier.requiredOwned})`,
    price: building.baseCost * tier.priceMultiplier,
    unlockAt: building.unlockAt,
    kind: 'building' as const,
    multiplier: 2,
    buildingId: building.id,
    requiredOwned: tier.requiredOwned,
  })),
)

const GLOBAL_UPGRADES: Upgrade[] = [
  { id: 'pack-spirit', name: 'Spirito del branco', emoji: '🐕', description: 'Produzione globale +5%', price: 500, unlockAt: 1_000, kind: 'all', multiplier: 1.05 },
  { id: 'cuddle-routine', name: 'Routine di coccole', emoji: '📅', description: 'Produzione globale +5%', price: 5_000, unlockAt: 10_000, kind: 'all', multiplier: 1.05 },
  { id: 'group-hug', name: 'Abbraccio di gruppo', emoji: '💞', description: 'Produzione globale +25%', price: 25_000, unlockAt: 10_000, kind: 'all', multiplier: 1.25 },
  { id: 'park-festival', name: 'Festival del parco', emoji: '🎈', description: 'Produzione globale +7%', price: 50_000, unlockAt: 100_000, kind: 'all', multiplier: 1.07 },
  { id: 'dog-network', name: 'Dog network', emoji: '📡', description: 'Produzione globale +10%', price: 500_000, unlockAt: 1_000_000, kind: 'all', multiplier: 1.1 },
  { id: 'national-day', name: 'Giornata nazionale', emoji: '🎉', description: 'Produzione globale +10%', price: 5_000_000, unlockAt: 10_000_000, kind: 'all', multiplier: 1.1 },
  { id: 'legendary-pack', name: 'Branco leggendario', emoji: '👑', description: 'Produzione globale +15%', price: 50_000_000, unlockAt: 100_000_000, kind: 'all', multiplier: 1.15 },
  { id: 'endless-cuddles', name: 'Coccole senza confini', emoji: '♾️', description: 'Produzione globale +10%', price: 2_500_000_000, unlockAt: 5_000_000_000, kind: 'all', multiplier: 1.1 },
  { id: 'astral-harmony', name: 'Armonia astrale', emoji: '🔮', description: 'Produzione globale +12%', price: 2_500_000_000_000, unlockAt: 5_000_000_000_000, kind: 'all', multiplier: 1.12 },
]

export const UPGRADES: Upgrade[] = [
  ...CLICK_UPGRADES,
  ...EXTRA_CLICK_UPGRADES,
  ...GENERATOR_UPGRADES,
  ...GLOBAL_UPGRADES,
]

export const NEWS = [
  'Cane locale insegue la propria coda per tre ore: «Ne è valsa la pena».',
  'Gli esperti confermano: dire “bravo cane” migliora ogni giornata.',
  'Nuovo record mondiale di scodinzolii registrato nel parco.',
  'Scomparsa una pantofola. Il principale sospettato non commenta.',
  'Il mercato delle coccole continua a crescere senza controllo.',
  'Cucciolo dorme in posizione impossibile e conquista il web.',
  'Il consiglio cittadino approva più panchine per le coccole.',
]

export const formatNumber = (value: number) => {
  if (value < 1_000) {
    return value < 10 && value % 1 !== 0 ? value.toFixed(1) : Math.floor(value).toLocaleString('it-IT')
  }

  const units = [
    { value: 1e15, suffix: 'Q' },
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'Mld' },
    { value: 1e6, suffix: 'Mln' },
    { value: 1e3, suffix: 'K' },
  ]
  const unit = units.find((item) => value >= item.value)!
  return `${(value / unit.value).toFixed(value >= unit.value * 100 ? 0 : 1)} ${unit.suffix}`
}

export const getBuildingCost = (building: Building, owned: number, amount: number) => {
  const ratio = 1.15
  return building.baseCost * ratio ** owned * ((ratio ** amount - 1) / (ratio - 1))
}

export const getBuildingSellValue = (building: Building, owned: number, amount: number) => {
  const quantity = Math.min(owned, amount)
  if (quantity === 0) return 0
  return getBuildingCost(building, owned - quantity, quantity) * 0.5
}
