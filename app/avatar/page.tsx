'use client'

import { useState, useEffect } from 'react'
import { 
  getMacroScore, 
  getUnlockedParts, 
  getEquippedLoadout, 
  setEquippedLoadout, 
  spendMacroScore, 
  unlockPart,
  addMacroScore,
  getGuestSession, 
  getLatestInBody 
} from '@/lib/storage'
import { GEAR_DB, RARITY_COLORS, type GearPart, type GearSlot } from '@/lib/outfits'
import { rollGacha, type GachaResult } from '@/lib/gacha'
import Avatar from '@/components/Avatar'
import { useLang } from '@/contexts/LangContext'
import { useSession } from 'next-auth/react'
import ShareButton from '@/components/ShareButton'
import { Shirt, ShoppingBag, Trophy, Lock, Sparkles, ArrowLeft, Loader2, Package, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import type { InBodyRecord } from '@/lib/types'

const GACHA_COST = 200

export default function AvatarPage() {
  const { lang } = useLang()
  const { data: session } = useSession()
  const [tab, setTab] = useState<'my_avatar' | 'store'>('my_avatar')
  const [score, setScore] = useState(0)
  const [unlockedIds, setUnlockedIds] = useState<string[]>([])
  const [loadout, setLoadout] = useState<Record<string, string>>({})
  const [inbody, setInbody] = useState<InBodyRecord | null>(null)
  
  // Gacha State
  const [isRolling, setIsRolling] = useState(false)
  const [rollResult, setRollResult] = useState<GachaResult | null>(null)

  const guest = getGuestSession()
  const userName = session?.user?.name || (guest ? 'Guest' : 'MacroDay User')

  const loadData = () => {
    setScore(getMacroScore())
    setUnlockedIds(getUnlockedParts())
    setLoadout(getEquippedLoadout())
    setInbody(getLatestInBody())
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleEquip(part: GearPart) {
    const newLoadout = { ...loadout, [part.slot]: part.id }
    setEquippedLoadout(newLoadout)
    setLoadout(newLoadout)
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(5);
    toast.success(lang === 'zh' ? `已裝備: ${part.nameZh}` : `Equipped: ${part.nameEn}`)
  }

  async function handleRoll() {
    if (score < GACHA_COST) {
      toast.error(lang === 'zh' ? '分數不足' : 'Not enough points')
      return
    }

    setIsRolling(true)
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);

    // Simulate anticipation
    await new Promise(r => setTimeout(r, 2000))

    const success = spendMacroScore(GACHA_COST)
    if (success) {
      const result = rollGacha(unlockedIds)
      unlockPart(result.part.id)
      if (result.refundPoints) {
        addMacroScore(result.refundPoints)
      }
      
      setRollResult(result)
      loadData()
      if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(100);
    }
    setIsRolling(false)
  }

  return (
    <div className="py-6 space-y-6 pb-24 min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0F9E75] transition-colors shadow-sm">
            <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
          </Link>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            {lang === 'zh' ? '角色系統' : 'Avatar'}
          </h1>
          <Link 
            href="/avatar/collection" 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F9E75]/10 text-[#0F9E75] hover:bg-[#0F9E75]/20 transition-all border border-[#0F9E75]/20 ml-1"
          >
            <BookOpen size={14} />
            <span className="text-[10px] font-black uppercase tracking-wider">
              {lang === 'zh' ? '圖鑑' : 'Library'}
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Trophy size={16} className="fill-[#F59E0B]" />
          <span className="font-black text-lg">{score}</span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl mx-4 backdrop-blur-sm">
        <button 
          onClick={() => setTab('my_avatar')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'my_avatar' ? 'bg-white dark:bg-slate-700 text-[#0F9E75] shadow-md' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <Shirt size={16} />
          {lang === 'zh' ? '我的衣櫃' : 'Wardrobe'}
        </button>
        <button 
          onClick={() => setTab('store')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'store' ? 'bg-white dark:bg-slate-700 text-[#0F9E75] shadow-md' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <ShoppingBag size={16} />
          {lang === 'zh' ? '獲得裝備' : 'Get Gear'}
        </button>
      </div>

      {/* Wardrobe Tab */}
      {tab === 'my_avatar' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
           {/* Character Stand */}
          <div id="avatar-capture-area" className="card-lg mx-4 bg-gradient-to-b from-[#f0faf7] to-white dark:from-slate-900 dark:to-slate-950 border-none relative overflow-hidden flex flex-col items-center pt-10 pb-8 shadow-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F9E75]/20 to-transparent" />
            <Sparkles size={120} className="absolute top-10 left-1/2 -translate-x-1/2 text-[#0F9E75] opacity-[0.03] pointer-events-none" />
            
            <Avatar loadout={loadout} size="lg" inbody={inbody} animated />
            
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{userName}</h2>
              <div className="mt-2 flex items-center justify-center gap-1">
                 <div className="h-1.5 w-1.5 rounded-full bg-[#0F9E75]" />
                 <span className="text-xs font-bold text-[#0F9E75] uppercase tracking-widest opacity-80">Online Profile</span>
              </div>
            </div>
            
            <div className="mt-6">
               <ShareButton targetId="avatar-capture-area" fileName={`MacroAvatar-${userName}`} />
            </div>
          </div>

          {/* Slots Selector */}
          <div className="px-4 space-y-8">
            {(['head', 'top', 'bottom', 'accessory'] as GearSlot[]).map(slot => (
              <div key={slot} className="space-y-4">
                <div className="flex items-center justify-between border-l-4 border-[#0F9E75] pl-3 py-1">
                   <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{slot}</h3>
                   <span className="text-[10px] font-bold text-slate-400">
                     {GEAR_DB.filter(p => p.slot === slot && unlockedIds.includes(p.id)).length} {lang === 'zh' ? '件已擁有' : 'Owned'}
                   </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {GEAR_DB.filter(p => p.slot === slot).map(part => {
                    const isUnlocked = unlockedIds.includes(part.id)
                    const isEquipped = loadout[slot] === part.id
                    
                    return (
                      <button
                        key={part.id}
                        disabled={!isUnlocked}
                        onClick={() => handleEquip(part)}
                        className={`aspect-square rounded-2xl flex items-center justify-center relative transition-all active:scale-95 ${
                          !isUnlocked 
                            ? 'bg-slate-100 dark:bg-slate-800 opacity-40 grayscale border border-dashed border-slate-300 dark:border-slate-700' 
                            : isEquipped 
                              ? 'bg-white dark:bg-slate-700 border-2 border-[#0F9E75] shadow-lg shadow-[#0F9E75]/10' 
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0F9E75]/50'
                        }`}
                      >
                         {!isUnlocked && <Lock size={14} className="text-slate-400" />}
                         {isUnlocked && (
                           <div className="flex flex-col items-center gap-1">
                              <Avatar loadout={{ [slot]: part.id }} size="sm" className="scale-75 origin-center" />
                           </div>
                         )}
                         {isEquipped && (
                           <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#0F9E75] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                              <CheckCircle2 size={12} className="text-white" />
                           </div>
                         )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gacha Tab */}
      {tab === 'store' && (
        <div className="px-4 space-y-8 flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="card-lg w-full bg-gradient-to-br from-slate-800 to-slate-900 border-none p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent" />
             
             <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-b from-[#F59E0B] to-[#D97706] rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl animate-bounce">
                   <Package size={48} className="text-white" />
                </div>
                
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                  {lang === 'zh' ? '開啟健身置物櫃' : 'Open Gym Locker'}
                </h2>
                <p className="text-slate-400 text-sm font-bold mb-8 max-w-[200px]">
                  {lang === 'zh' ? '隨機獲得一件服裝部件，包含稀有與傳說裝備！' : 'Randomly unlock a gear part, including Rare & Legendary sets!'}
                </p>

                <div className="space-y-4 w-full">
                  <button
                    disabled={isRolling || score < GACHA_COST}
                    onClick={handleRoll}
                    className="w-full py-4 rounded-[1.5rem] bg-[#F59E0B] hover:bg-[#D97706] text-white font-black text-lg transition-all active:scale-95 disabled:grayscale disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-[#F59E0B]/20"
                  >
                    {isRolling ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <>
                        <Trophy size={18} className="fill-white" />
                        {GACHA_COST} <span className="opacity-70 text-sm">pts</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
                     Guaranteed Refund if Duplicate
                  </p>
                </div>
             </div>
          </div>

          {/* Rarity Table */}
          <div className="w-full card border-slate-200 dark:border-slate-800 p-5 space-y-4">
             <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{lang === 'zh' ? '掉落率' : 'Drop Rates'}</h4>
             <div className="grid grid-cols-2 gap-4">
                <RateRow color={RARITY_COLORS.common} label="Common" rate="70%" />
                <RateRow color={RARITY_COLORS.rare} label="Rare" rate="24.9%" />
                <RateRow color={RARITY_COLORS.epic} label="Epic" rate="5%" />
                <RateRow color={RARITY_COLORS.legendary} label="Legendary" rate="0.1%" />
             </div>
          </div>
        </div>
      )}

      {/* Result Backdrop Animation */}
      <AnimatePresence>
        {isRolling && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black backdrop-blur-xl flex flex-col items-center justify-center p-10"
          >
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="absolute">
                <Sparkles size={300} className="text-[#F59E0B] opacity-10" />
             </motion.div>
             <div className="relative">
                <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                   <Package size={100} className="text-[#F59E0B]" />
                </motion.div>
             </div>
             <p className="mt-8 text-[#F59E0B] font-black text-xl tracking-tighter animate-pulse">
                {lang === 'zh' ? '正在解鎖...' : 'BREAKING LOCKER...'}
             </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      {rollResult && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
           <motion.div 
             initial={{ scale: 0.8, opacity: 0 }} 
             animate={{ scale: 1, opacity: 1 }}
             className="w-full max-w-sm card-lg bg-white dark:bg-slate-900 border-none p-8 flex flex-col items-center text-center shadow-3xl"
           >
              <div 
                className="w-32 h-32 rounded-full mb-6 flex items-center justify-center relative shadow-inner overflow-hidden"
                style={{ backgroundColor: `${RARITY_COLORS[rollResult.part.rarity]}20` }}
              >
                 <motion.div initial={{ y: 20 }} animate={{ y: 0 }} transition={{ type: "spring" }}>
                    <Avatar loadout={{ [rollResult.part.slot]: rollResult.part.id }} size="md" />
                 </motion.div>
              </div>

              <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: RARITY_COLORS[rollResult.part.rarity] }}>
                 {rollResult.part.rarity} {rollResult.part.slot}
              </span>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 leading-tight">
                 {lang === 'zh' ? rollResult.part.nameZh : rollResult.part.nameEn}
              </h2>
              
              <div className="my-6 py-3 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold border border-slate-100 dark:border-slate-700">
                {rollResult.isNew ? (
                  <span className="text-[#0F9E75] flex items-center gap-2">
                    <Sparkles size={16} /> {lang === 'zh' ? '獲得新裝備！' : 'NEW GEAR UNLOCKED!'}
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-2">
                    🔄 {lang === 'zh' ? `重複已轉換為 +${rollResult.refundPoints}` : `Duplicate! Converted to +${rollResult.refundPoints}`}
                  </span>
                )}
              </div>

              <div className="flex gap-3 w-full">
                 <button 
                  onClick={() => setRollResult(null)}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-sm active:scale-95 transition-all"
                 >
                   OK
                 </button>
                 {rollResult.isNew && (
                   <button 
                    onClick={() => { 
                      const p = rollResult.part;
                      const newLoadout = { ...loadout, [p.slot]: p.id };
                      setEquippedLoadout(newLoadout);
                      setLoadout(newLoadout);
                      setRollResult(null); 
                    }}
                    className="flex-1 py-4 rounded-2xl text-white font-black text-sm shadow-xl active:scale-95 transition-all"
                    style={{ backgroundColor: RARITY_COLORS[rollResult.part.rarity] }}
                   >
                     {lang === 'zh' ? '立即裝備' : 'Equip Now'}
                   </button>
                 )}
              </div>
           </motion.div>
        </div>
      )}
    </div>
  )
}

function RateRow({ color, label, rate }: { color: string; label: string; rate: string }) {
  return (
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</span>
       </div>
       <span className="text-[10px] font-black text-slate-400">{rate}</span>
    </div>
  )
}

// Inline missing icon
function CheckCircle2({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
