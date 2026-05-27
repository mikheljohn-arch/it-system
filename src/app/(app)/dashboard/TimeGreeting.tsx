'use client'

import { useEffect, useState } from 'react'

export default function TimeGreeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    function update() {
      const h = new Date().getHours()
      setGreeting(h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening')
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
      Good {greeting}, {name} 👋
    </h1>
  )
}