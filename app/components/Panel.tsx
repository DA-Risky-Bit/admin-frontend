export default function Panel({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`border border-border bg-surface ${className}`}>
      <div className="border-b border-border bg-surface-raised px-2.5 py-1.5 font-semibold">{title}</div>
      <div>{children}</div>
    </section>
  )
}
