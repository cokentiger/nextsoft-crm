'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, DollarSign, Pencil, Trash2, Calendar, User, Search, Loader2, ShoppingCart, X, ChevronDown, Check, Briefcase } from 'lucide-react'

// --- COMPONENT SEARCHABLE SELECT (Đã fix lỗi Z-Index & Overflow) ---
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
        className="w-full border border-gray-300 px-3 py-2.5 rounded bg-white flex justify-between items-center cursor-pointer hover:border-red-500 transition h-11"
      >
        <span className={`text-sm truncate ${selectedOption ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption[labelKey] : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
      </div>

      {isOpen && (
        // FIX: z-[9999] để đảm bảo menu luôn nổi lên trên cùng, không bị dòng dưới che
        <div className="absolute z-[9999] mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-hidden flex flex-col min-w-[300px] left-0 animate-in fade-in zoom-in-95 duration-100">
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
  const [editingId, setEditingId] = useState<string|null>(null) // ID của deal đang sửa
  
  const [searchTerm, setSearchTerm] = useState(''); const [viewMode, setViewMode] = useState<'MINE'|'ALL'>('ALL')
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
    // FIX: Load thêm deal_items để phục vụ việc Sửa (Edit)
    const d = await supabase.from('deals')
      .select('*, customers(name), profiles(full_name), deal_items(*)')
      .order('created_at', { ascending: false })
    
    const c = await supabase.from('customers').select('id, name')
    const p = await supabase.from('products').select('*').eq('is_active', true)
    
    setDeals(d.data || []); setCustomers(c.data || []); setProducts(p.data || []); setLoading(false)
  }

  // --- LOGIC ---
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
    newItems[index] = { ...newItems[index], product_id: productId, name: product.name, price: product.price }
    setSelectedItems(newItems)
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems]; newItems[index] = { ...newItems[index], [field]: value }; setSelectedItems(newItems)
  }

  // --- HÀM MỞ FORM SỬA (EDIT) ---
  const handleEdit = (deal: any) => {
    setEditingId(deal.id)
    setFormData({
      title: deal.title,
      customer_id: deal.customer_id,
      stage: deal.stage,
      expected_close_date: deal.expected_close_date || ''
    })
    
    // Map dữ liệu từ DB (deal_items) vào UI
    const items = deal.deal_items.map((di: any) => ({
      is_custom: !di.product_id, // Nếu không có ID sản phẩm thì là custom
      product_id: di.product_id || '',
      name: di.item_name, // Lấy tên đã lưu trong DB
      price: di.price,
      quantity: di.quantity
    }))
    setSelectedItems(items)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa Cơ hội này không?')) return
    await supabase.from('deals').delete().eq('id', id)
    loadData()
  }

  // --- SAVE (TẠO MỚI HOẶC CẬP NHẬT) ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customer_id) return alert('Chưa chọn khách hàng!')
    if (selectedItems.length === 0) return alert('Chưa chọn sản phẩm/dịch vụ nào!')
    const invalidItem = selectedItems.find(i => i.is_custom && !i.name.trim())
    if (invalidItem) return alert('Vui lòng nhập tên cho các dòng Dịch vụ khác!')

    setSubmitting(true)
    try {
      const dealPayload = {
        title: formData.title, customer_id: formData.customer_id, stage: formData.stage,
        value: totalDealValue, assigned_to: currentUser, expected_close_date: formData.expected_close_date || null
      }

      let dealId = editingId
      
      if (editingId) {
        // UPDATE
        const { error } = await supabase.from('deals').update(dealPayload).eq('id', editingId)
        if (error) throw error
        // Xóa items cũ để lưu items mới (Cách đơn giản nhất)
        await supabase.from('deal_items').delete().eq('deal_id', editingId)
      } else {
        // INSERT
        const { data, error } = await supabase.from('deals').insert([dealPayload]).select().single()
        if (error) throw error
        dealId = data.id
      }

      // Lưu Items Mới
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
  
  const filteredDeals = deals.filter(d => 
    (viewMode === 'ALL' || d.assigned_to === currentUser) &&
    (d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="p-8 h-full flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Cơ hội (Deals)</h1><p className="text-sm text-gray-500">Pipeline & Doanh thu</p></div>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 shadow-md transition"><Plus className="h-4 w-4"/> Thêm mới</button>
      </div>

      {/* FILTER */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
         <div className="relative flex-1 max-w-lg"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input type="text" placeholder="Tìm kiếm..." className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
         <div className="flex bg-white border rounded-lg p-1"><button onClick={() => setViewMode('MINE')} className={`px-4 py-1.5 text-xs font-bold rounded ${viewMode==='MINE'?'bg-red-50 text-red-700':'text-gray-500 hover:bg-gray-50'}`}>Của tôi</button><button onClick={() => setViewMode('ALL')} className={`px-4 py-1.5 text-xs font-bold rounded ${viewMode==='ALL'?'bg-red-50 text-red-700':'text-gray-500 hover:bg-gray-50'}`}>Tất cả</button></div>
      </div>

      {/* LIST DEALS (Đã thêm nút Sửa/Xóa) */}
      {loading ? <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-red-500"/></div> : 
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-y-auto pb-10">
         {filteredDeals.map((deal) => (
           <div key={deal.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between border-l-4 border-l-transparent hover:border-l-yellow-500 group relative">
             
             {/* Action Buttons (Hiện khi hover) */}
             <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(deal)} className="p-1.5 bg-gray-100 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded" title="Sửa"><Pencil className="h-3.5 w-3.5"/></button>
                <button onClick={() => handleDelete(deal.id)} className="p-1.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded" title="Xóa"><Trash2 className="h-3.5 w-3.5"/></button>
             </div>

             <div>
                <div className="flex justify-between items-start mb-2"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${deal.stage==='NEW'?'bg-blue-50 text-blue-700 border-blue-200':deal.stage==='WON'?'bg-green-50 text-green-700 border-green-200':deal.stage==='LOST'?'bg-gray-100 text-gray-500 border-gray-200':'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{deal.stage}</span></div>
                <h3 className="font-bold text-gray-900 truncate text-base mb-1 pr-14">{deal.title}</h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3"><User className="h-3.5 w-3.5 text-gray-400"/> {deal.customers?.name}</div>
                <div className="space-y-1"><div className="flex items-center gap-2 text-xs text-gray-500"><span className="text-gray-400">Phụ trách:</span> {deal.profiles?.full_name || 'Chưa giao'}</div>{deal.expected_close_date && (<div className="flex items-center gap-2 text-xs text-orange-600 font-medium"><Calendar className="h-3 w-3"/> Dự kiến: {new Date(deal.expected_close_date).toLocaleDateString('vi-VN')}</div>)}</div>
             </div>
             <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-end"><span className="font-bold text-red-700 text-lg">{formatMoney(deal.value)}</span><span className="text-[10px] text-gray-400">{new Date(deal.created_at).toLocaleDateString('vi-VN')}</span></div>
           </div>
         ))}
       </div>
      }

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

                  {/* Cột 2: FIX BẢNG SẢN PHẨM (Bỏ overflow-hidden để menu xổ ra ngoài) */}
                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-gray-500"/> Chi tiết Báo giá</h3>
                       <div className="flex gap-3">
                         <button type="button" onClick={addCustomItem} className="text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition flex items-center gap-2">+ Dịch vụ khác</button>
                         <button type="button" onClick={addProductItem} className="text-sm font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-md shadow-red-100"><Plus className="h-4 w-4"/> Thêm Sản phẩm</button>
                       </div>
                    </div>

                    {/* QUAN TRỌNG: Đã xóa class overflow-hidden ở đây */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                       <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 text-xs font-bold text-gray-500 uppercase border-b border-gray-200 rounded-t-xl">
                          <div className="col-span-5 pl-2">Tên Hạng mục / Sản phẩm</div>
                          <div className="col-span-2 text-center">SL</div>
                          <div className="col-span-2 text-right">Đơn giá</div>
                          <div className="col-span-2 text-right">Thành tiền</div>
                          <div className="col-span-1"></div>
                       </div>
                       
                       <div className="p-3 space-y-3">
                          {selectedItems.length === 0 && <p className="text-sm text-gray-400 text-center py-8 italic">Chưa có hạng mục nào. Bấm nút "Thêm" ở trên.</p>}
                          {selectedItems.map((item, index) => (
                             <div key={index} className="grid grid-cols-12 gap-4 items-center bg-white p-2 rounded border border-gray-100 shadow-sm relative z-10">
                                {/* Cột Tên */}
                                <div className="col-span-5">
                                   {item.is_custom ? (
                                     <div className="relative">
                                        <Pencil className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-400"/>
                                        <input type="text" placeholder="Nhập tên dịch vụ (VD: Phí gia công...)" autoFocus
                                          className="w-full border border-gray-300 pl-9 pr-3 py-2.5 rounded text-sm focus:border-red-500 outline-none bg-yellow-50 focus:bg-white transition"
                                          value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} />
                                     </div>
                                   ) : (
                                     <SearchableSelect options={products} value={item.product_id} onChange={(val: string) => handleProductChange(index, val)} placeholder="Chọn sản phẩm..." labelKey="name"/>
                                   )}
                                </div>
                                <div className="col-span-2"><input type="number" min="1" className="w-full p-2.5 border border-gray-300 rounded text-center text-sm outline-none focus:border-red-500" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} /></div>
                                <div className="col-span-2"><input type="number" className={`w-full p-2.5 border border-gray-300 rounded text-right text-sm outline-none focus:border-red-500 ${item.is_custom ? 'bg-yellow-50' : ''}`} value={item.price} onChange={e => handleItemChange(index, 'price', Number(e.target.value))} /></div>
                                <div className="col-span-2 text-right"><span className="font-bold text-sm text-gray-800 block py-2">{formatMoney(item.price * item.quantity)}</span></div>
                                <div className="col-span-1 text-right"><button type="button" onClick={() => removeItem(index)} className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition"><Trash2 className="h-4 w-4"/></button></div>
                             </div>
                          ))}
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