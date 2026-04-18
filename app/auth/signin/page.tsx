'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import SignInPrompt from '@/components/SignInPrompt'
import Logo from '@/components/Logo'
import { useLang } from '@/contexts/LangContext'

export default function SignInPage() {
  const { lang } = useLang()
  const { status } = useSession()
  const router = useRouter()

  // Redirect to home if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[#0F9E75]/20 flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-[#0F9E75]/30 border-t-[#0F9E75] rounded-full animate-spin" />
          </div>
          <p className="text-slate-500">{lang === 'zh' ? '載入中...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <Logo lang={lang} size="md" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {lang === 'zh' ? '登入 MacroDay' : 'Sign in to MacroDay'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lang === 'zh' ? '同步您的數據，解鎖所有功能' : 'Sync your data and unlock all features'}
          </p>
        </div>

        {/* Sign In Component */}
        <SignInPrompt
          title=""
          description=""
          onClose={() => router.push('/')}
        />

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            {lang === 'zh' ? '以訪客身份繼續' : 'Continue as Guest'}
          </button>
        </div>
      </div>
    </div>
  )
}
