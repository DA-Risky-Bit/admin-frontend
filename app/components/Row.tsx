export default function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-5 items-center gap-3 border-b border-border px-2.5 py-1.5">
      <div className="w-32.5 shrink-0 text-muted">{label}</div>
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
    </div>
  )
}
