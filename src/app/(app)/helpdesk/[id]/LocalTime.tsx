'use client'

import { format } from 'date-fns'

export default function LocalTime({ date, fmt = 'MMM d, yyyy h:mm a' }: { date: string, fmt?: string }) {
  return <span>{format(new Date(date), fmt)}</span>
}