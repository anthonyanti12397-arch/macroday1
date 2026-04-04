'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { getLang, saveLang } from '@/lib/storage'
import { T, type Lang, type Translations } from '@/lib/i18n'

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
}

const LangContext = createContext<LangContextType>({
  lang: 'zh',
  setLang: () => {},
  t: T.zh as Translations,
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('zh')

  useEffect(() => {
    setLangState(getLang())
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    saveLang(l)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: T[lang] as Translations }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
