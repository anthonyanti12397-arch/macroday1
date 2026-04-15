'use client'

/**
 * Gets the user's current GPS coordinates.
 */
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        console.error('Geolocation error:', error)
        resolve(null)
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  })
}

/**
 * Reverse geocodes coordinates to a human-readable address/district using OpenStreetMap (Free).
 */
export async function getAddressFromCoords(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`, {
      headers: { 'Accept-Language': 'zh-HK,zh,en' }
    })
    const data = await res.json()
    // Extract district/city
    const addr = data.address
    const district = addr.suburb || addr.district || addr.city_district || addr.town || addr.city || ''
    const city = addr.city || addr.state || ''
    return `${district}, ${city}`.trim().replace(/^, |, $/g, '')
  } catch (err) {
    console.error('Reverse geocoding error:', err)
    return `${lat.toFixed(3)}, ${lon.toFixed(3)}`
  }
}
