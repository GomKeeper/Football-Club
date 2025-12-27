'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: '홈 (Home)', href: '/manager', icon: '🏠' },
  { label: '경기 관리', href: '/manager/matches', icon: '⚽' },
  { label: '알림 센터', href: '/manager/notifications', icon: '📢' },
  { label: '회원 관리', href: '/manager/members', icon: '👥' }, // Placeholder
]

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* 🖥️ Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r h-screen sticky top-0 shadow-sm z-10">
        <div className="p-6 border-b">
          <h1 className="text-xl font-extrabold text-blue-600 tracking-tight">신사에이스 FC</h1>
          <p className="text-xs text-gray-400 mt-1">운영진 대시보드</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t text-xs text-gray-400 text-center">
          v0.5.0 (Beta)
        </div>
      </aside>

      {/* 📱 Mobile Top Bar */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <span className="font-bold text-lg text-blue-600">Manager Mode</span>
        <select 
          className="bg-gray-100 rounded-md py-1 px-3 text-sm border-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => window.location.href = e.target.value}
          value={pathname}
        >
          {NAV_ITEMS.map(item => (
            <option key={item.href} value={item.href}>{item.icon} {item.label}</option>
          ))}
        </select>
      </div>

      {/* 📄 Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}