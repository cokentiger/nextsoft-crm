'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Search, Phone, Mail, User, X, Loader2, Pencil, Trash2, ChevronLeft, ChevronRight, MapPin, Building2, Check, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

// --- COMPONENT SEARCHABLE SELECT (Tái sử dụng từ trang Deals) ---
// Giúp tìm kiếm trong danh sách dropdown
const SearchableSelect = ({ options, value, onChange, placeholder, labelKey = 'name' }: any) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter((opt: any) => 
    opt[labelKey].toLowerCase().includes(search.toLowerCase())
  )
  const selectedOption = options.find((opt: any) => opt.id === value)

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 px-3 py-2.5 rounded-lg bg-white flex justify-between items-center cursor-pointer hover:border-red-500 transition h-11"
      >
        <span className={`text-sm truncate ${selectedOption ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption[labelKey] : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute z-[9999] mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-hidden flex flex-col w-full animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input 
                autoFocus type="text" 
                className="w-full pl-8 pr-2 py-2 text-sm border border-gray-200 rounded outline-none focus:border-red-500"
                placeholder="Gõ để tìm..."
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt: any) => (
                <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); setSearch('') }}
                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-red-50 border-b border-gray-50 last:border-0 flex justify-between items-center ${opt.id === value ? 'bg-red-50 text-red-700 font-bold' : 'text-gray-700'}`}
                >
                  <span className="truncate mr-2">{opt[labelKey]}</span>
                  {opt.id === value && <Check className="h-4 w-4 flex-shrink-0"/>}
                </div>
              ))
            ) : <div className="p-4 text-sm text-gray-400 text-center">Không tìm thấy kết quả.</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// DANH SÁCH TỈNH THÀNH (Đã chuyển về dạng Object cho SearchableSelect)
