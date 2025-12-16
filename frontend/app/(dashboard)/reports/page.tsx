'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ReportsPage() {
  const [dealData, setDealData] = useState<any[]>([]); const [ticketData, setTicketData] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: deals } = await supabase.from('deals').select('stage, value')
      // MÀU SẮC THƯƠNG HIỆU: Đỏ, Vàng, Xanh lá (Win), Xám (Lost)
      const dealStats = [
        { name: 'Mới', value: deals?.filter(d => d.stage === 'NEW').length || 0, color: '#DC2626' }, // Đỏ
        { name: 'Đàm phán', value: deals?.filter(d => d.stage === 'NEGOTIATION').length || 0, color: '#EAB308' }, // Vàng
        { name: 'Thắng', value: deals?.filter(d => d.stage === 'WON').length || 0, color: '#16A34A' }, // Xanh lá
        { name: 'Thua', value: deals?.filter(d => d.stage === 'LOST').length || 0, color: '#4B5563' }, // Xám đen
      ].filter(item => item.value > 0)

      const { data: tickets } = await supabase.from('tickets').select('status')
      const ticketStats = [
        { name: 'Mở', count: tickets?.filter(t => t.status === 'OPEN').length || 0 },
        { name: 'Xử lý', count: tickets?.filter(t => t.status === 'IN_PROGRESS').length || 0 },
        { name: 'Xong', count: tickets?.filter(t => t.status === 'RESOLVED').length || 0 },
      ]
      setDealData(dealStats); setTicketData(ticketStats)
    }; fetchData()
  }, [])

  return (
    <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Báo cáo & Phân tích</h1>
        <div className="grid gap-8 md:grid-cols-2">
          {/* PIE CHART */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-t-4 border-t-red-600">
            <h3 className="font-bold text-gray-900 mb-4 text-center">Tỷ lệ Cơ hội (Deals)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dealData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                    {dealData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value, 'Số lượng']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* BAR CHART */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-t-4 border-t-yellow-500">
            <h3 className="font-bold text-gray-900 mb-4 text-center">Ticket hỗ trợ</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Số lượng" fill="#DC2626" radius={[4, 4, 0, 0]} /> {/* Cột màu Đỏ */}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
    </div>
  )
}