'use client'

import { useState, useEffect } from 'react'
import { getUnlockedParts } from '@/lib/storage'
import { GEAR_DB, RARITY_COLORS, type GearPart, type GearSlot } from '@/lib/outfits'
import Avatar from '@/components/Avatar'
import { useLang } from '@/contexts/LangContext'
import { ArrowLeft, Lock, Sparkles, LayoutGrid, ListFilter } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function GearCollectionPage() {
  const { lang } = useLang()
  const [unlockedIds, setUnlockedIds] = useState<string[]>([])
  const [filter, setFilter] = useState<GearSlot | 'all'>('all')

  useEffect(() => {
    setUnlockedIds(getUnlockedParts())
  }, [])

  const filteredGear = GEAR_DB.filter(p => filter === 'all' || p.slot === filter)
  const totalGear = GEAR_DB.length
  const unlockedCount = GEAR_DB.filter(p => unlockedIds.includes(p.id)).length
  const completionRate = Math.round((unlockedCount / totalGear) * 100)

  const slots: (GearSlot | 'all')[] = ['all', 'head', 'top', 'bottom', 'accessory']

  return (
    <div className="py-6 space-y-6 pb-24 min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/avatar" className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0F9E75] transition-colors shadow-sm">
            <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
          </Link>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            {lang === 'zh' ? '時裝圖鑑' : 'Collection'}
          </h1>
        </div>
      </div>

      {/* Progress Card */}
      <div className="mx-4 p-6 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border-none shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0F9E75]/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {lang === 'zh' ? '收集進度' : 'Collection Progress'}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">{completionRate}%</span>
              <span className="text-sm font-bold text-slate-400">({unlockedCount}/{totalGear})</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0F9E75] flex items-center justify-center shadow-lg shadow-[#0F9E75]/30">
            <Sparkles size={24} className="text-white" />
          </div>
        </div>
        <div className="mt-4 w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            className="h-full bg-[#0F9E75] rounded-full"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl mx-4 overflow-x-auto no-scrollbar">
        {slots.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`whitespace-nowrap flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all ${
              filter === s 
                ? 'bg-white dark:bg-slate-700 text-[#0F9E75] shadow-sm' 
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Gear Grid */}
      <div className="px-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {filteredGear.map((part) => {
          const isUnlocked = unlockedIds.includes(part.id)
          const rarityColor = RARITY_COLORS[part.rarity]

          return (
            <motion.div
              layout
              key={part.id}
              className={`group relative rounded-[2rem] p-4 flex flex-col items-center gap-3 transition-all ${
                isUnlocked 
                  ? 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-800/50 opacity-60 border border-dashed border-slate-300 dark:border-slate-700'
              }`}
            >
              <div 
                className="w-full aspect-square rounded-2xl flex items-center justify-center relative bg-slate-50 dark:bg-slate-800 overflow-hidden"
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
                    <Lock size={20} className="text-slate-400" />
                  </div>
                )}
                
                <div className="relative z-0 scale-125">
                   <Avatar 
                    loadout={{ [part.slot]: part.id }} 
                    size="sm" 
                    className={!isUnlocked ? 'grayscale' : ''} 
                   />
                </div>

                {/* Rarity Tag */}
                <div 
                  className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: rarityColor }}
                />
              </div>

              <div className="text-center w-full">
                <p className="text-[10px] uppercase tracking-tighter font-black opacity-40 mb-0.5" style={{ color: rarityColor }}>
                  {part.rarity}
                </p>
                <h3 className="text-xs font-black text-slate-800 dark:text-white truncate">
                  {lang === 'zh' ? part.nameZh : part.nameEn}
                </h3>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
