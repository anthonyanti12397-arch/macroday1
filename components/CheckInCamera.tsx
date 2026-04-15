'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, X, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { isPhotoRecent } from '@/lib/exif'
import { useLang } from '@/contexts/LangContext'

interface CheckInCameraProps {
  checkInType: 'meal' | 'training'
  mealName?: string
  onVerified: () => void
  onClose: () => void
}

export default function CheckInCamera({ checkInType, mealName, onVerified, onClose }: CheckInCameraProps) {
  const { t } = useLang()
  const c = t.checkin
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [photo, setPhoto] = useState<{ blob: Blob, base64: string } | null>(null)
  const [step, setStep] = useState<'camera' | 'preview' | 'verifying' | 'result'>('camera')
  const [verifyStatus, setVerifyStatus] = useState<'success' | 'fail' | null>(null)
  const [failReason, setFailReason] = useState('')
  const [loadingText, setLoadingText] = useState(c.uploading)

  useEffect(() => {
    async function initCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        setStream(s)
        if (videoRef.current) {
          videoRef.current.srcObject = s
        }
      } catch (err) {
        console.error('Camera access denied:', err)
        alert('Camera access is required for check-in.')
        onClose()
      }
    }
    initCamera()

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentional to avoid recreating stream on unmount triggers

  function handleCapture() {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1080
    canvas.height = video.videoHeight || 1920
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // We get Base64 directly via toDataURL
    const base64 = canvas.toDataURL('image/jpeg', 0.8)
    
    canvas.toBlob(blob => {
      if (blob) {
        setPhoto({ blob, base64 })
        setStep('preview')
      }
    }, 'image/jpeg', 0.8)
  }

  function handleRetake() {
    setPhoto(null)
    setStep('camera')
  }

  async function handleConfirm() {
    if (!photo) return
    setStep('verifying')
    
    // Get Fail limit mechanism
    const d = new Date()
    const key = `macroday_checkin_fails_${d.getFullYear()}${d.getMonth()}${d.getDate()}`
    const fails = parseInt(localStorage.getItem(key) || '0', 10)

    if (fails >= 3) {
      setVerifyStatus('success')
      setStep('result')
      setTimeout(() => onVerified(), 1500)
      return
    }

    try {
      // 1. EXIF validation
      const file = new File([photo.blob], 'checkin.jpg', { type: 'image/jpeg' })
      const recent = await isPhotoRecent(file)
      
      if (!recent) {
        throw new Error(c.tooOld)
      }

      setLoadingText(c.verifying)

      // 2. Base64 Upload -> AI Verification bypasses Vercel Blob directly
      const res = await fetch('/api/verify-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image: photo.base64,
          checkInType,
          mealName
        })
      })

      if (!res.ok) {
        throw new Error('API Request Failed')
      }

      const { verified, reason } = await res.json()

      if (verified) {
        setVerifyStatus('success')
        setStep('result')
        setTimeout(() => {
          if (stream) stream.getTracks().forEach(t => t.stop())
          onVerified()
        }, 1500)
      } else {
        localStorage.setItem(key, (fails + 1).toString())
        throw new Error(checkInType === 'meal' ? c.failMeal : c.failTraining)
      }
      
    } catch (err: any) {
      setVerifyStatus('fail')
      setFailReason(err.message || 'Verification failed')
      setStep('result')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={() => {
          if(stream) stream.getTracks().forEach(t => t.stop())
          onClose()
        }} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-md">
          <X size={20} />
        </button>
        <p className="font-bold text-white shadow-black drop-shadow-md">
          {checkInType === 'meal' ? c.mealPrompt : c.trainingPrompt}
        </p>
        <div className="w-10" />
      </div>

      {step === 'camera' && (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="flex-1 w-full h-full object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 p-8 flex justify-center bg-gradient-to-t from-black via-black/80 to-transparent">
            <button 
              onClick={handleCapture}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center focus:scale-95 transition-transform"
            >
              <div className="w-16 h-16 bg-white rounded-full transition-transform active:scale-90" />
            </button>
          </div>
        </>
      )}

      {step === 'preview' && photo && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.base64} className="flex-1 w-full h-full object-cover" alt="Preview" />
          <div className="absolute bottom-0 inset-x-0 p-8 flex gap-4 bg-gradient-to-t from-black via-black/80 to-transparent">
            <button onClick={handleRetake} className="flex-1 py-4 bg-white/20 text-white font-bold rounded-2xl backdrop-blur-md">
              {c.retake}
            </button>
            <button onClick={handleConfirm} className="flex-1 py-4 bg-[#0F9E75] text-white font-bold rounded-2xl">
              {c.confirm}
            </button>
          </div>
        </>
      )}

      {step === 'verifying' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-white/20 rounded-full" />
            <div className="w-24 h-24 border-4 border-[#0F9E75] border-t-transparent rounded-full animate-spin absolute inset-0" />
            <Camera size={28} className="text-white absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-white font-bold animate-pulse">{loadingText}</p>
        </div>
      )}

      {step === 'result' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5">
          {verifyStatus === 'success' ? (
            <MotionWrapper>
              <div className="w-24 h-24 bg-[#0F9E75] rounded-full flex items-center justify-center text-white mb-4">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-2xl font-black text-white">{c.passed}</h2>
            </MotionWrapper>
          ) : (
            <MotionWrapper>
              <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white mb-4 mx-auto">
                <AlertCircle size={48} />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">{c.retake}</h2>
              <p className="text-white/80 font-medium mb-8 max-w-sm">{failReason}</p>
              <button onClick={handleRetake} className="px-8 py-4 bg-white text-black font-bold rounded-2xl flex items-center gap-2 mx-auto">
                <RefreshCw size={18} />
                {c.retake}
              </button>
            </MotionWrapper>
          )}
        </div>
      )}
    </div>
  )
}

function MotionWrapper({children}: {children: React.ReactNode}) {
  return <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">{children}</div>
}
