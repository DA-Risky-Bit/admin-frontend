export default function Bar({ pct, text }: { pct: number; text: string }) {
  const p = Math.max(0, Math.min(pct, 100))
  return (
    <div className="relative h-5 w-full border border-[#444] bg-[#333]">
      <div className="absolute inset-y-0 left-0 bg-[#3d6fa5]" style={{ width: `${p}%` }} />
      <div className="relative text-center text-xs leading-5 text-white">{text}</div>
    </div>
  )
}
