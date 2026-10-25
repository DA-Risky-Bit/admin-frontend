import { useCallback, useEffect, useRef, useState } from 'react'
import AdminSidebar from '../components/Sidebar'

// Backend lives on a different origin; set VITE_API_URL (e.g. http://localhost:3000)
const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/docker`


// withCredentials sends cookies cross-origin (needs matching CORS on the server)
const sse = (path: string) => new EventSource(`${API}${path}`, { withCredentials: true })

const MAX_LOG_LINES = 500
const HISTORY_POINTS = 60 // the server sends a snapshot every 2s, so 60 points is about 2 minutes

interface ContainerInfo {
  Id: string
  Names: string[]
  Image: string
  State: string
  Status: string
}
interface HostInfo {
  containers: number
  running: number
  paused: number
  stopped: number
  images: number
  ncpu: number
  memTotal: number
  serverVersion: string
  os: string
}
interface Stats {
  cpuPct: number
  memUsed: number
  memLimit: number
}
interface LogLine {
  stream: 'stdout' | 'stderr'
  text: string
}

const mb = (n: number) => (n / 1024 / 1024).toFixed(1)
const gb = (n: number) => (n / 1024 ** 3).toFixed(1)
const stateColor = (s: string) =>
  s === 'running' ? '#3c3' : s === 'exited' ? '#c33' : s === 'paused' ? '#cc3' : '#666'

function Card({ label, value, sub, pct }: { label: string; value: string; sub?: string; pct?: number }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={styles.cardValue}>{value}</div>
      {sub && <div style={styles.cardSub}>{sub}</div>}
      {pct !== undefined && <progress style={styles.cardBar} value={Math.min(pct, 100)} max={100} />}
    </div>
  )
}

function Sparkline({ values, max }: { values: number[]; max: number }) {
  const w = 300
  const h = 60
  if (values.length < 2) return <div style={{ height: h }} />
  const offset = HISTORY_POINTS - values.length // grow in from the right
  const pts = values
    .map((v, i) => `${((i + offset) / (HISTORY_POINTS - 1)) * w},${h - (Math.min(v, max) / max) * h}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: h }}>
      <polyline
        points={pts}
        fill="none"
        stroke="#4aa3ff"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default function DockerDashboard() {
  const [info, setInfo] = useState<HostInfo | null>(null)
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [snapshot, setSnapshot] = useState<Record<string, Stats>>({})
  const [cpuHistory, setCpuHistory] = useState<number[]>([]) // sum of container CPU %, 100 = one core
  const [events, setEvents] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const logBox = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    try {
      const [cRes, iRes] = await Promise.all([
        fetch(`${API}/containers`, { credentials: 'include' }),
        fetch(`${API}/info`, { credentials: 'include' }),
      ])
      const [c, i] = await Promise.all([cRes.json(), iRes.json()])
      if (!cRes.ok || !Array.isArray(c)) throw new Error(c?.error ?? `HTTP ${cRes.status}`)
      if (!iRes.ok) throw new Error(i?.error ?? `HTTP ${iRes.status}`)
      setContainers(c)
      setInfo(i)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  // Initial load + lifecycle events (start/stop/die...) trigger a refresh
  useEffect(() => {
    refresh()

    const es = sse('/events')
    es.addEventListener('docker', (e) => {
      const ev = JSON.parse((e as MessageEvent).data)
      const name = ev.Actor?.Attributes?.name ?? ev.id?.slice(0, 12)
      const line = `${new Date().toLocaleTimeString()}  ${ev.Action}  ${name}`
      setEvents((prev) => [line, ...prev].slice(0, 50))
      refresh()
    })

    return () => es.close()
  }, [refresh])

  // One stream carries live stats for ALL running containers
  useEffect(() => {
    const es = sse('/stats')
    es.addEventListener('snapshot', (e) => {
      const data = JSON.parse((e as MessageEvent).data) as Record<string, Stats>
      setSnapshot(data)
      const total = Object.values(data).reduce((sum, s) => sum + s.cpuPct, 0)
      setCpuHistory((prev) => [...prev, total].slice(-HISTORY_POINTS))
    })
    return () => es.close()
  }, [])

  // Logs only for the selected container
  useEffect(() => {
    setLogs([])
    if (!selected) return

    const pushLog = (stream: LogLine['stream'], raw: string) => {
      const text = (JSON.parse(raw) as string).replace(/\n$/, '')
      setLogs((prev) => [...prev, { stream, text }].slice(-MAX_LOG_LINES))
    }

    const es = sse(`/containers/${selected}/logs`)
    es.addEventListener('stdout', (e) => pushLog('stdout', (e as MessageEvent).data))
    es.addEventListener('stderr', (e) => pushLog('stderr', (e as MessageEvent).data))
    return () => es.close()
  }, [selected])

  // Auto-scroll logs
  useEffect(() => {
    const el = logBox.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs])

  // Derived numbers for the cards
  const capacityCpu = (info?.ncpu ?? 1) * 100
  const totalCpu = cpuHistory.at(-1) ?? 0
  const cpuPctOfHost = (totalCpu / capacityCpu) * 100
  const totalMem = Object.values(snapshot).reduce((sum, s) => sum + s.memUsed, 0)
  const memPctOfHost = info ? (totalMem / info.memTotal) * 100 : 0
  const historyPct = cpuHistory.map((v) => (v / capacityCpu) * 100)
  const historyMax = Math.max(5, ...historyPct) // auto-scale so small loads are still visible

  const sorted = [...containers].sort(
    (a, b) => Number(b.State === 'running') - Number(a.State === 'running'),
  )
  const selectedName = containers.find((c) => c.Id === selected)?.Names[0]?.replace('/', '')

  return (
    <div style={styles.wrap}>
      <AdminSidebar />

      <main style={styles.main}>
        <header style={styles.header}>
          <h2 style={{ margin: 0 }}>Docker overview</h2>
          {info && (
            <small style={{ color: '#777' }}>
              {info.os} · Docker {info.serverVersion}
            </small>
          )}
        </header>

        {error && <p style={styles.error}>{error}</p>}

        <section style={styles.cards}>
          <Card
            label="Running"
            value={String(info?.running ?? '–')}
            sub={`of ${info?.containers ?? '–'} containers`}
          />
          <Card
            label="Stopped"
            value={String(info?.stopped ?? '–')}
            sub={`${info?.paused ?? 0} paused`}
          />
          <Card label="Images" value={String(info?.images ?? '–')} />
          <Card
            label="CPU"
            value={`${cpuPctOfHost.toFixed(1)}%`}
            sub={`${info?.ncpu ?? '–'} cores available`}
            pct={cpuPctOfHost}
          />
          <Card
            label="Memory"
            value={`${gb(totalMem)} GB`}
            sub={`of ${info ? gb(info.memTotal) : '–'} GB`}
            pct={memPctOfHost}
          />
        </section>

        <section style={styles.panel}>
          <div style={styles.panelTitle}>
            Total CPU usage · peak {Math.max(0, ...historyPct).toFixed(1)}% of host
          </div>
          <Sparkline values={historyPct} max={historyMax} />
        </section>

        <section style={styles.panel}>
          <div style={styles.panelTitle}>Containers</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Image</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>CPU</th>
                <th style={styles.th}>Memory</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const s = snapshot[c.Id]
                return (
                  <tr
                    key={c.Id}
                    onClick={() => setSelected(c.Id === selected ? null : c.Id)}
                    style={{ ...styles.row, background: c.Id === selected ? '#222' : 'transparent' }}
                  >
                    <td style={styles.td}>
                      <span style={{ ...styles.dot, background: stateColor(c.State) }} />
                      {c.Names[0]?.replace('/', '')}
                    </td>
                    <td style={{ ...styles.td, color: '#888' }}>{c.Image}</td>
                    <td style={{ ...styles.td, color: '#888' }}>{c.Status}</td>
                    <td style={styles.td}>{s ? `${s.cpuPct.toFixed(1)}%` : '–'}</td>
                    <td style={styles.td}>{s ? `${mb(s.memUsed)} MB` : '–'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <div style={styles.bottom}>
          {selected && (
            <section style={{ ...styles.panel, flex: 2, minWidth: 0 }}>
              <div style={{ ...styles.panelTitle, display: 'flex', justifyContent: 'space-between' }}>
                <span>Logs · {selectedName}</span>
                <button onClick={() => setSelected(null)} style={styles.close} aria-label="Close logs">
                  ✕
                </button>
              </div>
              <div ref={logBox} style={styles.logs}>
                {logs.map((l, i) => (
                  <div key={i} style={{ color: l.stream === 'stderr' ? '#f77' : undefined }}>
                    {l.text}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section style={{ ...styles.panel, flex: 1, minWidth: 0 }}>
            <div style={styles.panelTitle}>Events</div>
            <pre style={styles.events}>{events.length ? events.join('\n') : 'Waiting for events…'}</pre>
          </section>
        </div>
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#111', color: '#ddd' },
  main: { flex: 1, overflowY: 'auto', padding: 16, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 },
  header: { display: 'flex', alignItems: 'baseline', gap: 12 },
  error: { color: '#f77', fontSize: 13, margin: 0 },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 },
  card: { background: '#181818', border: '1px solid #2a2a2a', borderRadius: 8, padding: 14 },
  cardLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 28, fontWeight: 600, margin: '4px 0' },
  cardSub: { fontSize: 12, color: '#777' },
  cardBar: { display: 'block', width: '100%', marginTop: 8 },
  panel: { background: '#181818', border: '1px solid #2a2a2a', borderRadius: 8, padding: 14 },
  panelTitle: { fontSize: 13, color: '#999', marginBottom: 10 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', color: '#777', fontWeight: 500, padding: '6px 8px', borderBottom: '1px solid #2a2a2a' },
  row: { cursor: 'pointer' },
  td: { padding: '8px', borderBottom: '1px solid #222' },
  dot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 8 },
  bottom: { display: 'flex', gap: 16, alignItems: 'stretch' },
  close: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
  logs: {
    height: 260,
    overflowY: 'auto',
    background: '#000',
    padding: 8,
    font: '12px/1.4 monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  events: { margin: 0, fontSize: 11, color: '#999', whiteSpace: 'pre-wrap', maxHeight: 260, overflowY: 'auto' },
}
