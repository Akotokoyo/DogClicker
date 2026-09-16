import { de } from './de'
import { en } from './en'
import { es } from './es'
import { fr } from './fr'
import { it, translate as translateWithDict, type TranslateParams, type TranslationKey } from './it'
import { ko } from './ko'
import { type Language } from './languages'
import { zh } from './zh'

export const translations = { it, en, fr, de, es, zh, ko }

export type { TranslateParams, TranslationKey }

export const translate = (language: Language, key: TranslationKey, params?: TranslateParams) =>
  translateWithDict(translations, language, key, params)
