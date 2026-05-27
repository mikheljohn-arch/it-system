'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

export default function RelativeTime({ date }: { date: string }) {
  const [text, setText] = useState('')

  useEffect(() => {
    function update() {
      setText(formatDistanceToNow(new Date(date), { addSuffix: true }))
    }
    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [date])

  return <span>{text}</span>
}