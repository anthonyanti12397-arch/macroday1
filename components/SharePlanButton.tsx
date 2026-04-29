'use client'

import { useState } from 'react'
import { Share2, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useLang } from '@/contexts/LangContext'

export default function SharePlanButton() {
  const { data: session } = useSession()
  const { lang } = useLang()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const userId = (session?.user as any)?.id

  if (!userId) return null

  const shareUrl = `${window.location.origin}/share/${userId}`
  const text = lang === 'zh'
    ? '查看我在 MacroDay 的飲食計劃 💪'
    : 'Check out my meal plan on MacroDay 💪'

  async function handleShare() {
    setLoading(true)
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My MacroDay Week', text, url: shareUrl })
        setLoading(false)
        return
      }
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success(lang === 'zh' ? '連結已複製！' : 'Link copied!')
      setTimeout(() => setCopied(false), 2500)
    } catch (_) {
      toast.error(lang === 'zh' ? '分享失敗' : 'Share failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/10 border border-violet-500/30 text-violet-400 hover:bg-violet-600/20 transition-colors text-sm font-semibold disabled:opacity-50"
    >
      {loading
        ? <Loader2 size={15} className="animate-spin" />
        : copied
          ? <CheckCircle size={15} />
          : <Share2 size={15} />}
      {copied
        ? (lang === 'zh' ? '已複製' : 'Copied!')
        : (lang === 'zh' ? '分享計劃' : 'Share Plan')}
    </button>
  )
}
