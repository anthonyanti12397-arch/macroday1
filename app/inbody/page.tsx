'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getInBodyHistory, getLatestInBody, getUserProfile, saveInBodyRecord, deleteInBodyRecord } from '@/lib/storage'
import type { InBodyRecord, UserProfile } from '@/lib/types'
import InBodyForm from '@/components/InBodyForm'
import InBodyChartModal from '@/components/InBodyChartModal'
import InBodyPhotoImport, { type ConfirmedInBody } from '@/components/InBodyPhotoImport'
import UpgradePrompt from '@/components/UpgradePrompt'
import { useLang } from '@/contexts/LangContext'
import { Activity, CheckCircle, TrendingUp, Lock, Edit2, Trash2, Camera, Plus, User, Users } from 'lucide-react'
import ComparisonCard from '@/components/ComparisonCard'
import { toast } from 'sonner'

const SELF = 'self'

interface ClientLite {
  id: string
  name: string
  gender?: string | null
}

// API InBodyEntry row → the InBodyRecord shape the chart/history components use.
function entryToRecord(e: Record<string, unknown>): InBodyRecord {
  const n = (v: unknown) => (v === null || v === undefined ? undefined : Number(v))
  return {
    id: String(e.id),
    date: String(e.entryDate),
    weight: Number(e.weight),
    height: Number(e.height),
    gender: e.gender === 'female' ? 'female' : 'male',
    age: Number(e.age),
    bodyFat: n(e.bodyFat),
    skeletalMuscleMass: n(e.skeletalMuscleMass),
    bmr: n(e.bmr),
    visceralFatLevel: n(e.visceralFatLevel),
    bodyWater: n(e.bodyWater),
  }
}

