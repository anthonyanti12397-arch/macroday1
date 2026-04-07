'use client'

import { motion } from 'framer-motion'
import Logo from './Logo'
import { useLang } from '@/contexts/LangContext'

export default function LoadingScreen({ message }: { message?: string }) {
  const { lang } = useLang()
  
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Logo size="lg" lang={lang} />
          </motion.div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
             {[0, 1, 2].map((i) => (
               <motion.div 
                 key={i}
                 className="w-1.5 h-1.5 rounded-full bg-[#0F9E75]"
                 animate={{ opacity: [0.3, 1, 0.3] }}
                 transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
               />
             ))}
          </div>
        </div>
        
        {message && (
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-8 animate-pulse">
            {message}
          </p>
        )}
      </motion.div>
    </div>
  )
}
