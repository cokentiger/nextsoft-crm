'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Users, DollarSign, Briefcase, AlertCircle, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [stats, setStats] = useState({ totalCustomers: 0, totalRevenue: 0, activeDeals: 0, pendingTickets: 0 })
  const [recentDeals, setRecentDeals] = useState<any[]>([])
  const [todayTasks, setTodayTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const customers = await supabase.from('customers').select('*', { count: 'exact', head: true })
      const deals = await supabase.from('deals').select('value').eq('stage', 'WON')
      const activeDeals = await supabase.from('deals').select('*', { count: 'exact', head: true }).neq('stage', 'WON').neq('stage', 'LOST')
      const tickets = await supabase.from('tickets').select('*', { count: 'exact', head: true }).neq('status', 'RESOLVED').neq('status', 'CLOSED')
      const totalRev = deals.data?.reduce((acc, curr) => acc + (curr.value || 0), 0) || 0

      setStats({ totalCustomers: customers.count || 0, totalRevenue: totalRev, activeDeals: activeDeals.count || 0, pendingTickets: tickets.count || 0 })
      
      const recent = await supabase.from('deals').select('*, customers(name)').order('created_at', { ascending: false }).limit(5)
      setRecentDeals(recent.data || [])

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const today = new Date().toISOString().split('T')[0]
        const tasks = await supabase.from('tasks').select('*').eq('assigned_to', user.id).neq('status', 'DONE').lte('due_date', today + 'T23:59:59').limit(5)
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

  return (
    <div className="p-8">
      <div className="mb-8"><h1 className="text-2xl font-bold text-gray-900">Tổng quan dự án</h1><p className="text-gray-500">Hiệu suất kinh doanh hôm nay.</p></div>
      
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <StatCard title="Doanh thu" value={formatMoney(stats.totalRevenue)} icon={DollarSign} colorClass="bg-yellow-500 shadow-yellow-200" />
        <StatCard title="Khách hàng" value={stats.totalCustomers} icon={Users} colorClass="bg-red-600 shadow-red-200" />
        <StatCard title="Deal đang chạy" value={stats.activeDeals} icon={Briefcase} colorClass="bg-gray-800 shadow-gray-200" />
        <StatCard title="Ticket tồn đọng" value={stats.pendingTickets} icon={AlertCircle} colorClass="bg-red-400 shadow-red-200" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="col-span-2 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Cơ hội mới nhất</h3><Link href="/deals" className="text-sm text-red-600 hover:underline">Xem tất cả</Link></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm"><thead className="text-gray-500 border-b bg-gray-50"><tr><th className="pb-3 pl-2 pt-2">Tên Deal</th><th className="pb-3 pt-2">Khách hàng</th><th className="pb-3 pt-2">Giá trị</th><th className="pb-3 pt-2">Trạng thái</th></tr></thead>
              <tbody className="divide-y">{recentDeals.map((d: any) => (
                  <tr key={d.id} className="hover:bg-yellow-50/50"><td className="py-3 pl-2 font-medium text-gray-900">{d.title}</td><td className="py-3 text-gray-500">{d.customers?.name}</td><td className="py-3 font-medium text-red-600">{formatMoney(d.value)}</td><td className="py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${d.stage === 'WON' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{d.stage}</span></td></tr>
                ))}</tbody></table>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Việc cần làm</h3><Link href="/tasks" className="text-sm text-red-600 hover:underline">Chi tiết</Link></div>
          <div className="space-y-4">{todayTasks.map((t: any) => (
              <div key={t.id} className="flex items-start gap-3 pb-3 border-b last:border-0 hover:bg-gray-50 p-2 rounded"><Clock className="h-5 w-5 text-yellow-500 mt-0.5" /><div><p className="text-sm font-medium text-gray-900 line-clamp-1">{t.title}</p><p className="text-xs text-gray-500">Hạn: {t.due_date ? new Date(t.due_date).toLocaleDateString('vi-VN') : 'Hôm nay'}</p></div></div>
            ))}{todayTasks.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Không có việc tồn đọng.</p>}</div>
        </div>
      </div>
    </div>
  )
}