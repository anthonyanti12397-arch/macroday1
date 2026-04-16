'use client'

import { useState } from 'react'
import type { InBodyRecord, PreferredCuisine, UserProfile } from '@/lib/types'
import { saveInBodyRecord, saveUserProfile } from '@/lib/storage'
import { useLang } from '@/contexts/LangContext'
import { toast } from 'sonner'

interface InBodyFormProps {
  latestRecord: InBodyRecord | null
  latestProfile: UserProfile | null
  editingRecord?: InBodyRecord | null
  onSaved: () => void
  onCancelEdit?: () => void
}

const RESTRICTIONS = ['No dairy', 'No gluten', 'Vegetarian', 'Vegan', 'No nuts', 'Halal']

const GOAL_OPTIONS: { value: UserProfile['goal'] }[] = [
  { value: 'muscle_gain' },
  { value: 'fat_loss' },
  { value: 'maintain' },
]

const FITNESS_LEVEL_OPTIONS: { value: NonNullable<UserProfile['fitnessLevel']> }[] = [
  { value: 'beginner' },
  { value: 'active' },
  { value: 'advanced' },
]

const FITNESS_LEVEL_ZH: Record<string, string> = {
  beginner: '新手 (機身/徒手)',
  active: '定期運動 (含負重)',
  advanced: '進階老手 (大重量)',
}


const PROTEIN_OPTIONS = ['Chicken', 'Fish', 'Pork', 'Beef', 'Tofu', 'Eggs', 'Seafood', 'Lamb']
const CARB_OPTIONS = ['Rice', 'Noodles', 'Bread', 'Sweet Potato', 'Oats', 'Pasta']
const COOKING_STYLE_OPTIONS: { value: UserProfile['cookingStyle'] }[] = [
  { value: 'home' },
  { value: 'takeout' },
  { value: 'both' },
]

const COOKING_STYLE_DESC: Record<UserProfile['cookingStyle'], { en: string; zh: string }> = {
  home:    { en: 'Full recipes with ingredients & steps', zh: '完整食譜，含食材及步驟' },
  takeout: { en: 'Easy-to-find dishes & where to buy',   zh: '容易購買的外賣推薦' },
  both:    { en: 'Mix of home cook and takeout',          zh: '自煮與外賣混合' },
}

const PROTEIN_ZH: Record<string, string> = {
  Chicken: '雞肉', Fish: '魚', Pork: '豬肉', Beef: '牛肉',
  Tofu: '豆腐', Eggs: '雞蛋', Seafood: '海鮮', Lamb: '羊肉',
}

const CARB_ZH: Record<string, string> = {
  Rice: '白飯', Noodles: '麵', Bread: '麵包',
  'Sweet Potato': '番薯', Oats: '燕麥', Pasta: '意粉',
}

const PREFERRED_CUISINE_OPTIONS: PreferredCuisine[] = [
  'Argentine',
  'Latin American',
  'Mediterranean',
  'Asian',
  'High Protein Classics',
]

const RESTRICTION_ZH: Record<string, string> = {
  'No dairy': '無乳製品', 'No gluten': '無麩質',
  Vegetarian: '素食', Vegan: '純素', 'No nuts': '無堅果', Halal: '清真',
}

