import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import {
  BUILDINGS,
  UPGRADES,
  getBuildingCost,
  getBuildingSellValue,
  type BuildingId,
} from '../game/data'

type PurchaseMode = 'buy' | 'sell'

type GameState = {
  cuddles: number
  totalCuddles: number
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
  message: string
  clickDog: () => number
  tick: (seconds: number) => void
  buyBuilding: (id: BuildingId) => void
  buyUpgrade: (id: string) => void
  setBuyAmount: (amount: 1 | 10 | 100) => void
  setPurchaseMode: (mode: PurchaseMode) => void
  collectGoldenBone: () => void
}

const emptyBuildings = Object.fromEntries(BUILDINGS.map(({ id }) => [id, 0])) as Record<BuildingId, number>

const randomBoneDelay = () => 18_000 + Math.random() * 22_000

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

export const getClickPower = (state: Pick<GameState, 'upgrades' | 'clickFrenzyUntil' | 'currentTime'>) => {
  const upgradeMultiplier = UPGRADES
    .filter((upgrade) => state.upgrades.includes(upgrade.id) && upgrade.kind === 'click')
    .reduce((total, upgrade) => total * upgrade.multiplier, 1)
  const frenzyMultiplier = state.currentTime < state.clickFrenzyUntil ? 25 : 1
  return upgradeMultiplier * frenzyMultiplier
}

export const getCps = (
  state: Pick<GameState, 'buildings' | 'upgrades' | 'frenzyUntil' | 'currentTime'>,
  ignoreFrenzy = false,
) => {
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
  return baseCps * getAllMultiplier(state.upgrades) * frenzyMultiplier
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
      cuddles: 0,
      totalCuddles: 0,
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
      message: 'Il tuo impero di coccole comincia qui.',

      clickDog: () => {
        const state = get()
        const gained = getClickPower(state)
        const updated = {
          cuddles: state.cuddles + gained,
          totalCuddles: state.totalCuddles + gained,
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
          currentTime: now,
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
          update.nextGoldenBoneAt = now + randomBoneDelay()
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
        set({
          cuddles: state.cuddles - upgrade.price,
          upgrades: [...state.upgrades, id],
          message: `${upgrade.name} acquistato!`,
        })
      },

      setBuyAmount: (buyAmount) => set({ buyAmount }),
      setPurchaseMode: (purchaseMode) => set({ purchaseMode }),

      collectGoldenBone: () => {
        const state = get()
        if (!state.goldenBoneVisible) return
        const now = Date.now()
        const roll = Math.random()
        const update: Partial<GameState> = {
          goldenBoneVisible: false,
          nextGoldenBoneAt: now + randomBoneDelay(),
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
          update.message = `Fortuna canina! Hai trovato ${Math.floor(reward).toLocaleString('it-IT')} coccole.`
        }
        set(update)
      },
    }),
    {
      name: 'dog-clicker-save',
      storage: createJSONStorage(() => throttledStorage),
      partialize: (state) => ({
        cuddles: state.cuddles,
        totalCuddles: state.totalCuddles,
        totalClicks: state.totalClicks,
        buildings: state.buildings,
        upgrades: state.upgrades,
        achievements: state.achievements,
        buyAmount: state.buyAmount,
      }),
    },
  ),
)
