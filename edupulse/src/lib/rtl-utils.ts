import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'] // Common RTL languages

export function useRTL() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const htmlElement = document.documentElement
    
    if (RTL_LANGUAGES.includes(i18n.language)) {
      htmlElement.dir = 'rtl'
      htmlElement.style.setProperty('font-family', 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"')
    } else {
      htmlElement.dir = 'ltr'
      htmlElement.style.setProperty('font-family', 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"')
    }
  }, [i18n.language])

  return RTL_LANGUAGES.includes(i18n.language)
}

export function isRTL(language: string): boolean {
  return RTL_LANGUAGES.includes(language)
}