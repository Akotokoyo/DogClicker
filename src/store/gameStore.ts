import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import {
  BUILDINGS,
  UPGRADES,
  getBuildingCost,
  getBuildingSellValue,
  type BuildingId,
} from '../game/data'
import {
  PRESTIGE_MIN_RUN_CUDDLES,
  PRESTIGE_UPGRADES,
  emptyPrestigeUpgrades,
  getPrestigeUpgradeCost,
  getTotalPrestigeStars,
  type PrestigeUpgradeId,
} from '../game/prestige'

type PurchaseMode = 'buy' | 'sell'

type GameState = {
  dogName: string
  cuddles: number
  totalCuddles: number
  allTimeCuddles: number
  totalClicks: number
  buildings: Record<BuildingId, number>
  upgrades: string[]
  achievements: string[]
  buyAmount: 1 | 10 | 100
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
  lastSavedAt: number
  offlineEarnings: number
  offlineSeconds: number
  showReturnModal: boolean
  prestigeStars: number
  availablePrestigeStars: number
  prestigeUpgrades: Record<PrestigeUpgradeId, number>
  showPrestigeModal: boolean
  message: string
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
  ascend: () => void
  buyPrestigeUpgrade: (id: PrestigeUpgradeId) => void
  collectGoldenBone: () => void
}

const emptyBuildings = Object.fromEntries(BUILDINGS.map(({ id }) => [id, 0])) as Record<BuildingId, number>

const randomBoneDelay = (goldenScentLevel = 0) =>
  (18_000 + Math.random() * 22_000) * Math.max(0.5, 1 - goldenScentLevel * 0.1)

