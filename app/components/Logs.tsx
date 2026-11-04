import { useEffect, useRef, useState } from 'react'
import { MAX_LOG_LINES } from '../lib/config'
import { sse } from '../lib/docker'
import type { LogLine } from '../lib/types'

export default function Logs({ id }: { id: string }) {
  const [lines, setLines] = useState<LogLine[]>([])
  const [ended, setEnded] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)

  useEffect(() => {
    const es = sse(`/containers/${id}/logs`)

    // A chunk can hold several lines, each starting with its timestamp
    const push = (stream: LogLine['stream'], raw: string) => {
      const parsed = (JSON.parse(raw) as string)
        .split('\n')
        .map((l) => l.replace(/\r$/, ''))
        .filter(Boolean)
        .map((l) => {
          const i = l.indexOf(' ')
          return { stream, ts: i < 0 ? '' : l.slice(0, i), text: i < 0 ? l : l.slice(i + 1) }
        })
      setLines((prev) => [...prev, ...parsed].slice(-MAX_LOG_LINES))
    }

    es.addEventListener('stdout', (e) => push('stdout', (e as MessageEvent).data))
    es.addEventListener('stderr', (e) => push('stderr', (e as MessageEvent).data))
    // The server closes the stream for stopped containers; close here so
    // EventSource doesn't reconnect and replay the same lines.
    es.onerror = () => {
      es.close()
      setEnded(true)
    }
    return () => es.close()
  }, [id])

  useEffect(() => {
    const el = box.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }, [lines])

  return (
    <div
      ref={box}
      className="h-72 overflow-y-auto break-all whitespace-pre-wrap bg-terminal p-2 font-mono text-xs leading-snug"
      onScroll={(e) => {
        const el = e.currentTarget
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 20
      }}
    >
      {lines.length === 0 && <div className="text-muted">{ended ? 'No logs.' : 'Waiting for logs…'}</div>}
      {lines.map((l, i) => (
        <div key={i} className={l.stream === 'stderr' ? 'text-danger' : undefined}>
          <span className="text-muted">{l.ts ? new Date(l.ts).toLocaleTimeString() : ''} </span>
          {l.text}
        </div>
      ))}
      {ended && lines.length > 0 && <div className="text-muted">— end of stream —</div>}
    </div>
  )
}