function num(v: string): number | undefined {
  if (v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export default function InBodyPage() {
  const { lang, t } = useLang()
  const i = t.inbody
  const { status } = useSession()
  const isAuthed = status === 'authenticated'

  const [subject, setSubject] = useState<string>(SELF)
  const [clients, setClients] = useState<ClientLite[]>([])
  const [history, setHistory] = useState<InBodyRecord[]>([])
  const [latest, setLatest] = useState<InBodyRecord | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [saved, setSaved] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const [editingRecord, setEditingRecord] = useState<InBodyRecord | null>(null)
  const [loadingClient, setLoadingClient] = useState(false)

  const isSelf = subject === SELF
  const currentClient = clients.find((c) => c.id === subject) || null
  const subjectName = isSelf ? (lang === 'zh' ? '自己' : 'Me') : currentClient?.name ?? ''

  // Load the self profile (for isPro gating) once.
  useEffect(() => { setProfile(getUserProfile()) }, [])

  // Fetch clients when logged in.
  const loadClients = useCallback(async () => {
    if (!isAuthed) return
    try {
      const res = await fetch('/api/clients')
      if (!res.ok) return
      const data = (await res.json()) as { clients: ClientLite[] }
      setClients(data.clients ?? [])
    } catch { /* ignore */ }
  }, [isAuthed])
  useEffect(() => { loadClients() }, [loadClients])

  // Load the current subject's history (localStorage for self, API for a client).
  const loadHistory = useCallback(async () => {
    if (isSelf) {
      setHistory(getInBodyHistory())
      setLatest(getLatestInBody())
      return
    }
    setLoadingClient(true)
    try {
      const res = await fetch(`/api/clients/${subject}/inbody`)
      if (!res.ok) { setHistory([]); setLatest(null); return }
      const data = (await res.json()) as { entries: Record<string, unknown>[] }
      const recs = (data.entries ?? []).map(entryToRecord)
      setHistory(recs)
      setLatest(recs.length ? recs[recs.length - 1] : null)
    } finally {
      setLoadingClient(false)
    }
  }, [isSelf, subject])
  useEffect(() => { loadHistory() }, [loadHistory])

  function flashSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleSelfFormSaved() {
    loadHistory()
    setEditingRecord(null)
    flashSaved()
    toast.success(lang === 'zh' ? '🏆 +20 分！記錄了新的資料' : '🏆 +20 pts! New data added')
  }

  // Save a photo-imported (coach-confirmed) measurement to the right place.
  async function handlePhotoConfirm(f: ConfirmedInBody) {
    if (isSelf) {
      const record: InBodyRecord = {
        id: crypto.randomUUID(),
        date: f.date,
        weight: Number(f.weight), height: Number(f.height), age: Number(f.age), gender: f.gender,
        ...(num(f.bodyFat) !== undefined ? { bodyFat: num(f.bodyFat) } : {}),
        ...(num(f.skeletalMuscleMass) !== undefined ? { skeletalMuscleMass: num(f.skeletalMuscleMass) } : {}),
        ...(num(f.bmr) !== undefined ? { bmr: num(f.bmr) } : {}),
        ...(num(f.visceralFatLevel) !== undefined ? { visceralFatLevel: num(f.visceralFatLevel) } : {}),
        ...(num(f.bodyWater) !== undefined ? { bodyWater: num(f.bodyWater) } : {}),
      }
      saveInBodyRecord(record)
      setShowPhoto(false)
      loadHistory()
      flashSaved()
      toast.success(lang === 'zh' ? '已儲存到「自己」' : 'Saved to "Me"')
      return
    }
    // Client → cloud
    const res = await fetch(`/api/clients/${subject}/inbody`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryDate: f.date, weight: f.weight, height: f.height, age: f.age, gender: f.gender,
        bodyFat: f.bodyFat, skeletalMuscleMass: f.skeletalMuscleMass, bmr: f.bmr,
        visceralFatLevel: f.visceralFatLevel, visceralFatArea: f.visceralFatArea,
        bodyWater: f.bodyWater, inbodyScore: f.inbodyScore, bmi: f.bmi,
      }),
    })
    if (!res.ok) { toast.error(lang === 'zh' ? '儲存失敗' : 'Save failed'); return }
    setShowPhoto(false)
    await loadHistory()
    flashSaved()
    toast.success(lang === 'zh' ? `已儲存到 ${subjectName}` : `Saved to ${subjectName}`)
  }

  async function handleAddClient() {
    const name = window.prompt(lang === 'zh' ? '學生名稱' : 'Student name')
    if (!name?.trim()) return
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) { toast.error(lang === 'zh' ? '新增失敗' : 'Failed to add'); return }
      const data = (await res.json()) as { client: ClientLite }
      await loadClients()
      setSubject(data.client.id)
      toast.success(lang === 'zh' ? `已新增學生：${data.client.name}` : `Added ${data.client.name}`)
    } catch {
      toast.error(lang === 'zh' ? '新增失敗' : 'Failed to add')
    }
  }

  function handleEdit(record: InBodyRecord) {
    setEditingRecord(record)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === 'zh' ? '確定要刪除這條記錄嗎？' : 'Delete this record?')) return
    if (isSelf) {
      deleteInBodyRecord(id)
    } else {
      const res = await fetch(`/api/clients/${subject}/inbody/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error(lang === 'zh' ? '刪除失敗' : 'Delete failed'); return }
    }
    loadHistory()
    toast.success(lang === 'zh' ? '記錄已刪除' : 'Record deleted')
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#E8F5F0] flex items-center justify-center">
            <Activity size={16} className="text-[#0F9E75]" />
          </div>
          <h1 className="page-header">{i.title}</h1>
        </div>
        <p className="text-sm text-slate-500 pl-10">{i.subtitle}</p>
      </div>

      {/* Subject switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <SubjectChip active={isSelf} onClick={() => setSubject(SELF)} icon={<User size={14} />} label={lang === 'zh' ? '自己' : 'Me'} />
        {clients.map((c) => (
          <SubjectChip key={c.id} active={subject === c.id} onClick={() => setSubject(c.id)} label={c.name} />
        ))}
        {isAuthed && (
          <button onClick={handleAddClient} className="shrink-0 flex items-center gap-1 h-9 px-3 rounded-full border border-dashed border-[#0F9E75]/50 text-[#0F9E75] text-sm font-bold hover:bg-[#E8F5F0] transition-colors">
            <Plus size={14} />{lang === 'zh' ? '學生' : 'Student'}
          </button>
        )}
      </div>
      {!isAuthed && (
        <p className="text-xs text-slate-400 -mt-3 flex items-center gap-1.5">
          <Users size={12} />{lang === 'zh' ? '登入後可管理學生的 InBody 數據' : 'Sign in to manage students’ InBody data'}
        </p>
      )}

      {/* Photo import — the hero action, for self and clients alike */}
      <button
        onClick={() => setShowPhoto(true)}
        className="w-full card-lg p-4 flex items-center gap-3 hover:border-[#0F9E75] transition-colors text-left"
      >
        <div className="w-11 h-11 rounded-2xl bg-[#0F9E75] flex items-center justify-center shrink-0">
          <Camera size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{lang === 'zh' ? '拍照匯入 InBody' : 'Import InBody by photo'}</p>
          <p className="text-xs text-slate-400">{lang === 'zh' ? `AI 自動讀取數值 → 確認 → 存到「${subjectName}」` : `AI reads the sheet → confirm → save to "${subjectName}"`}</p>
        </div>
      </button>

      {saved && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F9E75] bg-[#E8F5F0] px-3 py-2 rounded-full w-fit">
          <CheckCircle size={13} />{i.saved}
        </div>
      )}

      {/* Comparison + chart (both subjects, when ≥2 records) */}
      {history.length >= 2 && (
        <ComparisonCard current={history[history.length - 1]} initial={history[0]} />
      )}
      {history.length >= 2 && (
        <button
          onClick={() => setShowChart(true)}
          className="w-full card-lg p-4 flex items-center gap-3 hover:border-[#0F9E75] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#F0EEFF] flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-[#7F77DD]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{i.viewCharts}</p>
            <p className="text-xs text-slate-400">{i.chartsDesc}</p>
          </div>
          {!profile?.isPro && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#7F77DD] bg-[#F0EEFF] px-2 py-1 rounded-full shrink-0">
              <Lock size={10} />Pro
            </div>
          )}
        </button>
      )}

      {/* History list */}
      {loadingClient ? (
        <p className="text-sm text-slate-400 text-center py-6">{lang === 'zh' ? '載入中…' : 'Loading…'}</p>
      ) : history.length > 0 ? (
        <div className="space-y-3">
          <p className="section-label pl-1">{i.history}</p>
          {[...history].reverse().map((r) => (
            <div key={r.id} className="card p-4 group relative">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-semibold text-[#0F9E75]">{r.date}</p>
                <div className="flex gap-2">
                  {isSelf && (
                    <button onClick={() => handleEdit(r)} className="p-1.5 text-slate-400 hover:text-[#0F9E75] hover:bg-[#0F9E75]/10 rounded-lg transition-colors">
                      <Edit2 size={14} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <HistStat label={i.weight.split(' ')[0]} value={`${r.weight}kg`} />
                <HistStat label={i.height.split(' ')[0]} value={`${r.height}cm`} />
                <HistStat label={i.age} value={`${r.age}`} />
                {r.bodyFat != null && <HistStat label={i.bodyFat.split(' ')[0]} value={`${r.bodyFat}%`} />}
                {r.skeletalMuscleMass != null && <HistStat label={i.muscle.split(' ')[0]} value={`${r.skeletalMuscleMass}kg`} />}
                {r.bmr != null && <HistStat label="BMR" value={`${r.bmr} kcal`} />}
                {r.visceralFatLevel != null && <HistStat label={i.visceralFat.split(' ')[0]} value={`${r.visceralFatLevel}`} />}
                {r.bodyWater != null && <HistStat label={i.bodyWater.split(' ')[0]} value={`${r.bodyWater}%`} />}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-6">
          {lang === 'zh' ? '尚無記錄。用上方「拍照匯入」開始。' : 'No records yet. Use “Import by photo” above to start.'}
        </p>
      )}

      {/* Self-only: full meal-preference form (manual edit + AI meal preferences) */}
      {isSelf && (
        <div className="card-lg p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-800 dark:text-slate-200">
              {editingRecord ? (lang === 'zh' ? '編輯記錄' : 'Edit Record') : (latest ? i.updateData : i.addData)}
            </h2>
          </div>
          <InBodyForm
            latestRecord={latest}
            latestProfile={profile}
            editingRecord={editingRecord}
            onSaved={handleSelfFormSaved}
            onCancelEdit={() => setEditingRecord(null)}
          />
        </div>
      )}

      {/* Photo import modal */}
      {showPhoto && (
        <InBodyPhotoImport
          subjectName={subjectName}
          defaultGender={(currentClient?.gender === 'female' ? 'female' : latest?.gender) || 'male'}
          onConfirm={handlePhotoConfirm}
          onClose={() => setShowPhoto(false)}
        />
      )}

      {/* Chart modal */}
      {showChart && (
        <InBodyChartModal
          records={history}
          isPro={profile?.isPro ?? false}
          subjectName={isSelf ? undefined : subjectName}
          coachView={!isSelf}
          onClose={() => setShowChart(false)}
          onUpgrade={() => { setShowChart(false); setShowUpgrade(true) }}
        />
      )}

      {/* Upgrade prompt */}
      {showUpgrade && (
        <UpgradePrompt
          onClose={() => setShowUpgrade(false)}
          onUpgrade={() => { setShowUpgrade(false); setProfile(getUserProfile()); setShowChart(true) }}
        />
      )}
    </div>
  )
}

function SubjectChip({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon?: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-bold border transition-all ${
        active ? 'bg-[#0F9E75] text-white border-[#0F9E75] shadow-md shadow-[#0F9E75]/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
      }`}
    >
      {icon}{label}
    </button>
  )
}

function HistStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{value}</p>
    </div>
  )
}
