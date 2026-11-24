import { Fragment } from 'react'
import Panel from './Panel'
import Logs from './Logs'
import { bytes } from '../lib/format'

import { nameOf, stateDot } from '../lib/docker'
import type { ContainerInfo, Stats } from '../lib/types'

const netTotals = (s: Stats) => {
  const nets = Object.values(s.net ?? {})
  return {
    rx: nets.reduce((sum, n) => sum + n.rx_bytes, 0),
    tx: nets.reduce((sum, n) => sum + n.tx_bytes, 0),
  }
}

const blkTotals = (s: Stats) => {
  const io = s.blkio?.io_service_bytes_recursive ?? []
  const sum = (op: string) => io.filter((e) => e.op.toLowerCase() === op).reduce((t, e) => t + e.value, 0)
  return { read: sum('read'), write: sum('write') }
}

const th = 'border-b border-border px-2.5 py-1.5 text-left font-semibold whitespace-nowrap'
const td = 'border-b border-border px-2.5 py-1.5 whitespace-nowrap'

export default function ContainerTable({
  title,
  rows,
  snapshot,
  selected,
  onSelect,
}: {
  title: string
  rows: ContainerInfo[]
  snapshot: Record<string, Stats>
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  return (
    <Panel title={title}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-surface-raised text-muted">
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Image</th>
              <th className={th}>State</th>
              <th className={th}>Status</th>
              <th className={th}>CPU</th>
              <th className={th}>Memory</th>
              <th className={th}>Net RX / TX</th>
              <th className={th}>Disk R / W</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const s = snapshot[c.Id]
              const open = c.Id === selected
              const net = s && netTotals(s)
              const blk = s && blkTotals(s)
              return (
                <Fragment key={c.Id}>
                  <tr
                    onClick={() => onSelect(open ? null : c.Id)}
                    className={`cursor-pointer hover:bg-surface-raised ${open ? 'bg-surface-raised' : ''}`}
                  >
                    <td className={td}>
                      <span className="mr-2 inline-block w-3 text-muted">{open ? '▾' : '▸'}</span>
                      {nameOf(c)}
                    </td>
                    <td className={`${td} text-muted`}>{c.Image}</td>
                    <td className={td}>
                      <span className={`mr-2 inline-block size-2.25 rounded-full ${stateDot(c.State)}`} />
                      {c.State}
                    </td>
                    <td className={`${td} text-muted`}>{c.Status}</td>
                    <td className={td}>{s ? `${s.cpuPct.toFixed(2)}%` : '–'}</td>
                    <td className={td}>
                      {s
                        ? `${bytes(s.memUsed)} / ${bytes(s.memLimit)} (${((s.memUsed / s.memLimit) * 100).toFixed(1)}%)`
                        : '–'}
                    </td>
                    <td className={td}>{net ? `${bytes(net.rx)} / ${bytes(net.tx)}` : '–'}</td>
                    <td className={td}>{blk ? `${bytes(blk.read)} / ${bytes(blk.write)}` : '–'}</td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={8} className="border-b border-border bg-surface p-2">
                        <Logs id={c.Id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2.5 py-3 text-muted">
                  No containers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
