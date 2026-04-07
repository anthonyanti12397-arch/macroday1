'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '@/contexts/LangContext'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  const { lang } = useLang()

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Only show if not already installed and we're on a mobile device (common heuristic)
      if (window.matchMedia('(display-mode: standalone)').matches) return
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        setShow(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShow(false)
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[60]"
        >
          <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0F9E75] flex items-center justify-center shrink-0">
                <Download size={20} />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight">{lang === 'zh' ? '安裝 MacroDay' : 'Install MacroDay'}</p>
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{lang === 'zh' ? '更快速、更流暢' : 'Faster & Better'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleInstall} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-black transition-transform active:scale-95">
                {lang === 'zh' ? '立即安裝' : 'Install'}
              </button>
              <button onClick={() => setShow(false)} className="p-2 text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
