'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  LayoutDashboard, Users, Calculator, FileText, CheckSquare, 
  LifeBuoy, Rocket, FileBarChart, LogOut, ChevronLeft, ChevronRight, UserCog, Package 
} from 'lucide-react'

const menuItems = [
  { name: 'Tổng quan', href: '/', icon: LayoutDashboard },
  { name: 'Khách hàng', href: '/customers', icon: Users },
  { name: 'Cơ hội (Deals)', href: '/deals', icon: Calculator },
  { name: 'Hợp đồng', href: '/contracts', icon: FileText },
  { name: 'Công việc', href: '/tasks', icon: CheckSquare },
  { name: 'Hỗ trợ (Tickets)', href: '/tickets', icon: LifeBuoy },
  { name: 'Triển khai', href: '/deployments', icon: Rocket },
  { name: 'Báo cáo', href: '/reports', icon: FileBarChart },
  { name: 'Sản phẩm', href: '/products', icon: Package },
  { name: 'Tài khoản', href: '/profile', icon: UserCog },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className={`relative flex min-h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out flex-shrink-0 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* LOGO */}
      <div className="flex h-16 items-center justify-center border-b border-gray-100 bg-white overflow-hidden">
        {isCollapsed ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 font-bold text-yellow-400 shadow-md flex-shrink-0 text-xl">N</div>
        ) : (
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-red-600">Next</span><span className="text-gray-900">soft</span><span className="text-yellow-500 text-sm">.vn</span>
          </h1>
        )}
      </div>

      {/* MENU */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : ''}
              className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-red-50 text-red-700 border-l-4 border-red-600 shadow-sm' 
                  : 'text-gray-600 hover:bg-yellow-50 hover:text-gray-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <item.icon className={`flex-shrink-0 transition-all ${isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-yellow-600'} ${isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* TOGGLE */}
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-red-50 hover:text-red-600 focus:outline-none">
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* FOOTER */}
      <div className="border-t border-gray-100 p-3">
        <button onClick={handleLogout} title={isCollapsed ? "Đăng xuất" : ""} className={`group flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-black hover:text-white transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOut className={`flex-shrink-0 transition-colors ${isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'} text-gray-400 group-hover:text-yellow-400`} />
          {!isCollapsed && <span className="truncate">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}