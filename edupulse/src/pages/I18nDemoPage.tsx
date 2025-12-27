import { useTranslation } from 'react-i18next'
import { I18nDemo } from '../components/I18nDemo'
import { useRTL } from '../lib/rtl-utils'

export default function I18nDemoPage() {
  const { t } = useTranslation()
  useRTL() // Initialize RTL support

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t('common.language')} & Internationalization Demo</h1>
        
        <div className="mb-8">
          <p className="text-lg mb-4">
            {t('common.welcome')} to the EduPulse Internationalization Demo. This page demonstrates:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Multi-language support (English & Arabic)</li>
            <li>Right-to-Left (RTL) language support</li>
            <li>Locale-specific date and number formatting</li>
            <li>Language persistence using localStorage</li>
            <li>Dynamic language switching</li>
          </ul>
        </div>

        <I18nDemo />

        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">How to Use:</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Use the language switcher in the header to change languages</li>
            <li>Observe how the UI adapts to different languages and directions</li>
            <li>Notice the date, number, and currency formatting changes</li>
            <li>Refresh the page - your language preference is persisted</li>
            <li>Try the demo controls below to see immediate language switching</li>
          </ol>
        </div>
      </div>
    </div>
  )
}