export default function InBodyForm({ latestRecord, latestProfile, editingRecord, onSaved, onCancelEdit }: InBodyFormProps) {
  const { lang, t } = useLang()
  const i = t.inbody

  const initialRecord = editingRecord || latestRecord
  
  const [weight, setWeight] = useState(initialRecord?.weight.toString() ?? '')
  const [height, setHeight] = useState(initialRecord?.height.toString() ?? '')
  const [age, setAge] = useState(initialRecord?.age.toString() ?? '')
  const [date, setDate] = useState(editingRecord?.date ?? (() => {
    const d = new Date(); 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })())
  const [gender, setGender] = useState<'male' | 'female'>(initialRecord?.gender ?? 'male')
  const [bodyFat, setBodyFat] = useState(initialRecord?.bodyFat?.toString() ?? '')
  const [muscleMass, setMuscleMass] = useState(initialRecord?.skeletalMuscleMass?.toString() ?? '')
  const [bmr, setBmr] = useState(initialRecord?.bmr?.toString() ?? '')
  const [visceralFat, setVisceralFat] = useState(initialRecord?.visceralFatLevel?.toString() ?? '')
  const [bodyWater, setBodyWater] = useState(initialRecord?.bodyWater?.toString() ?? '')
  const [goal, setGoal] = useState<UserProfile['goal']>(latestProfile?.goal ?? 'maintain')
  const [restrictions, setRestrictions] = useState<string[]>(latestProfile?.dietaryRestrictions ?? [])
  const [proteinPrefs, setProteinPrefs] = useState<string[]>(latestProfile?.proteinPreferences ?? [])
  const [carbPrefs, setCarbPrefs] = useState<string[]>(latestProfile?.carbPreferences ?? [])
  const [cookingStyle, setCookingStyle] = useState<UserProfile['cookingStyle']>(latestProfile?.cookingStyle ?? 'both')
  const [preferredCuisine, setPreferredCuisine] = useState<PreferredCuisine>(latestProfile?.preferredCuisine ?? 'Argentine')
  const [fitnessLevel, setFitnessLevel] = useState<NonNullable<UserProfile['fitnessLevel']>>(latestProfile?.fitnessLevel ?? 'beginner')

  const [error, setError] = useState('')

  const toggle = (arr: string[], val: string, setter: (v: string[]) => void) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(5);
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
  }

  const setGenderWithHaptic = (g: 'male'|'female') => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(5);
    setGender(g);
  }

  const setGoalWithHaptic = (g: UserProfile['goal']) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(5);
    setGoal(g);
  }

  function validateOptionalNumber(val: string, min: number, max: number, label: string): string {
    if (!val) return ''
    const n = Number(val)
    if (isNaN(n) || n < min || n > max) return `${label} must be between ${min} and ${max}`
    return ''
  }

  function validate(): string {
    if (!weight || isNaN(Number(weight)) || Number(weight) <= 0) return lang === 'zh' ? '體重必須是正數' : 'Weight must be a positive number'
    if (!height || isNaN(Number(height)) || Number(height) < 50 || Number(height) > 250) return lang === 'zh' ? '身高必須介於 50–250 cm' : 'Height must be between 50 and 250 cm'
    if (!age || isNaN(Number(age)) || Number(age) < 10 || Number(age) > 120) return lang === 'zh' ? '年齡必須介於 10–120' : 'Age must be between 10 and 120'
    return (
      validateOptionalNumber(bodyFat, 1, 70, i.bodyFat) ||
      validateOptionalNumber(muscleMass, 1, 100, i.muscle) ||
      validateOptionalNumber(bmr, 500, 5000, 'BMR') ||
      validateOptionalNumber(visceralFat, 1, 20, i.visceralFat) ||
      validateOptionalNumber(bodyWater, 0, 100, i.bodyWater)
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')

    const record: InBodyRecord = {
      id: editingRecord?.id || crypto.randomUUID(),
      date,
      weight: Number(weight), height: Number(height), age: Number(age), gender,
      ...(bodyFat ? { bodyFat: Number(bodyFat) } : {}),
      ...(muscleMass ? { skeletalMuscleMass: Number(muscleMass) } : {}),
      ...(bmr ? { bmr: Number(bmr) } : {}),
      ...(visceralFat ? { visceralFatLevel: Number(visceralFat) } : {}),
      ...(bodyWater ? { bodyWater: Number(bodyWater) } : {}),
    }

    const profile: UserProfile = {
      goal, dietaryRestrictions: restrictions,
      activityLevel: latestProfile?.activityLevel ?? 'moderate',
      fitnessLevel,
      proteinPreferences: proteinPrefs, carbPreferences: carbPrefs,
      cuisinePreferences: [],
      preferredCuisine,
      dislikedIngredients: latestProfile?.dislikedIngredients ?? [],
      cookingStyle, isPro: latestProfile?.isPro ?? false,
      isAdFree: latestProfile?.isAdFree ?? false,
    }

    saveInBodyRecord(record)
    saveUserProfile(profile)
    toast.success(lang === 'zh' ? '設定已儲存！' : 'Settings saved successfully!')
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Required fields */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
          {i.basicInfo} <span className="text-red-400">{i.required}</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight pl-1">{lang === 'zh' ? '日期' : 'Date'}</label>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-zinc-200 focus:border-[#0F9E75] focus:ring-0 text-slate-800 font-bold transition-all"
            />
          </div>
          <Field label={`${i.weight} *`} value={weight} onChange={setWeight} placeholder="75.0" />
          <Field label={`${i.height} *`} value={height} onChange={setHeight} placeholder="175" />
          <Field label={`${i.age} *`} value={age} onChange={setAge} placeholder="28" />
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{i.gender} *</label>
            <div className="flex gap-2 h-[44px] items-center">
              {(['male', 'female'] as const).map((g) => (
                <button key={g} type="button" onClick={() => setGenderWithHaptic(g)}
                  className={`flex-1 h-full rounded-2xl text-sm font-bold border transition-all active:scale-95 ${
                    gender === g
                      ? 'bg-[#0F9E75] text-white border-[#0F9E75] shadow-lg shadow-[#0F9E75]/20'
                      : 'bg-white/50 backdrop-blur-sm text-zinc-500 border-zinc-200'
                  }`}>
                  {g === 'male' ? i.male : i.female}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Optional InBody fields */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
          {i.inbodySection} <span className="text-zinc-400 font-normal normal-case">{i.inbodyOptional}</span>
        </p>
        <p className="text-xs text-zinc-400 mb-3">{i.inbodyHint}</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label={i.bodyFat} value={bodyFat} onChange={setBodyFat} placeholder="18.5" />
          <Field label={i.muscle} value={muscleMass} onChange={setMuscleMass} placeholder="35.0" />
          <Field label={i.bmr} value={bmr} onChange={setBmr} placeholder="1750" />
          <Field label={i.visceralFat} value={visceralFat} onChange={setVisceralFat} placeholder="5" />
          <Field label={i.bodyWater} value={bodyWater} onChange={setBodyWater} placeholder="55.0" />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      {/* Cooking Style */}
      <div>
        <p className="text-sm font-semibold text-zinc-700 mb-2">{i.cookingStyle}</p>
        <div className="grid grid-cols-3 gap-2">
          {COOKING_STYLE_OPTIONS.map(({ value }) => (
            <button key={value} type="button" onClick={() => {
              if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(5);
              setCookingStyle(value);
            }}
              className={`flex flex-col items-center text-center px-2 py-3 rounded-2xl text-sm border transition-all active:scale-95 gap-1 ${
                cookingStyle === value
                  ? 'bg-[#0F9E75] text-white border-[#0F9E75] shadow-lg shadow-[#0F9E75]/20'
                  : 'bg-white/50 backdrop-blur-sm text-zinc-700 border-zinc-200 hover:border-[#0F9E75]'
              }`}>
              <span className="font-bold">{t.cookingStyle[value]}</span>
              <span className={`text-[10px] leading-tight ${cookingStyle === value ? 'text-white/80' : 'text-zinc-400'}`}>
                {COOKING_STYLE_DESC[value][lang]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Protein preferences */}
      <div>
        <p className="text-sm font-semibold text-zinc-700 mb-1">{i.proteinPrefs}</p>
        <p className="text-xs text-zinc-400 mb-2">{i.proteinOptional}</p>
        <div className="flex flex-wrap gap-2">
          {PROTEIN_OPTIONS.map((p) => (
            <button key={p} type="button" onClick={() => toggle(proteinPrefs, p, setProteinPrefs)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                proteinPrefs.includes(p)
                  ? 'bg-[#0F9E75] text-white border-[#0F9E75]'
                  : 'bg-white text-zinc-600 border-zinc-300 hover:border-[#0F9E75]'
              }`}>
              {lang === 'zh' ? PROTEIN_ZH[p] : p}
            </button>
          ))}
        </div>
      </div>

      {/* Carb preferences */}
      <div>
        <p className="text-sm font-semibold text-zinc-700 mb-1">{i.carbPrefs}</p>
        <p className="text-xs text-zinc-400 mb-2">{i.carbOptional}</p>
        <div className="flex flex-wrap gap-2">
          {CARB_OPTIONS.map((c) => (
            <button key={c} type="button" onClick={() => toggle(carbPrefs, c, setCarbPrefs)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                carbPrefs.includes(c)
                  ? 'bg-[#E09B20] text-white border-[#E09B20]'
                  : 'bg-white text-zinc-600 border-zinc-300 hover:border-[#E09B20]'
              }`}>
              {lang === 'zh' ? CARB_ZH[c] : c}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine preferences */}
      <div>
        <p className="text-sm font-semibold text-zinc-700 mb-2">Preferred Cuisine</p>
        <select
          value={preferredCuisine}
          onChange={(e) => setPreferredCuisine(e.target.value as PreferredCuisine)}
          className="w-full h-12 px-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-zinc-200 focus:border-[#0F9E75] focus:ring-0 text-slate-800 font-bold transition-all"
        >
          {PREFERRED_CUISINE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-400 mt-2">
          {lang === 'zh' ? '讓 AI 更貼近你所在市場與食材文化。' : 'Helps AI localize meals to your market and pantry.'}
        </p>
      </div>



      {/* Goal */}
      <div>
        <p className="text-sm font-semibold text-zinc-700 mb-2">{i.goal}</p>
        <div className="flex gap-2 flex-wrap">
          {GOAL_OPTIONS.map(({ value }) => (
            <button key={value} type="button" onClick={() => setGoalWithHaptic(value)}
              className={`px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all active:scale-95 ${
                goal === value
                  ? 'bg-[#0F9E75] text-white border-[#0F9E75] shadow-lg shadow-[#0F9E75]/20'
                  : 'bg-white/50 backdrop-blur-sm text-zinc-700 border-zinc-200 hover:border-[#0F9E75]'
              }`}>
              {t.settings.goalLabels[value]}
            </button>
          ))}
        </div>
      </div>

      {/* Fitness Level */}
      <div>
        <p className="text-sm font-semibold text-zinc-700 mb-2">{lang === 'zh' ? '運動習慣' : 'Fitness Level'}</p>
        <div className="flex gap-2 flex-wrap">
          {FITNESS_LEVEL_OPTIONS.map(({ value }) => (
            <button key={value} type="button" onClick={() => {
              if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(5);
              setFitnessLevel(value);
            }}
              className={`px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all active:scale-95 ${
                fitnessLevel === value
                  ? 'bg-[#0F9E75] text-white border-[#0F9E75] shadow-lg shadow-[#0F9E75]/20'
                  : 'bg-white/50 backdrop-blur-sm text-zinc-700 border-zinc-200 hover:border-[#0F9E75]'
              }`}>
              {lang === 'zh' ? FITNESS_LEVEL_ZH[value] : value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Dietary Restrictions */}
      <div>
        <p className="text-sm font-semibold text-zinc-700 mb-2">{i.restrictions}</p>
        <div className="flex flex-wrap gap-3">
          {RESTRICTIONS.map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={restrictions.includes(r)}
                onChange={() => toggle(restrictions, r, setRestrictions)}
                className="w-4 h-4 accent-[#0F9E75]" />
              <span className="text-sm text-zinc-700">{lang === 'zh' ? RESTRICTION_ZH[r] : r}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {editingRecord && (
          <button type="button" onClick={onCancelEdit} className="flex-1 h-12 rounded-2xl border border-zinc-200 text-zinc-500 font-bold hover:bg-zinc-50 transition-all">
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
        )}
        <button type="submit" className="flex-[2] btn-primary">{t.btn.save}</button>
      </div>
    </form>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight pl-1">{label}</label>
      <input 
        type="number" 
        step="any" 
        inputMode="decimal"
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} 
        className="w-full h-12 px-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-zinc-200 focus:border-[#0F9E75] focus:ring-0 text-slate-800 font-bold transition-all" 
      />
    </div>
  )
}
