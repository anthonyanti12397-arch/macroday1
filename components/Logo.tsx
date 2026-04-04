import { APP_NAME, APP_NAME_ZH } from '@/lib/constants'

interface LogoProps {
  lang?: 'en' | 'zh'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Show only the icon, no wordmark */
  iconOnly?: boolean
}

function LogoIcon({ size }: { size: number }) {
  const r = Math.round(size * 0.25)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F9E75" />
          <stop offset="100%" stopColor="#0BD68A" />
        </linearGradient>
        <linearGradient id="logoGradDark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b8462" />
          <stop offset="100%" stopColor="#09b875" />
        </linearGradient>
      </defs>
      {/* Background rounded square */}
      <rect width="40" height="40" rx={r} fill="url(#logoGrad)" />
      {/* Lightning bolt / fuel spark */}
      <path
        d="M23 7 L13 22 H19.5 L17 33 L27 18 H20.5 L23 7Z"
        fill="white"
        fillOpacity="0.95"
      />
    </svg>
  )
}

export default function Logo({ lang = 'en', size = 'md', className = '', iconOnly = false }: LogoProps) {
  const config = {
    sm:  { iconSize: 26, textClass: 'text-lg font-bold',   gap: 'gap-2' },
    md:  { iconSize: 34, textClass: 'text-2xl font-bold',  gap: 'gap-2.5' },
    lg:  { iconSize: 52, textClass: 'text-4xl font-bold',  gap: 'gap-3.5' },
  }[size]

  if (iconOnly) return <LogoIcon size={config.iconSize} />

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      <LogoIcon size={config.iconSize} />
      <span className={`tracking-tight text-slate-900 ${config.textClass}`}>
        {lang === 'zh' ? APP_NAME_ZH : APP_NAME}
      </span>
    </div>
  )
}
