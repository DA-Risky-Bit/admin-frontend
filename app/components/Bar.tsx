export default function Bar({ pct, text }: { pct: number; text: string }) {
  const p = Math.max(0, Math.min(pct, 100))
  return (
    <div className="relative h-5 w-full border border-border bg-primary">
      <div className="absolute inset-y-0 left-0 bg-secondary" style={{ width: `${p}%` }} />
      <div className="relative text-center text-xs leading-5 text-tertiary">{text}</div>
    </div>
  )
}
