import { useCallback, useEffect, useState } from 'react'
import { API } from './config'
import { sse } from './docker'
import type { ContainerInfo, HostInfo, Stats } from './types'

export function useContainers() {
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API}/containers`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok || !Array.isArray(data)) throw new Error(data?.error ?? `HTTP ${res.status}`)
      setContainers(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    refresh()
    const es = sse('/events')
    es.addEventListener('docker', () => refresh())
    const timer = setInterval(refresh, 30_000)
    return () => {
      es.close()
      clearInterval(timer)
    }
  }, [refresh])

  return { containers, error }
}

export function useHostInfo() {
  const [info, setInfo] = useState<HostInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/info`, { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
        setInfo(data)
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  return { info, error }
}

export function useStats() {
  const [snapshot, setSnapshot] = useState<Record<string, Stats>>({})

  useEffect(() => {
    const es = sse('/stats')
    es.addEventListener('snapshot', (e) => {
      setSnapshot(JSON.parse((e as MessageEvent).data) as Record<string, Stats>)
    })
    return () => es.close()
  }, [])

  return snapshot
}
