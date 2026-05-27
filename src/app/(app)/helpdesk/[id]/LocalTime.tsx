'use client'

import { useEffect, useState } from 'react'

export default function LocalTime({ date, fmt = 'long' }: { date: string, fmt?: 'long' | 'short' | 'date-only' }) {
  const [text, setText] = useState('')

  useEffect(() => {
    const d = new Date(date)
    if (fmt === 'date-only') {
      setText(d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }))
    } else if (fmt === 'short') {
      setText(d.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }))
    } else {
      setText(d.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }))
    }
  }, [date, fmt])

  return <span>{text}</span>
}