import { API_DOCKER, COMPOSE_SERVICE_LABEL, USER_GROUP_LABEL } from './config'
import type { ContainerInfo } from './types'

export const sse = (path: string) => new EventSource(`${API_DOCKER}${path}`, { withCredentials: true })

export const nameOf = (c: ContainerInfo) => c.Names[0]?.replace('/', '') ?? c.Id.slice(0, 12)
export const serviceOf = (c: ContainerInfo) => c.Labels?.[COMPOSE_SERVICE_LABEL]
export const isUser = (c: ContainerInfo) => c.Labels?.[USER_GROUP_LABEL] === 'user'

export const byState = (a: ContainerInfo, b: ContainerInfo) =>
  Number(b.State === 'running') - Number(a.State === 'running') || nameOf(a).localeCompare(nameOf(b))

export const stateDot = (s: string) =>
  s === 'running' ? 'bg-[#4c4]' : s === 'paused' ? 'bg-[#ec4]' : s === 'exited' ? 'bg-[#d44]' : 'bg-[#666]'

export const justStarted = (status: string) =>
  /^Up (Less than a second|\d+ seconds?|About a minute|[1-4] minutes?)\b/.test(status)
