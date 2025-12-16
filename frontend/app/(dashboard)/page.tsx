'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Users, DollarSign, Briefcase, AlertCircle, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [stats, setStats] = useState({ totalCustomers: 0, totalRevenue: 0, activeDeals: 0, pendingTickets: 0 })
  const [recentDeals, setRecentDeals] = useState<any[]>([])
  const [todayTasks, setTodayTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      // 1. Thống kê số liệu
      const customers = await supabase.from('customers').select('*', { count: 'exact', head: true })
      const deals = await supabase.from('deals').select('value').eq('stage', 'WON')
      const activeDeals = await supabase.from('deals').select('*', { count: 'exact', head: true }).neq('stage', 'WON').neq('stage', 'LOST')
      const tickets = await supabase.from('tickets').select('*', { count: 'exact', head: true }).neq('status', 'RESOLVED').neq('status', 'CLOSED')
      const totalRev = deals.data?.reduce((acc, curr) => acc + (curr.value || 0), 0) || 0

      setStats({ 
        totalCustomers: customers.count || 0, 
        totalRevenue: totalRev, 
        activeDeals: activeDeals.count || 0, 
        pendingTickets: tickets.count || 0 
      })
      
      // 2. Load Deal mới nhất (Top 5)
      const recent = await supabase.from('deals')
        .select('*, customers(name)')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentDeals(recent.data || [])

      // 3. Load CÔNG VIỆC TỒN ĐỌNG (Cập nhật logic lấy full)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const today = new Date().toISOString().split('T')[0]
        
        // Lấy tất cả việc chưa xong mà hạn <= hôm nay (bao gồm quá hạn)
        // Thêm select customers(name) để biết việc của khách nào
        const tasks = await supabase.from('tasks')
          .select('*, customers(name)') 
          .eq('assigned_to', user.id)
          .neq('status', 'DONE')
          .lte('due_date', today + 'T23:59:59')
          .order('due_date', { ascending: true }) // Việc gấp (hạn cũ nhất) lên đầu
          // .limit(5)  <-- ĐÃ BỎ GIỚI HẠN NÀY ĐỂ HIỆN HẾT
        
        setTodayTasks(tasks.data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
  
  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition border-l-4 border-l-transparent hover:border-l-red-500">
      <div className="flex items-center justify-between">
        <div><p className="text-sm font-medium text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-900 mt-2">{value}</p></div>
        <div className={`rounded-lg p-3 ${colorClass}`}><Icon className="h-6 w-6 text-white" /></div>
      </div>
    </div>
  )

  // Hàm kiểm tra quá hạn
  const isOverdue = (dateString: string) => {
    if (!dateString) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(dateString) < today
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan dự án</h1>
        <p className="text-gray-500">Hiệu suất kinh doanh hôm nay.</p>
      </div>
      
      {/* KHỐI THỐNG KÊ */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <StatCard title="Doanh thu" value={formatMoney(stats.totalRevenue)} icon={DollarSign} colorClass="bg-yellow-500 shadow-yellow-200" />
        <StatCard title="Khách hàng" value={stats.totalCustomers} icon={Users} colorClass="bg-red-600 shadow-red-200" />
        <StatCard title="Deal đang chạy" value={stats.activeDeals} icon={Briefcase} colorClass="bg-gray-800 shadow-gray-200" />
        <StatCard title="Ticket tồn đọng" value={stats.pendingTickets} icon={AlertCircle} colorClass="bg-red-400 shadow-red-200" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* BẢNG DEAL MỚI */}
        <div className="col-span-2 rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Cơ hội mới nhất</h3>
            <Link href="/deals" className="text-sm text-red-600 hover:underline">Xem tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500 border-b bg-gray-50">
                <tr>
                  <th className="pb-3 pl-2 pt-2">Tên Deal</th>
                  <th className="pb-3 pt-2">Khách hàng</th>
                  <th className="pb-3 pt-2">Giá trị</th>
                  <th className="pb-3 pt-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentDeals.map((d: any) => (
                  <tr key={d.id} className="hover:bg-yellow-50/50 transition-colors">
                    <td className="py-3 pl-2 font-medium text-gray-900">{d.title}</td>
                    <td className="py-3 text-gray-500">{d.customers?.name}</td>
                    <td className="py-3 font-medium text-red-600">{formatMoney(d.value)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${d.stage === 'WON' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {d.stage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CÔNG VIỆC CẦN LÀM (Đã nâng cấp) */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              Việc tồn đọng <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{todayTasks.length}</span>
            </h3>
            <Link href="/tasks" className="text-sm text-red-600 hover:underline">Chi tiết</Link>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-gray-200">
            {todayTasks.map((t: any) => {
              const overdue = isOverdue(t.due_date)
              return (
                <div key={t.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${overdue ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100 hover:border-yellow-200 hover:bg-yellow-50'}`}>
                  {overdue ? <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" /> : <Clock className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />}
                  
                  <div className="w-full min-w-0">
                    <p className={`text-sm font-bold truncate ${overdue ? 'text-red-700' : 'text-gray-900'}`}>{t.title}</p>
                    
                    {/* Hiển thị thêm tên khách hàng nếu có */}
                    {t.customers && (
                      <p className="text-xs text-gray-600 mt-0.5 truncate flex items-center gap-1">
                        <Users className="h-3 w-3" /> {t.customers.name}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center mt-1.5">
                      <p className={`text-xs font-medium ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                        Hạn: {t.due_date ? new Date(t.due_date).toLocaleDateString('vi-VN') : 'Hôm nay'}
                      </p>
                      {/* Badge trạng thái TODO/IN_PROGRESS */}
                      <span className="text-[10px] bg-white border px-1.5 rounded text-gray-500 uppercase font-bold">{t.status}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {todayTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <CheckCircle2 className="h-12 w-12 text-green-100 mb-2" />
                <p className="text-sm">Tuyệt vời! Không có việc tồn.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}