export const API = `${import.meta.env.VITE_API_URL ?? 'http://api.localhost'}/api/docker`

export const EXPECTED_DOWN = ['riskybit-ollama-downloader-1']

export const SCALABLE = ['admin-frontend', 'chat-frontend', 'challenge-frontend']
export const MAX_REPLICAS = 5

export const MAX_LOG_LINES = 500

export const USER_GROUP_LABEL = 'com.risky-bit.group'
export const COMPOSE_SERVICE_LABEL = 'com.docker.compose.service'
