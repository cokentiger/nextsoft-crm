'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Search, Phone, Mail, User, X, Loader2, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'ADMIN' | 'SALE'>('SALE')
  
  // Filter & Pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '', tax_code: '', contact_person: '', email: '', phone: '',
    health_score: 100, lifecycle_stage: 'LEAD'
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (data) setUserRole(data.role)
      }
      fetchCustomers()
    }
    init()
  }, [])

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    setCustomers(data || [])
    setLoading(false)
  }

  // Logic Search & Pagination
  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  )
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Handlers
  const handleEdit = (c: any) => {
    setEditingId(c.id)
    // SỬA LỖI: Thêm || '' để tránh lỗi null value trong input
    setFormData({
      name: c.name,
      tax_code: c.tax_code || '',
      contact_person: c.contact_person || '',
      email: c.email || '',
      phone: c.phone || '',
      health_score: c.health_score || 100,
      lifecycle_stage: c.lifecycle_stage || 'LEAD'
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({ name: '', tax_code: '', contact_person: '', email: '', phone: '', health_score: 100, lifecycle_stage: 'LEAD' })
    setEditingId(null)
    setShowModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    const payload = {
      name: formData.name, tax_code: formData.tax_code, contact_person: formData.contact_person,
      email: formData.email, phone: formData.phone, health_score: formData.health_score, lifecycle_stage: formData.lifecycle_stage
    }

    if (editingId) await supabase.from('customers').update(payload).eq('id', editingId)
    else await supabase.from('customers').insert([payload])

    setSubmitting(false); resetForm(); fetchCustomers(); router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (userRole !== 'ADMIN') return alert('Bạn không có quyền xóa!')
    if (!confirm('Xóa khách hàng này?')) return
    await supabase.from('customers').delete().eq('id', id)
    fetchCustomers()
  }

  return (
    <div className="p-8 flex flex-col h-full overflow-hidden">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Khách hàng</h1>
          <p className="text-sm text-gray-500">Quản lý đối tác ({customers.length})</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 shadow-md shadow-red-100 transition-all">
          <Plus className="h-4 w-4" /> Thêm mới
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="mb-6 flex gap-4 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          {/* INPUT CHUẨN: Có border rõ ràng */}
          <input 
            type="text" placeholder="Tìm kiếm tên, email, SĐT..." 
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} 
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm mb-4">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4">Liên hệ</th>
              <th className="px-6 py-4">Giai đoạn</th>
              <th className="px-6 py-4 text-center">Điểm</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan={5} className="py-8 text-center">Đang tải...</td></tr> : paginated.map((c) => (
              <tr key={c.id} className="hover:bg-yellow-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{c.name}</div>
                  {c.tax_code && <div className="text-xs text-gray-400 font-mono mt-0.5">MST: {c.tax_code}</div>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-medium text-gray-700"><User className="h-3 w-3"/> {c.contact_person || '--'}</div>
                    {c.email && <div className="flex items-center gap-2 text-xs"><Mail className="h-3 w-3"/> {c.email}</div>}
                    {c.phone && <div className="flex items-center gap-2 text-xs"><Phone className="h-3 w-3"/> {c.phone}</div>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    c.lifecycle_stage === 'PAID' ? 'bg-green-100 text-green-700' : 
                    c.lifecycle_stage === 'TRIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {c.lifecycle_stage}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-lg font-extrabold ${c.health_score >= 80 ? 'text-green-600' : c.health_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {c.health_score}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(c)} className="rounded p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition"><Pencil className="h-4 w-4" /></button>
                    {userRole === 'ADMIN' && <button onClick={() => handleDelete(c.id)} className="rounded p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 flex-shrink-0">
           <p className="text-sm text-gray-700">Trang {currentPage} / {totalPages}</p>
           <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-4 w-4"/></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-4 w-4"/></button>
           </div>
        </div>
      )}

      {/* MODAL FORM - Đã sửa lỗi mất border */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Cập nhật thông tin' : 'Thêm khách hàng mới'}</h2>
              <button onClick={resetForm}><X className="h-5 w-5 text-gray-400 hover:text-red-500" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên Doanh nghiệp *</label>
                <input required type="text" className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã số thuế</label>
                  <input type="text" className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" 
                    value={formData.tax_code} onChange={e => setFormData({...formData, tax_code: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Người liên hệ</label>
                  <input type="text" className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" 
                    value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input type="email" className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Điện thoại</label>
                  <input type="text" className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              {/* Advanced Options (Only for Edit or create with details) */}
              <div className="bg-gray-50 p-3 rounded border border-gray-200 grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Giai đoạn</label>
                    <select className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-red-500 focus:outline-none bg-white"
                      value={formData.lifecycle_stage} onChange={e => setFormData({...formData, lifecycle_stage: e.target.value})}>
                      <option value="LEAD">Tiềm năng (Lead)</option>
                      <option value="TRIAL">Dùng thử (Trial)</option>
                      <option value="PAID">Đã mua (Paid)</option>
                      <option value="CHURNED">Rời bỏ (Churned)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Điểm sức khỏe</label>
                    <input type="number" className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-red-500 focus:outline-none" 
                      value={formData.health_score} onChange={e => setFormData({...formData, health_score: Number(e.target.value)})} />
                 </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetForm} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy bỏ</button>
                <button type="submit" disabled={submitting} className="rounded bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 shadow-md shadow-red-100 flex items-center gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin"/>} Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}