'use client'

import { useState, useRef } from 'react'
import { X, Camera, Upload, Loader2, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Meal } from '@/lib/types'

interface IdentifiedFood {
  foodName: string
  englishName: string
  servingSize: string
  estimatedCalories: number
  estimatedProtein: number
  estimatedCarbs: number
  estimatedFat: number
  ingredients: string[]
  confidence: number
}

interface FoodVisionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubstitute?: (meal: Meal) => void
  onAddExtra?: (food: IdentifiedFood) => void
  currentMealName?: string
  lang: string
}

export default function FoodVisionModal({
  isOpen,
  onClose,
  onSubstitute,
  onAddExtra,
  currentMealName,
  lang,
}: FoodVisionModalProps) {
  const [step, setStep] = useState<'capture' | 'identify' | 'result'>('capture')
  const [identifiedFood, setIdentifiedFood] = useState<IdentifiedFood | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  async function identifyFood(imageBase64: string, mimeType: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/identify-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType }),
      })

      if (!res.ok) throw new Error('Failed to identify food')

      const data: IdentifiedFood = await res.json()

      if (data.confidence < 0.3) {
        toast.error(lang === 'zh' ? '無法識別食物，請重試' : 'Could not identify food, please try again')
        setStep('capture')
        return
      }

      setIdentifiedFood(data)
      setStep('result')
      toast.success(lang === 'zh' ? '識別成功！' : 'Food identified!')
    } catch (err) {
      toast.error(lang === 'zh' ? '識別失敗，請重試' : 'Identification failed, please try again')
      setStep('capture')
    } finally {
      setLoading(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      const mimeType = file.type || 'image/jpeg'
      identifyFood(base64.split(',')[1] || base64, mimeType)
    }
    reader.readAsDataURL(file)
  }

  function handleSubstitute() {
    if (!identifiedFood || !onSubstitute) return

    const meal: Meal = {
      name: identifiedFood.foodName,
      imagePrompt: identifiedFood.englishName,
      cookingTime: 0,
      calories: identifiedFood.estimatedCalories,
      protein: identifiedFood.estimatedProtein,
      carbs: identifiedFood.estimatedCarbs,
      fat: identifiedFood.estimatedFat,
      ingredients: identifiedFood.ingredients,
      steps: [lang === 'zh' ? '拍照識別的餐點' : 'Photo-identified meal'],
      isTakeout: true,
      whereToGet: lang === 'zh' ? '直接享用' : 'Enjoy immediately',
    }

    onSubstitute(meal)
    onClose()
  }

  function handleAddExtra() {
    if (!identifiedFood || !onAddExtra) return
    onAddExtra(identifiedFood)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-white dark:bg-slate-800 rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {lang === 'zh' ? '📸 識別食物' : '📸 Identify Food'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Capture Step */}
        {step === 'capture' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {lang === 'zh'
                ? '拍照或上傳食物圖片，AI 將分析營養信息'
                : 'Take a photo or upload an image of your food for AI nutrition analysis'}
            </p>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
              >
                <Camera size={18} />
                {lang === 'zh' ? '拍照' : 'Camera'}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                {lang === 'zh' ? '上傳' : 'Upload'}
              </button>
            </div>
          </div>
        )}

        {/* Result Step */}
        {step === 'result' && identifiedFood && (
          <div className="space-y-4">
            <div className="bg-teal-50 dark:bg-slate-700 border border-teal-100 dark:border-slate-600 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                {identifiedFood.confidence >= 0.7 ? (
                  <Check className="text-[#0F9E75] shrink-0 mt-0.5" size={20} />
                ) : (
                  <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                )}
                <div className="flex-1">
                  <p className="font-bold text-lg text-slate-800 dark:text-slate-100">
                    {identifiedFood.foodName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {identifiedFood.englishName} · {identifiedFood.servingSize}
                  </p>
                  {identifiedFood.confidence < 0.7 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      {lang === 'zh' ? '⚠️ 識別信心度有限，請核實數據' : '⚠️ Low confidence - please verify data'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Nutrition Table */}
            <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {lang === 'zh' ? '營養估算' : 'Nutrition Estimate'}
              </p>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white dark:bg-slate-600 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">熱量</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {identifiedFood.estimatedCalories}
                  </p>
                  <p className="text-[10px] text-slate-400">kcal</p>
                </div>
                <div className="bg-white dark:bg-slate-600 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">蛋白質</p>
                  <p className="text-lg font-bold text-[#0F9E75]">
                    {identifiedFood.estimatedProtein}
                  </p>
                  <p className="text-[10px] text-slate-400">g</p>
                </div>
                <div className="bg-white dark:bg-slate-600 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">碳水</p>
                  <p className="text-lg font-bold text-amber-500">
                    {identifiedFood.estimatedCarbs}
                  </p>
                  <p className="text-[10px] text-slate-400">g</p>
                </div>
                <div className="bg-white dark:bg-slate-600 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">脂肪</p>
                  <p className="text-lg font-bold text-red-500">
                    {identifiedFood.estimatedFat}
                  </p>
                  <p className="text-[10px] text-slate-400">g</p>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            {identifiedFood.ingredients.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'zh' ? '主要成分' : 'Main Ingredients'}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {identifiedFood.ingredients.join(' · ')}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {onSubstitute && (
                <button
                  onClick={handleSubstitute}
                  className="flex-1 btn-primary py-3"
                >
                  {currentMealName
                    ? (lang === 'zh' ? `替換${currentMealName}` : `Replace ${currentMealName}`)
                    : (lang === 'zh' ? '替換餐點' : 'Substitute Meal')}
                </button>
              )}
              {onAddExtra && (
                <button
                  onClick={handleAddExtra}
                  className="flex-1 btn-secondary py-3"
                >
                  {lang === 'zh' ? '加入額外食物' : 'Add as Extra'}
                </button>
              )}
              <button
                onClick={() => setStep('capture')}
                className="flex-1 btn-secondary py-3"
              >
                {lang === 'zh' ? '重新拍照' : 'Retake'}
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="animate-spin text-[#0F9E75]" size={32} />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {lang === 'zh' ? '分析中...' : 'Analyzing...'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
