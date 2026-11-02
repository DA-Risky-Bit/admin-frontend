export interface ContainerInfo {
  Id: string
  Names: string[]
  Image: string
  State: string
  Status: string // e.g. "Up 3 minutes", "Exited (0) 2 hours ago"
  Labels?: Record<string, string>
}
export interface HostInfo {
  ncpu: number
  memTotal: number
  serverVersion: string
  os: string
}
export interface Stats {
  cpuPct: number
  memUsed: number
  memLimit: number
  net?: Record<string, { rx_bytes: number; tx_bytes: number }> | null
  blkio?: { io_service_bytes_recursive?: { op: string; value: number }[] | null } | null
}
export interface LogLine {
  stream: 'stdout' | 'stderr'
  ts: string
  text: string
  name?: string // only set on the combined log stream
}
