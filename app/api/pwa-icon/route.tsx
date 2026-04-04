import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

function makeIcon(size: number) {
  const radius = Math.round(size * 0.2)
  const iconSize = Math.round(size * 0.55)
  return new ImageResponse(
    <div
      style={{
        width: size, height: size,
        borderRadius: radius,
        background: 'linear-gradient(135deg, #0F9E75 0%, #0BD68A 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <path d="M13 2L4.5 13.5H11L9 22L19.5 9H13.5L16 2Z" fill="white" />
      </svg>
    </div>,
    { width: size, height: size }
  )
}

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const size = searchParams.get('size') === '512' ? 512 : 192
  return makeIcon(size)
}
