interface MacroBarProps {
  label: string
  target: number
  unit?: string
  color: string
}

export default function MacroBar({ label, target, unit = 'g', color }: MacroBarProps) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="text-sm font-bold" style={{ color }}>
        {target}{unit}
      </span>
    </div>
  )
}
