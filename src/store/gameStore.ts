import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import {
  BUILDINGS,
  UPGRADES,
  emptyBuildings,
  getBuildingCost,
  getBuildingSellValue,
  type BuildingId,
} from '../game/data'
import {
  PRESTIGE_MIN_RUN_CUDDLES,
  PRESTIGE_UPGRADES,
  getPrestigeUpgradeCost,
  getTotalPrestigeStars,
  type PrestigeUpgradeId,
} from '../game/prestige'
import {
  SAVE_KEY,
  defaultPersistedGame,
  normalizePersistedGame,
  type PersistedGame,
} from '../game/save'
import { detectLanguage, type Language } from '../i18n/languages'
import { type TranslateParams, type TranslationKey } from '../i18n/translations'

type PurchaseMode = 'buy' | 'sell'
type MenuTab = 'stats' | 'options'

export type GameMessage = {
  key: TranslationKey
  params?: TranslateParams
}

export type GameState = PersistedGame & {
  purchaseMode: PurchaseMode
  goldenBoneVisible: boolean
  goldenBoneExpiresAt: number
  nextGoldenBoneAt: number
  goldenBoneX: number
  goldenBoneY: number
  goldenBoneSize: number
  frenzyUntil: number
  clickFrenzyUntil: number
  currentTime: number
  offlineEarnings: number
  offlineSeconds: number
  showReturnModal: boolean
  showPrestigeModal: boolean
  showMenu: boolean
  menuTab: MenuTab
  tutorialOpen: boolean
  tutorialStep: number
  hydrated: boolean
  message: GameMessage
  prepareOfflineEarnings: () => void
  dismissReturnModal: () => void
  clickDog: () => number
  tick: (seconds: number) => void
  buyBuilding: (id: BuildingId) => void
  buyUpgrade: (id: string) => void
  setBuyAmount: (amount: 1 | 10 | 100) => void
  setPurchaseMode: (mode: PurchaseMode) => void
  setDogName: (name: string) => void
  setPrestigeModal: (visible: boolean) => void
  setMenu: (visible: boolean, tab?: MenuTab) => void
  setLanguage: (language: Language) => void
  setAnimationsEnabled: (enabled: boolean) => void
  setAbbreviatedNumbers: (enabled: boolean) => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  startTutorial: () => void
  skipTutorial: () => void
  completeTutorial: () => void
  setTutorialStep: (step: number) => void
  ascend: () => void
  buyPrestigeUpgrade: (id: PrestigeUpgradeId) => void
  collectGoldenBone: () => void
  importSave: (data: PersistedGame) => void
  resetSave: () => void
  getPersistedSnapshot: () => PersistedGame
}

const randomBoneDelay = (goldenScentLevel = 0) =>
  (18_000 + Math.random() * 22_000) * Math.max(0.5, 1 - goldenScentLevel * 0.1)

let pendingSave: { name: string; value: string } | undefined
let saveTimer: ReturnType<typeof setTimeout> | undefined
export const flushSave = () => {
  if (pendingSave) localStorage.setItem(pendingSave.name, pendingSave.value)
  pendingSave = undefined
  saveTimer = undefined
}
const throttledStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    pendingSave = { name, value }
    saveTimer ??= setTimeout(flushSave, 5_000)
  },
  removeItem: (name) => localStorage.removeItem(name),
}
window.addEventListener('beforeunload', flushSave)

const getAllMultiplier = (upgrades: string[]) =>
  UPGRADES.filter((upgrade) => upgrades.includes(upgrade.id) && upgrade.kind === 'all')
    .reduce((total, upgrade) => total * upgrade.multiplier, 1)

export const getClaimablePrestigeStars = (
  state: Pick<GameState, 'allTimeCuddles' | 'prestigeStars' | 'totalCuddles'>,
) => {
  if (state.totalCuddles < PRESTIGE_MIN_RUN_CUDDLES) return 0
  return Math.max(0, getTotalPrestigeStars(state.allTimeCuddles) - state.prestigeStars)
}

