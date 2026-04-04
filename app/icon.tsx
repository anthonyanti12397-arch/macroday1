import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32, height: 32,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L4.5 13.5H11L9 22L19.5 9H13.5L16 2Z" fill="white" />
      </svg>
    </div>,
    { ...size }
  )
}
