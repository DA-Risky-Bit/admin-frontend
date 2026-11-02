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
    <section className={`border border-[#3a3a3a] bg-[#242424] ${className}`}>
      <div className="border-b border-[#3a3a3a] bg-[#2f2f2f] px-2.5 py-1.5 font-semibold">{title}</div>
      <div>{children}</div>
    </section>
  )
}
