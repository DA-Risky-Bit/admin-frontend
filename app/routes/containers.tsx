import { useState } from 'react'
import AdminSidebar from '../components/Sidebar'
import ContainerTable from '../components/ContainerTable'

import { byState, isUser } from '../lib/docker'
import { useContainers, useStats } from '../lib/hooks'
import type { ContainerInfo } from '../lib/types'

const runningTitle = (name: string, list: ContainerInfo[]) =>
  `${name} (${list.filter((c) => c.State === 'running').length} of ${list.length} running)`

export default function DockerContainers() {
  const { containers, error } = useContainers()
  const snapshot = useStats()
  const [selected, setSelected] = useState<string | null>(null)

  const system = containers.filter((c) => !isUser(c)).sort(byState)
  const user = containers.filter(isUser).sort(byState)

  return (
    <div className="flex h-screen bg-surface-sunken">
      <AdminSidebar />

      <main className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <div className="flex items-baseline gap-3 px-1 py-1.5 text-[15px]">
          <b>Containers</b>
        </div>

        {error && <div className="px-1 text-danger">Error: {error}</div>}

        <ContainerTable
          title={runningTitle('System containers', system)}
          rows={system}
          snapshot={snapshot}
          selected={selected}
          onSelect={setSelected}
        />
        <ContainerTable
          title={runningTitle('User containers', user)}
          rows={user}
          snapshot={snapshot}
          selected={selected}
          onSelect={setSelected}
        />
      </main>
    </div>
  )
}
