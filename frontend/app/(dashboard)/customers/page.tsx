'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Search, Phone, Mail, User, X, Loader2, Pencil, Trash2, ChevronLeft, ChevronRight, MapPin, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

// DANH SÁCH 34 TỈNH THÀNH HOẠT ĐỘNG (Cập nhật 2025)
// Sắp xếp ABC để dễ tìm kiếm
const PROVINCES = [
  'An Giang', 'Bắc Ninh', 'Bình Dương', 'Cà Mau', 'Cao Bằng', 
  'Đắk Lắk', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 
  'Hà Tĩnh', 'Hưng Yên', 'Khánh Hoà', 'Lai Châu', 'Lạng Sơn', 
  'Lào Cai', 'Lâm Đồng', 'Nghệ An', 'Ninh Bình', 'Phú Thọ', 
  'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sơn La', 'Tây Ninh', 
  'Thái Nguyên', 'Thanh Hoá', 'Tuyên Quang', 'Vĩnh Long',
  'TP. Cần Thơ', 'TP. Đà Nẵng', 'TP. Hải Phòng', 'TP. Hà Nội', 
  'TP. Hồ Chí Minh', 'TP. Huế'
]

export default function CustomersPage() {
  // 1. STATE QUẢN LÝ DỮ LIỆU
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'ADMIN' | 'SALE'>('SALE')
  
  // 2. STATE PHÂN TRANG & TÌM KIẾM
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const router = useRouter()
  const supabase = createClient()

  // 3. STATE FORM (Đã thêm address & province)
  const [formData, setFormData] = useState({
    name: '', 
    tax_code: '', 
    contact_person: '', 
    email: '', 
    phone: '',
    address: '',
    province: 'TP. Hồ Chí Minh', // Mặc định
    health_score: 100, 
    lifecycle_stage: 'LEAD'
  })

  // KHỞI TẠO DỮ LIỆU
  useEffect(() => {
    const init = async () => {
      // Lấy quyền user hiện tại
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

  // LOGIC TÌM KIẾM & PHÂN TRANG
  // Cập nhật: Tìm cả trong Tỉnh thành và Địa chỉ
  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.province && c.province.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // XỬ LÝ SỰ KIỆN FORM
  const handleEdit = (c: any) => {
    setEditingId(c.id)
    setFormData({
      name: c.name,
      tax_code: c.tax_code || '',
      contact_person: c.contact_person || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '', 
      province: c.province || 'TP. Hồ Chí Minh',
      health_score: c.health_score || 100,
      lifecycle_stage: c.lifecycle_stage || 'LEAD'
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({ 
      name: '', tax_code: '', contact_person: '', email: '', phone: '', 
      address: '', province: 'TP. Hồ Chí Minh',
      health_score: 100, lifecycle_stage: 'LEAD' 
    })
    setEditingId(null)
    setShowModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setSubmitting(true)
    
    // Chuẩn bị dữ liệu gửi lên
    const payload = {
      name: formData.name, 
      tax_code: formData.tax_code, 
      contact_person: formData.contact_person,
      email: formData.email, 
      phone: formData.phone, 
      address: formData.address,      // Mới
      province: formData.province,    // Mới
      health_score: formData.health_score, 
      lifecycle_stage: formData.lifecycle_stage
    }

    if (editingId) {
      await supabase.from('customers').update(payload).eq('id', editingId)
    } else {
      await supabase.from('customers').insert([payload])
    }

    setSubmitting(false); 
    resetForm(); 
    fetchCustomers(); 
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (userRole !== 'ADMIN') return alert('Bạn không có quyền xóa!')
    if (!confirm('Xóa khách hàng này?')) return
    await supabase.from('customers').delete().eq('id', id)
    fetchCustomers()
  }

  return (
    <div className="p-8 flex flex-col h-full overflow-hidden">
      {/* --- HEADER --- */}
      <div className="mb-6 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Khách hàng</h1>
          <p className="text-sm text-gray-500">Quản lý đối tác và thông tin địa điểm ({customers.length})</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-md shadow-red-100 transition-all">
          <Plus className="h-4 w-4" /> Thêm khách hàng
        </button>
      </div>

      {/* --- TOOLBAR TÌM KIẾM --- */}
      <div className="mb-6 flex gap-4 flex-shrink-0">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input 
            type="text" placeholder="Tìm tên cty, tỉnh thành, email, sđt..." 
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} 
          />
        </div>
      </div>

      {/* --- TABLE DỮ LIỆU --- */}
      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm mb-4">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4">Doanh nghiệp</th>
              <th className="px-6 py-4">Liên hệ</th>
              <th className="px-6 py-4">Khu vực (Mới)</th>
              <th className="px-6 py-4">Giai đoạn</th>
              <th className="px-6 py-4 text-center">Sức khỏe</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan={6} className="py-12 text-center text-gray-400">Đang tải dữ liệu...</td></tr> : 
             paginated.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-gray-400">Không tìm thấy dữ liệu phù hợp.</td></tr> :
             paginated.map((c) => (
              <tr key={c.id} className="hover:bg-yellow-50/40 transition-colors group">
                
                {/* 1. Tên & MST */}
                <td className="px-6 py-4 align-top">
                  <div className="font-bold text-gray-900 text-base">{c.name}</div>
                  {c.tax_code && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 bg-gray-100 w-fit px-1.5 py-0.5 rounded">
                      <Building2 className="h-3 w-3"/> MST: {c.tax_code}
                    </div>
                  )}
                </td>

                {/* 2. Liên hệ */}
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 font-medium text-gray-700">
                      <User className="h-3.5 w-3.5 text-gray-400"/> {c.contact_person || '---'}
                    </div>
                    {c.email && <div className="flex items-center gap-2 text-xs hover:text-red-600 transition cursor-pointer"><Mail className="h-3.5 w-3.5"/> {c.email}</div>}
                    {c.phone && <div className="flex items-center gap-2 text-xs"><Phone className="h-3.5 w-3.5"/> {c.phone}</div>}
                  </div>
                </td>

                {/* 3. Khu vực (MỚI) */}
                <td className="px-6 py-4 align-top">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-gray-800 text-xs">{c.province || 'Chưa cập nhật'}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2 w-40" title={c.address}>
                        {c.address || '-'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* 4. Giai đoạn */}
                <td className="px-6 py-4 align-middle">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border ${
                    c.lifecycle_stage === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 
                    c.lifecycle_stage === 'TRIAL' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                    c.lifecycle_stage === 'CHURNED' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {c.lifecycle_stage}
                  </span>
                </td>

                {/* 5. Điểm sức khỏe */}
                <td className="px-6 py-4 text-center align-middle">
                  <div className="flex flex-col items-center">
                    <span className={`text-lg font-extrabold ${c.health_score >= 80 ? 'text-green-600' : c.health_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {c.health_score}
                    </span>
                    <div className="w-12 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full ${c.health_score >= 80 ? 'bg-green-500' : c.health_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${c.health_score}%` }}></div>
                    </div>
                  </div>
                </td>

                {/* 6. Hành động */}
                <td className="px-6 py-4 text-right align-middle">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(c)} className="rounded p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Sửa"><Pencil className="h-4 w-4" /></button>
                    {userRole === 'ADMIN' && <button onClick={() => handleDelete(c.id)} className="rounded p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Xóa"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- PHÂN TRANG --- */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 flex-shrink-0">
           <p className="text-sm text-gray-700">Hiển thị trang <b>{currentPage}</b> / {totalPages} ({filtered.length} kết quả)</p>
           <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"><ChevronLeft className="h-4 w-4"/></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"><ChevronRight className="h-4 w-4"/></button>
           </div>
        </div>
      )}

      {/* --- MODAL FORM --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in zoom-in duration-200 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Cập nhật thông tin' : 'Thêm khách hàng mới'}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-red-600 transition"><X className="h-6 w-6" /></button>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto">
              <form id="customerForm" onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. Thông tin định danh */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-red-600 uppercase border-b border-red-100 pb-1">1. Thông tin chung</h3>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên Doanh nghiệp <span className="text-red-500">*</span></label>
                    <input required type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" 
                      placeholder="VD: Công ty TNHH Nextsoft..."
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã số thuế</label>
                      <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 outline-none" 
                        placeholder="VD: 031..."
                        value={formData.tax_code} onChange={e => setFormData({...formData, tax_code: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Người đại diện</label>
                      <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 outline-none" 
                        placeholder="VD: Nguyễn Văn A"
                        value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* 2. Địa chỉ & Liên hệ (MỚI) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-red-600 uppercase border-b border-red-100 pb-1 mt-2">2. Địa điểm & Liên hệ</h3>
                  
                  {/* Tỉnh thành & Địa chỉ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tỉnh / Thành phố <span className="text-red-500">*</span></label>
                      <select 
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 outline-none bg-white"
                        value={formData.province} 
                        onChange={e => setFormData({...formData, province: e.target.value})}
                      >
                         {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số điện thoại</label>
                      <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 outline-none" 
                        placeholder="VD: 0909..."
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Địa chỉ chi tiết</label>
                    <textarea rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 outline-none" 
                      placeholder="VD: Số 123, Đường Nguyễn Huệ, Phường Bến Nghé..."
                      value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                    <input type="email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 outline-none" 
                      placeholder="contact@company.com"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>

                {/* 3. Phân loại */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-red-600 uppercase border-b border-red-100 pb-1 mt-2">3. Phân loại khách hàng</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Giai đoạn</label>
                        <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 outline-none bg-white font-medium text-gray-700"
                          value={formData.lifecycle_stage} onChange={e => setFormData({...formData, lifecycle_stage: e.target.value})}>
                          <option value="LEAD">🔵 Tiềm năng (Lead)</option>
                          <option value="TRIAL">🟡 Dùng thử (Trial)</option>
                          <option value="PAID">🟢 Đã mua (Paid)</option>
                          <option value="CHURNED">⚪ Rời bỏ (Churned)</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Điểm sức khỏe (0-100)</label>
                        <input type="number" min="0" max="100" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 outline-none" 
                          value={formData.health_score} onChange={e => setFormData({...formData, health_score: Number(e.target.value)})} />
                     </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Hủy bỏ</button>
              <button type="submit" form="customerForm" disabled={submitting} className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-lg shadow-red-200 flex items-center gap-2 transition-all">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Lưu thông tin'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}