let pendingSave: { name: string; value: string } | undefined
let saveTimer: ReturnType<typeof setTimeout> | undefined
const flushSave = () => {
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
  { id: 'first-pat', name: 'La prima coccola', emoji: '🤎' },
  { id: 'click-apprentice', name: 'Mano instancabile', emoji: '🖐️' },
  { id: 'cuddle-rich', name: 'Mille coccole', emoji: '✨' },
  { id: 'dog-empire', name: 'Impero canino', emoji: '👑' },
  { id: 'first-helper', name: 'Una zampa in più', emoji: '🤝' },
  { id: 'big-pack', name: 'Branco numeroso', emoji: '🐕' },
]

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      dogName: 'Biscotto',
      cuddles: 0,
      totalCuddles: 0,
      allTimeCuddles: 0,
      totalClicks: 0,
      buildings: { ...emptyBuildings },
      upgrades: [],
      achievements: [],
      buyAmount: 1,
      purchaseMode: 'buy',
      goldenBoneVisible: false,
      goldenBoneExpiresAt: 0,
      nextGoldenBoneAt: Date.now() + randomBoneDelay(),
      goldenBoneX: 50,
      goldenBoneY: 50,
      goldenBoneSize: 76,
      frenzyUntil: 0,
      clickFrenzyUntil: 0,
      currentTime: Date.now(),
      lastSavedAt: Date.now(),
      offlineEarnings: 0,
      offlineSeconds: 0,
      showReturnModal: false,
      prestigeStars: 0,
      availablePrestigeStars: 0,
      prestigeUpgrades: { ...emptyPrestigeUpgrades },
      showPrestigeModal: false,
      message: 'Il tuo impero di coccole comincia qui.',

      prepareOfflineEarnings: () => {
        const state = get()
        const now = Date.now()
        const offlineCapHours = 8 + state.prestigeUpgrades.productiveSleep * 2
        const offlineSeconds = Math.min(
          Math.max((now - state.lastSavedAt) / 1_000, 0),
          offlineCapHours * 60 * 60,
        )
        const offlineEarnings = getCps({ ...state, currentTime: now }, true) * offlineSeconds

        if (offlineSeconds >= 60 && offlineEarnings > 0) {
          set({
            cuddles: state.cuddles + offlineEarnings,
            totalCuddles: state.totalCuddles + offlineEarnings,
            allTimeCuddles: state.allTimeCuddles + offlineEarnings,
            offlineEarnings,
            offlineSeconds,
            showReturnModal: true,
            lastSavedAt: now,
            currentTime: now,
            message: `Il branco ha prodotto ${Math.floor(offlineEarnings).toLocaleString('it-IT')} coccole mentre eri via.`,
          })
          const current = get()
          const achievements = getNewAchievements(current)
          if (achievements.length !== current.achievements.length) set({ achievements })
        } else {
          set({ lastSavedAt: now, currentTime: now })
        }
      },

      dismissReturnModal: () => set({
        showReturnModal: false,
        offlineEarnings: 0,
        offlineSeconds: 0,
      }),

      clickDog: () => {
        const state = get()
        const gained = getClickPower(state)
        const updated = {
          cuddles: state.cuddles + gained,
          totalCuddles: state.totalCuddles + gained,
          allTimeCuddles: state.allTimeCuddles + gained,
          totalClicks: state.totalClicks + 1,
        }
        set(updated)
        const current = get()
        const achievements = getNewAchievements(current)
        if (achievements.length !== current.achievements.length) set({ achievements })
        return gained
      },

      tick: (seconds) => {
        const state = get()
        const now = Date.now()
        const gained = getCps(state) * seconds
        const update: Partial<GameState> = {
          cuddles: state.cuddles + gained,
          totalCuddles: state.totalCuddles + gained,
          allTimeCuddles: state.allTimeCuddles + gained,
          currentTime: now,
          lastSavedAt: now,
        }

        if (!state.goldenBoneVisible && now >= state.nextGoldenBoneAt) {
          update.goldenBoneVisible = true
          update.goldenBoneExpiresAt = now + 9_000
          update.goldenBoneX = Math.random() * 100
          update.goldenBoneY = Math.random() * 100
          update.goldenBoneSize = 48 + Math.random() * 62
          update.message = 'Un osso d’oro è apparso! Acchiappalo!'
        } else if (state.goldenBoneVisible && now >= state.goldenBoneExpiresAt) {
          update.goldenBoneVisible = false
          update.nextGoldenBoneAt = now + randomBoneDelay(state.prestigeUpgrades.goldenScent)
          update.message = 'L’osso d’oro è svanito... tornerà.'
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
            message: `${building.name}: ${quantity} vendut${quantity === 1 ? 'o' : 'i'}.`,
          })
          return
        }

        const cost = getBuildingCost(building, state.buildings[id], state.buyAmount)
        if (state.cuddles < cost) return
        set({
          cuddles: state.cuddles - cost,
          buildings: { ...state.buildings, [id]: state.buildings[id] + state.buyAmount },
          message: `${building.name}: +${state.buyAmount} al lavoro!`,
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
          message: `${upgrade.name} acquistato!`,
        })
      },

      setBuyAmount: (buyAmount) => set({ buyAmount }),
      setPurchaseMode: (purchaseMode) => set({ purchaseMode }),
      setDogName: (dogName) => set({ dogName: dogName.slice(0, 18) }),
      setPrestigeModal: (showPrestigeModal) => set({ showPrestigeModal }),

      ascend: () => {
        const state = get()
        const earnedStars = getClaimablePrestigeStars(state)
        if (earnedStars <= 0) return
        const now = Date.now()
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
          nextGoldenBoneAt: now + randomBoneDelay(state.prestigeUpgrades.goldenScent),
          currentTime: now,
          lastSavedAt: now,
          message: `Nuova eredità iniziata con ${earnedStars} Stelle canine!`,
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
          message: `${upgrade.name} ora è al livello ${level + 1}.`,
        })
      },

      collectGoldenBone: () => {
        const state = get()
        if (!state.goldenBoneVisible) return
        const now = Date.now()
        const roll = Math.random()
        const update: Partial<GameState> = {
          goldenBoneVisible: false,
          nextGoldenBoneAt: now + randomBoneDelay(state.prestigeUpgrades.goldenScent),
        }

        if (roll < 0.4) {
          update.frenzyUntil = now + 30_000
          update.message = 'Frenesia! Produzione ×7 per 30 secondi.'
        } else if (roll < 0.75) {
          update.clickFrenzyUntil = now + 15_000
          update.message = 'Zampe velocissime! Click ×25 per 15 secondi.'
        } else {
          const reward = Math.max(77, getCps(state, true) * 600)
          update.cuddles = state.cuddles + reward
          update.totalCuddles = state.totalCuddles + reward
          update.allTimeCuddles = state.allTimeCuddles + reward
          update.message = `Fortuna canina! Hai trovato ${Math.floor(reward).toLocaleString('it-IT')} coccole.`
        }
        set(update)
      },
    }),
    {
      name: 'dog-clicker-save',
      storage: createJSONStorage(() => throttledStorage),
      onRehydrateStorage: () => (state) => {
        state?.prepareOfflineEarnings()
      },
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<GameState>
        return {
          ...currentState,
          ...persisted,
          allTimeCuddles:
            persisted.allTimeCuddles ?? persisted.totalCuddles ?? currentState.allTimeCuddles,
          buildings: {
            ...currentState.buildings,
            ...persisted.buildings,
          },
          prestigeUpgrades: {
            ...currentState.prestigeUpgrades,
            ...persisted.prestigeUpgrades,
          },
        }
      },
      partialize: (state) => ({
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
      }),
    },
  ),
)
