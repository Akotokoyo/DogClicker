import { useCallback } from 'react'
import { UPGRADES, getGeneratorPrefix, type BuildingId, type Upgrade } from '../game/data'
import { useGameStore, type GameMessage } from '../store/gameStore'
import { formatDuration, formatNumber } from './format'
import { getLanguageLocale } from './languages'
import { translate, type TranslateParams, type TranslationKey } from './translations'

export const useTranslation = () => {
  const language = useGameStore((state) => state.language)
  const abbreviatedNumbers = useGameStore((state) => state.abbreviatedNumbers)

  const t = useCallback(
    (key: TranslationKey, params?: TranslateParams) => translate(language, key, params),
    [language],
  )

  const format = useCallback(
    (value: number) => formatNumber(value, language, abbreviatedNumbers),
    [language, abbreviatedNumbers],
  )

  const duration = useCallback(
    (seconds: number) => formatDuration(seconds, language),
    [language],
  )

  const buildingName = useCallback(
    (id: BuildingId) => t(`building.${id}.name` as TranslationKey),
    [t],
  )

  const buildingDescription = useCallback(
    (id: BuildingId) => t(`building.${id}.description` as TranslationKey),
    [t],
  )

  const upgradeName = useCallback(
    (upgrade: Upgrade) => {
      if (upgrade.kind === 'building' && upgrade.buildingId) {
        return t(`upgrade.prefix.${getGeneratorPrefix(upgrade.requiredOwned)}` as TranslationKey, {
          building: buildingName(upgrade.buildingId),
        })
      }
      return t(`upgrade.${upgrade.id}.name` as TranslationKey)
    },
    [buildingName, t],
  )

  const upgradeDescription = useCallback(
    (upgrade: Upgrade) => {
      if (upgrade.kind === 'building' && upgrade.buildingId) {
        return t('upgrade.generator.description', {
          building: buildingName(upgrade.buildingId),
          count: upgrade.requiredOwned ?? 0,
        })
      }
      return t(`upgrade.${upgrade.id}.description` as TranslationKey)
    },
    [buildingName, t],
  )

  return {
    t,
    language,
    locale: getLanguageLocale(language),
    formatNumber: format,
    formatDuration: duration,
    buildingName,
    buildingDescription,
    upgradeName,
    upgradeDescription,
    resolveMessage: (message: GameMessage) => {
      const params: TranslateParams = { ...message.params }
      if (typeof params.amount === 'number') params.amount = format(Number(params.amount))
      if (typeof params.buildingId === 'string') params.name = buildingName(params.buildingId as BuildingId)
      if (typeof params.upgradeId === 'string') {
        const upgrade = UPGRADES.find((item) => item.id === params.upgradeId)
        params.name = upgrade ? upgradeName(upgrade) : String(params.upgradeId)
      }
      if (typeof params.prestigeId === 'string') {
        params.name = t(`prestige.${params.prestigeId}.name` as TranslationKey)
      }
      return t(message.key, params)
    },
  }
}
