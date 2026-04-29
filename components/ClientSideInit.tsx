'use client'

import { useCloudSync } from '@/hooks/useCloudSync'

export default function ClientSideInit() {
  useCloudSync()
  return null
}
