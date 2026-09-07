export type BuildingId =
  | 'paw'
  | 'sitter'
  | 'walker'
  | 'park'
  | 'groomer'
  | 'shop'
  | 'school'
  | 'shelter'

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
]

export type Upgrade = {
  id: string
  name: string
  emoji: string
  description: string
  price: number
  unlockAt: number
  kind: 'click' | 'all' | 'building'
  multiplier: number
  buildingId?: BuildingId
}

export const UPGRADES: Upgrade[] = [
  { id: 'soft-glove', name: 'Guanto morbido', emoji: '🧤', description: 'Coccole per click ×2', price: 100, unlockAt: 50, kind: 'click', multiplier: 2 },
  { id: 'sitter-course', name: 'Corso per sitter', emoji: '📚', description: 'Dog sitter ×2', price: 500, unlockAt: 250, kind: 'building', multiplier: 2, buildingId: 'sitter' },
  { id: 'happy-leash', name: 'Guinzaglio felice', emoji: '🦮', description: 'Dog walker ×2', price: 5_000, unlockAt: 2_000, kind: 'building', multiplier: 2, buildingId: 'walker' },
  { id: 'group-hug', name: 'Abbraccio di gruppo', emoji: '💞', description: 'Tutta la produzione ×1,25', price: 25_000, unlockAt: 10_000, kind: 'all', multiplier: 1.25 },
  { id: 'magic-treat', name: 'Snack magico', emoji: '🥓', description: 'Coccole per click ×5', price: 100_000, unlockAt: 50_000, kind: 'click', multiplier: 5 },
  { id: 'dog-network', name: 'Dog network', emoji: '📡', description: 'Tutta la produzione ×2', price: 1_000_000, unlockAt: 500_000, kind: 'all', multiplier: 2 },
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
