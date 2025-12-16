'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Search, Pencil, Trash2, User, Clock, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [submitting, setSubmitting] = useState(false)
  const [customers, setCustomers] = useState<any[]>([]); const [employees, setEmployees] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<string|null>(null); const [editingId, setEditingId] = useState<string|null>(null)
  const [viewMode, setViewMode] = useState<'MINE'|'ALL'>('ALL'); const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter(); const supabase = createClient()
  const [formData, setFormData] = useState({ title: '', status: 'OPEN', priority: 'NORMAL', customer_id: '', assigned_to: '', deadline: '' })

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser(); setCurrentUser(user?.id||null)
      const t = await supabase.from('tickets').select('*, customers(name), profiles(full_name, email), tasks(status)').order('created_at', { ascending: false })
      const c = await supabase.from('customers').select('id, name'); const e = await supabase.from('profiles').select('id, full_name, email')
      setTickets(t.data||[]); setCustomers(c.data||[]); setEmployees(e.data||[]); setLoading(false)
    }; fetch()
  }, [])

  const filtered = tickets.filter(t => (viewMode === 'ALL' || t.assigned_to === currentUser) && (t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.customers?.name.toLowerCase().includes(searchTerm.toLowerCase())))
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    const payload = { title: formData.title, status: formData.status, priority: formData.priority, customer_id: formData.customer_id||null, assigned_to: formData.assigned_to||currentUser, deadline: formData.deadline||null }
    if (editingId) await supabase.from('tickets').update(payload).eq('id', editingId); else await supabase.from('tickets').insert([payload])
    setSubmitting(false); setShowModal(false); setEditingId(null); setFormData({ title: '', status: 'OPEN', priority: 'NORMAL', customer_id: '', assigned_to: '', deadline: '' }); const t = await supabase.from('tickets').select('*, customers(name), profiles(full_name, email), tasks(status)').order('created_at', { ascending: false }); setTickets(t.data||[])
  }
  const handleDelete = async (id: string) => { if(confirm("Xóa ticket?")) { await supabase.from('tickets').delete().eq('id', id); setTickets(tickets.filter(t => t.id !== id)) } }
  const handleEdit = (t: any) => { setEditingId(t.id); setFormData({ title: t.title, status: t.status, priority: t.priority, customer_id: t.customer_id, assigned_to: t.assigned_to||'', deadline: t.deadline ? t.deadline.split('T')[0] : '' }); setShowModal(true) }
  const getStatusBadge = (s: string) => ({ 'OPEN': 'bg-red-100 text-red-700', 'IN_PROGRESS': 'bg-yellow-100 text-yellow-700', 'RESOLVED': 'bg-green-100 text-green-700', 'CLOSED': 'bg-gray-100 text-gray-500' }[s] || 'bg-gray-100')

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Hỗ trợ (Tickets)</h1><p className="text-sm text-gray-500">Tiếp nhận yêu cầu & SLA</p></div>
        <button onClick={() => { setEditingId(null); setShowModal(true) }} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-red-700 shadow-md shadow-red-200"><Plus className="h-4 w-4"/> Tạo Ticket</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
         <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input type="text" placeholder="Tìm tiêu đề, khách hàng..." className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
         <div className="flex bg-white border rounded-md p-1"><button onClick={() => setViewMode('MINE')} className={`px-4 py-1.5 text-xs font-medium rounded ${viewMode==='MINE'?'bg-red-50 text-red-700':'text-gray-500 hover:bg-gray-50'}`}>Việc tôi</button><button onClick={() => setViewMode('ALL')} className={`px-4 py-1.5 text-xs font-medium rounded ${viewMode==='ALL'?'bg-red-50 text-red-700':'text-gray-500 hover:bg-gray-50'}`}>Tất cả</button></div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
         <table className="w-full text-left text-sm text-gray-500"><thead className="bg-gray-50 uppercase text-xs font-bold text-gray-700"><tr><th className="px-6 py-4">Tiêu đề / Mức độ</th><th className="px-6 py-4">Phụ trách / Deadline</th><th className="px-6 py-4">Trạng thái</th><th className="px-6 py-4 text-right">#</th></tr></thead>
           <tbody className="divide-y divide-gray-100">{filtered.map(t => (
                <tr key={t.id} className="hover:bg-yellow-50/50 transition-colors">
                    <td className="px-6 py-4"><div className="font-bold text-gray-900">{t.title}</div><div className="text-xs text-gray-500 mt-1">KH: {t.customers?.name}</div><div className={`inline-flex mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${t.priority === 'URGENT' ? 'text-red-600 border-red-200 bg-red-50' : t.priority === 'HIGH' ? 'text-orange-600 border-orange-200 bg-orange-50' : 'text-gray-600 border-gray-200 bg-gray-50'}`}>{t.priority}</div></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-1.5 text-xs text-gray-900 font-medium"><User className="h-3.5 w-3.5 text-gray-400"/> {t.profiles?.full_name||'--'}</div>{t.deadline && (<div className={`flex items-center gap-1.5 text-xs mt-1 ${new Date(t.deadline) < new Date() && t.status !== 'RESOLVED' ? 'text-red-600 font-bold' : 'text-gray-500'}`}><Clock className="h-3.5 w-3.5"/> {new Date(t.deadline).toLocaleDateString('vi-VN')}</div>)}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${getStatusBadge(t.status)}`}>{t.status}</span></td>
                    <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEdit(t)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Pencil className="h-4 w-4"/></button><button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4"/></button></div></td>
                </tr>
            ))}</tbody></table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl"><h2 className="text-lg font-bold mb-4">{editingId ? 'Sửa Ticket' : 'Tạo Ticket'}</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <div><label className="text-xs font-bold text-gray-500 uppercase">TIÊU ĐỀ</label><input className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required/></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Khách hàng</label><select className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})}><option value="">-- Chọn --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Mức độ</label><select className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}><option value="NORMAL">Bình thường</option><option value="HIGH">Cao</option><option value="URGENT">Khẩn cấp</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Người xử lý</label><select className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})}><option value="">-- Chọn --</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name||e.email}</option>)}</select></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Deadline</label><input type="date" className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} /></div>
                    </div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Trạng thái</label><select className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="OPEN">Mới</option><option value="IN_PROGRESS">Đang xử lý</option><option value="RESOLVED">Đã xong</option><option value="CLOSED">Đóng</option></select></div>
                    <div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Hủy</button><button className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 flex items-center gap-1">{submitting && <Loader2 className="h-3 w-3 animate-spin"/>} Lưu</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}