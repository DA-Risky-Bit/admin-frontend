export default function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-5 items-center gap-3 border-b border-[#2c2c2c] px-2.5 py-1.5">
      <div className="w-32.5 shrink-0 text-[#aaa]">{label}</div>
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
    </div>
  )
}
