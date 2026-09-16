export type PrestigeUpgradeId =
  | 'packHeart'
  | 'swiftPaw'
  | 'productiveSleep'
  | 'goldenScent'
  | 'starterKennel'
  | 'astralBond'

export type PrestigeUpgrade = {
  id: PrestigeUpgradeId
  emoji: string
  baseCost: number
  maxLevel: number
}

export const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  { id: 'packHeart', emoji: '💗', baseCost: 1, maxLevel: 10 },
  { id: 'swiftPaw', emoji: '🐾', baseCost: 1, maxLevel: 10 },
  { id: 'productiveSleep', emoji: '🌙', baseCost: 2, maxLevel: 4 },
  { id: 'goldenScent', emoji: '🦴', baseCost: 3, maxLevel: 5 },
  { id: 'starterKennel', emoji: '🏡', baseCost: 4, maxLevel: 5 },
  { id: 'astralBond', emoji: '🔮', baseCost: 6, maxLevel: 5 },
]

export const emptyPrestigeUpgrades = Object.fromEntries(
  PRESTIGE_UPGRADES.map(({ id }) => [id, 0]),
) as Record<PrestigeUpgradeId, number>

export const getPrestigeUpgradeCost = (upgrade: PrestigeUpgrade, level: number) =>
  upgrade.baseCost * (level + 1)

export const PRESTIGE_MIN_RUN_CUDDLES = 1_000_000_000_000

export const getTotalPrestigeStars = (allTimeCuddles: number) =>
  Math.floor(Math.sqrt(Math.max(0, allTimeCuddles) / 100_000_000_000))
