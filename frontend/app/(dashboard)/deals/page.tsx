'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, DollarSign, Pencil, Trash2, Calendar, User, Search, Loader2, ShoppingCart, X, ChevronDown, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

// --- COMPONENT CON: Ô CHỌN CÓ TÌM KIẾM (Searchable Select) ---
// Giúp tìm khách hàng/sản phẩm trong danh sách hàng ngàn dòng
const SearchableSelect = ({ options, value, onChange, placeholder, labelKey = 'name' }: any) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Lọc danh sách theo từ khóa
  const filteredOptions = options.filter((opt: any) => 
    opt[labelKey].toLowerCase().includes(search.toLowerCase())
  )

  const selectedOption = options.find((opt: any) => opt.id === value)

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 p-2.5 rounded bg-white flex justify-between items-center cursor-pointer hover:border-red-500 transition"
      >
        <span className={`text-sm ${selectedOption ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption[labelKey] : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
          {/* Ô tìm kiếm */}
          <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
              <input 
                autoFocus
                type="text" 
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-red-500"
                placeholder="Gõ để tìm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          {/* Danh sách kết quả */}
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt: any) => (
                <div 
                  key={opt.id}
                  onClick={() => { onChange(opt.id); setIsOpen(false); setSearch('') }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-red-50 flex justify-between items-center ${opt.id === value ? 'bg-red-50 text-red-700 font-bold' : 'text-gray-700'}`}
                >
                  {opt[labelKey]}
                  {opt.id === value && <Check className="h-3 w-3"/>}
                </div>
              ))
            ) : (
              <div className="p-3 text-xs text-gray-400 text-center">Không tìm thấy kết quả.</div>
            )}
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
  const [products, setProducts] = useState<any[]>([]) // Danh sách SP để chọn
  
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<string|null>(null)
  
  // State tìm kiếm & Lọc ngoài trang chủ
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'MINE'|'ALL'>('ALL')

  const supabase = createClient()

  // State Form Deal
  const [formData, setFormData] = useState({ 
    title: '', 
    customer_id: '', 
    stage: 'NEW', 
    expected_close_date: '' 
  })

  // State Danh sách sản phẩm đã chọn (Deal Items)
  const [selectedItems, setSelectedItems] = useState<any[]>([])

  // --- 1. LOAD DỮ LIỆU ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user?.id || null)
      loadData()
    }
    init()
  }, [])

  const loadData = async () => {
    // Load Deals
    const d = await supabase.from('deals')
      .select('*, customers(name), profiles(full_name), deal_items(*)') // Load cả deal_items nếu cần hiển thị chi tiết
      .order('created_at', { ascending: false })
    
    // Load Customers (Chỉ lấy id, name để nhẹ)
    const c = await supabase.from('customers').select('id, name')
    
    // Load Products
    const p = await supabase.from('products').select('*').eq('is_active', true)

    setDeals(d.data || [])
    setCustomers(c.data || [])
    setProducts(p.data || [])
    setLoading(false)
  }

  // --- 2. LOGIC TÍNH TIỀN ---
  const totalDealValue = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const addItem = () => setSelectedItems([...selectedItems, { product_id: '', name: '', price: 0, quantity: 1 }])
  
  const removeItem = (index: number) => {
    const newItems = [...selectedItems]; newItems.splice(index, 1); setSelectedItems(newItems)
  }

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    const newItems = [...selectedItems]
    newItems[index] = { ...newItems[index], product_id: productId, name: product.name, price: product.price }
    setSelectedItems(newItems)
  }

  const handleItemChange = (index: number, field: string, value: number) => {
    const newItems = [...selectedItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setSelectedItems(newItems)
  }

  // --- 3. XỬ LÝ LƯU (SAVE) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customer_id) return alert('Chưa chọn khách hàng!')
    if (selectedItems.length === 0) return alert('Chưa chọn sản phẩm nào!')

    setSubmitting(true)
    try {
      // B1: Tạo Deal (Lưu tổng tiền)
      const dealPayload = {
        title: formData.title,
        customer_id: formData.customer_id,
        stage: formData.stage,
        value: totalDealValue, // Lấy tổng tự tính
        assigned_to: currentUser,
        expected_close_date: formData.expected_close_date || null
      }

      const { data: newDeal, error } = await supabase.from('deals').insert([dealPayload]).select().single()
      if (error) throw error

      // B2: Lưu Deal Items
      const itemsPayload = selectedItems.map(item => ({
        deal_id: newDeal.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }))
      const { error: err2 } = await supabase.from('deal_items').insert(itemsPayload)
      if (err2) throw err2

      setShowModal(false)
      resetForm()
      loadData()
    } catch (err: any) {
      alert('Lỗi: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ title: '', customer_id: '', stage: 'NEW', expected_close_date: '' })
    setSelectedItems([])
  }

  // Helper formats
  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
  
  const filteredDeals = deals.filter(d => 
    (viewMode === 'ALL' || d.assigned_to === currentUser) &&
    (d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-8 h-full flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cơ hội (Deals)</h1>
          <p className="text-sm text-gray-500">Pipeline & Doanh thu dự kiến</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 shadow-md shadow-red-200 transition">
          <Plus className="h-4 w-4"/> Thêm mới
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
         <div className="relative flex-1 max-w-lg">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
           <input type="text" placeholder="Tìm tên deal, khách hàng..." 
             className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" 
             value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
           />
         </div>
         <div className="flex bg-white border rounded-lg p-1">
           <button onClick={() => setViewMode('MINE')} className={`px-4 py-1.5 text-xs font-bold rounded ${viewMode==='MINE'?'bg-red-50 text-red-700':'text-gray-500 hover:bg-gray-50'}`}>Của tôi</button>
           <button onClick={() => setViewMode('ALL')} className={`px-4 py-1.5 text-xs font-bold rounded ${viewMode==='ALL'?'bg-red-50 text-red-700':'text-gray-500 hover:bg-gray-50'}`}>Tất cả</button>
         </div>
      </div>

      {/* LIST DEALS */}
      {loading ? <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-red-500"/></div> : 
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-y-auto pb-10">
         {filteredDeals.map((deal) => (
           <div key={deal.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between border-l-4 border-l-transparent hover:border-l-yellow-500 group">
             <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                    deal.stage === 'NEW' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    deal.stage === 'WON' ? 'bg-green-50 text-green-700 border-green-200' :
                    deal.stage === 'LOST' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>{deal.stage}</span>
                </div>
                <h3 className="font-bold text-gray-900 truncate text-base mb-1" title={deal.title}>{deal.title}</h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                   <User className="h-3.5 w-3.5 text-gray-400"/> {deal.customers?.name}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="text-gray-400">Phụ trách:</span> {deal.profiles?.full_name || 'Chưa giao'}
                  </div>
                  {deal.expected_close_date && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 font-medium">
                      <Calendar className="h-3 w-3"/> Dự kiến: {new Date(deal.expected_close_date).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>
             </div>
             
             <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-end">
                <span className="font-bold text-red-700 text-lg">{formatMoney(deal.value)}</span>
                <span className="text-[10px] text-gray-400">{new Date(deal.created_at).toLocaleDateString('vi-VN')}</span>
             </div>
           </div>
         ))}
       </div>
      }

      {/* --- MODAL FORM (ĐÃ LÀM TO HƠN) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
          {/* max-w-4xl: Modal rộng hơn để hiển thị bảng sản phẩm */}
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
             
             {/* Modal Header */}
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
               <h2 className="text-xl font-bold text-gray-900">{formData.title ? 'Cập nhật Deal' : 'Tạo Cơ hội mới'}</h2>
               <button onClick={() => setShowModal(false)}><X className="h-6 w-6 text-gray-400 hover:text-red-600"/></button>
             </div>

             {/* Modal Body */}
             <div className="p-6 overflow-y-auto flex-1">
                <form id="dealForm" onSubmit={handleSave} className="space-y-6">
                  
                  {/* CỘT 1: THÔNG TIN CHUNG */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tên Deal / Dự án <span className="text-red-500">*</span></label>
                          <input required className="w-full border border-gray-300 p-2.5 rounded text-sm focus:border-red-500 outline-none font-medium" 
                            placeholder="Ví dụ: Triển khai CRM..."
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                        </div>
                        
                        {/* SEARCHABLE SELECT CHO KHÁCH HÀNG */}
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Khách hàng <span className="text-red-500">*</span></label>
                          <SearchableSelect 
                            options={customers} 
                            value={formData.customer_id} 
                            onChange={(val: string) => setFormData({...formData, customer_id: val})}
                            placeholder="-- Tìm và chọn khách hàng --"
                          />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Giai đoạn</label>
                              <select className="w-full border border-gray-300 p-2.5 rounded text-sm focus:border-red-500 outline-none bg-white" 
                                value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                                <option value="NEW">Mới</option>
                                <option value="NEGOTIATION">Đàm phán</option>
                                <option value="WON">Thắng (Won)</option>
                                <option value="LOST">Thua (Lost)</option>
                              </select>
                           </div>
                           <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ngày dự kiến chốt</label>
                              <input type="date" className="w-full border border-gray-300 p-2.5 rounded text-sm focus:border-red-500 outline-none" 
                                value={formData.expected_close_date} onChange={e => setFormData({...formData, expected_close_date: e.target.value})} />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* CỘT 2: DANH SÁCH SẢN PHẨM (Tự tính tiền) */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center mb-3">
                       <h3 className="font-bold text-gray-800 flex items-center gap-2"><ShoppingCart className="h-4 w-4"/> Sản phẩm / Dịch vụ</h3>
                       <button type="button" onClick={addItem} className="text-sm font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded transition">+ Thêm dòng</button>
                    </div>

                    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                       {/* Header bảng */}
                       <div className="grid grid-cols-12 gap-2 p-2 bg-gray-100 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                          <div className="col-span-6">Sản phẩm</div>
                          <div className="col-span-2 text-center">SL</div>
                          <div className="col-span-2 text-right">Đơn giá</div>
                          <div className="col-span-2 text-right">Thành tiền</div>
                       </div>
                       
                       {/* Body bảng */}
                       <div className="p-2 space-y-2">
                          {selectedItems.length === 0 && <p className="text-sm text-gray-400 text-center py-4 italic">Chưa có sản phẩm nào được chọn.</p>}
                          
                          {selectedItems.map((item, index) => (
                             <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                {/* Cột Tên SP (Có Search) */}
                                <div className="col-span-6">
                                   <SearchableSelect 
                                      options={products}
                                      value={item.product_id}
                                      onChange={(val: string) => handleProductChange(index, val)}
                                      placeholder="Chọn sản phẩm..."
                                      labelKey="name"
                                   />
                                </div>
                                
                                {/* Cột Số lượng */}
                                <div className="col-span-2">
                                   <input type="number" min="1" className="w-full p-2 border rounded text-center text-sm outline-none focus:border-red-500"
                                      value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} />
                                </div>

                                {/* Cột Đơn giá */}
                                <div className="col-span-2 text-right text-sm text-gray-600">
                                   {formatMoney(item.price)}
                                </div>

                                {/* Cột Thành tiền & Xóa */}
                                <div className="col-span-2 flex justify-end items-center gap-2">
                                   <span className="font-bold text-sm text-gray-800">{formatMoney(item.price * item.quantity)}</span>
                                   <button type="button" onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                    
                    {/* Tổng cộng */}
                    <div className="flex justify-end items-center gap-3 mt-4">
                       <span className="text-gray-500 text-sm font-medium">Tổng giá trị Deal:</span>
                       <span className="text-2xl font-bold text-red-600">{formatMoney(totalDealValue)}</span>
                    </div>
                  </div>

                </form>
             </div>

             {/* Modal Footer */}
             <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
               <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Hủy bỏ</button>
               <button type="submit" form="dealForm" disabled={submitting} className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200 flex items-center gap-2 transition">
                 {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Lưu Deal'}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}