export const getClickPower = (
  state: Pick<
    GameState,
    | 'upgrades'
    | 'clickFrenzyUntil'
    | 'currentTime'
    | 'buildings'
    | 'frenzyUntil'
    | 'prestigeStars'
    | 'prestigeUpgrades'
  >,
) => {
  const upgradeMultiplier = UPGRADES
    .filter((upgrade) => state.upgrades.includes(upgrade.id) && upgrade.kind === 'click')
    .reduce((total, upgrade) => total * upgrade.multiplier, 1)
  const cpsFraction = UPGRADES
    .filter((upgrade) => state.upgrades.includes(upgrade.id) && upgrade.kind === 'clickCps')
    .reduce((total, upgrade) => total + upgrade.multiplier, 0)
  const astralFraction = state.prestigeUpgrades.astralBond * 0.01
  const productionBonus = getCps(state, true) * (cpsFraction + astralFraction)
  const prestigeClickMultiplier = 1 + state.prestigeUpgrades.swiftPaw * 0.1
  const frenzyMultiplier = state.currentTime < state.clickFrenzyUntil ? 25 : 1
  return (upgradeMultiplier + productionBonus) * prestigeClickMultiplier * frenzyMultiplier
}

export function getCps(
  state: Pick<
    GameState,
    'buildings' | 'upgrades' | 'frenzyUntil' | 'currentTime' | 'prestigeStars' | 'prestigeUpgrades'
  >,
  ignoreFrenzy = false,
) {
  const baseCps = BUILDINGS.reduce((total, building) => {
    const buildingMultiplier = UPGRADES
      .filter(
        (upgrade) =>
          state.upgrades.includes(upgrade.id) &&
          upgrade.kind === 'building' &&
          upgrade.buildingId === building.id,
      )
      .reduce((multiplier, upgrade) => multiplier * upgrade.multiplier, 1)
    return total + building.cps * state.buildings[building.id] * buildingMultiplier
  }, 0)

  const frenzyMultiplier = !ignoreFrenzy && state.currentTime < state.frenzyUntil ? 7 : 1
  const permanentMultiplier =
    1 + state.prestigeStars * 0.01 + state.prestigeUpgrades.packHeart * 0.05
  return baseCps * getAllMultiplier(state.upgrades) * permanentMultiplier * frenzyMultiplier
}

const getNewAchievements = (state: GameState) => {
  const earned = [...state.achievements]
  const add = (id: string, condition: boolean) => {
    if (condition && !earned.includes(id)) earned.push(id)
  }
  add('first-pat', state.totalClicks >= 1)
  add('click-apprentice', state.totalClicks >= 100)
  add('cuddle-rich', state.totalCuddles >= 1_000)
  add('dog-empire', state.totalCuddles >= 1_000_000)
  add('first-helper', Object.values(state.buildings).some((amount) => amount > 0))
  add('big-pack', Object.values(state.buildings).reduce((sum, amount) => sum + amount, 0) >= 50)
  return earned
}

export const ACHIEVEMENT_DETAILS = [
  { id: 'first-pat', emoji: '🤎' },
  { id: 'click-apprentice', emoji: '🖐️' },
  { id: 'cuddle-rich', emoji: '✨' },
  { id: 'dog-empire', emoji: '👑' },
  { id: 'first-helper', emoji: '🤝' },
  { id: 'big-pack', emoji: '🐕' },
]

const pickPersisted = (state: PersistedGame): PersistedGame => ({
  dogName: state.dogName,
  cuddles: state.cuddles,
  totalCuddles: state.totalCuddles,
  allTimeCuddles: state.allTimeCuddles,
  totalClicks: state.totalClicks,
  buildings: state.buildings,
  upgrades: state.upgrades,
  achievements: state.achievements,
  buyAmount: state.buyAmount,
  lastSavedAt: state.lastSavedAt,
  prestigeStars: state.prestigeStars,
  availablePrestigeStars: state.availablePrestigeStars,
  prestigeUpgrades: state.prestigeUpgrades,
  playTimeSeconds: state.playTimeSeconds,
  bonesCollected: state.bonesCollected,
  recordCps: state.recordCps,
  recordBalance: state.recordBalance,
  recordOffline: state.recordOffline,
  language: state.language,
  animationsEnabled: state.animationsEnabled,
  abbreviatedNumbers: state.abbreviatedNumbers,
  volume: state.volume,
  muted: state.muted,
  tutorialCompleted: state.tutorialCompleted,
})

