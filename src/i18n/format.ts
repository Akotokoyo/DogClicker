import { getLanguageLocale, type Language } from './languages'
import { translate } from './translations'

const WESTERN_UNITS = [
  { value: 1e15, suffix: 'Q' },
  { value: 1e12, suffix: 'T' },
  { value: 1e9, suffix: 'B' },
  { value: 1e6, suffix: 'M' },
  { value: 1e3, suffix: 'K' },
]

const UNITS: Record<Language, { value: number; suffix: string }[]> = {
  it: [
    { value: 1e15, suffix: 'Q' },
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'Mld' },
    { value: 1e6, suffix: 'Mln' },
    { value: 1e3, suffix: 'K' },
  ],
  en: WESTERN_UNITS,
  fr: [
    { value: 1e15, suffix: 'P' },
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'Md' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'k' },
  ],
  de: [
    { value: 1e15, suffix: 'Brd' },
    { value: 1e12, suffix: 'Bio' },
    { value: 1e9, suffix: 'Mrd' },
    { value: 1e6, suffix: 'Mio' },
    { value: 1e3, suffix: 'Tsd' },
  ],
  es: [
    { value: 1e15, suffix: 'C' },
    { value: 1e12, suffix: 'B' },
    { value: 1e9, suffix: 'MM' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'mil' },
  ],
  zh: [
    { value: 1e12, suffix: '兆' },
    { value: 1e8, suffix: '亿' },
    { value: 1e4, suffix: '万' },
  ],
  ko: [
    { value: 1e12, suffix: '조' },
    { value: 1e8, suffix: '억' },
    { value: 1e4, suffix: '만' },
  ],
}

export const formatNumber = (value: number, language: Language, abbreviated: boolean) => {
  const locale = getLanguageLocale(language)
  if (!abbreviated || Math.abs(value) < 1_000) {
    if (Math.abs(value) < 10 && value % 1 !== 0) {
      return value.toLocaleString(locale, { maximumFractionDigits: 1 })
    }
    return Math.floor(value).toLocaleString(locale)
  }

  const units = UNITS[language]
  const unit = units.find((item) => Math.abs(value) >= item.value)
  if (!unit) return Math.floor(value).toLocaleString(locale)
  const digits = Math.abs(value) >= unit.value * 100 ? 0 : 1
  return `${(value / unit.value).toLocaleString(locale, { maximumFractionDigits: digits })} ${unit.suffix}`
}

export const formatDuration = (totalSeconds: number, language: Language) => {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  const parts: string[] = []
  if (hours > 0) parts.push(translate(language, 'time.hours', { value: hours }))
  if (minutes > 0) parts.push(translate(language, 'time.minutes', { value: minutes }))
  if (hours === 0 && minutes === 0) parts.push(translate(language, 'time.seconds', { value: rest }))
  return parts.join(' ')
}
