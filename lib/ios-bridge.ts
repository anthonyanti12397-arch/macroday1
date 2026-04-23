/**
 * iOS Native Bridge
 * Wraps Capacitor plugins for iOS-specific functionality
 * Falls back gracefully on web
 */

import { Preferences } from '@capacitor/preferences'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { LocalNotifications, PendingResult } from '@capacitor/local-notifications'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()
const isIOS = Capacitor.getPlatform() === 'ios'

/**
 * Store sensitive data in native secure storage (iOS Keychain)
 */
export async function saveToSecureStorage(key: string, value: string): Promise<void> {
  if (isNative) {
    await Preferences.set({ key, value })
  } else {
    localStorage.setItem(key, value)
  }
}

/**
 * Retrieve from native secure storage
 */
export async function getFromSecureStorage(key: string): Promise<string | null> {
  if (isNative) {
    const { value } = await Preferences.get({ key })
    return value || null
  } else {
    return localStorage.getItem(key)
  }
}

/**
 * Haptic feedback for user interactions
 */
export async function triggerHaptic(type: 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
  if (!isNative) return

  try {
    switch (type) {
      case 'success':
        await Haptics.notification({ type: NotificationType.Success })
        break
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning })
        break
      case 'error':
        await Haptics.notification({ type: NotificationType.Error })
        break
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light })
        break
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium })
        break
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy })
        break
    }
  } catch (error) {
    console.warn('Haptic feedback not available:', error)
  }
}

/**
 * Schedule local notification (breakfast reminder, meal ready, etc)
 */
export async function scheduleNotification(options: {
  title: string
  body: string
  id?: number
  scheduledTime?: Date
}): Promise<void> {
  if (!isNative) {
    // Web push via browser API (future)
    return
  }

  try {
    const result = await LocalNotifications.schedule({
      notifications: [
        {
          title: options.title,
          body: options.body,
          id: options.id || Math.floor(Math.random() * 10000),
          schedule: options.scheduledTime
            ? {
                on: {
                  hour: options.scheduledTime.getHours(),
                  minute: options.scheduledTime.getMinutes()
                }
              }
            : undefined
        }
      ]
    })
    console.log('Notification scheduled:', result)
  } catch (error) {
    console.error('Failed to schedule notification:', error)
  }
}

/**
 * Schedule daily meal reminder (9 AM by default)
 */
export async function scheduleDailyMealReminder(hour = 9, minute = 0): Promise<void> {
  await scheduleNotification({
    id: 1,
    title: '🍽️ Time for your daily meal plan',
    body: 'Your personalized meal plan is ready. Check what\'s for breakfast!',
    scheduledTime: new Date(new Date().setHours(hour, minute, 0, 0))
  })
}

/**
 * Capture photo from device camera for food identification
 */
export async function captureFood(): Promise<{
  base64: string
  format: 'jpeg' | 'png'
} | null> {
  if (!isNative) {
    console.warn('Camera not available on web platform')
    return null
  }

  try {
    const image = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    })

    return {
      base64: image.base64String || '',
      format: (image.format || 'jpeg') as 'jpeg' | 'png'
    }
  } catch (error) {
    console.error('Camera capture failed:', error)
    return null
  }
}

/**
 * Open photo library and select an image for meal tracking
 */
export async function selectMealPhoto(): Promise<{
  base64: string
  format: 'jpeg' | 'png'
} | null> {
  if (!isNative) {
    console.warn('Photo library not available on web platform')
    return null
  }

  try {
    const image = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos
    })

    return {
      base64: image.base64String || '',
      format: (image.format || 'jpeg') as 'jpeg' | 'png'
    }
  } catch (error) {
    console.error('Photo selection failed:', error)
    return null
  }
}

/**
 * Check if app is running on iOS
 */
export function isRunningOnIOS(): boolean {
  return isIOS
}

/**
 * Get app information for debugging
 */
export async function getAppInfo(): Promise<{
  platform: string
  isNative: boolean
  preferences: Record<string, string>
}> {
  const platform = Capacitor.getPlatform()
  const preferences: Record<string, string> = {}

  if (isNative) {
    try {
      const { keys } = await Preferences.keys()
      for (const key of keys) {
        const { value } = await Preferences.get({ key })
        if (value) preferences[key] = value
      }
    } catch (error) {
      console.warn('Could not read preferences:', error)
    }
  }

  return {
    platform,
    isNative,
    preferences
  }
}
