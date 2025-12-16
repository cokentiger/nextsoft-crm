'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, DollarSign, Pencil, Trash2, Calendar, User, Search, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [submitting, setSubmitting] = useState(false)
  const [customers, setCustomers] = useState<any[]>([]); const [employees, setEmployees] = useState<any[]>([]) 
  const [currentUser, setCurrentUser] = useState<string|null>(null); const [editingId, setEditingId] = useState<string|null>(null)
  const [viewMode, setViewMode] = useState<'MINE'|'ALL'>('ALL'); const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter(); const supabase = createClient()
  const [formData, setFormData] = useState({ title: '', value: 0, stage: 'NEW', customer_id: '', assigned_to: '', expected_close_date: '' })

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser(); setCurrentUser(user?.id||null)
      const d = await supabase.from('deals').select('*, customers(name), profiles(full_name, email), tasks(status)').order('created_at', { ascending: false })
      const c = await supabase.from('customers').select('id, name'); const e = await supabase.from('profiles').select('id, full_name, email')
      setDeals(d.data||[]); setCustomers(c.data||[]); setEmployees(e.data||[]); setLoading(false)
    }; fetch()
  }, [])

  const filtered = deals.filter(d => (viewMode === 'ALL' || d.assigned_to === currentUser) && (d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.customers?.name.toLowerCase().includes(searchTerm.toLowerCase())))
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    const payload = { title: formData.title, value: formData.value, stage: formData.stage, customer_id: formData.customer_id||null, assigned_to: formData.assigned_to||currentUser, expected_close_date: formData.expected_close_date||null }
    if (editingId) await supabase.from('deals').update(payload).eq('id', editingId); else await supabase.from('deals').insert([payload])
    setSubmitting(false); setShowModal(false); setEditingId(null); setFormData({ title: '', value: 0, stage: 'NEW', customer_id: '', assigned_to: '', expected_close_date: '' }); 
    const d = await supabase.from('deals').select('*, customers(name), profiles(full_name, email), tasks(status)').order('created_at', { ascending: false }); setDeals(d.data||[])
  }
  const handleDelete = async (id: string) => { if(confirm('Xóa deal?')) { await supabase.from('deals').delete().eq('id', id); setDeals(deals.filter(d => d.id !== id)) } }
  const handleEdit = (d: any) => { setEditingId(d.id); setFormData({ title: d.title, value: d.value, stage: d.stage, customer_id: d.customer_id, assigned_to: d.assigned_to||'', expected_close_date: d.expected_close_date||'' }); setShowModal(true) }
  
  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
  const getStageBadge = (s: string) => ({ 'NEW': 'bg-blue-50 text-blue-700', 'NEGOTIATION': 'bg-yellow-100 text-yellow-800', 'WON': 'bg-green-100 text-green-700', 'LOST': 'bg-gray-100 text-gray-500' }[s] || 'bg-gray-100')

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Cơ hội (Deals)</h1><p className="text-sm text-gray-500">Pipeline & Doanh thu dự kiến</p></div>
        <button onClick={() => { setEditingId(null); setShowModal(true) }} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-red-700 shadow-md shadow-red-200"><Plus className="h-4 w-4"/> Thêm mới</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
         <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input type="text" placeholder="Tìm tên deal, khách hàng..." className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
         <div className="flex bg-white border rounded-md p-1"><button onClick={() => setViewMode('MINE')} className={`px-4 py-1.5 text-xs font-medium rounded ${viewMode==='MINE'?'bg-red-50 text-red-700':'text-gray-500 hover:bg-gray-50'}`}>Của tôi</button><button onClick={() => setViewMode('ALL')} className={`px-4 py-1.5 text-xs font-medium rounded ${viewMode==='ALL'?'bg-red-50 text-red-700':'text-gray-500 hover:bg-gray-50'}`}>Tất cả</button></div>
      </div>

      {loading ? <p className="text-center py-10">Đang tải...</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
         {filtered.map((deal) => (
           <div key={deal.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between border-l-4 border-l-transparent hover:border-l-yellow-500">
             <div>
                <div className="flex justify-between items-start"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStageBadge(deal.stage)}`}>{deal.stage}</span><div className="flex gap-1"><button onClick={() => handleEdit(deal)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Pencil className="h-4 w-4"/></button><button onClick={() => handleDelete(deal.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4"/></button></div></div>
                <h3 className="mt-2 font-bold text-gray-900 truncate">{deal.title}</h3><p className="text-xs text-gray-500 mt-1 truncate">KH: {deal.customers?.name}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500"><div className="flex items-center gap-1"><User className="h-3 w-3"/> {deal.profiles?.full_name||'--'}</div>{deal.expected_close_date && (<div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded"><Calendar className="h-3 w-3"/> {new Date(deal.expected_close_date).toLocaleDateString('vi-VN')}</div>)}</div>
             </div>
             <div className="mt-4 pt-3 border-t flex justify-between items-center"><span className="font-bold text-red-700 flex items-center gap-1"><DollarSign className="h-4 w-4"/> {formatMoney(deal.value)}</span><span className="text-[10px] text-gray-400">{new Date(deal.created_at).toLocaleDateString('vi-VN')}</span></div>
           </div>
         ))}</div>
      }

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl"><h2 className="text-lg font-bold mb-4">{editingId ? 'Cập nhật' : 'Tạo mới'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                  <div><label className="text-xs font-bold text-gray-500 uppercase">Tên Deal</label><input className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required/></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Giá trị (VNĐ)</label><input type="number" className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})}/><div className="text-[10px] text-red-600 font-bold mt-1 text-right">{formatMoney(formData.value)}</div></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Giai đoạn</label><select className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}><option value="NEW">Mới</option><option value="NEGOTIATION">Đàm phán</option><option value="WON">Thắng</option><option value="LOST">Thua</option></select></div>
                  </div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase">Khách hàng</label><select className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})}><option value="">-- Chọn --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Hủy</button><button type="submit" disabled={submitting} className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 flex items-center gap-1">{submitting && <Loader2 className="h-3 w-3 animate-spin"/>} Lưu</button></div>
              </form>
          </div>
        </div>
      )}
    </div>
  )
}