import type { Metadata } from 'next'
import { ReactNode } from 'react'
import AppShell from '@/components/AppShell'
import './globals.css'

export const metadata: Metadata = {
  title: 'S-Store',
  description: 'Discover recipes, home ideas, style inspiration and products on S-Store.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-[#111111] antialiased selection:bg-red-100 selection:text-red-900">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
