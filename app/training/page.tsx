'use client'

import { useEffect, useState } from 'react'
import { getLatestInBody, getUserProfile, getTrainingHistory, saveTrainingRecord, addMacroScore } from '@/lib/storage'
import type { InBodyRecord, UserProfile, TrainingRecord, TrainingPlan } from '@/lib/types'
import { useLang } from '@/contexts/LangContext'
import { CheckCircle, Activity, Loader2, Dumbbell, Flame, Clock } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import CheckInCamera from '@/components/CheckInCamera'

const FOCUS_AREAS = [
  { id: 'upper', zh: '上肢推 (胸/肩/三頭)', en: 'Upper Body (Push)' },
  { id: 'pull', zh: '胸背 (背/二頭)', en: 'Upper Body (Pull)' },
  { id: 'lower', zh: '下肢與臀部', en: 'Lower Body & Glutes' },
  { id: 'core', zh: '核心強化', en: 'Core' },
  { id: 'cardio', zh: '燃脂有氧', en: 'Cardio' },
  { id: 'full', zh: '全身綜合', en: 'Full Body' },
]

export default function TrainingPage() {
  const { lang, t } = useLang()
  const [inbody, setInbody] = useState<InBodyRecord | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [todayRecord, setTodayRecord] = useState<TrainingRecord | null>(null)

  const [focusArea, setFocusArea] = useState('full')
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [diversity, setDiversity] = useState(0.5)

  useEffect(() => {
    setInbody(getLatestInBody())
    setProfile(getUserProfile())
    
    const th = getTrainingHistory()
    const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
    const today = th.find(t => t.date === todayStr)
    if (today) setTodayRecord(today)
  }, [])

  function getExcludedExercises(): string[] {
    const history = getTrainingHistory()
    const today = new Date()
    const last3Days: string[] = []

    // Get exercise names from last 3 days
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const record = history.find(r => r.date === dateStr)
      if (record?.plan?.exercises) {
        last3Days.push(...record.plan.exercises.map(ex => ex.name))
      }
    }

    return last3Days
  }

  async function handleGenerate(isRegenerate: boolean = false) {
    if (!inbody || !profile) return
    setIsGenerating(true)
    setLoadingText(lang === 'zh' ? '分析肌肉數據...' : 'Analyzing data...')

    try {
      const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()

      setTimeout(() => setLoadingText(lang === 'zh' ? '配對最佳動作...' : 'Matching exercises...'), 1500)
      setTimeout(() => setLoadingText(lang === 'zh' ? '建立訓練清單...' : 'Building plan...'), 3500)

      const excludedExercises = isRegenerate ? getExcludedExercises() : []
      const currentDiversity = isRegenerate ? Math.min(diversity + 0.2, 1.0) : diversity
      const seed = `${todayStr}_${Date.now()}`

      const response = await fetch('/api/generate-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: inbody.weight,
          height: inbody.height,
          age: inbody.age,
          gender: inbody.gender,
          goal: profile.goal,
          muscleKg: inbody.skeletalMuscleMass,
          fatPercent: inbody.bodyFat,
          date: todayStr,
          focus: focusArea,
          fitnessLevel: profile.fitnessLevel || 'beginner',
          diversity: currentDiversity,
          excludeExercises: excludedExercises,
          seed,
        })
      })

      if (!response.ok) throw new Error('Failed to generate')

      const plan: TrainingPlan = await response.json()

      const record: TrainingRecord = {
        date: todayStr,
        plan,
        completed: false,
        regenerationCount: isRegenerate ? (todayRecord?.regenerationCount ?? 0) + 1 : 0
      }

      saveTrainingRecord(record)
      setTodayRecord(record)
      setDiversity(currentDiversity)
      toast.success(lang === 'zh' ? '訓練清單已生成！' : 'Training plan generated!')
    } catch (err) {
      toast.error(lang === 'zh' ? '生成失敗，請重試' : 'Generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleComplete() {
    setCheckinOpen(true)
  }

  function executeComplete() {
    if (!todayRecord) return
    const updated = { ...todayRecord, completed: true, completedAt: new Date().toISOString() }
    saveTrainingRecord(updated)
    setTodayRecord(updated)
    
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate([100, 50, 100])
    }
    addMacroScore(15)
    toast.success(lang === 'zh' ? '🏆 +15 分！做的好' : '🏆 +15 pts! Great job')
  }

  if (!inbody || !profile) {
    return (
      <div className="py-6 space-y-5">
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)', boxShadow: '0 4px 12px rgba(15,158,117,0.35)' }}>
            <Dumbbell size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
              {lang === 'zh' ? '訓練' : 'Training'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'zh' ? 'AI 個人化訓練計劃' : 'AI personalised workouts'}
            </p>
          </div>
        </div>

        <div className="relative rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #0f1f1a 0%, #111827 60%, #0a1628 100%)', border: '1px solid rgba(15,158,117,0.15)', boxShadow: '0 0 40px rgba(15,158,117,0.06)' }}>
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-15 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #0BD68A 0%, transparent 70%)' }} />
          <div className="relative p-6 space-y-5">
            {/* Step progress */}
            <div className="flex items-center gap-2">
              {[
                { n: 1, label: lang === 'zh' ? '身體數據' : 'Body Data', done: false },
                { n: 2, label: lang === 'zh' ? '餐單' : 'Meals', done: false },
                { n: 3, label: lang === 'zh' ? '訓練' : 'Training', done: false },
              ].map((step, i) => (
                <div key={step.n} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${step.n === 1 ? 'text-white' : 'text-slate-600 bg-slate-800'}`}
                    style={step.n === 1 ? { background: 'linear-gradient(135deg, #0F9E75, #0BD68A)' } : {}}>
                    {step.n}
                  </div>
                  <span className={`text-[10px] font-semibold truncate ${step.n === 1 ? 'text-[#0BD68A]' : 'text-slate-600'}`}>{step.label}</span>
                  {i < 2 && <div className="flex-1 h-px bg-slate-700 mx-1" />}
                </div>
              ))}
            </div>

            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(15,158,117,0.12)', border: '1px solid rgba(15,158,117,0.2)' }}>
                <Dumbbell size={28} className="text-[#0F9E75]" />
              </div>
              <p className="font-bold text-white text-base mb-1">
                {lang === 'zh' ? '先完成身體數據' : 'Complete Body Data First'}
              </p>
              <p className="text-slate-400 text-sm">
                {lang === 'zh' ? 'AI 需要你的肌肉數據才能配對最佳訓練' : 'AI needs your muscle data to match the right workout'}
              </p>
            </div>

            <Link href="/inbody" className="block w-full py-3.5 rounded-2xl text-white font-bold text-sm text-center transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)', boxShadow: '0 4px 14px rgba(15,158,117,0.35)' }}>
              {lang === 'zh' ? '前往輸入數據 →' : 'Add Body Data →'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6 pb-24">
      <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 px-2 tracking-tight">
        {lang === 'zh' ? '訓練' : 'Training'}
      </h1>

      {todayRecord ? (
        <div className="space-y-4 px-2">
          {todayRecord.completed && (
            <div className="bg-[#E8F5F0] border border-[#0F9E75]/20 rounded-2xl p-4 flex gap-3 text-[#0F9E75]">
              <CheckCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{lang === 'zh' ? '今日訓練已達成' : 'Today completed!'}</p>
                <p className="text-xs opacity-80 mt-0.5">{lang === 'zh' ? '好好休息，肌肉正在成長中。' : 'Rest well, your muscles are recovering.'}</p>
              </div>
            </div>
          )}

          <div className="card-lg p-5">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{todayRecord.plan.name}</h2>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock size={14} />
                  <span className="text-xs font-semibold">{todayRecord.plan.duration} mins</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Flame size={14} className="text-amber-500" />
                  <span className="text-xs font-semibold">{todayRecord.plan.estimatedCalories} kcal</span>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Warm Up</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">{todayRecord.plan.warmup}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Exercises</p>
                <div className="space-y-3">
                  {todayRecord.plan.exercises.map((ex, i) => (
                    <div key={i} className="flex gap-3 bg-white dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 p-4 rounded-2xl shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-[#0F9E75]/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#0F9E75]">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{ex.name}</p>
                        <div className="flex gap-3 mt-1.5">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 px-2 py-0.5 rounded-md">
                            {ex.sets} sets
                          </span>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 px-2 py-0.5 rounded-md">
                            {ex.reps} reps
                          </span>
                        </div>
                        {ex.tips && (
                          <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">
                            💡 {ex.tips}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cool Down</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">{todayRecord.plan.cooldown}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleComplete}
                className="flex-1 btn-primary !text-lg !h-14 shadow-lg shadow-[#0F9E75]/30">
                📸 {lang === 'zh' ? '拍照打卡得分' : 'Photo Check-in'}
              </button>
              <button
                onClick={() => handleGenerate(true)}
                disabled={isGenerating}
                className="flex-1 btn-secondary !text-lg !h-14 shadow-lg shadow-slate-300/30 dark:shadow-slate-700/30">
                🔄 {lang === 'zh' ? '重新生成' : 'Regenerate'}
                {todayRecord.regenerationCount ? ` (${todayRecord.regenerationCount})` : ''}
              </button>
            </div>
            
            {checkinOpen && (
              <CheckInCamera
                checkInType="training"
                onVerified={() => {
                  setCheckinOpen(false)
                  executeComplete()
                }}
                onClose={() => setCheckinOpen(false)}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 px-2">
          <div className="card-lg bg-gradient-to-br from-[#0F9E75] to-[#0BD68A] p-6 text-white overflow-hidden relative">
            <Dumbbell size={100} className="absolute -right-4 -bottom-4 opacity-10" />
            <p className="font-bold text-lg mb-2 relative z-10">
              {lang === 'zh' ? '今日尚未生成訓練 💪' : "Today's training not set 💪"}
            </p>
            <p className="text-sm text-white/80 font-medium relative z-10">
              {lang === 'zh' 
                ? `根據前次更新的 ${inbody.bodyFat || '--'}% 體脂與「${t.settings.goalLabels[profile.goal]}」目標，請選擇今日重點：` 
                : `Based on your ${inbody.bodyFat || '--'}% body fat and ${t.settings.goalLabels[profile.goal]} goal:`}
            </p>
          </div>

          <div>
             <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1">
               {lang === 'zh' ? '選擇今日訓練部位' : 'Select Target Area'}
             </p>
             <div className="flex flex-wrap gap-2">
               {FOCUS_AREAS.map(area => (
                 <button 
                   key={area.id}
                   onClick={() => setFocusArea(area.id)}
                   className={`px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all active:scale-95 ${
                     focusArea === area.id
                       ? 'bg-[#0F9E75] border-[#0F9E75] text-white shadow-md shadow-[#0F9E75]/20'
                       : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-[#0F9E75]'
                   }`}
                 >
                   {lang === 'zh' ? area.zh : area.en}
                 </button>
               ))}
             </div>
          </div>

          <button
            disabled={isGenerating}
            onClick={() => handleGenerate(false)}
            className={`w-full !h-14 !text-base relative overflow-hidden transition-all ${
              isGenerating 
                ? 'bg-slate-100 text-[#0F9E75] border-2 border-[#0F9E75] opacity-90 cursor-wait shadow-inner rounded-2xl font-bold flex items-center justify-center gap-2'
                : 'btn-primary shadow-xl shadow-[#0F9E75]/20'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>{loadingText}</span>
              </>
            ) : (
              lang === 'zh' ? '生成今日訓練' : 'Generate Today\'s Training'
            )}
            
            {isGenerating && (
              <div className="absolute bottom-0 left-0 h-1 bg-[#0F9E75] transition-all duration-1000 w-1/2 animate-pulse" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}
