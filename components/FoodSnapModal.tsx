'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Upload, Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useLang } from '@/contexts/LangContext'

interface FoodResult {
  name: string
  nameZh: string
  calories: number
  protein: number
  carbs: number
  fat: number
  serving: string
  confidence: 'high' | 'medium' | 'low'
  ingredients: string[]
}

interface Props {
  onClose: () => void
}

export default function FoodSnapModal({ onClose }: Props) {
  const { lang } = useLang()
  const [preview, setPreview] = useState<string | null>(null)
  const [base64, setBase64] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FoodResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((file: File) => {
    setResult(null)
    setError(null)
    setMimeType(file.type || 'image/jpeg')

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      // Extract raw base64 (strip data:image/...;base64, prefix)
      const b64 = dataUrl.split(',')[1]
      setBase64(b64)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleAnalyse = async () => {
    if (!base64) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/food/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })
      const data = await res.json() as FoodResult & { error?: string }

      if (!res.ok || data.error) {
        setError(data.error ?? (lang === 'zh' ? '識別失敗，請再試' : 'Could not identify food'))
        return
      }

      setResult(data)
    } catch {
      setError(lang === 'zh' ? '網絡錯誤，請再試' : 'Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  const handleLog = () => {
    if (!result) return
    toast.success(
      lang === 'zh'
        ? `已記錄：${result.nameZh} (${result.calories} kcal)`
        : `Logged: ${result.name} (${result.calories} kcal)`
    )
    onClose()
  }

  const confidenceColor = {
    high: 'text-emerald-500',
    medium: 'text-amber-500',
    low: 'text-rose-500',
  }

  const confidenceLabel = {
    high: lang === 'zh' ? '高可信度' : 'High confidence',
    medium: lang === 'zh' ? '中可信度' : 'Medium confidence',
    low: lang === 'zh' ? '低可信度' : 'Low confidence',
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>

          <div className="px-5 pb-8 pt-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {lang === 'zh' ? '📸 食物識別' : '📸 Snap a Meal'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'zh' ? 'AI 分析你的食物宏量' : 'AI estimates macros from your photo'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Image preview or upload area */}
            {!preview ? (
              <div className="space-y-3">
                {/* Camera button (mobile) */}
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 border-dashed border-[#0F9E75]/40 bg-[#0F9E75]/5 hover:bg-[#0F9E75]/10 transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#0F9E75]/15 flex items-center justify-center">
                    <Camera size={22} className="text-[#0F9E75]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {lang === 'zh' ? '拍照' : 'Take a photo'}
                    </p>
                    <p className="text-xs text-slate-400">{lang === 'zh' ? '使用相機拍攝食物' : 'Use camera to snap food'}</p>
                  </div>
                </button>

                {/* Upload button */}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#0F9E75] transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <Upload size={20} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {lang === 'zh' ? '上傳圖片' : 'Upload photo'}
                    </p>
                    <p className="text-xs text-slate-400">{lang === 'zh' ? '從相簿選擇' : 'Choose from library'}</p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Food" className="w-full h-52 object-cover" />
                  <button
                    onClick={() => { setPreview(null); setBase64(null); setResult(null); setError(null) }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3">
                    <AlertCircle size={16} className="text-rose-500 shrink-0" />
                    <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
                  </div>
                )}

                {/* Result */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      {/* Food name + confidence */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-base font-bold text-slate-800 dark:text-white">
                            {lang === 'zh' ? result.nameZh : result.name}
                          </p>
                          <p className="text-xs text-slate-400">{result.serving}</p>
                        </div>
                        <span className={`text-xs font-semibold ${confidenceColor[result.confidence]}`}>
                          {confidenceLabel[result.confidence]}
                        </span>
                      </div>

                      {/* Macro grid */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: lang === 'zh' ? '卡路里' : 'Cal', value: result.calories, unit: 'kcal', color: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10' },
                          { label: lang === 'zh' ? '蛋白質' : 'Protein', value: result.protein, unit: 'g', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
                          { label: lang === 'zh' ? '碳水' : 'Carbs', value: result.carbs, unit: 'g', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
                          { label: lang === 'zh' ? '脂肪' : 'Fat', value: result.fat, unit: 'g', color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' },
                        ].map((m) => (
                          <div key={m.label} className={`rounded-xl p-2.5 text-center ${m.color.split(' ').slice(1).join(' ')}`}>
                            <div className={`text-lg font-black ${m.color.split(' ')[0]}`}>{m.value}</div>
                            <div className="text-[10px] text-slate-400">{m.unit}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{m.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Ingredients */}
                      {result.ingredients?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {result.ingredients.map((ing) => (
                            <span key={ing} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                              {ing}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Log button */}
                      <button
                        onClick={handleLog}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)', boxShadow: '0 4px 16px rgba(15,158,117,0.3)' }}
                      >
                        <CheckCircle size={18} />
                        {lang === 'zh' ? '記錄這餐' : 'Log this meal'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Analyse button (only when no result yet) */}
                {!result && (
                  <button
                    onClick={handleAnalyse}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)', boxShadow: '0 4px 16px rgba(15,158,117,0.3)' }}
                  >
                    {loading
                      ? <><Loader2 size={18} className="animate-spin" />{lang === 'zh' ? 'AI 分析中...' : 'Analysing...'}</>
                      : <><Camera size={18} />{lang === 'zh' ? '分析宏量' : 'Identify macros'}</>
                    }
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Hidden file inputs */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
