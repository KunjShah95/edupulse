import { useTranslation } from 'react-i18next'
import { useLocaleFormatting } from '../lib/locale-utils'

export function I18nDemo() {
  const { t, i18n } = useTranslation()
  const { formatDate, formatCurrency, formatNumber, formatPercent } = useLocaleFormatting()

  // Sample data for demonstration
  const today = new Date()
  const sampleNumber = 1234567.89
  const sampleCurrency = 99.99
  const samplePercent = 0.75

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">{t('common.language')} Demo</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.language')}</p>
          <p className="font-medium text-gray-900 dark:text-white">{i18n.language === 'en' ? 'English' : 'العربية'}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.welcome')}</p>
          <p className="font-medium text-gray-900 dark:text-white">{t('common.welcome')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">Current Date</p>
          <p className="font-medium text-gray-900 dark:text-white">{formatDate(today)}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">Formatted Number</p>
          <p className="font-medium text-gray-900 dark:text-white">{formatNumber(sampleNumber)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">Currency</p>
          <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(sampleCurrency)}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">Percentage</p>
          <p className="font-medium text-gray-900 dark:text-white">{formatPercent(samplePercent)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => i18n.changeLanguage('en')}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          English
        </button>
        <button
          onClick={() => i18n.changeLanguage('ar')}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          العربية
        </button>
      </div>
    </div>
  )
}