import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const getLanguageName = (lng: string) => {
    switch (lng) {
      case 'en':
        return 'English'
      case 'ar':
        return 'العربية'
      default:
        return lng
    }
  }

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800"
          id="language-menu-button"
          aria-expanded="true"
          aria-haspopup="true"
        >
          <Languages className="h-4 w-4" />
          <span>{getLanguageName(i18n.language)}</span>
        </button>
      </div>

      <div
        className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="language-menu-button"
        tabIndex={-1}
      >
        <div className="py-1" role="none">
          <button
            onClick={() => changeLanguage('en')}
            className="text-gray-700 dark:text-gray-200 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            role="menuitem"
            tabIndex={-1}
            id="language-menu-item-0"
          >
            English
          </button>
          <button
            onClick={() => changeLanguage('ar')}
            className="text-gray-700 dark:text-gray-200 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            role="menuitem"
            tabIndex={-1}
            id="language-menu-item-1"
          >
            العربية
          </button>
        </div>
      </div>
    </div>
  )
}