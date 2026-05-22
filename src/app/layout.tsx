import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IT Management System',
  description: 'Internal IT helpdesk, asset tracking, and license management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
