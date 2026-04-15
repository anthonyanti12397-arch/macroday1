'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

export default function DisclaimerPage() {
  const { lang } = useLang()

  return (
    <div className="py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 px-2">
        <Link href="/" className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0F9E75] transition-colors shadow-sm">
          <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">
          {lang === 'zh' ? '免責聲明' : 'Disclaimer'}
        </h1>
      </div>

      <div className="card-lg p-6 space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed">
        <div className="flex items-center gap-3 text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/30">
          <AlertTriangle size={24} className="shrink-0" />
          <p className="text-sm font-bold">
            {lang === 'zh' 
              ? '本應用程式所提供之資訊僅供參考，並非醫療建議。' 
              : 'The information provided by this app is for reference only and is not medical advice.'}
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            {lang === 'zh' ? '1. 非醫療專業建議' : '1. Not Medical Advice'}
          </h2>
          <p>
            {lang === 'zh'
              ? 'MacroDay 是一個基於人工智慧（AI）的營養與健身輔助工具。我們提供的餐單建議、營養計算及訓練計畫皆由演算法生成，不能取代專業醫師、營養師或健身教練的診斷與指導。'
              : 'MacroDay is an AI-powered nutrition and fitness assistant. Our meal suggestions, nutrient calculations, and training plans are algorithm-generated and cannot replace the diagnosis and guidance of professional physicians, dietitians, or fitness coaches.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            {lang === 'zh' ? '2. 精確度限制' : '2. Accuracy Limits'}
          </h2>
          <p>
            {lang === 'zh'
              ? '雖然我們努力提供準確的營養數據，但 AI 生成的內容可能存在誤差。食物的營養成分會因產地、烹飪方式及份量估算而有所不同。請用戶在執行任何飲食計畫前，務必根據自身體質進行判斷。'
              : 'While we strive to provide accurate nutritional data, AI-generated content may contain errors. Nutrient composition vary by origin, cooking method, and portion estimation. Users must exercise their own judgment based on their physical condition.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            {lang === 'zh' ? '3. 身體狀況與過敏' : '3. Health Conditions & Allergies'}
          </h2>
          <p>
            {lang === 'zh'
              ? '如果您患有糖尿病、高血壓、腎臟病或其他任何慢性疾病，或正處於懷孕/哺乳期，在使用本 App 前請務必諮詢醫療人員。請自行確保所選餐單中不含您的過敏原。'
              : 'If you suffer from diabetes, hypertension, kidney disease, or any other chronic condition, or are pregnant/breastfeeding, please consult a medical professional before using this app. Ensure the selected meals do not contain your allergens.'}
          </p>
        </section>

        <footer className="pt-6 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
          Updated: 2026-04-12
        </footer>
      </div>
    </div>
  )
}
