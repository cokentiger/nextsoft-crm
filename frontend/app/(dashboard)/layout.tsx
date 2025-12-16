// frontend/app/(dashboard)/layout.tsx
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Dòng này giúp cố định chiều cao bằng màn hình, Sidebar không bị co lại
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      {/* Sidebar nằm cố định bên trái */}
      <Sidebar />

      {/* Nội dung chính nằm bên phải, có thanh cuộn riêng */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full">
          {children}
        </div>
      </main>
      
    </div>
  )
}