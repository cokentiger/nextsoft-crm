'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Users, DollarSign, Briefcase, AlertCircle, Clock, AlertTriangle, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  // Thêm state revenue_month (Tháng này) và deal_counts (Chi tiết từng giai đoạn)
  const [stats, setStats] = useState({ 
    totalCustomers: 0, 
    totalRevenue: 0, 
    revenueThisMonth: 0, // Mới
    activeDeals: 0, 
    pendingTickets: 0 
  })
  
  const [dealCounts, setDealCounts] = useState({ NEW: 0, NEGOTIATION: 0 }) // Mới: Đếm chi tiết
  const [recentDeals, setRecentDeals] = useState<any[]>([])
  const [myTasks, setMyTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const supabase = createClient()

  const loadData = async () => {
    setRefreshing(true)
    
    // 1. LẤY USER HIỆN TẠI
    const { data: { user } } = await supabase.auth.getUser()

    // 2. KHÁCH HÀNG
    const customers = await supabase.from('customers').select('id', { count: 'exact', head: true })

    // 3. DOANH THU & DEAL
    // Lấy tất cả Deal để tự tính toán Client-side cho nhanh và linh hoạt
    const { data: allDeals } = await supabase.from('deals').select('value, stage, created_at')
    
    let totalRev = 0
    let monthRev = 0
    let countActive = 0
    let countNew = 0
    let countNego = 0

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    allDeals?.forEach(d => {
      // Tính doanh thu (Chỉ tính WON)
      if (d.stage === 'WON') {
        const val = d.value || 0
        totalRev += val
        
        // Check nếu thuộc tháng này
        const dDate = new Date(d.created_at)
        if (dDate.getMonth() === thisMonth && dDate.getFullYear() === thisYear) {
          monthRev += val
        }
      } 
      // Tính Deal đang chạy (Không phải WON cũng ko phải LOST)
      else if (d.stage !== 'LOST') {
        countActive++
        if (d.stage === 'NEW') countNew++
        if (d.stage === 'NEGOTIATION') countNego++
      }
    })

    // 4. TICKET TỒN ĐỌNG (Chưa đóng)
    const tickets = await supabase.from('tickets').select('id', { count: 'exact', head: true })
      .neq('status', 'RESOLVED').neq('status', 'CLOSED')

    setStats({ 
      totalCustomers: customers.count || 0, 
      totalRevenue: totalRev, 
      revenueThisMonth: monthRev,
      activeDeals: countActive, 
      pendingTickets: tickets.count || 0 
    })
    setDealCounts({ NEW: countNew, NEGOTIATION: countNego })

    // 5. DEAL MỚI NHẤT (Lấy Top 5)
    const recent = await supabase.from('deals')
      .select('*, customers(name)')
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentDeals(recent.data || [])

    // 6. VIỆC CẦN LÀM (MY TASKS)
    // Logic mới: Lấy TẤT CẢ việc chưa xong (kể cả tương lai) để hiển thị
    if (user) {
      const tasks = await supabase.from('tasks')
        .select('*, customers(name)') 
        .eq('assigned_to', user.id)
        .neq('status', 'DONE') // Chỉ lấy việc chưa xong
        .order('due_date', { ascending: true }) // Hạn gần xếp trước
      
      setMyTasks(tasks.data || [])
    }

    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { loadData() }, [])

  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
  
  // Kiểm tra quá hạn
  const isOverdue = (dateString: string) => {
    if (!dateString) return false
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return new Date(dateString) < today
  }

  // Component Thẻ thống kê
  const StatCard = ({ title, value, subValue, icon: Icon, colorClass, textColor }: any) => (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition relative overflow-hidden group">
      <div className={`absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${textColor}`}>
        <Icon className="h-16 w-16" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subValue && <p className={`text-xs mt-1 font-medium ${textColor}`}>{subValue}</p>}
      </div>
      <div className={`mt-4 h-1 w-full rounded-full bg-gray-100`}>
        <div className={`h-1 rounded-full ${colorClass}`} style={{ width: '70%' }}></div>
      </div>
    </div>
  )

  return (
    <div className="p-8 h-full overflow-y-auto">
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan dự án</h1>
          <p className="text-gray-500 text-sm mt-1">Hiệu suất kinh doanh & Công việc hôm nay.</p>
        </div>
        <button 
          onClick={loadData} 
          disabled={refreshing}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-red-600 transition"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> 
          {refreshing ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>
      
      {/* KHỐI THỐNG KÊ (Đã nâng cấp) */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <StatCard 
          title="Tổng Doanh thu" 
          value={formatMoney(stats.totalRevenue)} 
          subValue={`Tháng này: ${formatMoney(stats.revenueThisMonth)}`} // Hiện thêm tháng này
          icon={DollarSign} 
          colorClass="bg-yellow-500" 
          textColor="text-yellow-600"
        />
        <StatCard 
          title="Khách hàng" 
          value={stats.totalCustomers} 
          subValue="Tổng số lượng khách"
          icon={Users} 
          colorClass="bg-red-600" 
          textColor="text-red-600"
        />
        <StatCard 
          title="Pipeline (Đang chạy)" 
          value={stats.activeDeals} 
          subValue={`${dealCounts.NEW} Mới - ${dealCounts.NEGOTIATION} Đàm phán`} // Chi tiết hơn
          icon={Briefcase} 
          colorClass="bg-blue-600" 
          textColor="text-blue-600"
        />
        <StatCard 
          title="Hỗ trợ (Tickets)" 
          value={stats.pendingTickets} 
          subValue="Yêu cầu đang chờ xử lý"
          icon={AlertCircle} 
          colorClass="bg-purple-500" 
          textColor="text-purple-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* BẢNG DEAL MỚI */}
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-lg">Giao dịch gần đây</h3>
            <Link href="/deals" className="text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded transition">Xem tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500 border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <th className="pb-3 pl-4 pt-3 rounded-tl-lg">Tên Deal</th>
                  <th className="pb-3 pt-3">Khách hàng</th>
                  <th className="pb-3 pt-3 text-right pr-4">Giá trị</th>
                  <th className="pb-3 pt-3 text-center rounded-tr-lg">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentDeals.map((d: any) => (
                  <tr key={d.id} className="hover:bg-yellow-50/30 transition-colors">
                    <td className="py-3 pl-4 font-bold text-gray-800">{d.title}</td>
                    <td className="py-3 text-gray-500 text-xs">{d.customers?.name}</td>
                    <td className="py-3 font-bold text-red-600 text-right pr-4">{formatMoney(d.value)}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        d.stage === 'WON' ? 'bg-green-50 text-green-700 border-green-200' :
                        d.stage === 'NEW' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        d.stage === 'LOST' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {d.stage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CÔNG VIỆC CẦN LÀM (Đã sửa logic: Hiện tất cả việc chưa xong) */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              Việc của tôi <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-extrabold">{myTasks.length}</span>
            </h3>
            <Link href="/tasks" className="text-sm font-medium text-gray-500 hover:text-red-600">Chi tiết</Link>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-1 flex-1 scrollbar-thin scrollbar-thumb-gray-200 custom-scrollbar">
            {myTasks.length > 0 ? myTasks.map((t: any) => {
              const overdue = isOverdue(t.due_date)
              return (
                <div key={t.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all group ${overdue ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100 hover:border-red-200 hover:shadow-sm'}`}>
                  {overdue 
                    ? <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0 animate-pulse" /> 
                    : <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0 group-hover:text-red-500" />
                  }
                  
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold truncate ${overdue ? 'text-red-700' : 'text-gray-800'}`}>{t.title}</p>
                    
                    {t.customers && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
                        <Users className="h-3 w-3" /> {t.customers.name}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center mt-2">
                      <p className={`text-[10px] font-medium px-2 py-0.5 rounded border ${overdue ? 'bg-white border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        {t.due_date ? new Date(t.due_date).toLocaleDateString('vi-VN') : 'Không thời hạn'}
                      </p>
                      <span className={`text-[10px] uppercase font-bold ${t.priority === 'HIGH' ? 'text-red-600' : 'text-gray-400'}`}>{t.priority}</span>
                    </div>
                  </div>
                </div>
              )
            }) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-8">
                <CheckCircle2 className="h-14 w-14 text-green-100 mb-3" />
                <p className="text-sm font-medium text-gray-500">Tuyệt vời!</p>
                <p className="text-xs">Bạn đã hoàn thành hết công việc.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}