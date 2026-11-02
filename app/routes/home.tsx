import { useEffect, useRef, useState } from 'react'
import AdminSidebar from '../components/Sidebar'

import Bar from '../components/Bar'
import Panel from '../components/Panel'
import Row from '../components/Row'

import { EXPECTED_DOWN, MAX_LOG_LINES, MAX_REPLICAS, SCALABLE } from '../lib/config'
import { isUser, justStarted, nameOf, serviceOf, sse } from '../lib/docker'
import { gb } from '../lib/format'
import { useContainers, useHostInfo, useStats } from '../lib/hooks'
import type { ContainerInfo, LogLine } from '../lib/types'

export default function DockerDashboard() {
  const { containers, error: containersError } = useContainers()
  const { info, error: infoError } = useHostInfo()
  const snapshot = useStats()
  const error = containersError ?? infoError

  const [logs, setLogs] = useState<LogLine[]>([])
  const logBox = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)

  // Combine Logs of all Containers
  useEffect(() => {
    const es = sse('/logs')
    es.addEventListener('log', (e) => {
      const line = JSON.parse((e as MessageEvent).data) as LogLine
      setLogs((prev) =>
        [...prev, line].sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0)).slice(-MAX_LOG_LINES),
      )
    })
    return () => es.close()
  }, [])

  // Auto-scroll Logs while user is at the bottom
  useEffect(() => {
    const el = logBox.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }, [logs])

  const userContainers = containers.filter(isUser)
  const systemContainers = containers.filter((c) => !isUser(c))

  const isExpectedDown = (c: ContainerInfo) => EXPECTED_DOWN.includes(nameOf(c))
  const shouldBeUp = systemContainers.filter((c) => !isExpectedDown(c))
  const upCount = shouldBeUp.filter((c) => c.State === 'running').length

  const problems: string[] = [
    ...shouldBeUp.filter((c) => c.State !== 'running').map((c) => `${nameOf(c)} is ${c.State}`),
    ...systemContainers
      .filter((c) => isExpectedDown(c) && c.State === 'running' && !justStarted(c.Status))
      .map((c) => `${nameOf(c)} should be stopped but is running`),
  ]
  const healthy = !error && problems.length === 0

  const replicas = SCALABLE.map((svc) => ({
    svc,
    running: systemContainers.filter((c) => serviceOf(c) === svc && c.State === 'running').length,
  }))

  const ncpu = info?.ncpu ?? 1
  const totalCpu = Object.values(snapshot).reduce((sum, s) => sum + s.cpuPct, 0) // 100 = one core
  const cpuPct = (totalCpu / (ncpu * 100)) * 100
  const totalMem = Object.values(snapshot).reduce((sum, s) => sum + s.memUsed, 0)
  const memPct = info ? (totalMem / info.memTotal) * 100 : 0
  const containerPct = shouldBeUp.length ? (upCount / shouldBeUp.length) * 100 : 0

  // User containers: counted separately
  const userRunning = userContainers.filter((c) => c.State === 'running').length
  const userCpu = userContainers.reduce((sum, c) => sum + (snapshot[c.Id]?.cpuPct ?? 0), 0)
  const userCpuPct = (userCpu / (ncpu * 100)) * 100
  const userMem = userContainers.reduce((sum, c) => sum + (snapshot[c.Id]?.memUsed ?? 0), 0)
  const userMemPct = info ? (userMem / info.memTotal) * 100 : 0
  const userPct = userContainers.length ? (userRunning / userContainers.length) * 100 : 0

  return (
      <div className="flex h-screen bg-[#1c1c1c] ">
        <AdminSidebar />

        <main className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          <div className="flex items-baseline gap-3 px-1 py-1.5 text-[15px]">
            <b>Docker</b>
            {info && (
              <span className="text-[#999]">
                {info.os} · Docker {info.serverVersion}
              </span>
            )}
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] items-start gap-3">
            <Panel title="Status - System Container">
              <Row label="Health">
                <span className={`mr-2 inline-block size-2.25 rounded-full ${healthy ? 'bg-[#4c4]' : 'bg-[#d44]'}`} />
                {error ? `Error: ${error}` : healthy ? 'OK' : `${problems.length} problem${problems.length > 1 ? 's' : ''}`}
              </Row>
              {problems.map((p) => (
                <Row key={p} label="">
                  <span className="text-[#e66]">{p}</span>
                </Row>
              ))}
              <Row label="Containers">
                <Bar pct={containerPct} text={`${upCount} of ${shouldBeUp.length} running`} />
              </Row>
            </Panel>

            <Panel title="Resources - Global">
              <Row label="CPU usage">
                <Bar pct={cpuPct} text={`${cpuPct.toFixed(2)}% of ${ncpu} CPU(s)`} />
              </Row>
              <Row label="Memory usage">
                <Bar
                  pct={memPct}
                  text={`${memPct.toFixed(2)}% (${gb(totalMem)} GiB of ${info ? gb(info.memTotal) : '–'} GiB)`}
                />
              </Row>
            </Panel>
          </div>

          <Panel title="Replicas">
            {replicas.map(({ svc, running }) => (
              <Row key={svc} label={svc}>
                <Bar
                  pct={(running / MAX_REPLICAS) * 100}
                  text={`${running} of ${MAX_REPLICAS}${running > 1 ? ' (scaled up)' : ''}`}
                />
              </Row>
            ))}
          </Panel>

          <Panel title="User containers">
            <Row label="Running">
              <Bar pct={userPct} text={`${userRunning} of ${userContainers.length} running`} />
            </Row>
            <Row label="CPU usage">
              <Bar pct={userCpuPct} text={`${userCpuPct.toFixed(2)}% of ${ncpu} CPU(s)`} />
            </Row>
            <Row label="Memory usage">
              <Bar
                pct={userMemPct}
                text={`${userMemPct.toFixed(2)}% (${gb(userMem)} GiB of ${info ? gb(info.memTotal) : '–'} GiB)`}
              />
            </Row>
          </Panel>

          <Panel title="Logs (all containers)">
            <div
              ref={logBox}
              className="h-80 overflow-y-auto break-all whitespace-pre-wrap bg-black p-2 font-mono text-xs leading-snug"
              onScroll={(e) => {
                const el = e.currentTarget
                stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 20
              }}
            >
              {logs.map((l, i) => (
                <div key={i} className={l.stream === 'stderr' ? 'text-[#e66]' : undefined}>
                  <span className="text-[#777]">
                    {new Date(l.ts).toLocaleTimeString()} {l.name}{' '}
                  </span>
                  {l.text}
                </div>
              ))}
            </div>
          </Panel>
        </main>
      </div>
    )
}
