import { useCallback, useEffect, useState } from 'react'
import { API_DOCKER } from './config'
import { sse } from './docker'
import type { ContainerInfo, HostInfo, Stats, User } from './types'
import { api } from '../api/clients'

export function useContainers() {
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await api(`${API_DOCKER}/containers`)
      const data = await res.json()

      if (!res.ok || !Array.isArray(data)) {
        throw new Error(data?.error ?? `HTTP ${res.status}`)
      }

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
    api(`${API_DOCKER}/info`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
        setInfo(data)
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  return { info, error }
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api('/api/users/')
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
        setUsers(data)
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  return { users, error }
}

export function useCode() {
  const [code, setCode] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [regenerating, setRegenerating] = useState<boolean>(false)

  const fetchCode = async () => {
    try {
      setError(null)
      setLoading(true)

      const res = await api('/api/code/')
      const data = await res.json()

      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)

      setCode(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const regenerateCode = async () => {
    try {
      setError(null)
      setRegenerating(true)

      const res = await api('/api/code/', {
        method: 'PUT',
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)

      setCode(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRegenerating(false)
    }
  }

  useEffect(() => {
    fetchCode()
  }, [])

  return {
    code,
    error,
    loading,
    regenerating,
    regenerateCode,
    refetch: fetchCode,
  }
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
