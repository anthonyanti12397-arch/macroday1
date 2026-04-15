import exifr from 'exifr'

// 檢查照片是否在 maxMinutes 分鐘內拍攝
// 返回 true = 合法，false = 太舊
export async function isPhotoRecent(file: File, maxMinutes = 10): Promise<boolean> {
  try {
    const exif = await exifr.parse(file, ['DateTimeOriginal'])
    if (!exif?.DateTimeOriginal) return true // 沒有 EXIF 資訊放行
    const photoTime = new Date(exif.DateTimeOriginal).getTime()
    const now = Date.now()
    return (now - photoTime) < maxMinutes * 60 * 1000
  } catch {
    return true // 解析失敗放行
  }
}
