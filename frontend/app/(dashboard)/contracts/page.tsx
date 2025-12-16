'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Search, Calendar, Key, RefreshCw, X, Loader2, Trash2, ShieldAlert, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [submitting, setSubmitting] = useState(false)
  const [customers, setCustomers] = useState<any[]>([]); const [userRole, setUserRole] = useState<'ADMIN'|'SALE'>('SALE')
  const [searchTerm, setSearchTerm] = useState(''); const [filterStatus, setFilterStatus] = useState('ALL'); const [currentPage, setCurrentPage] = useState(1); const itemsPerPage = 10
  const [editingId, setEditingId] = useState<string|null>(null); const router = useRouter(); const supabase = createClient()
  const [formData, setFormData] = useState({ contract_code: '', total_value: 0, start_date: '', end_date: '', status: 'DRAFT', license_key: '', is_auto_renew: false, customer_id: '' })

  useEffect(() => {
    const checkRole = async () => { const { data: { user } } = await supabase.auth.getUser(); if (user) { const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single(); if (data) setUserRole(data.role) } }
    checkRole(); fetch()
  }, [])
  const fetch = async () => {
    const d = await supabase.from('contracts').select('*, customers(name)').order('created_at', { ascending: false })
    const c = await supabase.from('customers').select('id, name').order('name'); setContracts(d.data||[]); setCustomers(c.data||[]); setLoading(false)
  }

  const filtered = contracts.filter(c => (c.contract_code.toLowerCase().includes(searchTerm.toLowerCase()) || c.customers?.name.toLowerCase().includes(searchTerm.toLowerCase())) && (filterStatus === 'ALL' || c.status === filterStatus))
  const paginated = filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage); const totalPages = Math.ceil(filtered.length/itemsPerPage)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    const payload = { contract_code: formData.contract_code, customer_id: formData.customer_id, start_date: formData.start_date||null, end_date: formData.end_date||null, total_value: formData.total_value, is_auto_renew: formData.is_auto_renew, status: formData.status, license_key: formData.license_key }
    if(userRole === 'SALE' && !editingId) { payload.status = 'DRAFT'; payload.license_key = '' }
    if(editingId) await supabase.from('contracts').update(payload).eq('id', editingId); else await supabase.from('contracts').insert([payload])
    setSubmitting(false); setShowModal(false); setEditingId(null); fetch(); router.refresh()
  }
  const handleDelete = async (id: string) => { if(userRole !== 'ADMIN') return alert("Cấm!"); if(confirm("Xóa?")) { await supabase.from('contracts').delete().eq('id', id); fetch() } }
  const handleEdit = (c: any) => { if(userRole==='SALE'&&c.status!=='DRAFT') return alert('Chỉ sửa nháp'); setEditingId(c.id); setFormData({ contract_code: c.contract_code, total_value: c.total_value, start_date: c.start_date||'', end_date: c.end_date||'', status: c.status, license_key: c.license_key||'', is_auto_renew: c.is_auto_renew, customer_id: c.customer_id }); setShowModal(true) }
  
  const getStatusColor = (s: string) => ({ 'ACTIVE': 'bg-green-100 text-green-700 ring-green-600/20', 'DRAFT': 'bg-gray-100 text-gray-600 ring-gray-500/10', 'EXPIRED': 'bg-red-100 text-red-700 ring-red-600/20' }[s] || 'bg-blue-50 text-blue-700')
  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  return (
    <div className="p-8 flex flex-col h-full overflow-hidden">
        <div className="mb-6 flex items-center justify-between flex-shrink-0">
          <div><h1 className="text-2xl font-bold text-gray-900">Quản lý Hợp đồng</h1><div className="flex items-center gap-2 mt-1"><span className={`text-xs font-bold px-2 py-0.5 rounded ${userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{userRole}</span><span className="text-sm text-gray-500">• {contracts.length} HĐ</span></div></div>
          <button onClick={() => { setEditingId(null); setFormData({contract_code:'',total_value:0,start_date:'',end_date:'',status:userRole==='ADMIN'?'ACTIVE':'DRAFT',license_key:'',is_auto_renew:false,customer_id:''}); setShowModal(true) }} className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 shadow-md shadow-red-200"><Plus className="h-4 w-4"/> Tạo hợp đồng</button>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 flex-shrink-0">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/><input type="text" placeholder="Tìm mã, khách..." className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} /></div>
          <select className="rounded-md border border-gray-300 py-2 px-3 text-sm outline-none focus:border-red-500 bg-white" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}><option value="ALL">Tất cả</option><option value="ACTIVE">Hiệu lực</option><option value="DRAFT">Nháp</option><option value="EXPIRED">Hết hạn</option></select>
        </div>

        <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm mb-4">
          <table className="w-full text-left text-sm text-gray-500"><thead className="bg-gray-50 text-xs font-medium uppercase text-gray-700 sticky top-0 z-10"><tr><th className="px-6 py-4">Mã HĐ</th><th className="px-6 py-4">Khách hàng</th><th className="px-6 py-4">Thời hạn / Key</th><th className="px-6 py-4">Giá trị</th><th className="px-6 py-4">Trạng thái</th><th className="px-6 py-4 text-right">#</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{loading ? <tr><td colSpan={6} className="text-center py-8">Đang tải...</td></tr> : paginated.map((c) => (
                <tr key={c.id} className="hover:bg-yellow-50/50 transition-colors">
                  <td className="px-6 py-4"><div className="font-bold text-gray-900">{c.contract_code}</div>{c.is_auto_renew && <div className="mt-1 flex items-center gap-1 text-[10px] text-red-600 bg-red-50 w-fit px-1 rounded"><RefreshCw className="h-3 w-3" /> Auto Renew</div>}</td>
                  <td className="px-6 py-4">{c.customers?.name}</td>
                  <td className="px-6 py-4"><div className="flex items-center gap-1 text-xs text-gray-900"><Calendar className="h-3 w-3 text-gray-400"/> {c.end_date ? new Date(c.end_date).toLocaleDateString('vi-VN') : '---'}</div>{c.license_key && <div className="mt-1 flex items-center gap-1 text-xs font-mono text-gray-500 bg-gray-100 px-1 rounded w-fit"><Key className="h-3 w-3"/> {c.license_key}</div>}</td>
                  <td className="px-6 py-4 font-medium text-red-600">{formatMoney(c.total_value)}</td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(c.status)}`}>{c.status}</span></td>
                  <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEdit(c)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Pencil className="h-4 w-4"/></button>{userRole === 'ADMIN' && <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4"/></button>}</div></td>
                </tr>
              ))}</tbody></table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 flex-shrink-0"><p className="text-sm text-gray-700">Trang {currentPage} / {totalPages}</p><nav className="isolate inline-flex -space-x-px rounded-md shadow-sm"><button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:bg-gray-100"><ChevronLeft className="h-5 w-5"/></button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:bg-gray-100"><ChevronRight className="h-5 w-5"/></button></nav></div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex justify-between mb-4"><h2 className="text-lg font-bold">{editingId ? 'Cập nhật' : 'Tạo mới'}</h2><button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400 hover:text-red-500"/></button></div>{userRole === 'SALE' && <div className="mb-4 bg-yellow-50 p-3 text-xs text-yellow-800 rounded border border-yellow-100 flex gap-2"><ShieldAlert className="h-4 w-4"/>Quyền SALE: Chỉ tạo Nháp, không cấp Key.</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase">Mã HĐ *</label><input required className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.contract_code} onChange={e => setFormData({...formData, contract_code: e.target.value})} /></div><div><label className="text-xs font-bold text-gray-500 uppercase">Khách hàng *</label><select required className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})}><option value="">-- Chọn --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase">Giá trị</label><input type="number" className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.total_value} onChange={e => setFormData({...formData, total_value: Number(e.target.value)})}/><div className="text-[10px] text-red-600 font-bold mt-1 text-right">{formatMoney(formData.total_value)}</div></div><div><label className="text-xs font-bold text-gray-500 uppercase">Trạng thái</label><select disabled={userRole !== 'ADMIN'} className="w-full border border-gray-300 p-2 rounded mt-1 text-sm disabled:bg-gray-100 focus:border-red-500 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="DRAFT">Nháp</option><option value="ACTIVE">Hiệu lực</option><option value="EXPIRED">Hết hạn</option><option value="CANCELLED">Hủy</option></select></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-gray-500 uppercase">Bắt đầu</label><input type="date" className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})}/></div><div><label className="text-xs font-bold text-gray-500 uppercase">Kết thúc</label><input type="date" className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})}/></div></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">License Key (Admin)</label><input disabled={userRole !== 'ADMIN'} className="w-full border border-gray-300 p-2 rounded mt-1 text-sm font-mono disabled:bg-gray-100 focus:border-red-500 outline-none" value={formData.license_key} onChange={e => setFormData({...formData, license_key: e.target.value})}/></div>
                <div className="flex gap-2"><input type="checkbox" checked={formData.is_auto_renew} onChange={e => setFormData({...formData, is_auto_renew: e.target.checked})}/><label className="text-sm">Auto Renew</label></div>
                <button type="submit" disabled={submitting} className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700 font-medium flex justify-center items-center gap-2">{submitting && <Loader2 className="animate-spin h-4 w-4"/>} Lưu Hợp đồng</button>
              </form>
            </div>
          </div>
        )}
    </div>
  )
}