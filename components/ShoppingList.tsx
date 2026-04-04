'use client'

import { useEffect, useState } from 'react'
import type { ShoppingItem } from '@/lib/types'
import { getShoppingChecked, saveShoppingChecked } from '@/lib/storage'
import { APP_NAME } from '@/lib/constants'
import { ClipboardCopy, RotateCcw, Check } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

const CATEGORY_ORDER: ShoppingItem['category'][] = [
  'protein', 'vegetables', 'carbs', 'dairy', 'condiments', 'other',
]

const CATEGORY_EMOJI: Record<ShoppingItem['category'], string> = {
  protein: '🥩', vegetables: '🥦', carbs: '🌾',
  dairy: '🥛', condiments: '🧂', other: '🛒',
}

const CATEGORY_COLOR: Record<ShoppingItem['category'], string> = {
  protein:    'text-[#D85A30] bg-[#FDF0EB]',
  vegetables: 'text-[#0F9E75] bg-[#E8F5F0]',
  carbs:      'text-[#E09B20] bg-[#FDF5E6]',
  dairy:      'text-blue-600 bg-blue-50',
  condiments: 'text-purple-600 bg-purple-50',
  other:      'text-slate-600 bg-slate-100',
}

interface ShoppingListProps {
  items: ShoppingItem[]
}

export default function ShoppingList({ items }: ShoppingListProps) {
  const { t } = useLang()
  const s = t.shopping
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)

  useEffect(() => { setChecked(getShoppingChecked()) }, [])

  function toggleItem(key: string) {
    const next = { ...checked, [key]: !checked[key] }
    setChecked(next)
    saveShoppingChecked(next)
  }

  function clearAll() { setChecked({}); saveShoppingChecked({}) }

  function copyList() {
    const grouped = CATEGORY_ORDER.map((cat) => {
      const catItems = items.filter((i) => i.category === cat)
      if (catItems.length === 0) return null
      const lines = catItems.map((i) => `- ${i.name} ${i.amount}`).join('\n')
      return `${t.categories[cat]}:\n${lines}`
    }).filter(Boolean)
    const text = `## ${APP_NAME} ${s.title}\n\n${grouped.join('\n\n')}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const checkedCount = Object.values(checked).filter(Boolean).length
  const totalCount = items.length

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    label: t.categories[cat],
    emoji: CATEGORY_EMOJI[cat],
    color: CATEGORY_COLOR[cat],
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-5">
      {/* Progress + actions */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">{checkedCount} / {totalCount} {s.items}</p>
            <p className="text-xs text-slate-400">{s.checkedOff}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyList}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              {copied ? <Check size={13} className="text-[#0F9E75]" /> : <ClipboardCopy size={13} />}
              {copied ? s.copied : s.copy}
            </button>
            <button onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              <RotateCcw size={13} /> {s.clear}
            </button>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#0F9E75] to-[#0BD68A] transition-all duration-500"
            style={{ width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : '0%' }} />
        </div>
      </div>

      {/* Grouped items */}
      {grouped.map(({ cat, label, emoji, color, items: catItems }) => (
        <div key={cat} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color}`}>
              {emoji} {label}
            </span>
            <span className="text-xs text-slate-400">{catItems.length} {s.items}</span>
          </div>
          <div className="card overflow-hidden divide-y divide-slate-50">
            {catItems.map((item) => {
              const key = `${item.name}-${item.amount}`
              const isChecked = !!checked[key]
              return (
                <label key={key}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isChecked ? 'bg-[#0F9E75] border-[#0F9E75]' : 'border-slate-300'
                  }`}>
                    {isChecked && <Check size={11} className="text-white" strokeWidth={3} />}
                    <input type="checkbox" checked={isChecked} onChange={() => toggleItem(key)} className="sr-only" />
                  </div>
                  <span className={`flex-1 text-sm font-medium transition-colors ${
                    isChecked ? 'line-through text-slate-300' : 'text-slate-700'
                  }`}>{item.name}</span>
                  <span className="text-xs font-semibold text-slate-400 shrink-0">{item.amount}</span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
