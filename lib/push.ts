'use client'

const PUSH_DISMISSED_KEY = 'macroday_push_dismissed'

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied'
  return Notification.requestPermission()
}

export function sendLocalNotification(title: string, body: string, icon = '/api/pwa-icon?size=192') {
  if (getPushPermission() !== 'granted') return
  try {
    new Notification(title, { body, icon })
  } catch {
    // Some browsers require service worker for notifications
  }
}

export function dismissPushBanner() {
  try { localStorage.setItem(PUSH_DISMISSED_KEY, '1') } catch { /* ignore */ }
}

export function isPushBannerDismissed(): boolean {
  try { return localStorage.getItem(PUSH_DISMISSED_KEY) === '1' } catch { return false }
}
