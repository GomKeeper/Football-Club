import './globals.css'
import { AuthProvider } from '@/components/AuthProvider' // Import this

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
           {children}
        </AuthProvider>
      </body>
    </html>
  )
}