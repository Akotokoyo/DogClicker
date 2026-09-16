import { BUILDINGS, emptyBuildings, type BuildingId } from './data'
import { emptyPrestigeUpgrades, type PrestigeUpgradeId } from './prestige'
import { LANGUAGE_IDS, type Language } from '../i18n/languages'

export const SAVE_KEY = 'dog-clicker-save'
export const SAVE_VERSION = 1
export const RESET_CONFIRMATION = 'RESET'

export type PersistedGame = {
  dogName: string
  cuddles: number
  totalCuddles: number
  allTimeCuddles: number
  totalClicks: number
  buildings: Record<BuildingId, number>
  upgrades: string[]
  achievements: string[]
  buyAmount: 1 | 10 | 100
  lastSavedAt: number
  prestigeStars: number
  availablePrestigeStars: number
  prestigeUpgrades: Record<PrestigeUpgradeId, number>
  playTimeSeconds: number
  bonesCollected: number
  recordCps: number
  recordBalance: number
  recordOffline: number
  language: Language
  animationsEnabled: boolean
  abbreviatedNumbers: boolean
  volume: number
  muted: boolean
  tutorialCompleted: boolean
}

export type SaveFile = {
  version: number
  exportedAt: number
  data: PersistedGame
}

export type SaveSummary = {
  dogName: string
  allTimeCuddles: number
  prestigeStars: number
}

export type SaveParseResult =
  | { ok: true; data: PersistedGame; summary: SaveSummary }
  | { ok: false; error: 'invalid' }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const asString = (value: unknown, fallback: string) =>
  typeof value === 'string' ? value : fallback

const asBoolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback

const asStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

export const defaultPersistedGame = (): PersistedGame => ({
  dogName: 'Biscotto',
  cuddles: 0,
  totalCuddles: 0,
  allTimeCuddles: 0,
  totalClicks: 0,
  buildings: { ...emptyBuildings },
  upgrades: [],
  achievements: [],
  buyAmount: 1,
  lastSavedAt: Date.now(),
  prestigeStars: 0,
  availablePrestigeStars: 0,
  prestigeUpgrades: { ...emptyPrestigeUpgrades },
  playTimeSeconds: 0,
  bonesCollected: 0,
  recordCps: 0,
  recordBalance: 0,
  recordOffline: 0,
  language: 'it',
  animationsEnabled: true,
  abbreviatedNumbers: true,
  volume: 80,
  muted: false,
  tutorialCompleted: false,
})

export const normalizePersistedGame = (raw: Record<string, unknown>): PersistedGame => {
  const defaults = defaultPersistedGame()
  const buildings = { ...defaults.buildings }
  if (isRecord(raw.buildings)) {
    for (const building of BUILDINGS) {
      buildings[building.id] = Math.max(0, asNumber(raw.buildings[building.id], 0))
    }
  }
  const prestigeUpgrades = { ...defaults.prestigeUpgrades }
  if (isRecord(raw.prestigeUpgrades)) {
    for (const id of Object.keys(prestigeUpgrades) as PrestigeUpgradeId[]) {
      prestigeUpgrades[id] = Math.max(0, Math.floor(asNumber(raw.prestigeUpgrades[id], 0)))
    }
  }
  const buyAmount = raw.buyAmount === 10 || raw.buyAmount === 100 ? raw.buyAmount : 1
  const language = LANGUAGE_IDS.includes(raw.language as Language) ? (raw.language as Language) : defaults.language
  const volume = Math.min(100, Math.max(0, asNumber(raw.volume, defaults.volume)))

  return {
    dogName: asString(raw.dogName, defaults.dogName).slice(0, 18) || defaults.dogName,
    cuddles: Math.max(0, asNumber(raw.cuddles, 0)),
    totalCuddles: Math.max(0, asNumber(raw.totalCuddles, 0)),
    allTimeCuddles: Math.max(0, asNumber(raw.allTimeCuddles, asNumber(raw.totalCuddles, 0))),
    totalClicks: Math.max(0, asNumber(raw.totalClicks, 0)),
    buildings,
    upgrades: asStringArray(raw.upgrades),
    achievements: asStringArray(raw.achievements),
    buyAmount,
    lastSavedAt: asNumber(raw.lastSavedAt, Date.now()),
    prestigeStars: Math.max(0, asNumber(raw.prestigeStars, 0)),
    availablePrestigeStars: Math.max(0, asNumber(raw.availablePrestigeStars, 0)),
    prestigeUpgrades,
    playTimeSeconds: Math.max(0, asNumber(raw.playTimeSeconds, 0)),
    bonesCollected: Math.max(0, asNumber(raw.bonesCollected, 0)),
    recordCps: Math.max(0, asNumber(raw.recordCps, 0)),
    recordBalance: Math.max(0, asNumber(raw.recordBalance, 0)),
    recordOffline: Math.max(0, asNumber(raw.recordOffline, 0)),
    language,
    animationsEnabled: asBoolean(raw.animationsEnabled, true),
    abbreviatedNumbers: asBoolean(raw.abbreviatedNumbers, true),
    volume,
    muted: asBoolean(raw.muted, false),
    tutorialCompleted: asBoolean(
      raw.tutorialCompleted,
      asNumber(raw.totalClicks, 0) > 0 || asNumber(raw.allTimeCuddles, 0) > 0,
    ),
  }
}

export const createSaveFile = (data: PersistedGame): string =>
  JSON.stringify({ version: SAVE_VERSION, exportedAt: Date.now(), data }, null, 2)

export const parseSaveFile = (json: string): SaveParseResult => {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!isRecord(parsed)) return { ok: false, error: 'invalid' }

    const rawData = isRecord(parsed.data)
      ? parsed.data
      : isRecord(parsed.state)
        ? parsed.state
        : parsed

    if (!isRecord(rawData)) return { ok: false, error: 'invalid' }
    if (parsed.version !== undefined && parsed.version !== SAVE_VERSION && !isRecord(parsed.state)) {
      if (typeof parsed.version === 'number' && parsed.version > SAVE_VERSION) {
        return { ok: false, error: 'invalid' }
      }
    }

    const data = normalizePersistedGame(rawData)
    return {
      ok: true,
      data,
      summary: {
        dogName: data.dogName,
        allTimeCuddles: data.allTimeCuddles,
        prestigeStars: data.prestigeStars,
      },
    }
  } catch {
    return { ok: false, error: 'invalid' }
  }
}
