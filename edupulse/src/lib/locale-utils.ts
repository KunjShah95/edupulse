import { useTranslation } from 'react-i18next'
import { format, formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { arSA } from 'date-fns/locale/ar-SA'

export function useLocaleFormatting() {
  const { i18n } = useTranslation()

  const getLocale = () => {
    switch (i18n.language) {
      case 'ar':
        return arSA
      case 'en':
      default:
        return enUS
    }
  }

  const formatDate = (date: Date | string, dateFormat?: string): string => {
    const locale = getLocale()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Use the format from translations if available, otherwise use default
    const formatString = dateFormat || i18n.t('dateFormats.short')
    
    return format(dateObj, formatString, { locale })
  }

  const formatDateLong = (date: Date | string): string => {
    const locale = getLocale()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const formatString = i18n.t('dateFormats.long')
    
    return format(dateObj, formatString, { locale })
  }

  const formatTime = (date: Date | string): string => {
    const locale = getLocale()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const formatString = i18n.t('dateFormats.time')
    
    return format(dateObj, formatString, { locale })
  }

  const formatRelativeTime = (date: Date | string): string => {
    const locale = getLocale()
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    return formatDistanceToNow(dateObj, { locale, addSuffix: true })
  }

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(i18n.language, options).format(value)
  }

  const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: currency
    }).format(value)
  }

  const formatPercent = (value: number): string => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value)
  }

  return {
    formatDate,
    formatDateLong,
    formatTime,
    formatRelativeTime,
    formatNumber,
    formatCurrency,
    formatPercent
  }
}

export function getLocaleDirection(language: string): 'ltr' | 'rtl' {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur']
  return rtlLanguages.includes(language) ? 'rtl' : 'ltr'
}