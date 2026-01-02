'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Users, DollarSign, Briefcase, AlertCircle, 
  Clock, TrendingUp, TrendingDown, Filter, PieChart 
} from 'lucide-react'
import Link from 'next/link'

// Helper: Format tiền tệ
const formatMoney = (n: number) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

export default function Dashboard() {
  const supabase = createClient()
  
  // --- STATE QUẢN LÝ ---
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date()) // Mặc định tháng hiện tại
  
  // Dữ liệu hiển thị
  const [kpi, setKpi] = useState({
    revenue: { current: 0, lastMonth: 0, growth: 0 },
    customers: { current: 0, lastMonth: 0, growth: 0 },
    deals: { active: 0, won: 0 },
    tickets: { pending: 0 }
  })
  
  const [revenueBySource, setRevenueBySource] = useState<any[]>([])
  const [recentDeals, setRecentDeals] = useState<any[]>([])
  const [myTasks, setMyTasks] = useState<any[]>([])

  // --- LOGIC FETCH DATA ---
  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // 1. XÁC ĐỊNH KHOẢNG THỜI GIAN (Time Range)
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth() // 0-11
    
    // Start/End của tháng HIỆN TẠI đang chọn
    const startOfMonth = new Date(year, month, 1).toISOString()
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    
    // Start/End của tháng TRƯỚC (để tính tăng trưởng)
    const startOfLastMonth = new Date(year, month - 1, 1).toISOString()
    const endOfLastMonth = new Date(year, month, 0, 23, 59, 59).toISOString()

    // 2. FETCH KHÁCH HÀNG (CUSTOMERS)
    const { data: customers } = await supabase
      .from('customers')
      .select('created_at')
    
    // 3. FETCH DEALS
    // Lưu ý: Ta lấy rộng hơn để tính toán Client-side cho linh hoạt các nhóm nguồn
    const { data: deals } = await supabase
      .from('deals')
      .select('value, stage, created_at, lead_source, title, id, customers(name)')
      .order('created_at', { ascending: false })

    // 4. FETCH TICKETS & TASKS
    const { count: pendingTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'RESOLVED')
      .neq('status', 'CLOSED')

    let tasksData: any[] = []
    if (user) {
      const { data } = await supabase.from('tasks')
        .select('*, customers(name)')
        .eq('assigned_to', user.id)
        .neq('status', 'DONE')
        .order('due_date', { ascending: true })
      tasksData = data || []
    }

    // --- TÍNH TOÁN KPI (BUSINESS LOGIC) ---
    
    // Helper check ngày
    const isInDateRange = (dateStr: string, start: string, end: string) => 
      dateStr >= start && dateStr <= end

    // A. KHÁCH HÀNG MỚI (NEW CUSTOMERS)
    const newCustCurrent = customers?.filter(c => isInDateRange(c.created_at, startOfMonth, endOfMonth)).length || 0
    const newCustLast = customers?.filter(c => isInDateRange(c.created_at, startOfLastMonth, endOfLastMonth)).length || 0
    
    // B. DOANH THU (REVENUE - Chỉ tính WON)
    let revCurrent = 0
    let revLast = 0
    let countActive = 0
    let sourceMap: Record<string, number> = {}

    deals?.forEach(d => {
      // Tính Pipeline (Active Deals - Không quan tâm tháng, chỉ quan tâm trạng thái hiện tại)
      if (d.stage !== 'WON' && d.stage !== 'LOST') {
        countActive++
      }

      // Tính Doanh Thu (Chỉ tính WON)
      if (d.stage === 'WON') {
        const val = d.value || 0
        
        // Doanh thu tháng này
        if (isInDateRange(d.created_at, startOfMonth, endOfMonth)) {
          revCurrent += val
          
          // Phân nhóm nguồn (Revenue Breakdown)
          const source = d.lead_source || 'Không xác định'
          sourceMap[source] = (sourceMap[source] || 0) + val
        }
        
        // Doanh thu tháng trước
        if (isInDateRange(d.created_at, startOfLastMonth, endOfLastMonth)) {
          revLast += val
        }
      }
    })

    // C. TÍNH TĂNG TRƯỞNG (%)
    const calcGrowth = (curr: number, last: number) => {
      if (last === 0) return curr > 0 ? 100 : 0
      return Math.round(((curr - last) / last) * 100)
    }

    setKpi({
      revenue: { current: revCurrent, lastMonth: revLast, growth: calcGrowth(revCurrent, revLast) },
      customers: { current: newCustCurrent, lastMonth: newCustLast, growth: calcGrowth(newCustCurrent, newCustLast) },
      deals: { active: countActive, won: deals?.filter(d => d.stage === 'WON').length || 0 },
      tickets: { pending: pendingTickets || 0 }
    })

    // Chuyển sourceMap thành mảng để render & sort
    const sourceArray = Object.entries(sourceMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value) // Cao nhất lên đầu
    
    setRevenueBySource(sourceArray)
    
    // Top 5 deals mới nhất (trong tháng chọn hoặc tổng thể tùy logic, ở đây lấy tổng thể mới nhất)
    setRecentDeals(deals?.slice(0, 5) || [])
    setMyTasks(tasksData)
    setLoading(false)
  }

  // Reload khi đổi tháng
  useEffect(() => { loadData() }, [selectedDate])

  // --- UI COMPONENTS ---

  // Component chọn tháng
  const MonthPicker = () => (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
      <Filter className="h-4 w-4 text-gray-500" />
      <select 
        className="text-sm font-semibold text-gray-700 outline-none bg-transparent cursor-pointer"
        value={selectedDate.getMonth()}
        onChange={(e) => {
          const newDate = new Date(selectedDate)
          newDate.setMonth(parseInt(e.target.value))
          setSelectedDate(newDate)
        }}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <option key={i} value={i}>Tháng {i + 1}</option>
        ))}
      </select>
      <select
        className="text-sm font-semibold text-gray-700 outline-none bg-transparent border-l pl-2 cursor-pointer"
        value={selectedDate.getFullYear()}
        onChange={(e) => {
          const newDate = new Date(selectedDate)
          newDate.setFullYear(parseInt(e.target.value))
          setSelectedDate(newDate)
        }}
      >
        {[2024, 2025, 2026, 2027].map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )

  // Component Thẻ KPI chuyên nghiệp
  const StatCard = ({ title, value, growth, icon: Icon, color }: any) => {
    const isPositive = growth >= 0
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
          </div>
          <div className={`p-2 rounded-lg ${color.bg} ${color.text}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        
        {/* Growth Indicator */}
        <div className="mt-4 flex items-center gap-2">
          <span className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(growth)}%
          </span>
          <span className="text-xs text-gray-400">so với tháng trước</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/50">
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Tổng quan</h1>
          <p className="text-gray-500 text-sm mt-1">
            Dữ liệu kinh doanh tháng {selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
          </p>
        </div>
        <MonthPicker />
      </div>
      
      {/* KPI GRID */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <StatCard 
          title="Doanh thu thực tế (Won)" 
          value={formatMoney(kpi.revenue.current)} 
          growth={kpi.revenue.growth}
          icon={DollarSign} 
          color={{ bg: 'bg-yellow-100', text: 'text-yellow-600' }}
        />
        <StatCard 
          title="Khách hàng mới" 
          value={kpi.customers.current} 
          growth={kpi.customers.growth}
          icon={Users} 
          color={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
        />
        {/* Pipeline không cần so sánh tháng, vì nó là snapshot hiện tại */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Cơ hội đang chạy</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{kpi.deals.active}</h3>
            </div>
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><Briefcase className="h-6 w-6"/></div>
          </div>
          <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
             <div className="h-full bg-purple-500 w-2/3"></div> 
             {/* Note: Ở đây có thể tính % tiến độ pipeline nếu muốn */}
          </div>
          <p className="text-xs text-gray-400 mt-2">Tổng giá trị pipeline tiềm năng</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
           <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Yêu cầu hỗ trợ</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{kpi.tickets.pending}</h3>
            </div>
            <div className="p-2 rounded-lg bg-red-100 text-red-600"><AlertCircle className="h-6 w-6"/></div>
          </div>
          <p className="text-xs text-gray-400 mt-4 font-medium text-red-500">Cần xử lý ngay</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* COL 1: REVENUE BREAKDOWN (MỚI) */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-gray-500"/> Nguồn doanh thu
          </h3>
          
          {revenueBySource.length > 0 ? (
            <div className="space-y-4">
              {revenueBySource.map((src, idx) => {
                const percent = Math.round((src.value / kpi.revenue.current) * 100) || 0
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{src.name}</span>
                      <span className="font-bold text-gray-900">{percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-blue-500' : 'bg-gray-400'}`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">{formatMoney(src.value)}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <p className="text-sm">Chưa có doanh thu tháng này</p>
            </div>
          )}
        </div>

        {/* COL 2 & 3: RECENT DEALS & TASKS */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Deals */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Giao dịch mới nhất</h3>
                <Link href="/deals" className="text-sm text-red-600 hover:underline">Xem tất cả</Link>
             </div>
             <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-500 border-b border-gray-100 bg-gray-50/50">
                  <tr>
                    <th className="pb-2 pl-2">Deal</th>
                    <th className="pb-2">Nguồn</th>
                    <th className="pb-2 text-right">Giá trị</th>
                    <th className="pb-2 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentDeals.map((d: any) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="py-3 pl-2">
                        <p className="font-bold text-gray-800">{d.title}</p>
                        <p className="text-xs text-gray-500">{d.customers?.name}</p>
                      </td>
                      <td className="py-3 text-gray-500 text-xs">{d.lead_source || '-'}</td>
                      <td className="py-3 font-bold text-gray-900 text-right">{formatMoney(d.value)}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          d.stage === 'WON' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>{d.stage}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
          </div>

          {/* Tasks Mini (Rút gọn) */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
             <h3 className="font-bold text-gray-900 text-lg mb-4">Việc cần làm gấp</h3>
             <div className="space-y-3">
               {myTasks.slice(0, 3).map((t: any) => (
                 <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm font-bold text-gray-800">{t.title}</p>
                        <p className="text-xs text-gray-500">{t.customers?.name}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-white px-2 py-1 rounded border text-gray-600">
                      {t.due_date ? new Date(t.due_date).toLocaleDateString('vi-VN') : 'No Date'}
                    </span>
                 </div>
               ))}
               {myTasks.length === 0 && <p className="text-sm text-gray-400">Không có công việc tồn đọng.</p>}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}