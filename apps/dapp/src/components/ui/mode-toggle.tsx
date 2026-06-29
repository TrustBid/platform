'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Esperamos a que el componente se monte en el cliente para evitar errores de hidratación
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-9 w-9" /> // Espacio en blanco mientras carga

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)

    // FORCE: Forzamos manualmente al HTML global a reaccionar si Tailwind se traba
    const root = window.document.documentElement
    if (nextTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 shrink-0 rounded-lg border border-border/80 bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
      title="Cambiar tema"
    >
      {theme === 'dark' ? (
        <Moon className="h-[1.1rem] w-[1.1rem] text-amber-400" />
      ) : (
        <Sun className="h-[1.1rem] w-[1.1rem] text-blue-600" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}