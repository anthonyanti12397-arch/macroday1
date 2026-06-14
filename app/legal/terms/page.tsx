'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Gavel } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

export default function TermsPage() {
  const { lang } = useLang()

  return (
    <div className="py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 px-2">
        <Link href="/" className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0F9E75] transition-colors shadow-sm">
          <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">
          {lang === 'zh' ? '使用者條款' : 'Terms of Service'}
        </h1>
      </div>

      <div className="card-lg p-6 space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed">
        <div className="flex items-center gap-3 text-[#0F9E75] bg-[#E8F5F0] dark:bg-slate-800 p-4 rounded-2xl border border-[#0F9E75]/20">
          <Gavel size={24} className="shrink-0" />
          <p className="text-sm font-bold">
            {lang === 'zh' 
              ? '使用 MacroDay 即代表您同意以下條款。' 
              : 'By using MacroDay, you agree to the following terms.'}
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            {lang === 'zh' ? '1. 帳戶與使用' : '1. Accounts & Usage'}
          </h2>
          <p>
            {lang === 'zh'
              ? '您承諾以誠實、合法的態度使用本程式。對於任何濫用 AI 生成功能或嘗試破解系統的行為，我們保留中止服務的權利。'
              : 'You agree to use this application honestly and legally. We reserve the right to suspend service for any abuse of AI features or attempts to breach the system.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            {lang === 'zh' ? '2. 副次性服務' : '2. Secondary Services'}
          </h2>
          <p>
            {lang === 'zh'
              ? '本 App 包含由第三方提供之人工智慧生成與辨識技術，包括 xAI (Grok)、Anthropic (Claude)、Together AI 與 SiliconFlow。生成內容之正確性及穩定性取決於該等第三方服務。'
              : 'This app uses AI generation and recognition technologies provided by third parties, including xAI (Grok), Anthropic (Claude), Together AI, and SiliconFlow. Content accuracy and availability depend on these third-party services.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            {lang === 'zh' ? '3. 教練與學生數據（重要）' : '3. Coaches & Client Data (Important)'}
          </h2>
          <p>
            {lang === 'zh'
              ? '若您以健身教練身分使用本 App 管理學生的 InBody 或身體數據，您聲明並保證：(a) 您在輸入任何學生的個人健康數據前，已取得該學生的明確同意；(b) 您有合法權限代其儲存與處理該等數據；(c) 您將僅為向該學生提供訓練/營養服務之目的使用這些數據。對於未經學生同意而輸入其數據所引起的任何索賠或責任，您同意賠償並使 MacroDay 免責。我們僅作為您的數據處理者，代您儲存與處理學生數據。'
              : 'If you use this app as a fitness coach to manage your clients’ InBody or body data, you represent and warrant that: (a) you have obtained each client’s explicit consent before entering their personal health data; (b) you have lawful authority to store and process that data on their behalf; and (c) you will use it solely to provide training/nutrition services to that client. You agree to indemnify and hold MacroDay harmless from any claim arising from entering a client’s data without their consent. We act only as your data processor for client data you enter.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            {lang === 'zh' ? '4. 智慧財產權' : '4. Intellectual Property'}
          </h2>
          <p>
            {lang === 'zh'
              ? 'MacroDay 及其包含的所有專有算法、使用者介面、插圖及圖標均受智慧財產權法保護。未經許可，禁止用於商業用途之拷貝或分發。'
              : 'MacroDay and its proprietary algorithms, UI, artwork, and icons are protected by intellectual property laws. Commercial copying or distribution without permission is prohibited.'}
          </p>
        </section>

        <footer className="pt-6 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
          Updated: 2026-06-14
        </footer>
      </div>
    </div>
  )
}
