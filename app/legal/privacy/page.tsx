'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

export default function PrivacyPage() {
  const { lang } = useLang()

  return (
    <div className="py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 px-2">
        <Link href="/" className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0F9E75] transition-colors shadow-sm">
          <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">
          {lang === 'zh' ? '隱私權政策' : 'Privacy Policy'}
        </h1>
      </div>

      <div className="card-lg p-6 space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed">
        <div className="flex items-center gap-3 text-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30">
          <ShieldCheck size={24} className="shrink-0" />
          <p className="text-sm font-bold">
            {lang === 'zh' 
              ? '您的數據主要存儲在您的本地設備上。' 
              : 'Your data is primarily stored locally on your device.'}
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            {lang === 'zh' ? '1. 數據存儲' : '1. Data Storage'}
          </h2>
          <p>
            {lang === 'zh'
              ? 'MacroDay 使用瀏覽器本地存儲（LocalStorage）來保存您的 InBody 記錄、餐單進度及個人偏好。在未登入狀態下，這些數據不會上傳至我們的服务器。'
              : 'MacroDay uses Browser LocalStorage to save your InBody records, meal progress, and personal preferences. In guest mode, this data is NOT uploaded to our servers.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            {lang === 'zh' ? '2. AI 數據處理' : '2. AI Data Processing'}
          </h2>
          <p>
            {lang === 'zh'
              ? '當您生成餐單或訓練計畫時，相關的營養參數（如身高、體重、目標）會以匿名方式傳送給第三方 AI 服務（如 OpenAI, Together AI）進行處理。我們不會將您的個人身份信息（如電子郵件）與這些數據一同發送。'
              : 'When you generate plans, relevant parameters (height, weight, goals) are sent anonymously to third-party AI services (e.g., OpenAI, Together AI) for processing. We do NOT send your PI (e.g., email) along with this data.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            {lang === 'zh' ? '3. 數據安全' : '3. Data Security'}
          </h2>
          <p>
            {lang === 'zh'
              ? '我們採取適當的安全措施來保護您的數據。如果您刪除瀏覽器緩存或重置應用程式，存儲在本地的數據將會消失且無法找回（除非您已登入並同步至雲端）。'
              : 'We take appropriate security measures to protect your data. If you clear your browser cache or reset the app, locally stored data will be lost and cannot be recovered (unless signed in and synced to cloud).'}
          </p>
        </section>

        <footer className="pt-6 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
          Updated: 2026-04-12
        </footer>
      </div>
    </div>
  )
}