const now = Date.now()
const defaults = defaultPersistedGame()

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...defaults,
      language: detectLanguage(),
      purchaseMode: 'buy',
      goldenBoneVisible: false,
      goldenBoneExpiresAt: 0,
      nextGoldenBoneAt: now + randomBoneDelay(),
      goldenBoneX: 50,
      goldenBoneY: 50,
      goldenBoneSize: 76,
      frenzyUntil: 0,
      clickFrenzyUntil: 0,
      currentTime: now,
      lastSavedAt: now,
      offlineEarnings: 0,
      offlineSeconds: 0,
      showReturnModal: false,
      showPrestigeModal: false,
      showMenu: false,
      menuTab: 'stats',
      tutorialOpen: false,
      tutorialStep: 0,
      hydrated: false,
      message: { key: 'message.start' },

      prepareOfflineEarnings: () => {
        const state = get()
        const timestamp = Date.now()
        const offlineCapHours = 8 + state.prestigeUpgrades.productiveSleep * 2
        const offlineSeconds = Math.min(
          Math.max((timestamp - state.lastSavedAt) / 1_000, 0),
          offlineCapHours * 60 * 60,
        )
        const offlineEarnings = getCps({ ...state, currentTime: timestamp }, true) * offlineSeconds

        if (offlineSeconds >= 60 && offlineEarnings > 0) {
          const cuddles = state.cuddles + offlineEarnings
          set({
            cuddles,
            totalCuddles: state.totalCuddles + offlineEarnings,
            allTimeCuddles: state.allTimeCuddles + offlineEarnings,
            offlineEarnings,
            offlineSeconds,
            showReturnModal: true,
            lastSavedAt: timestamp,
            currentTime: timestamp,
            recordBalance: Math.max(state.recordBalance, cuddles),
            recordOffline: Math.max(state.recordOffline, offlineEarnings),
            message: { key: 'message.offline', params: { amount: offlineEarnings } },
          })
          const current = get()
          const achievements = getNewAchievements(current)
          if (achievements.length !== current.achievements.length) set({ achievements })
        } else {
          set({ lastSavedAt: timestamp, currentTime: timestamp })
        }
      },

      dismissReturnModal: () => set((state) => ({
        showReturnModal: false,
        offlineEarnings: 0,
        offlineSeconds: 0,
        tutorialOpen: !state.tutorialCompleted,
      })),

      clickDog: () => {
        const state = get()
        const gained = getClickPower(state)
        const cuddles = state.cuddles + gained
        set({
          cuddles,
          totalCuddles: state.totalCuddles + gained,
          allTimeCuddles: state.allTimeCuddles + gained,
          totalClicks: state.totalClicks + 1,
          recordBalance: Math.max(state.recordBalance, cuddles),
        })
        const current = get()
        const achievements = getNewAchievements(current)
        if (achievements.length !== current.achievements.length) set({ achievements })
        return gained
      },

      tick: (seconds) => {
        const state = get()
        const timestamp = Date.now()
        const gained = getCps(state) * seconds
        const cuddles = state.cuddles + gained
        const update: Partial<GameState> = {
          cuddles,
          totalCuddles: state.totalCuddles + gained,
          allTimeCuddles: state.allTimeCuddles + gained,
          currentTime: timestamp,
          lastSavedAt: timestamp,
          playTimeSeconds: state.playTimeSeconds + seconds,
          recordCps: Math.max(state.recordCps, getCps(state)),
          recordBalance: Math.max(state.recordBalance, cuddles),
        }

        if (!state.goldenBoneVisible && timestamp >= state.nextGoldenBoneAt) {
          update.goldenBoneVisible = true
          update.goldenBoneExpiresAt = timestamp + 9_000
          update.goldenBoneX = Math.random() * 100
          update.goldenBoneY = Math.random() * 100
          update.goldenBoneSize = 48 + Math.random() * 62
          update.message = { key: 'message.boneSpawn' }
        } else if (state.goldenBoneVisible && timestamp >= state.goldenBoneExpiresAt) {
          update.goldenBoneVisible = false
          update.nextGoldenBoneAt = timestamp + randomBoneDelay(state.prestigeUpgrades.goldenScent)
          update.message = { key: 'message.boneGone' }
        }

        set(update)
        const current = get()
        const achievements = getNewAchievements(current)
        if (achievements.length !== current.achievements.length) set({ achievements })
      },

      buyBuilding: (id) => {
        const state = get()
        const building = BUILDINGS.find((item) => item.id === id)
        if (!building || state.totalCuddles < building.unlockAt) return

        if (state.purchaseMode === 'sell') {
          const quantity = Math.min(state.buildings[id], state.buyAmount)
          if (!quantity) return
          const refund = getBuildingSellValue(building, state.buildings[id], quantity)
          set({
            cuddles: state.cuddles + refund,
            buildings: { ...state.buildings, [id]: state.buildings[id] - quantity },
            message: { key: 'message.sold', params: { buildingId: id, quantity } },
          })
          return
        }

        const cost = getBuildingCost(building, state.buildings[id], state.buyAmount)
        if (state.cuddles < cost) return
        set({
          cuddles: state.cuddles - cost,
          buildings: { ...state.buildings, [id]: state.buildings[id] + state.buyAmount },
          message: { key: 'message.bought', params: { buildingId: id, quantity: state.buyAmount } },
        })
        const current = get()
        const achievements = getNewAchievements(current)
        if (achievements.length !== current.achievements.length) set({ achievements })
      },

      buyUpgrade: (id) => {
        const state = get()
        const upgrade = UPGRADES.find((item) => item.id === id)
        if (!upgrade || state.upgrades.includes(id) || state.cuddles < upgrade.price) return
        const hasEnoughGenerators =
          !upgrade.requiredOwned ||
          (upgrade.buildingId !== undefined && state.buildings[upgrade.buildingId] >= upgrade.requiredOwned)
        if (state.totalCuddles < upgrade.unlockAt || !hasEnoughGenerators) return
        set({
          cuddles: state.cuddles - upgrade.price,
          upgrades: [...state.upgrades, id],
          message: { key: 'message.upgrade', params: { upgradeId: id } },
        })
      },

      setBuyAmount: (buyAmount) => set({ buyAmount }),
      setPurchaseMode: (purchaseMode) => set({ purchaseMode }),
      setDogName: (dogName) => set({ dogName: dogName.slice(0, 18) }),
      setPrestigeModal: (showPrestigeModal) => set({ showPrestigeModal }),
      setMenu: (showMenu, menuTab) => set({ showMenu, menuTab: menuTab ?? get().menuTab }),
      setLanguage: (language) => set({ language }),
      setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),
      setAbbreviatedNumbers: (abbreviatedNumbers) => set({ abbreviatedNumbers }),
      setVolume: (volume) => set({ volume: Math.min(100, Math.max(0, volume)) }),
      setMuted: (muted) => set({ muted }),
      startTutorial: () => set({ tutorialCompleted: false, tutorialOpen: true, tutorialStep: 0, showMenu: false }),
      skipTutorial: () => set({ tutorialCompleted: true, tutorialOpen: false, tutorialStep: 0 }),
      completeTutorial: () => set({ tutorialCompleted: true, tutorialOpen: false, tutorialStep: 0 }),
      setTutorialStep: (tutorialStep) => set({ tutorialStep }),

      ascend: () => {
        const state = get()
        const earnedStars = getClaimablePrestigeStars(state)
        if (earnedStars <= 0) return
        const timestamp = Date.now()
        const startingPaws = state.prestigeUpgrades.starterKennel * 2
        set({
          cuddles: 0,
          totalCuddles: 0,
          buildings: { ...emptyBuildings, paw: startingPaws },
          upgrades: [],
          prestigeStars: state.prestigeStars + earnedStars,
          availablePrestigeStars: state.availablePrestigeStars + earnedStars,
          showPrestigeModal: false,
          showReturnModal: false,
          offlineEarnings: 0,
          offlineSeconds: 0,
          goldenBoneVisible: false,
          frenzyUntil: 0,
          clickFrenzyUntil: 0,
          nextGoldenBoneAt: timestamp + randomBoneDelay(state.prestigeUpgrades.goldenScent),
          currentTime: timestamp,
          lastSavedAt: timestamp,
          message: { key: 'message.prestige', params: { stars: earnedStars } },
        })
        flushSave()
      },

      buyPrestigeUpgrade: (id) => {
        const state = get()
        const upgrade = PRESTIGE_UPGRADES.find((item) => item.id === id)
        if (!upgrade) return
        const level = state.prestigeUpgrades[id]
        const cost = getPrestigeUpgradeCost(upgrade, level)
        if (level >= upgrade.maxLevel || state.availablePrestigeStars < cost) return
        set({
          availablePrestigeStars: state.availablePrestigeStars - cost,
          prestigeUpgrades: { ...state.prestigeUpgrades, [id]: level + 1 },
          message: { key: 'message.prestigeUpgrade', params: { prestigeId: id, level: level + 1 } },
        })
      },

      collectGoldenBone: () => {
        const state = get()
        if (!state.goldenBoneVisible) return
        const timestamp = Date.now()
        const roll = Math.random()
        const update: Partial<GameState> = {
          goldenBoneVisible: false,
          nextGoldenBoneAt: timestamp + randomBoneDelay(state.prestigeUpgrades.goldenScent),
          bonesCollected: state.bonesCollected + 1,
        }

        if (roll < 0.4) {
          update.frenzyUntil = timestamp + 30_000
          update.message = { key: 'message.frenzy' }
        } else if (roll < 0.75) {
          update.clickFrenzyUntil = timestamp + 15_000
          update.message = { key: 'message.clickFrenzy' }
        } else {
          const reward = Math.max(77, getCps(state, true) * 600)
          const cuddles = state.cuddles + reward
          update.cuddles = cuddles
          update.totalCuddles = state.totalCuddles + reward
          update.allTimeCuddles = state.allTimeCuddles + reward
          update.recordBalance = Math.max(state.recordBalance, cuddles)
          update.message = { key: 'message.lucky', params: { amount: reward } }
        }
        set(update)
      },

      importSave: (data) => {
        const timestamp = Date.now()
        set({
          ...data,
          lastSavedAt: timestamp,
          currentTime: timestamp,
          purchaseMode: 'buy',
          goldenBoneVisible: false,
          frenzyUntil: 0,
          clickFrenzyUntil: 0,
          nextGoldenBoneAt: timestamp + randomBoneDelay(data.prestigeUpgrades.goldenScent),
          offlineEarnings: 0,
          offlineSeconds: 0,
          showReturnModal: false,
          showPrestigeModal: false,
          showMenu: false,
          tutorialOpen: !data.tutorialCompleted,
          tutorialStep: 0,
          hydrated: true,
          message: { key: 'message.start' },
        })
        flushSave()
      },

      resetSave: () => {
        const state = get()
        const timestamp = Date.now()
        set({
          ...defaultPersistedGame(),
          language: state.language,
          animationsEnabled: state.animationsEnabled,
          abbreviatedNumbers: state.abbreviatedNumbers,
          volume: state.volume,
          muted: state.muted,
          lastSavedAt: timestamp,
          currentTime: timestamp,
          nextGoldenBoneAt: timestamp + randomBoneDelay(),
          purchaseMode: 'buy',
          goldenBoneVisible: false,
          frenzyUntil: 0,
          clickFrenzyUntil: 0,
          offlineEarnings: 0,
          offlineSeconds: 0,
          showReturnModal: false,
          showPrestigeModal: false,
          showMenu: false,
          tutorialOpen: true,
          tutorialStep: 0,
          tutorialCompleted: false,
          message: { key: 'message.start' },
        })
        flushSave()
      },

      getPersistedSnapshot: () => pickPersisted(get()),
    }),
    {
      name: SAVE_KEY,
      storage: createJSONStorage(() => throttledStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.hydrated = true
        state.prepareOfflineEarnings()
        if (!state.tutorialCompleted && !state.showReturnModal) state.tutorialOpen = true
      },
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Record<string, unknown>
        const normalized = normalizePersistedGame(persisted)
        return {
          ...currentState,
          ...normalized,
        }
      },
      partialize: (state) => pickPersisted(state),
    },
  ),
)
