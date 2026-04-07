'use client'

import { useState } from 'react'
import { Share2, Download, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import { useLang } from '@/contexts/LangContext'
import { toast } from 'sonner'

export default function ShareButton({ targetId, fileName }: { targetId: string; fileName: string }) {
  const [loading, setLoading] = useState(false)
  const { lang } = useLang()

  async function handleShare() {
    const element = document.getElementById(targetId)
    if (!element) return

    setLoading(true)
    try {
      // 1. Capture as canvas
      const canvas = await html2canvas(element, {
        scale: 3, // Very high quality for Social Media
        useCORS: true,
        backgroundColor: null, // Transparent background
        logging: false,
      })
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1.0))
      if (!blob) throw new Error('Blob creation failed')

      const file = new File([blob], `${fileName}.png`, { type: 'image/png' })

      // 2. Try Web Share API (Mobile)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My MacroDay Progress',
          text: 'Check out my nutrition progress on MacroDay AI!',
        })
        toast.success(lang === 'zh' ? '分享成功！' : 'Shared successfully!')
      } else {
        // 3. Fallback to Download (Desktop/Old browsers)
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${fileName}.png`
        link.click()
        toast.success(lang === 'zh' ? '圖片已下載，快去分享吧！' : 'Image downloaded! Time to share.')
      }
    } catch (err) {
      console.error(err)
      toast.error(lang === 'zh' ? '分享失敗' : 'Share failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 transition-all disabled:opacity-50"
      title="Share Progress"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
    </button>
  )
}
