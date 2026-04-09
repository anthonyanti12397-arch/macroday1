'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
  isDark: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [isDark, setIsDark] = useState(false)

  // Load saved theme on mount
  useEffect(() => {
    const saved = (localStorage.getItem('macroday_theme') as Theme) ?? 'system'
    setThemeState(saved)
  }, [])

  // Apply theme whenever it changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    const resolve = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      setIsDark(dark)
      document.documentElement.classList.toggle('dark', dark)
    }

    resolve()
    mq.addEventListener('change', resolve)
    return () => mq.removeEventListener('change', resolve)
  }, [theme])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem('macroday_theme', t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
