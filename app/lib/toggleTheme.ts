import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function useTheme() {
  // null until the browser has read the real value, so SSR and first client render match
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    setTheme(readTheme())
  }, [])

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme
  }, [theme])

  const toggle = () => {
    const next: Theme = (theme ?? 'dark') === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem('theme', next)
    } catch {}
    setTheme(next)
  }

  return { theme, toggle }
}
