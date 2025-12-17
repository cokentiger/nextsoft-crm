'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, FileText, Search, Printer, Key, Calendar, X, ShieldCheck, Loader2 } from 'lucide-react'

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([])
  const [wonDeals, setWonDeals] = useState<any[]>([]) // Chỉ chứa Deal đã WON
  const [loading, setLoading] = useState(true)
  
  const [showModal, setShowModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false) // Modal xem trước khi in
  const [submitting, setSubmitting] = useState(false)
  
  // State tìm kiếm & Lọc
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  // State Form
  const [formData, setFormData] = useState({
    contract_code: '',
    deal_id: '',
    customer_id: '',
    status: 'DRAFT',
    start_date: '',
    end_date: '',
    license_key: '',
    total_value: 0,
    is_auto_renew: false
  })

  // State lưu hợp đồng đang chọn để IN
  const [selectedContract, setSelectedContract] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    // 1. Load Hợp đồng (Kèm thông tin Khách và Deal)
    const { data: cData } = await supabase.from('contracts')
      .select('*, customers(name, address, tax_code, contact_person), deals(title)')
      .order('created_at', { ascending: false })
    
    // 2. Load Deal đã Thắng (để tạo HĐ mới)
    const { data: dData } = await supabase.from('deals')
      .select('*, customers(id, name)')
      .eq('stage', 'WON')
      .order('created_at', { ascending: false })

    setContracts(cData || [])
    setWonDeals(dData || [])
    setLoading(false)
  }

  // --- LOGIC FORM ---
  
  // Khi chọn Deal -> Tự động điền thông tin Khách & Tiền
  const handleDealChange = (dealId: string) => {
    const deal = wonDeals.find(d => d.id === dealId)
    if (!deal) return

    // Tự sinh mã HĐ: HD-{Năm}-{Random 3 số}
    const autoCode = `HD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
    
    // Tự tính ngày: Bắt đầu hôm nay, Kết thúc sau 1 năm
    const today = new Date().toISOString().split('T')[0]
    const nextYear = new Date()
    nextYear.setFullYear(nextYear.getFullYear() + 1)
    const endDate = nextYear.toISOString().split('T')[0]

    setFormData({
      ...formData,
      deal_id: deal.id,
      customer_id: deal.customer_id, // Tự lấy ID khách từ Deal
      total_value: deal.value,       // Tự lấy Tiền từ Deal
      contract_code: autoCode,
      start_date: today,
      end_date: endDate,
      status: 'DRAFT'
    })
  }

  // Sinh License Key ngẫu nhiên
  const generateLicenseKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let key = ''
    // Format: XXXX-XXXX-XXXX-XXXX
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      if (i < 3) key += '-'
    }
    setFormData({ ...formData, license_key: key })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from('contracts').insert([formData])
    if (!error) {
      setShowModal(false)
      loadData()
      // Reset form
      setFormData({ contract_code: '', deal_id: '', customer_id: '', status: 'DRAFT', start_date: '', end_date: '', license_key: '', total_value: 0, is_auto_renew: false })
    } else {
      alert(error.message)
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa hợp đồng này?')) return
    await supabase.from('contracts').delete().eq('id', id)
    loadData()
  }

  // Mở modal in ấn
  const handlePrint = (contract: any) => {
    setSelectedContract(contract)
    setShowPrintModal(true)
  }

  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  // Filter logic
  const filteredContracts = contracts.filter(c => 
    (filterStatus === 'ALL' || c.status === filterStatus) &&
    (c.contract_code.toLowerCase().includes(searchTerm.toLowerCase()) || c.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-8 h-full flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Hợp đồng</h1>
          <p className="text-gray-500">Quản lý hồ sơ pháp lý và cấp License Key.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 shadow-md shadow-red-100 transition">
          <Plus className="h-5 w-5" /> Tạo Hợp đồng mới
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="flex gap-4 mb-6">
         <div className="relative flex-1 max-w-lg">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
           <input type="text" placeholder="Tìm số hợp đồng, tên khách..." 
             className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500"
             value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
         <select className="border border-gray-300 rounded-lg px-3 py-2 outline-none bg-white text-sm font-medium text-gray-700"
           value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
           <option value="ALL">Tất cả trạng thái</option>
           <option value="DRAFT">📝 Nháp (Draft)</option>
           <option value="ACTIVE">✅ Hiệu lực (Active)</option>
           <option value="EXPIRED">⚠️ Hết hạn (Expired)</option>
         </select>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs sticky top-0">
            <tr>
              <th className="px-6 py-4">Số Hợp đồng</th>
              <th className="px-6 py-4">Khách hàng / Deal</th>
              <th className="px-6 py-4">Thời hạn</th>
              <th className="px-6 py-4">Giá trị</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredContracts.map((c) => (
              <tr key={c.id} className="hover:bg-yellow-50/30 transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400"/> {c.contract_code}
                  </div>
                  {c.license_key && <div className="text-xs font-mono text-gray-500 mt-1 bg-gray-100 px-1 rounded w-fit">{c.license_key}</div>}
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{c.customers?.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Deal: {c.deals?.title}</div>
                </td>
                <td className="px-6 py-4 text-gray-600 text-xs">
                  <div>BĐ: {c.start_date ? new Date(c.start_date).toLocaleDateString('vi-VN') : '--'}</div>
                  <div>KT: {c.end_date ? new Date(c.end_date).toLocaleDateString('vi-VN') : '--'}</div>
                </td>
                <td className="px-6 py-4 font-bold text-red-600">{formatMoney(c.total_value)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                    c.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                    c.status === 'EXPIRED' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {c.status === 'ACTIVE' ? 'Hiệu lực' : c.status === 'EXPIRED' ? 'Hết hạn' : 'Nháp'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handlePrint(c)} className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded transition" title="Xem & In">
                    <Printer className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredContracts.length === 0 && !loading && <tr><td colSpan={6} className="text-center py-10 text-gray-400">Chưa có hợp đồng nào.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* MODAL TẠO MỚI */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center rounded-t-xl">
              <h2 className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-red-600"/> Tạo Hợp đồng & Cấp Key</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400 hover:text-red-600"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              {/* Chọn Deal */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Chọn Deal đã chốt (WON) <span className="text-red-500">*</span></label>
                <select required className="w-full border border-gray-300 p-2.5 rounded text-sm focus:border-red-500 outline-none bg-white font-medium"
                  onChange={(e) => handleDealChange(e.target.value)} value={formData.deal_id}>
                  <option value="">-- Chọn Deal --</option>
                  {wonDeals.map(d => <option key={d.id} value={d.id}>{d.title} - {d.customers?.name} ({formatMoney(d.value)})</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1 italic">Chỉ hiển thị các Deal đã thắng.</p>
              </div>

              {/* Thông tin tự động */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Số Hợp đồng</label>
                    <input required type="text" className="w-full border border-gray-300 p-2.5 rounded text-sm bg-gray-50 font-bold text-gray-700"
                       value={formData.contract_code} onChange={e => setFormData({...formData, contract_code: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Giá trị (VNĐ)</label>
                    <input type="number" className="w-full border border-gray-300 p-2.5 rounded text-sm bg-gray-50 font-bold text-red-600"
                       value={formData.total_value} readOnly />
                 </div>
              </div>

              {/* Thời hạn */}
              <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                 <div>
                    <label className="text-xs font-bold text-blue-700 uppercase mb-1 block">Ngày hiệu lực</label>
                    <input type="date" required className="w-full border border-blue-200 p-2 rounded text-sm focus:border-blue-500 outline-none"
                       value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-blue-700 uppercase mb-1 block">Ngày hết hạn</label>
                    <input type="date" required className="w-full border border-blue-200 p-2 rounded text-sm focus:border-blue-500 outline-none"
                       value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                 </div>
              </div>

              {/* License Key */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">License Key (Mã kích hoạt)</label>
                <div className="flex gap-2">
                  <input type="text" className="flex-1 border border-gray-300 p-2.5 rounded text-sm font-mono tracking-widest text-center uppercase"
                     placeholder="XXXX-XXXX-XXXX-XXXX" value={formData.license_key} onChange={e => setFormData({...formData, license_key: e.target.value})} />
                  <button type="button" onClick={generateLicenseKey} className="bg-gray-800 text-white px-3 rounded text-xs font-bold hover:bg-black flex items-center gap-1">
                    <Key className="h-3 w-3" /> Sinh mã
                  </button>
                </div>
              </div>

              {/* Trạng thái */}
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Trạng thái HĐ</label>
                 <select className="w-full border border-gray-300 p-2.5 rounded text-sm focus:border-red-500 outline-none bg-white"
                   value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                   <option value="DRAFT">Bản nháp (Đang soạn)</option>
                   <option value="ACTIVE">Đã ký & Hiệu lực</option>
                   <option value="EXPIRED">Đã hết hạn / Hủy</option>
                 </select>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                 <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm font-bold text-gray-600 hover:bg-gray-50">Hủy</button>
                 <button type="submit" disabled={submitting} className="px-6 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 shadow-lg flex items-center gap-2">
                    {submitting && <Loader2 className="animate-spin h-4 w-4"/>} Lưu Hợp đồng
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM TRƯỚC HỢP ĐỒNG (PRINT PREVIEW) */}
      {showPrintModal && selectedContract && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
           <div className="bg-gray-200 w-full max-w-3xl h-[90vh] rounded-lg flex flex-col overflow-hidden">
              <div className="bg-gray-800 text-white p-3 flex justify-between items-center shadow-md">
                 <h3 className="font-bold text-sm flex items-center gap-2"><FileText className="h-4 w-4"/> Xem trước bản in</h3>
                 <div className="flex gap-2">
                    <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><Printer className="h-3 w-3"/> In ngay</button>
                    <button onClick={() => setShowPrintModal(false)} className="bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded text-xs"><X className="h-4 w-4"/></button>
                 </div>
              </div>
              
              {/* KHUNG GIẤY A4 GIẢ LẬP */}
              <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-200 print:p-0 print:overflow-visible">
                 <div className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-xl text-black text-sm leading-relaxed print:shadow-none print:w-full print:h-auto">
                    
                    {/* Header Hợp Đồng */}
                    <div className="text-center mb-8">
                       <h1 className="text-xl font-bold uppercase mb-1">Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam</h1>
                       <p className="text-xs font-bold underline mb-6">Độc lập - Tự do - Hạnh phúc</p>
                       <h2 className="text-2xl font-bold uppercase mt-8">HỢP ĐỒNG CUNG CẤP DỊCH VỤ PHẦN MỀM</h2>
                       <p className="italic mt-2">Số: {selectedContract.contract_code}</p>
                    </div>

                    <div className="space-y-4 text-justify">
                       <p>Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth()+1} năm {new Date().getFullYear()}, tại văn phòng công ty Nextsoft, chúng tôi gồm:</p>
                       
                       {/* BÊN A */}
                       <div className="mb-4">
                          <h3 className="font-bold uppercase mb-2">BÊN A (Bên Mua): {selectedContract.customers?.name}</h3>
                          <p>Đại diện: {selectedContract.customers?.contact_person || '....................'}</p>
                          <p>Mã số thuế: {selectedContract.customers?.tax_code || '....................'}</p>
                          <p>Địa chỉ: {selectedContract.customers?.address || '....................'}</p>
                       </div>

                       {/* BÊN B */}
                       <div className="mb-4">
                          <h3 className="font-bold uppercase mb-2">BÊN B (Bên Bán): CÔNG TY CÔNG NGHỆ NEXTSOFT</h3>
                          <p>Đại diện: Ông Hồ Đăng Phương - Chức vụ: Giám đốc</p>
                          <p>Mã số thuế: 0101234567</p>
                          <p>Địa chỉ: Tòa nhà Tech, TP. Hồ Chí Minh</p>
                       </div>

                       <p>Hai bên thống nhất ký kết hợp đồng với các điều khoản sau:</p>

                       <h4 className="font-bold mt-4">Điều 1: Nội dung thực hiện</h4>
                       <p>Bên B đồng ý cung cấp cho Bên A bản quyền sử dụng phần mềm/dịch vụ theo thỏa thuận tại đơn hàng (Deal) số <b>{selectedContract.deals?.title}</b>.</p>
                       
                       <h4 className="font-bold mt-4">Điều 2: Thời hạn & Giá trị</h4>
                       <ul className="list-disc pl-5 space-y-1">
                          <li>Ngày hiệu lực: <b>{new Date(selectedContract.start_date).toLocaleDateString('vi-VN')}</b></li>
                          <li>Ngày hết hạn: <b>{new Date(selectedContract.end_date).toLocaleDateString('vi-VN')}</b></li>
                          <li>Tổng giá trị hợp đồng: <b className="text-lg">{formatMoney(selectedContract.total_value)}</b> (Chưa bao gồm VAT)</li>
                       </ul>

                       <h4 className="font-bold mt-4">Điều 3: Bản quyền (License)</h4>
                       <p>Bên A được cấp mã kích hoạt bản quyền (License Key) để sử dụng hệ thống:</p>
                       <div className="border-2 border-dashed border-gray-300 bg-gray-50 p-3 text-center font-mono font-bold text-lg mt-2 tracking-widest">
                          {selectedContract.license_key || 'CHƯA CẤP KEY'}
                       </div>

                       <div className="grid grid-cols-2 mt-12 gap-10 text-center">
                          <div>
                             <p className="font-bold uppercase mb-16">Đại diện Bên A</p>
                             <p className="italic">(Ký, ghi rõ họ tên)</p>
                          </div>
                          <div>
                             <p className="font-bold uppercase mb-16">Đại diện Bên B</p>
                             <p className="font-bold">Hồ Đăng Phương</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}