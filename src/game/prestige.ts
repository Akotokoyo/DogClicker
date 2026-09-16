export type PrestigeUpgradeId =
  | 'packHeart'
  | 'swiftPaw'
  | 'productiveSleep'
  | 'goldenScent'
  | 'starterKennel'
  | 'astralBond'

export type PrestigeUpgrade = {
  id: PrestigeUpgradeId
  name: string
  emoji: string
  description: string
  baseCost: number
  maxLevel: number
}

export const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  { id: 'packHeart', name: 'Cuore fedele', emoji: '💗', description: 'Produzione globale +5% per livello.', baseCost: 1, maxLevel: 10 },
  { id: 'swiftPaw', name: 'Zampa rapida', emoji: '🐾', description: 'Potenza dei click +10% per livello.', baseCost: 1, maxLevel: 10 },
  { id: 'productiveSleep', name: 'Sonno produttivo', emoji: '🌙', description: 'Limite offline +2 ore per livello.', baseCost: 2, maxLevel: 4 },
  { id: 'goldenScent', name: 'Fiuto d’oro', emoji: '🦴', description: 'L’osso d’oro appare il 10% prima per livello.', baseCost: 3, maxLevel: 5 },
  { id: 'starterKennel', name: 'Cuccia di partenza', emoji: '🏡', description: 'Inizi ogni partita con 2 Zampette per livello.', baseCost: 4, maxLevel: 5 },
  { id: 'astralBond', name: 'Legame astrale', emoji: '🔮', description: 'Ogni click ottiene +1% della produzione/s per livello.', baseCost: 6, maxLevel: 5 },
]

export const emptyPrestigeUpgrades = Object.fromEntries(
  PRESTIGE_UPGRADES.map(({ id }) => [id, 0]),
) as Record<PrestigeUpgradeId, number>

export const getPrestigeUpgradeCost = (upgrade: PrestigeUpgrade, level: number) =>
  upgrade.baseCost * (level + 1)

export const PRESTIGE_MIN_RUN_CUDDLES = 1_000_000_000_000

export const getTotalPrestigeStars = (allTimeCuddles: number) =>
  Math.floor(Math.sqrt(Math.max(0, allTimeCuddles) / 100_000_000_000))
