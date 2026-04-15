'use client'

import { useEffect } from 'react'
import { checkAndInitStarterGear } from '@/lib/storage'
import { GEAR_DB } from '@/lib/outfits'

export default function ClientSideInit() {
  useEffect(() => {
    checkAndInitStarterGear(GEAR_DB)
  }, [])

  return null
}
