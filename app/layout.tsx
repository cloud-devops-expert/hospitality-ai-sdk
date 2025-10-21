import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hospitality AI SDK',
  description: 'AI-powered tools for hospitality management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
