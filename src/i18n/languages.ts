export const LANGUAGES = [
  { id: 'it', nativeName: 'Italiano', locale: 'it-IT' },
  { id: 'en', nativeName: 'English', locale: 'en-US' },
  { id: 'fr', nativeName: 'Français', locale: 'fr-FR' },
  { id: 'de', nativeName: 'Deutsch', locale: 'de-DE' },
  { id: 'es', nativeName: 'Español', locale: 'es-ES' },
  { id: 'zh', nativeName: '中文', locale: 'zh-CN' },
  { id: 'ko', nativeName: '한국어', locale: 'ko-KR' },
] as const

export type Language = (typeof LANGUAGES)[number]['id']

export const LANGUAGE_IDS = LANGUAGES.map((language) => language.id)

export const getLanguageLocale = (language: Language) =>
  LANGUAGES.find((item) => item.id === language)?.locale ?? 'it-IT'

export const detectLanguage = (): Language => {
  const code = navigator.language.toLowerCase()
  if (code.startsWith('zh')) return 'zh'
  const short = code.slice(0, 2)
  return LANGUAGE_IDS.includes(short as Language) ? (short as Language) : 'it'
}