const PROVINCES_LIST = [
  'An Giang', 'Bắc Ninh', 'Bình Dương', 'Cà Mau', 'Cao Bằng', 
  'Đắk Lắk', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 
  'Hà Tĩnh', 'Hưng Yên', 'Khánh Hoà', 'Lai Châu', 'Lạng Sơn', 
  'Lào Cai', 'Lâm Đồng', 'Nghệ An', 'Ninh Bình', 'Phú Thọ', 
  'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sơn La', 'Tây Ninh', 
  'Thái Nguyên', 'Thanh Hoá', 'Tuyên Quang', 'Vĩnh Long',
  'TP. Cần Thơ', 'TP. Đà Nẵng', 'TP. Hải Phòng', 'TP. Hà Nội', 
  'TP. Hồ Chí Minh', 'TP. Huế'
].map(p => ({ id: p, name: p })) // Map thành { id: '...', name: '...' }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'ADMIN' | 'SALE'>('SALE')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const router = useRouter()
  const supabase = createClient()

  // Form Data
  const [formData, setFormData] = useState({
    name: '', tax_code: '', contact_person: '', email: '', phone: '',
    address: '', province: 'TP. Hồ Chí Minh', health_score: 100, lifecycle_stage: 'LEAD'
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

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.province && c.province.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEdit = (c: any) => {
    setEditingId(c.id)
    setFormData({
      name: c.name, tax_code: c.tax_code || '', contact_person: c.contact_person || '',
      email: c.email || '', phone: c.phone || '', address: c.address || '', 
      province: c.province || 'TP. Hồ Chí Minh', health_score: c.health_score || 100,
      lifecycle_stage: c.lifecycle_stage || 'LEAD'
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({ 
      name: '', tax_code: '', contact_person: '', email: '', phone: '', 
      address: '', province: 'TP. Hồ Chí Minh', health_score: 100, lifecycle_stage: 'LEAD' 
    })
    setEditingId(null)
    setShowModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    const payload = { ...formData }

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
          <p className="text-sm text-gray-500">Quản lý đối tác và thông tin liên hệ ({customers.length})</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-md shadow-red-100 transition-all">
          <Plus className="h-4 w-4" /> Thêm khách hàng
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="mb-6 flex gap-4 flex-shrink-0">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input 
            type="text" placeholder="Tìm tên cty, tỉnh thành, email, sđt..." 
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} 
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm mb-4">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-sm font-bold uppercase text-gray-700 sticky top-0 z-10 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Doanh nghiệp</th>
              <th className="px-6 py-4">Liên hệ</th>
              <th className="px-6 py-4">Khu vực</th>
              <th className="px-6 py-4">Giai đoạn</th>
              <th className="px-6 py-4 text-center">Sức khỏe</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan={6} className="py-12 text-center text-gray-400">Đang tải dữ liệu...</td></tr> : 
             paginated.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-gray-400">Không tìm thấy dữ liệu.</td></tr> :
             paginated.map((c) => (
              <tr key={c.id} className="hover:bg-yellow-50/40 transition-colors group">
                <td className="px-6 py-4 align-top">
                  <div className="font-bold text-gray-900 text-base mb-1">{c.name}</div>
                  {c.tax_code && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 w-fit px-2 py-1 rounded">
                      <Building2 className="h-3 w-3"/> MST: {c.tax_code}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 align-top space-y-1.5">
                  <div className="flex items-center gap-2 font-medium text-gray-700">
                    <User className="h-3.5 w-3.5 text-gray-400"/> {c.contact_person || '---'}
                  </div>
                  {c.email && <div className="flex items-center gap-2 text-xs hover:text-red-600 cursor-pointer"><Mail className="h-3.5 w-3.5"/> {c.email}</div>}
                  {c.phone && <div className="flex items-center gap-2 text-xs"><Phone className="h-3.5 w-3.5"/> {c.phone}</div>}
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{c.province || 'Chưa cập nhật'}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2 w-48" title={c.address}>{c.address || '-'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-middle">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${
                    c.lifecycle_stage === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 
                    c.lifecycle_stage === 'TRIAL' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                    c.lifecycle_stage === 'CHURNED' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {c.lifecycle_stage}
                  </span>
                </td>
                <td className="px-6 py-4 text-center align-middle">
                  <div className="flex flex-col items-center">
                    <span className={`text-lg font-extrabold ${c.health_score >= 80 ? 'text-green-600' : c.health_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{c.health_score}</span>
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full ${c.health_score >= 80 ? 'bg-green-500' : c.health_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${c.health_score}%` }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right align-middle">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(c)} className="rounded p-2 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition" title="Sửa"><Pencil className="h-4 w-4" /></button>
                    {userRole === 'ADMIN' && <button onClick={() => handleDelete(c.id)} className="rounded p-2 bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50 transition" title="Xóa"><Trash2 className="h-4 w-4" /></button>}
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
           <p className="text-sm text-gray-700">Trang <b>{currentPage}</b> / {totalPages} ({filtered.length} kết quả)</p>
           <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"><ChevronLeft className="h-4 w-4"/></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"><ChevronRight className="h-4 w-4"/></button>
           </div>
        </div>
      )}

      {/* --- MODAL FORM (ĐÃ LÀM TO HƠN: max-w-4xl) --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in zoom-in duration-200 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Cập nhật thông tin' : 'Thêm khách hàng mới'}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-red-600 transition"><X className="h-6 w-6" /></button>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 overflow-y-auto bg-white">
              <form id="customerForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* CỘT TRÁI: THÔNG TIN CHUNG */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-red-600 uppercase border-b border-red-100 pb-2">1. Thông tin chung</h3>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tên Doanh nghiệp <span className="text-red-500">*</span></label>
                    <input required type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none h-11" 
                      placeholder="VD: Công ty TNHH Nextsoft..."
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mã số thuế</label>
                      <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-red-500 outline-none h-11" 
                        placeholder="VD: 031..."
                        value={formData.tax_code} onChange={e => setFormData({...formData, tax_code: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Người đại diện</label>
                      <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-red-500 outline-none h-11" 
                        placeholder="VD: Nguyễn Văn A"
                        value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                    </div>
                  </div>
                  
                  {/* Phân loại khách hàng */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mt-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Phân loại & Đánh giá</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Giai đoạn</label>
                          <select className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 outline-none bg-white font-medium text-gray-700 h-11"
                            value={formData.lifecycle_stage} onChange={e => setFormData({...formData, lifecycle_stage: e.target.value})}>
                            <option value="LEAD">🔵 Tiềm năng (Lead)</option>
                            <option value="TRIAL">🟡 Dùng thử (Trial)</option>
                            <option value="PAID">🟢 Đã mua (Paid)</option>
                            <option value="CHURNED">⚪ Rời bỏ (Churned)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Điểm sức khỏe (0-100)</label>
                          <input type="number" min="0" max="100" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 outline-none h-11" 
                            value={formData.health_score} onChange={e => setFormData({...formData, health_score: Number(e.target.value)})} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI: LIÊN HỆ & ĐỊA CHỈ */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-red-600 uppercase border-b border-red-100 pb-2">2. Địa điểm & Liên hệ</h3>
                  
                  {/* Tỉnh thành (Searchable Select) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tỉnh / Thành phố <span className="text-red-500">*</span></label>
                      <SearchableSelect 
                        options={PROVINCES_LIST}
                        value={formData.province}
                        onChange={(val: string) => setFormData({...formData, province: val})}
                        placeholder="Chọn tỉnh thành"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Số điện thoại</label>
                      <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-red-500 outline-none h-11" 
                        placeholder="VD: 0909..."
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Địa chỉ chi tiết</label>
                    <textarea rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 outline-none" 
                      placeholder="VD: Số 123, Đường Nguyễn Huệ, Phường Bến Nghé..."
                      value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email liên hệ</label>
                    <input type="email" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-red-500 outline-none h-11" 
                      placeholder="contact@company.com"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Hủy bỏ</button>
              <button type="submit" form="customerForm" disabled={submitting} className="rounded-lg bg-red-600 px-8 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-lg shadow-red-200 flex items-center gap-2 transition-all active:scale-95">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Lưu thông tin'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}