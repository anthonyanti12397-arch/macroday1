'use client'

import { useEffect, useState } from 'react'
import { getInBodyHistory, getLatestInBody, getUserProfile } from '@/lib/storage'
import type { InBodyRecord, UserProfile } from '@/lib/types'
import InBodyForm from '@/components/InBodyForm'
import InBodyChartModal from '@/components/InBodyChartModal'
import UpgradePrompt from '@/components/UpgradePrompt'
import { useLang } from '@/contexts/LangContext'
import { Activity, CheckCircle, TrendingUp, Lock } from 'lucide-react'
import ComparisonCard from '@/components/ComparisonCard'

export default function InBodyPage() {
  const { t } = useLang()
  const i = t.inbody
  const [history, setHistory] = useState<InBodyRecord[]>([])
  const [latest, setLatest] = useState<InBodyRecord | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [saved, setSaved] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  function load() {
    setHistory(getInBodyHistory())
    setLatest(getLatestInBody())
    setProfile(getUserProfile())
  }

  useEffect(() => { load() }, [])

  function handleSaved() {
    load()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
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

      {/* Form card */}
      <div className="card-lg p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-800">
            {latest ? i.updateData : i.addData}
          </h2>
          {saved && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F9E75] bg-[#E8F5F0] px-3 py-1.5 rounded-full">
              <CheckCircle size={13} />
              {i.saved}
            </div>
          )}
        </div>
        <InBodyForm latestRecord={latest} latestProfile={profile} onSaved={handleSaved} />
      </div>

      {history.length >= 2 && (
        <ComparisonCard current={history[history.length - 1]} initial={history[0]} />
      )}

      {/* View Charts button */}
      {history.length >= 2 && (
        <button
          onClick={() => setShowChart(true)}
          className="w-full card-lg p-4 flex items-center gap-3 hover:border-[#0F9E75] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#F0EEFF] flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-[#7F77DD]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800 text-sm">{i.viewCharts}</p>
            <p className="text-xs text-slate-400">{i.chartsDesc}</p>
          </div>
          {!profile?.isPro && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#7F77DD] bg-[#F0EEFF] px-2 py-1 rounded-full shrink-0">
              <Lock size={10} />
              Pro
            </div>
          )}
        </button>
      )}

      {/* History list */}
      {history.length > 0 && (
        <div className="space-y-3">
          <p className="section-label pl-1">{i.history}</p>
          {[...history].reverse().map((r) => (
            <div key={r.id} className="card p-4">
              <p className="text-xs font-semibold text-[#0F9E75] mb-2">{r.date}</p>
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
      )}

      {/* Chart modal */}
      {showChart && (
        <InBodyChartModal
          records={history}
          isPro={profile?.isPro ?? false}
          onClose={() => setShowChart(false)}
          onUpgrade={() => { setShowChart(false); setShowUpgrade(true) }}
        />
      )}

      {/* Upgrade prompt */}
      {showUpgrade && (
        <UpgradePrompt
          onClose={() => setShowUpgrade(false)}
          onUpgrade={() => {
            setShowUpgrade(false)
            load()
            setShowChart(true)
          }}
        />
      )}
    </div>
  )
}

function HistStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-700">{value}</p>
    </div>
  )
}
