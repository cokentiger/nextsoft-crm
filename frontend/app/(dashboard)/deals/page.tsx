'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Pencil, Trash2, Calendar, User, Search, Loader2, ShoppingCart, X, ChevronDown, Check, Briefcase, Package, Server, Code, Wrench, Clock, Zap, Filter, FileDown, Printer } from 'lucide-react'
// 1. IMPORT HOOK IN ẤN
import { useReactToPrint } from 'react-to-print'

// --- CẤU HÌNH ICON & MÀU SẮC ---
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
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))

  // 2. TẠO REF ĐỂ IN ẤN
  const componentRef = useRef<HTMLDivElement>(null);

  const supabase = createClient()

  const [formData, setFormData] = useState({ title: '', customer_id: '', stage: 'NEW', expected_close_date: '' })
  const [selectedItems, setSelectedItems] = useState<any[]>([])

  // 3. CẤU HÌNH HOOK IN ẤN
  const handlePrint = useReactToPrint({
    contentRef: componentRef, 
    documentTitle: `Bao_Gia_${new Date().toISOString().slice(0,10)}`,
  });

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
    newItems[index] = { ...newItems[index], product_id: productId, name: product.name, price: product.price, category: product.category, billing_cycle: product.billing_cycle }
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
  const baseFilteredDeals = deals.filter(d => 
    (viewMode === 'ALL' || d.assigned_to === currentUser) &&
    (d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const monthFilteredDeals = monthFilter 
    ? baseFilteredDeals.filter(d => d.created_at.startsWith(monthFilter))
    : baseFilteredDeals

  const groupRunning = monthFilteredDeals.filter(d => ['NEW', 'NEGOTIATION'].includes(d.stage))
  const groupWon = monthFilteredDeals.filter(d => d.stage === 'WON')
  const groupLost = monthFilteredDeals.filter(d => d.stage === 'LOST')
  const sumValue = (list: any[]) => list.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cơ hội (Deals)</h1>
          <p className="text-sm text-gray-500">Quản lý Pipeline & Doanh thu</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 shadow-md transition text-sm">
          <Plus className="h-4 w-4"/> Thêm mới
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative flex-1 w-full md:max-w-md">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
           <input type="text" placeholder="Tìm kiếm deal, khách hàng..." 
             className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500 text-sm" 
             value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
           />
         </div>
         <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5">
               <Filter className="h-4 w-4 text-gray-500"/>
               <span className="text-xs font-bold text-gray-500 hidden sm:inline">Tháng:</span>
               <input type="month" className="bg-transparent text-sm font-medium outline-none text-gray-700 cursor-pointer" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
               {monthFilter && (<button onClick={() => setMonthFilter('')} className="text-xs text-red-500 hover:underline ml-1">Xóa</button>)}
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode('MINE')} className={`px-3 py-1.5 text-xs font-bold rounded ${viewMode==='MINE'?'bg-white text-red-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>Của tôi</button>
              <button onClick={() => setViewMode('ALL')} className={`px-3 py-1.5 text-xs font-bold rounded ${viewMode==='ALL'?'bg-white text-red-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>Tất cả</button>
            </div>
         </div>
      </div>

      {/* KANBAN BOARD */}
      {loading ? (
        <div className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin mx-auto text-red-500"/></div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-[1024px]">
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

      {/* MODAL FORM - ĐÃ SỬA LẠI BACKDROP VÀ REF */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm overflow-y-auto">
          {/* 4. GẮN REF VÀO PHẦN BAO NGOÀI NỘI DUNG CẦN IN (CARD TRẮNG) */}
          <div ref={componentRef} className="bg-white rounded-xl w-full max-w-5xl shadow-2xl flex flex-col my-auto relative print:shadow-none print:w-full print:max-w-none print:absolute print:top-0 print:left-0 print:p-8">
             
             {/* --- PHẦN HEADER CÔNG TY (CHỈ HIỆN KHI IN) --- */}
             <div className="hidden print:block mb-8 border-b-2 border-red-600 pb-4">
               <div className="flex justify-between items-start">
                 <div>
                   <h1 className="text-xl font-extrabold text-red-600 uppercase tracking-wide">CÔNG TY TNHH MTV TIẾP BƯỚC CÔNG NGHỆ</h1>
                   <div className="text-sm text-gray-600 mt-2 space-y-1">
                     <p className="flex items-center gap-2">📍 Địa chỉ: 48/23 Nguyễn Trãi, Phường Ninh Kiều, TP. Cần Thơ</p>
                     <p className="flex items-center gap-2">🌐 Website: nextsoft.vn | 📧 Email: info@nextsoft.vn</p>
                     <p className="flex items-center gap-2">☎️ Hotline/Zalo: 0939.616.929</p>
                   </div>
                 </div>
                 <div className="text-right">
                   {/* Logo: Thay src bằng đường dẫn logo của bạn */}
                   <img src="/logoVuong_web.png" className="h-16 w-auto" alt="Nextsoft Logo" />
                   
                 </div>
               </div>
             </div>
             {/* ------------------------------------------------------- */}

             {/* Header Modal - Ẩn nút X khi in */}
             <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl print:bg-white print:border-none print:px-0 print:py-0">
               <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 print:text-2xl print:uppercase print:justify-center print:w-full print:mb-4">
                 <Briefcase className="h-5 w-5 text-red-600 print:hidden"/> 
                 {editingId ? 'PHIẾU BÁO GIÁ DỊCH VỤ' : 'Tạo Cơ hội mới'}
               </h2>
               <button onClick={() => setShowModal(false)} className="print:hidden"><X className="h-6 w-6 text-gray-400 hover:text-red-600"/></button>
             </div>

             <div className="p-8 bg-white print:p-0">
                <form id="dealForm" onSubmit={handleSave} className="space-y-8">
                  {/* Thông tin chung */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4">
                     <div className="space-y-5 print:space-y-2">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Tên Dự án / Hạng mục</label>
                          <input required className="w-full border border-gray-300 px-4 py-2.5 rounded-lg text-sm focus:border-red-500 outline-none font-medium print:border-none print:p-0 print:font-bold print:text-lg print:bg-transparent" 
                            placeholder="Ví dụ: Triển khai CRM Giai đoạn 2..."
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Kính gửi Khách hàng</label>
                          {/* Khi in thì hiện text thay vì dropdown */}
                          <div className="print:hidden">
                            <SearchableSelect options={customers} value={formData.customer_id} onChange={(val: string) => setFormData({...formData, customer_id: val})} placeholder="-- Tìm khách hàng --" />
                          </div>
                          <div className="hidden print:block font-bold text-lg text-gray-800">
                             {customers.find(c => c.id === formData.customer_id)?.name || '___________________________'}
                          </div>
                        </div>
                     </div>
                     <div className="space-y-5 print:space-y-2">
                        <div className="grid grid-cols-2 gap-5">
                           <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Số báo giá</label>
                              <div className="text-sm font-bold text-gray-700 h-11 flex items-center">
                                 #{editingId ? editingId.slice(0,6).toUpperCase() : 'NEW'}
                              </div>
                              {/* Ẩn select trạng thái khi in cho đẹp */}
                              <div className="print:hidden">
                                <select className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm" 
                                  value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                                  <option value="NEW">Mới</option><option value="NEGOTIATION">Đàm phán</option><option value="WON">Thắng (Won)</option><option value="LOST">Thua (Lost)</option>
                                </select>
                              </div>
                           </div>
                           <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Ngày lập phiếu</label>
                              <input type="date" className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:border-red-500 outline-none h-11 print:border-none print:p-0 print:bg-transparent" 
                                value={formData.expected_close_date} onChange={e => setFormData({...formData, expected_close_date: e.target.value})} />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6 print:border-t-2 print:border-red-600 print:mt-4">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-gray-500"/> Chi tiết Hạng mục</h3>
                       <div className="flex gap-3 print:hidden">
                         <button type="button" onClick={addCustomItem} className="text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition flex items-center gap-2">+ Dịch vụ khác</button>
                         <button type="button" onClick={addProductItem} className="text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-md shadow-red-100"><Plus className="h-4 w-4"/> Thêm Sản phẩm</button>
                       </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm print:bg-white print:border-none print:shadow-none">
                       {/* Header Bảng */}
                       <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 text-xs font-bold text-gray-500 uppercase border-b border-gray-200 rounded-t-xl print:bg-red-600 print:text-white print:border-none print:rounded-none">
                          <div className="col-span-1 text-center">STT</div>
                          <div className="col-span-4 pl-2">Tên Hạng mục</div>
                          <div className="col-span-2 text-center">ĐVT</div>
                          <div className="col-span-1 text-center">SL</div>
                          <div className="col-span-2 text-right">Đơn giá</div>
                          <div className="col-span-2 text-right">Thành tiền</div>
                          <div className="col-span-0 print:hidden"></div>
                       </div>
                       
                       <div className="p-3 space-y-3 print:space-y-0 print:p-0">
                          {selectedItems.length === 0 && <p className="text-sm text-gray-400 text-center py-8 italic">Chưa có hạng mục nào.</p>}
                          {selectedItems.map((item, index) => {
                             const TypeIcon = TYPE_CONFIG[item.category]?.icon
                             const CycleConfig = CYCLE_CONFIG[item.billing_cycle]

                             return (
                             <div key={index} className="grid grid-cols-12 gap-4 items-center bg-white p-2 rounded border border-gray-100 shadow-sm relative z-10 group print:border-none print:shadow-none print:border-b print:border-gray-200 print:rounded-none print:py-3">
                                <div className="col-span-1 text-center font-medium text-gray-500 text-sm">{index + 1}</div>
                                <div className="col-span-4">
                                   {item.is_custom ? (
                                     <div className="relative">
                                        <Pencil className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-400 print:hidden"/>
                                        <input type="text" placeholder="Nhập tên dịch vụ..."
                                          className="w-full border border-gray-300 pl-9 pr-3 py-2.5 rounded text-sm focus:border-red-500 outline-none bg-yellow-50 focus:bg-white transition print:bg-white print:border-none print:p-0 print:font-semibold"
                                          value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} />
                                     </div>
                                   ) : (
                                     <div className="space-y-1">
                                        <div className="print:hidden">
                                           <SearchableSelect options={products} value={item.product_id} onChange={(val: string) => handleProductChange(index, val)} placeholder="Chọn sản phẩm..." labelKey="name"/>
                                        </div>
                                        <div className="hidden print:block font-bold text-sm">{item.name}</div>
                                     </div>
                                   )}
                                </div>
                                <div className="col-span-2 text-center text-xs">
                                    {item.category ? TYPE_CONFIG[item.category]?.label : 'Gói'}
                                    {item.billing_cycle && <span className="block text-[10px] text-gray-400">{CYCLE_CONFIG[item.billing_cycle]?.label}</span>}
                                </div>
                                
                                <div className="col-span-1"><input type="number" min="1" className="w-full p-2.5 border border-gray-300 rounded text-center text-sm outline-none focus:border-red-500 print:border-none print:p-0 print:text-center print:bg-transparent" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} /></div>
                                <div className="col-span-2"><input type="number" className={`w-full p-2.5 border border-gray-300 rounded text-right text-sm outline-none focus:border-red-500 ${item.is_custom ? 'bg-yellow-50' : ''} print:bg-transparent print:border-none print:p-0`} value={item.price} onChange={e => handleItemChange(index, 'price', Number(e.target.value))} /></div>
                                <div className="col-span-2 text-right"><span className="font-bold text-sm text-gray-800 block py-2">{formatMoney(item.price * item.quantity)}</span></div>
                                <div className="col-span-0 text-right print:hidden"><button type="button" onClick={() => removeItem(index)} className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition"><Trash2 className="h-4 w-4"/></button></div>
                             </div>
                             )
                          })}
                       </div>
                    </div>
                    
                    <div className="flex justify-end items-center gap-4 mt-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 print:bg-white print:border-none print:mt-2">
                       <span className="text-gray-600 font-bold uppercase text-sm">Tổng thanh toán:</span>
                       <span className="text-3xl font-extrabold text-red-600">{formatMoney(totalDealValue)}</span>
                    </div>
                    
                    {/* Footer ghi chú khi in */}
                    <div className="hidden print:block mt-8 pt-4 border-t border-gray-300">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="text-xs text-gray-500">
                                <p className="font-bold text-gray-700 mb-1">Thông tin thanh toán:</p>
                                <p>Ngân hàng: Ngân hàng TMCP Quốc tế Việt Nam (VIB)</p>
                                <p>Số tài khoản: 009 526 480</p>
                                <p>Chủ tài khoản: Công Ty TNHH Một Thành Viên Tiếp Bước Công Nghệ</p>
                                <p>-------</p>
                                <p>Ngân hàng: Ngân hàng TMCP Tiên Phong (TPB)</p>
                                <p>Số tài khoản: 000 334 30102</p>
                                <p>Chủ tài khoản: Hồ Đăng Phương</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-gray-700 mb-16">Người lập phiếu</p>
                                <p className="text-sm font-medium">{currentUser ? 'Admin' : 'Nhân viên kinh doanh'}</p>
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-gray-400 mt-8">Cảm ơn Quý khách đã tin tưởng sử dụng dịch vụ của NextSoft!</p>
                    </div>

                  </div>
                </form>
             </div>

             {/* Footer Button - Ẩn toàn bộ khi in */}
             <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-4 rounded-b-xl print:hidden">
               <button onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Hủy bỏ</button>
               
               <button type="button" onClick={() => handlePrint()} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2 transition">
                 <Printer className="h-4 w-4"/> In Báo giá
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