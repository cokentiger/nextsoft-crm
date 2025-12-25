'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Pencil, Trash2, Calendar, User, Search, Loader2, ShoppingCart, X, ChevronDown, Check, Briefcase, Package, Server, Code, Wrench, Clock, Zap, Filter, FileDown } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// CẤU HÌNH ICON & MÀU SẮC
const TYPE_CONFIG: any = {
  'SOFTWARE': { label: 'Phần mềm', icon: Package, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'SERVER': { label: 'Server/VPS', icon: Server, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  'SERVICE': { label: 'Dịch vụ', icon: Code, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  'MAINTENANCE': { label: 'Bảo trì', icon: Wrench, color: 'bg-gray-100 text-gray-700 border-gray-200' }
}

const CYCLE_CONFIG: any = {
  'ONE_TIME': { label: 'Vĩnh viễn', icon: Zap, color: 'text-gray-500' },
  'MONTHLY': { label: '/ tháng', icon: Clock, color: 'text-green-600 font-bold' },
  'YEARLY': { label: '/ năm', icon: Calendar, color: 'text-blue-600 font-bold' }
}

// --- COMPONENT SEARCHABLE SELECT ---
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
        <div className="absolute z-[9999] mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-hidden flex flex-col w-full min-w-[300px] left-0 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input 
                autoFocus type="text" 
                className="w-full pl-8 pr-2 py-2 text-sm border border-gray-200 rounded outline-none focus:border-red-500"
                placeholder="Gõ từ khóa..."
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

// --- TRANG CHÍNH ---
export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<string|null>(null)
  const [editingId, setEditingId] = useState<string|null>(null)
  
  // State Filter & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'MINE'|'ALL'>('ALL')
  // Bộ lọc tháng: mặc định là tháng hiện tại (format YYYY-MM)
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))

  const supabase = createClient()

  const [formData, setFormData] = useState({ title: '', customer_id: '', stage: 'NEW', expected_close_date: '' })
  const [selectedItems, setSelectedItems] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser(); setCurrentUser(user?.id || null); loadData()
    }
    init()
  }, [])

  const loadData = async () => {
    const d = await supabase.from('deals')
      .select('*, customers(name), profiles(full_name), deal_items(*)')
      .order('created_at', { ascending: false })
    
    const c = await supabase.from('customers').select('id, name')
    const p = await supabase.from('products').select('*').eq('is_active', true)
    
    setDeals(d.data || []); setCustomers(c.data || []); setProducts(p.data || []); setLoading(false)
  }

  // --- LOGIC FORM ---
  const totalDealValue = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const addProductItem = () => setSelectedItems([...selectedItems, { is_custom: false, product_id: '', name: '', price: 0, quantity: 1 }])
  const addCustomItem = () => setSelectedItems([...selectedItems, { is_custom: true, product_id: null, name: '', price: 0, quantity: 1 }])
  
  const removeItem = (index: number) => {
    const newItems = [...selectedItems]; newItems.splice(index, 1); setSelectedItems(newItems)
  }

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const newItems = [...selectedItems]
    newItems[index] = { 
      ...newItems[index], 
      product_id: productId, 
      name: product.name, 
      price: product.price,
      category: product.category,
      billing_cycle: product.billing_cycle
    }
    setSelectedItems(newItems)
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems]; newItems[index] = { ...newItems[index], [field]: value }; setSelectedItems(newItems)
  }

  const handleEdit = (deal: any) => {
    setEditingId(deal.id)
    setFormData({
      title: deal.title, customer_id: deal.customer_id, stage: deal.stage, expected_close_date: deal.expected_close_date || ''
    })
    const items = deal.deal_items.map((di: any) => {
      const originalProduct = products.find(p => p.id === di.product_id)
      return {
        is_custom: !di.product_id,
        product_id: di.product_id || '',
        name: di.item_name,
        price: di.price,
        quantity: di.quantity,
        category: originalProduct?.category,
        billing_cycle: originalProduct?.billing_cycle
      }
    })
    setSelectedItems(items)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa Cơ hội này không?')) return
    await supabase.from('deals').delete().eq('id', id)
    loadData()
  }

  // --- TÍNH NĂNG XUẤT PDF (MỚI) ---
  const exportToPDF = () => {
    if (!formData.customer_id || selectedItems.length === 0) {
      return alert('Vui lòng chọn khách hàng và sản phẩm trước khi xuất báo giá!')
    }

    const doc = new jsPDF()
    const customer = customers.find((c: any) => c.id === formData.customer_id)
    
    // 1. Header NextSoft
    // Paste chuỗi base64 dài ngoằng của bạn vào đây (ví dụ minh họa)
    const logoBase64 = "data:image/png;base64,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" 
    
    // Thêm ảnh vào PDF: (data, format, x, y, width, height)
    // x=14, y=10 là toạ độ. width=50, height=15 là kích thước logo (tùy chỉnh cho vừa)
    doc.addImage(logoBase64, 'PNG', 14, 10, 50, 15)

    doc.setFontSize(20)
    doc.setTextColor(220, 38, 38) 
    doc.text("NEXTSOFT TECHNOLOGY", 14, 22)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text("Công ty TNHH MTV Tiếp Bước Công Nghệ", 14, 28)
    doc.text("Website: nextsoft.vn | Hotline: 0939.616.929", 14, 33)
    doc.setDrawColor(200, 200, 200)
    doc.line(14, 40, 196, 40)

    // 2. Thông tin Deal
    doc.setFontSize(16)
    doc.setTextColor(0)
    doc.text("BẢNG BÁO GIÁ / QUOTATION", 105, 55, { align: 'center' })
    
    doc.setFontSize(10)
    doc.text(`MÃ SỐ: #DEAL-${editingId ? editingId.slice(0,6).toUpperCase() : 'NEW'}`, 14, 70)
    doc.text(`NGÀY: ${new Date().toLocaleDateString('vi-VN')}`, 14, 76)
    doc.text(`KHÁCH HÀNG: ${customer?.name || 'Khach le'}`, 14, 85)
    doc.text(`DỰ ÁN: ${formData.title}`, 14, 91)

    // 3. Bảng sản phẩm
    const tableColumn = ["STT", "Ten San Pham / Dich Vu", "Phan loai", "SL", "Don gia", "Thanh tien"]
    const tableRows = selectedItems.map((item, index) => [
      index + 1,
      item.name,
      item.category ? TYPE_CONFIG[item.category]?.label : 'Khac',
      item.quantity,
      formatMoney(item.price),
      formatMoney(item.price * item.quantity)
    ])

    autoTable(doc, {
      startY: 100,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' }
      },
      styles: { font: "helvetica", fontSize: 9 },
    })

    // 4. Tổng tiền & Footer
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.setTextColor(220, 38, 38)
    doc.text(`TỔNG CỘNG: ${formatMoney(totalDealValue)}`, 196, finalY, { align: 'right' })
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text("(Đã bao gồm VAT)", 196, finalY + 6, { align: 'right' })
    doc.setTextColor(0)
    doc.text("Người lập báo giá", 160, finalY + 30, { align: 'center' })
    doc.text(currentUser || "NextSoft Staff", 160, finalY + 50, { align: 'center' })

    // Lưu file
    doc.save(`Bao_gia_${customer?.name || 'KHACH'}_${new Date().toISOString().slice(0,10)}.pdf`)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customer_id) return alert('Chưa chọn khách hàng!')
    if (selectedItems.length === 0) return alert('Chưa chọn sản phẩm/dịch vụ nào!')
    
    setSubmitting(true)
    try {
      const dealPayload = {
        title: formData.title, customer_id: formData.customer_id, stage: formData.stage,
        value: totalDealValue, assigned_to: currentUser, expected_close_date: formData.expected_close_date || null
      }

      let dealId = editingId
      if (editingId) {
        const { error } = await supabase.from('deals').update(dealPayload).eq('id', editingId)
        if (error) throw error
        await supabase.from('deal_items').delete().eq('deal_id', editingId)
      } else {
        const { data, error } = await supabase.from('deals').insert([dealPayload]).select().single()
        if (error) throw error
        dealId = data.id
      }

      const itemsPayload = selectedItems.map(item => ({
        deal_id: dealId,
        product_id: item.is_custom ? null : item.product_id,
        item_name: item.name, 
        quantity: item.quantity,
        price: item.price
      }))
      const { error: err2 } = await supabase.from('deal_items').insert(itemsPayload)
      if (err2) throw err2

      setShowModal(false); resetForm(); loadData()
    } catch (err: any) {
      alert('Lỗi: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => { 
    setEditingId(null)
    setFormData({ title: '', customer_id: '', stage: 'NEW', expected_close_date: '' })
    setSelectedItems([]) 
  }

  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  // --- LOGIC FILTER & GROUPING ---
  
  // 1. Lọc theo text và quyền sở hữu
  const baseFilteredDeals = deals.filter(d => 
    (viewMode === 'ALL' || d.assigned_to === currentUser) &&
    (d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // 2. Lọc theo tháng (Nếu có chọn)
  const monthFilteredDeals = monthFilter 
    ? baseFilteredDeals.filter(d => d.created_at.startsWith(monthFilter))
    : baseFilteredDeals

  // 3. Phân chia khu vực (Grouping)
  const groupRunning = monthFilteredDeals.filter(d => ['NEW', 'NEGOTIATION'].includes(d.stage))
  const groupWon = monthFilteredDeals.filter(d => d.stage === 'WON')
  const groupLost = monthFilteredDeals.filter(d => d.stage === 'LOST')

  // Tính tổng giá trị từng nhóm
  const sumValue = (list: any[]) => list.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)

  // Helper render card
  const renderDealCard = (deal: any) => (
    <div key={deal.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between border-l-4 border-l-transparent hover:border-l-yellow-500 group relative mb-3">
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
         <button onClick={() => handleEdit(deal)} className="p-1.5 bg-gray-100 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded" title="Sửa"><Pencil className="h-3 w-3"/></button>
         <button onClick={() => handleDelete(deal.id)} className="p-1.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded" title="Xóa"><Trash2 className="h-3 w-3"/></button>
      </div>
      <div>
         <div className="flex justify-between items-start mb-2">
           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${deal.stage==='NEW'?'bg-blue-50 text-blue-700 border-blue-200':deal.stage==='WON'?'bg-green-50 text-green-700 border-green-200':deal.stage==='LOST'?'bg-gray-100 text-gray-500 border-gray-200':'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
             {deal.stage}
           </span>
         </div>
         <h3 className="font-bold text-gray-900 truncate text-sm mb-1 pr-10">{deal.title}</h3>
         <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2"><User className="h-3 w-3 text-gray-400"/> {deal.customers?.name}</div>
      </div>
      <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
        <span className="font-bold text-red-700 text-sm">{formatMoney(deal.value)}</span>
        <span className="text-[10px] text-gray-400">{new Date(deal.created_at).toLocaleDateString('vi-VN')}</span>
      </div>
    </div>
  )

  return (
    <div className="p-8 h-full flex flex-col bg-gray-50/50">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cơ hội (Deals)</h1>
          <p className="text-sm text-gray-500">Quản lý Pipeline & Doanh thu</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 shadow-md transition text-sm">
          <Plus className="h-4 w-4"/> Thêm mới
        </button>
      </div>

      {/* TOOLBAR: FILTER & SEARCH */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
         {/* Search */}
         <div className="relative flex-1 w-full md:max-w-md">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
           <input type="text" placeholder="Tìm kiếm deal, khách hàng..." 
             className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500 text-sm" 
             value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
           />
         </div>

         {/* Filters Right Side */}
         <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Month Filter */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5">
               <Filter className="h-4 w-4 text-gray-500"/>
               <span className="text-xs font-bold text-gray-500 hidden sm:inline">Tháng:</span>
               <input 
                 type="month" 
                 className="bg-transparent text-sm font-medium outline-none text-gray-700 cursor-pointer"
                 value={monthFilter}
                 onChange={(e) => setMonthFilter(e.target.value)}
               />
               {monthFilter && (
                 <button onClick={() => setMonthFilter('')} className="text-xs text-red-500 hover:underline ml-1">Xóa</button>
               )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode('MINE')} className={`px-3 py-1.5 text-xs font-bold rounded ${viewMode==='MINE'?'bg-white text-red-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>Của tôi</button>
              <button onClick={() => setViewMode('ALL')} className={`px-3 py-1.5 text-xs font-bold rounded ${viewMode==='ALL'?'bg-white text-red-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>Tất cả</button>
            </div>
         </div>
      </div>

      {/* MAIN CONTENT: GROUPED SECTIONS */}
      {loading ? (
        <div className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin mx-auto text-red-500"/></div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-[1024px]">
            
            {/* Cột 1: ĐANG THỰC HIỆN */}
            <div className="flex flex-col h-full">
               <div className="flex justify-between items-center mb-3 px-1">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Đang thực hiện
                    <span className="ml-2 bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">{groupRunning.length}</span>
                  </h3>
                  <span className="text-sm font-bold text-blue-600">{formatMoney(sumValue(groupRunning))}</span>
               </div>
               <div className="bg-gray-100/50 p-2 rounded-xl flex-1 border border-dashed border-gray-300 min-h-[200px]">
                  {groupRunning.length === 0 && <p className="text-center text-xs text-gray-400 py-10">Không có deal nào đang chạy</p>}
                  {groupRunning.map(renderDealCard)}
               </div>
            </div>

            {/* Cột 2: THÀNH CÔNG */}
            <div className="flex flex-col h-full">
               <div className="flex justify-between items-center mb-3 px-1">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Thành công
                    <span className="ml-2 bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">{groupWon.length}</span>
                  </h3>
                  <span className="text-sm font-bold text-green-600">{formatMoney(sumValue(groupWon))}</span>
               </div>
               <div className="bg-green-50/30 p-2 rounded-xl flex-1 border border-dashed border-green-200 min-h-[200px]">
                  {groupWon.length === 0 && <p className="text-center text-xs text-gray-400 py-10">Chưa có deal thành công tháng này</p>}
                  {groupWon.map(renderDealCard)}
               </div>
            </div>

            {/* Cột 3: THẤT BẠI / DỪNG */}
            <div className="flex flex-col h-full">
               <div className="flex justify-between items-center mb-3 px-1">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span> Chưa thành công
                    <span className="ml-2 bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">{groupLost.length}</span>
                  </h3>
                  <span className="text-sm font-bold text-gray-500">{formatMoney(sumValue(groupLost))}</span>
               </div>
               <div className="bg-gray-100 p-2 rounded-xl flex-1 border border-dashed border-gray-300 min-h-[200px]">
                  {groupLost.length === 0 && <p className="text-center text-xs text-gray-400 py-10">Không có deal thất bại</p>}
                  {groupLost.map(renderDealCard)}
               </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL FORM --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh]">
             {/* Header */}
             <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
               <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Briefcase className="h-5 w-5 text-red-600"/> {editingId ? 'Cập nhật Deal' : 'Tạo Cơ hội mới'}</h2>
               <button onClick={() => setShowModal(false)}><X className="h-6 w-6 text-gray-400 hover:text-red-600"/></button>
             </div>

             <div className="p-8 overflow-y-auto flex-1 bg-white">
                <form id="dealForm" onSubmit={handleSave} className="space-y-8">
                  {/* Cột 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-5">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Tên Deal / Dự án <span className="text-red-500">*</span></label>
                          <input required className="w-full border border-gray-300 px-4 py-2.5 rounded-lg text-sm focus:border-red-500 outline-none font-medium" 
                            placeholder="Ví dụ: Triển khai CRM Giai đoạn 2..."
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Khách hàng <span className="text-red-500">*</span></label>
                          <SearchableSelect options={customers} value={formData.customer_id} onChange={(val: string) => setFormData({...formData, customer_id: val})} placeholder="-- Tìm khách hàng --" />
                        </div>
                     </div>
                     <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                           <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Giai đoạn</label>
                              <select className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:border-red-500 outline-none bg-white h-11" 
                                value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                                <option value="NEW">Mới</option><option value="NEGOTIATION">Đàm phán</option><option value="WON">Thắng (Won)</option><option value="LOST">Thua (Lost)</option>
                              </select>
                           </div>
                           <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Ngày dự kiến chốt</label>
                              <input type="date" className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:border-red-500 outline-none h-11" 
                                value={formData.expected_close_date} onChange={e => setFormData({...formData, expected_close_date: e.target.value})} />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Cột 2: BẢNG SẢN PHẨM */}
                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-gray-500"/> Chi tiết Báo giá</h3>
                       <div className="flex gap-3">
                         <button type="button" onClick={addCustomItem} className="text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition flex items-center gap-2">+ Dịch vụ khác</button>
                         <button type="button" onClick={addProductItem} className="text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-md shadow-red-100"><Plus className="h-4 w-4"/> Thêm Sản phẩm</button>
                       </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                       <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 text-xs font-bold text-gray-500 uppercase border-b border-gray-200 rounded-t-xl">
                          <div className="col-span-5 pl-2">Sản phẩm / Dịch vụ</div>
                          <div className="col-span-2 text-center">SL</div>
                          <div className="col-span-2 text-right">Đơn giá</div>
                          <div className="col-span-2 text-right">Thành tiền</div>
                          <div className="col-span-1"></div>
                       </div>
                       
                       <div className="p-3 space-y-3">
                          {selectedItems.length === 0 && <p className="text-sm text-gray-400 text-center py-8 italic">Chưa có hạng mục nào. Bấm nút "Thêm" ở trên.</p>}
                          {selectedItems.map((item, index) => {
                             const TypeIcon = TYPE_CONFIG[item.category]?.icon
                             const CycleConfig = CYCLE_CONFIG[item.billing_cycle]

                             return (
                             <div key={index} className="grid grid-cols-12 gap-4 items-center bg-white p-2 rounded border border-gray-100 shadow-sm relative z-10 group">
                                <div className="col-span-5">
                                   {item.is_custom ? (
                                     <div className="relative">
                                        <Pencil className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-400"/>
                                        <input type="text" placeholder="Nhập tên dịch vụ (VD: Phí gia công...)" autoFocus
                                          className="w-full border border-gray-300 pl-9 pr-3 py-2.5 rounded text-sm focus:border-red-500 outline-none bg-yellow-50 focus:bg-white transition"
                                          value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} />
                                     </div>
                                   ) : (
                                     <div className="space-y-1">
                                        <SearchableSelect options={products} value={item.product_id} onChange={(val: string) => handleProductChange(index, val)} placeholder="Chọn sản phẩm..." labelKey="name"/>
                                        {item.category && (
                                          <div className="flex gap-2 pl-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${TYPE_CONFIG[item.category]?.color}`}>
                                              {TypeIcon && <TypeIcon className="h-3 w-3"/>} {TYPE_CONFIG[item.category]?.label}
                                            </span>
                                            {CycleConfig && (
                                              <span className={`text-[10px] px-1.5 py-0.5 flex items-center gap-1 ${CycleConfig.color}`}>
                                                {CycleConfig.icon && <CycleConfig.icon className="h-3 w-3"/>} {CycleConfig.label}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                     </div>
                                   )}
                                </div>
                                <div className="col-span-2"><input type="number" min="1" className="w-full p-2.5 border border-gray-300 rounded text-center text-sm outline-none focus:border-red-500" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} /></div>
                                <div className="col-span-2"><input type="number" className={`w-full p-2.5 border border-gray-300 rounded text-right text-sm outline-none focus:border-red-500 ${item.is_custom ? 'bg-yellow-50' : ''}`} value={item.price} onChange={e => handleItemChange(index, 'price', Number(e.target.value))} /></div>
                                <div className="col-span-2 text-right"><span className="font-bold text-sm text-gray-800 block py-2">{formatMoney(item.price * item.quantity)}</span></div>
                                <div className="col-span-1 text-right"><button type="button" onClick={() => removeItem(index)} className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition"><Trash2 className="h-4 w-4"/></button></div>
                             </div>
                             )
                          })}
                       </div>
                    </div>
                    <div className="flex justify-end items-center gap-4 mt-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                       <span className="text-gray-600 font-bold uppercase text-sm">Tổng cộng:</span>
                       <span className="text-3xl font-extrabold text-red-600">{formatMoney(totalDealValue)}</span>
                    </div>
                  </div>
                </form>
             </div>
             <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-4 rounded-b-xl">
               <button onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Hủy bỏ</button>
               
               {/* Nút Xuất PDF */}
               <button type="button" onClick={exportToPDF} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2 transition">
                 <FileDown className="h-4 w-4"/> Xuất Báo giá
               </button>

               <button type="submit" form="dealForm" disabled={submitting} className="px-8 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200 flex items-center gap-2 transition transform active:scale-95">
                 {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : editingId ? 'Cập nhật' : 'Tạo mới'}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}