'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, X, AlertTriangle, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useLang } from '@/contexts/LangContext'
import type { InBodyOcrResult } from '@/lib/inbody-ocr'

// The coach-confirmed measurement fields handed back to the parent on save.
export interface ConfirmedInBody {
  date: string
  weight: string
  height: string
  age: string
  gender: 'male' | 'female'
  bodyFat: string
  skeletalMuscleMass: string
  bmr: string
  visceralFatLevel: string
  visceralFatArea: string
  bodyWater: string
  inbodyScore: string
  bmi: string
}

interface Props {
  subjectName: string // "自己" or the client's name — shown in the header
  defaultGender?: 'male' | 'female'
  onConfirm: (fields: ConfirmedInBody) => void | Promise<void>
  onClose: () => void
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function s(v: number | null | undefined): string {
  return v === null || v === undefined ? '' : String(v)
}

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  const buf = await file.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return { base64: btoa(binary), mimeType: file.type || 'image/jpeg' }
}

export default function InBodyPhotoImport({ subjectName, defaultGender = 'male', onConfirm, onClose }: Props) {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const fileRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<'pick' | 'reading' | 'confirm'>('pick')
  const [saving, setSaving] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [confidence, setConfidence] = useState<number | null>(null)
  const [fields, setFields] = useState<ConfirmedInBody>({
    date: todayISO(), weight: '', height: '', age: '', gender: defaultGender,
    bodyFat: '', skeletalMuscleMass: '', bmr: '', visceralFatLevel: '',
    visceralFatArea: '', bodyWater: '', inbodyScore: '', bmi: '',
  })

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStage('reading')
    try {
      const { base64, mimeType } = await fileToBase64(file)
      const res = await fetch('/api/inbody/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const r = (await res.json()) as InBodyOcrResult
      setFields({
        date: r.date || todayISO(),
        weight: s(r.weight), height: s(r.height), age: s(r.age),
        gender: r.gender === 'female' ? 'female' : 'male',
        bodyFat: s(r.bodyFat), skeletalMuscleMass: s(r.skeletalMuscleMass),
        bmr: s(r.bmr), visceralFatLevel: s(r.visceralFatLevel),
        visceralFatArea: s(r.visceralFatArea), bodyWater: '', // not OCR'd — coach fills manually
        inbodyScore: s(r.inbodyScore), bmi: s(r.bmi),
      })
      setWarnings(Array.isArray(r.warnings) ? r.warnings : [])
      setConfidence(typeof r.confidence === 'number' ? r.confidence : null)
      setStage('confirm')
    } catch (err) {
      console.error(err)
      toast.error(zh ? '讀取失敗，請重拍或手動輸入' : 'Could not read the sheet — retake or enter manually')
      setStage('pick')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function set<K extends keyof ConfirmedInBody>(k: K, v: ConfirmedInBody[K]) {
    setFields((f) => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!fields.weight || !fields.height || !fields.age) {
      toast.error(zh ? '體重、身高、年齡為必填' : 'Weight, height and age are required')
      return
    }
    setSaving(true)
    try {
      await onConfirm(fields)
    } finally {
      setSaving(false)
    }
  }

  const lowConf = confidence !== null && confidence < 0.85

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-black text-slate-800 dark:text-white">
              {zh ? '拍照匯入 InBody' : 'Import InBody by photo'}
            </h2>
            <p className="text-xs text-slate-400">{zh ? `對象：${subjectName}` : `For: ${subjectName}`}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

          {stage === 'pick' && (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-10 rounded-3xl border-2 border-dashed border-[#0F9E75]/40 bg-[#E8F5F0]/50 dark:bg-emerald-900/10 flex flex-col items-center gap-3 hover:border-[#0F9E75] transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#0F9E75] flex items-center justify-center">
                <Camera size={26} className="text-white" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-200">{zh ? '拍照或選擇 InBody 紙本' : 'Take or pick an InBody printout'}</p>
              <p className="text-xs text-slate-400 px-8 text-center">
                {zh ? 'AI 會自動讀取數值，你只需確認後儲存' : 'AI reads the values — you just confirm and save'}
              </p>
            </button>
          )}

          {stage === 'reading' && (
            <div className="py-16 flex flex-col items-center gap-3">
              <Loader2 size={32} className="text-[#0F9E75] animate-spin" />
              <p className="font-bold text-slate-600 dark:text-slate-300">{zh ? '正在讀取數值…' : 'Reading the sheet…'}</p>
            </div>
          )}

          {stage === 'confirm' && (
            <div className="space-y-4">
              <div className={`flex items-start gap-2 p-3 rounded-2xl text-xs font-medium ${lowConf || warnings.length ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'}`}>
                {lowConf || warnings.length ? <AlertTriangle size={15} className="shrink-0 mt-0.5" /> : <Check size={15} className="shrink-0 mt-0.5" />}
                <span>
                  {lowConf || warnings.length
                    ? (zh ? '部分數值可能不準，請核對下方標示的欄位後再儲存。' : 'Some values may be off — please check the highlighted fields before saving.')
                    : (zh ? '已讀取，請核對後儲存。' : 'Read successfully — please verify and save.')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <FLabel>{zh ? '檢測日期' : 'Date'}</FLabel>
                  <input type="date" value={fields.date} onChange={(e) => set('date', e.target.value)} className={inputCls(false)} />
                </div>
                <NumField label={zh ? '體重 (kg) *' : 'Weight (kg) *'} k="weight" fields={fields} warnings={warnings} onChange={set} />
                <NumField label={zh ? '身高 (cm) *' : 'Height (cm) *'} k="height" fields={fields} warnings={warnings} onChange={set} />
                <NumField label={zh ? '年齡 *' : 'Age *'} k="age" fields={fields} warnings={warnings} onChange={set} />
                <div>
                  <FLabel>{zh ? '性別' : 'Gender'}</FLabel>
                  <div className="flex gap-2 h-12">
                    {(['male', 'female'] as const).map((g) => (
                      <button key={g} type="button" onClick={() => set('gender', g)}
                        className={`flex-1 rounded-2xl text-sm font-bold border transition-all ${fields.gender === g ? 'bg-[#0F9E75] text-white border-[#0F9E75]' : 'bg-white/50 text-zinc-500 border-zinc-200'}`}>
                        {g === 'male' ? (zh ? '男' : 'Male') : (zh ? '女' : 'Female')}
                      </button>
                    ))}
                  </div>
                </div>
                <NumField label={zh ? '體脂率 (%)' : 'Body Fat (%)'} k="bodyFat" fields={fields} warnings={warnings} onChange={set} />
                <NumField label={zh ? '骨骼肌量 (kg)' : 'Skeletal Muscle (kg)'} k="skeletalMuscleMass" fields={fields} warnings={warnings} onChange={set} />
                <NumField label="BMR (kcal)" k="bmr" fields={fields} warnings={warnings} onChange={set} />
                <NumField label="BMI" k="bmi" fields={fields} warnings={warnings} onChange={set} />
                <NumField label={zh ? '內臟脂肪級別' : 'Visceral Fat Level'} k="visceralFatLevel" fields={fields} warnings={warnings} onChange={set} />
                <NumField label={zh ? '內臟脂肪面積 (cm²)' : 'Visceral Fat Area (cm²)'} k="visceralFatArea" fields={fields} warnings={warnings} onChange={set} />
                <NumField label={zh ? '體水分 (%)' : 'Body Water (%)'} k="bodyWater" fields={fields} warnings={warnings} onChange={set} />
                <NumField label={zh ? 'InBody 評分' : 'InBody Score'} k="inbodyScore" fields={fields} warnings={warnings} onChange={set} />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStage('pick')} className="flex-1 h-12 rounded-2xl border border-zinc-200 text-zinc-500 font-bold hover:bg-zinc-50 transition-all">
                  {zh ? '重拍' : 'Retake'}
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-[2] h-12 rounded-2xl bg-[#0F9E75] text-white font-bold shadow-lg shadow-[#0F9E75]/20 disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {zh ? '確認並儲存' : 'Confirm & save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-tight pl-1 mb-1">{children}</label>
}

function inputCls(flagged: boolean) {
  return `w-full h-12 px-4 rounded-2xl bg-white/50 backdrop-blur-sm border ${flagged ? 'border-amber-400 ring-1 ring-amber-300' : 'border-zinc-200'} focus:border-[#0F9E75] focus:ring-0 text-slate-800 dark:text-white font-bold transition-all`
}

function NumField({ label, k, fields, warnings, onChange }: {
  label: string
  k: keyof ConfirmedInBody
  fields: ConfirmedInBody
  warnings: string[]
  onChange: <K extends keyof ConfirmedInBody>(k: K, v: ConfirmedInBody[K]) => void
}) {
  // Flag a field if OCR warned about it, or if it came back empty (coach should fill).
  const flagged = warnings.includes(k as string) || fields[k] === ''
  return (
    <div>
      <FLabel>{label}</FLabel>
      <input
        type="number" step="any" inputMode="decimal"
        value={fields[k] as string}
        onChange={(e) => onChange(k, e.target.value as ConfirmedInBody[typeof k])}
        className={inputCls(flagged)}
      />
    </div>
  )
}
