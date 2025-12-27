import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

// Import translation files
import enTranslations from '../locales/en/translation.json'
import arTranslations from '../locales/ar/translation.json'

i18n
  // Load translations from files
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      ar: {
        translation: arTranslations
      }
    },
    fallbackLng: 'en',
    debug: import.meta.env.MODE === 'development',
    interpolation: {
      escapeValue: false // React already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },
    react: {
      useSuspense: false
    }
  })

export default i18n