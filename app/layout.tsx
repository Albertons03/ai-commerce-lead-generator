import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { ToastDebugger } from '@/components/toast-debugger'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AI Commerce Lead Generator',
  description: 'AI-powered e-commerce lead generation dashboard with intelligent chatbot integration',
  keywords: ['AI', 'e-commerce', 'lead generation', 'chatbot', 'analytics'],
  authors: [{ name: 'AI Commerce Lead Generator Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ToastProvider />
          {children}
          {process.env.NODE_ENV === 'development' && <ToastDebugger />}
        </ThemeProvider>
      </body>
    </html>
  )
}
