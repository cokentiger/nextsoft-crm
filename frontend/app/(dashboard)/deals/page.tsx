'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Pencil, Trash2, Calendar, User, Search, Loader2, ShoppingCart, X, ChevronDown, Check, Briefcase, Package, Server, Code, Wrench, Clock, Zap, Filter, FileDown, Printer, MapPin, Phone, Mail } from 'lucide-react'
import ReactToPrint from 'react-to-print';

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

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function DealManager() {
  const supabase = createClient()
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Ref cho tính năng in ấn
  const printRef = useRef<HTMLDivElement>(null);

  // State cho form
  const [deal, setDeal] = useState<any>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'DRAFT',
    note: ''
  })
  
  const [items, setItems] = useState<any[]>([])

  // --- LẤY DỮ LIỆU ---
  const fetchDeals = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          deal_items (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDeals(data || [])
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeals()
  }, [])

  // --- XỬ LÝ FORM ---
  const handleAddItem = () => {
    setItems([...items, {
      service_name: '',
      service_type: 'SOFTWARE',
      billing_cycle: 'ONE_TIME',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      description: ''
    }])
  }

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Tự động tính thành tiền
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price
    }
    
    setItems(newItems)
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // 1. Lưu Deal
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .upsert([{
           id: deal.id, // Nếu có id thì update, không thì insert
           ...deal,
           total_value: items.reduce((sum, item) => sum + item.total_price, 0)
        }])
        .select()
        .single()

      if (dealError) throw dealError

      // 2. Lưu Items (Xóa cũ thêm mới cho đơn giản)
      if (deal.id) {
        await supabase.from('deal_items').delete().eq('deal_id', deal.id)
      }

      const itemsToInsert = items.map(item => ({
        deal_id: dealData.id,
        ...item
      }))

      const { error: itemsError } = await supabase.from('deal_items').insert(itemsToInsert)
      if (itemsError) throw itemsError

      await fetchDeals()
      setShowModal(false)
      // Reset form
      setDeal({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'DRAFT',
        note: ''
      })
      setItems([])

    } catch (error) {
      console.error('Lỗi lưu:', error)
      alert('Có lỗi xảy ra!')
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (d: any) => {
    setDeal({
        id: d.id,
        customer_name: d.customer_name,
        customer_phone: d.customer_phone,
        customer_email: d.customer_email,
        start_date: d.start_date,
        end_date: d.end_date,
        status: d.status,
        note: d.note
    })
    setItems(d.deal_items || [])
    setShowModal(true)
  }

  const totalDealValue = items.reduce((sum, item) => sum + (item.total_price || 0), 0)

  // --- RENDER ---
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-gray-50 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quản Lý Báo Giá</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Theo dõi và quản lý các thỏa thuận kinh doanh
          </p>
        </div>
        <button 
          onClick={() => {
            setDeal({
                customer_name: '',
                customer_phone: '',
                customer_email: '',
                start_date: new Date().toISOString().split('T')[0],
                status: 'DRAFT',
            })
            setItems([])
            setShowModal(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" /> Tạo Báo Giá Mới
        </button>
      </div>

      {/* Danh sách Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {deals.map((d) => (
          <div key={d.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Briefcase className="h-6 w-6" />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${d.status === 'WON' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {d.status}
                </div>
             </div>
             
             <h3 className="text-xl font-bold text-gray-900 mb-1">{d.customer_name}</h3>
             <div className="space-y-2 mb-4 text-sm text-gray-500">
                <p className="flex items-center gap-2"><Phone className="h-4 w-4"/> {d.customer_phone || '---'}</p>
                <p className="flex items-center gap-2"><Calendar className="h-4 w-4"/> {d.start_date}</p>
             </div>

             <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-lg font-bold text-blue-600">{formatMoney(d.total_value)}</span>
                <button onClick={() => openEdit(d)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Pencil className="h-5 w-5" />
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* MODAL FORM & PRINT PREVIEW */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
             
             {/* Modal Header */}
             <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <div>
                 <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                   {deal.id ? <><Pencil className="h-6 w-6 text-blue-600"/> Cập nhật Báo Giá</> : <><Plus className="h-6 w-6 text-blue-600"/> Tạo Báo Giá Mới</>}
                 </h2>
                 <p className="text-sm text-gray-500 mt-1">Điền thông tin khách hàng và dịch vụ chi tiết</p>
               </div>
               <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition">
                 <X className="h-6 w-6" />
               </button>
             </div>

             {/* Modal Body */}
             <div className="flex-1 overflow-y-auto p-8 bg-white">
                <form id="dealForm" onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* Thông tin khách hàng */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Tên Khách hàng <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input required type="text" value={deal.customer_name} onChange={e => setDeal({...deal, customer_name: e.target.value})} 
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Nhập tên khách hàng..." />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Số điện thoại</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input type="text" value={deal.customer_phone} onChange={e => setDeal({...deal, customer_phone: e.target.value})} 
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="0909..." />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input type="email" value={deal.customer_email} onChange={e => setDeal({...deal, customer_email: e.target.value})} 
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="example@gmail.com" />
                        </div>
                    </div>
                  </div>

                  {/* Danh sách dịch vụ */}
                  <div>
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Chi tiết Dịch vụ / Sản phẩm</h3>
                        <button type="button" onClick={handleAddItem} className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg font-semibold transition flex items-center gap-1">
                            <Plus className="h-4 w-4" /> Thêm dòng
                        </button>
                    </div>

                    <div className="border rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="p-4 w-[40px]">#</th>
                                    <th className="p-4">Tên dịch vụ</th>
                                    <th className="p-4 w-[140px]">Loại</th>
                                    <th className="p-4 w-[140px]">Chu kỳ</th>
                                    <th className="p-4 w-[80px] text-center">SL</th>
                                    <th className="p-4 w-[140px] text-right">Đơn giá</th>
                                    <th className="p-4 w-[140px] text-right">Thành tiền</th>
                                    <th className="p-4 w-[50px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="p-4 text-center text-gray-500">{idx + 1}</td>
                                        <td className="p-4">
                                            <input type="text" value={item.service_name} onChange={e => handleUpdateItem(idx, 'service_name', e.target.value)} 
                                                className="w-full border-none bg-transparent focus:ring-0 font-medium placeholder-gray-400" placeholder="Nhập tên sản phẩm..." />
                                        </td>
                                        <td className="p-4">
                                            <select value={item.service_type} onChange={e => handleUpdateItem(idx, 'service_type', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 text-gray-600 text-xs">
                                                {Object.keys(TYPE_CONFIG).map(key => <option key={key} value={key}>{TYPE_CONFIG[key].label}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            <select value={item.billing_cycle} onChange={e => handleUpdateItem(idx, 'billing_cycle', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 text-gray-600 text-xs">
                                                {Object.keys(CYCLE_CONFIG).map(key => <option key={key} value={key}>{CYCLE_CONFIG[key].label}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            <input type="number" min="1" value={item.quantity} onChange={e => handleUpdateItem(idx, 'quantity', Number(e.target.value))} 
                                                className="w-full text-center border rounded py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                        </td>
                                        <td className="p-4 text-right">
                                            <input type="number" min="0" value={item.unit_price} onChange={e => handleUpdateItem(idx, 'unit_price', Number(e.target.value))} 
                                                className="w-full text-right border rounded py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                        </td>
                                        <td className="p-4 text-right font-bold text-gray-800">
                                            {formatMoney(item.total_price)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600 transition"><Trash2 className="h-4 w-4"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {items.length === 0 && <div className="p-8 text-center text-gray-400 italic">Chưa có dịch vụ nào. Nhấn "Thêm dòng" để bắt đầu.</div>}
                    </div>

                    <div className="flex justify-end mt-4 items-center gap-4">
                        <span className="text-gray-600 font-medium">Tổng cộng:</span>
                        <span className="text-3xl font-extrabold text-red-600">{formatMoney(totalDealValue)}</span>
                    </div>
                  </div>
                </form>
             </div>

             {/* Modal Footer */}
             <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-4 rounded-b-xl">
               <button onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Hủy bỏ</button>
               
               {/* Nút Xuất PDF - Sử dụng ReactToPrint */}
               <ReactToPrint
                  trigger={() => (
                    <button type="button" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2 transition">
                      <FileDown className="h-4 w-4"/> Xuất Báo Giá (PDF)
                    </button>
                  )}
                  content={() => printRef.current}
                  documentTitle={`Baogia - ${deal.customer_name || 'KhachHang'} - ${new Date().toISOString().split('T')[0]}`}
                  pageStyle={`
                    @page {
                      size: A4;
                      margin: 20mm;
                    }
                    @media print {
                      body { -webkit-print-color-adjust: exact; }
                    }
                  `}
                />

               <button type="submit" form="dealForm" disabled={submitting} className="px-8 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200 flex items-center gap-2 transition">
                 {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}
                 Lưu Báo Giá
               </button>
             </div>
           </div>
        </div>
      )}

      {/* =====================================================================================
          KHUNG IN ẨN (CHỈ HIỆN KHI NHẤN NÚT IN)
          ===================================================================================== */}
      <div style={{ display: "none" }}>
        <div ref={printRef} className="print-container font-serif text-black p-4 max-w-[210mm] mx-auto bg-white">
          
          {/* 1. Header & Thông tin công ty */}
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
            <div className="flex gap-4">
               {/* LOGO VUÔNG - KHÔNG BỊ MÉO */}
               <div className="w-[90px] h-[90px] border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {/* --- THAY LINK LOGO CỦA BẠN VÀO ĐÂY --- */}
                  <img src="/logoVuong_web.png" alt="Logo" className="w-full h-full object-contain" />
               </div>
               
               {/* --- THAY ĐỔI THÔNG TIN CÔNG TY TẠI ĐÂY --- */}
               <div className="text-sm space-y-1">
                 <h1 className="text-xl font-bold uppercase text-blue-800">CÔNG TY TNHH MTV TIẾP BƯỚC CÔNG NGHỆ</h1>
                 <p className="font-semibold">NEXTSOFT.VN</p>
                 <p><span className="font-bold">Địa chỉ:</span> 48/23 Nguyễn Trãi, Phường Ninh Kiều, TP. Cần Thơ</p>
                 <p><span className="font-bold">Hotline:</span> 0939.616.929 - <span className="font-bold">Website:</span> nextsoft.vn</p>
               </div>
            </div>
            
            <div className="text-right">
              <h2 className="text-2xl font-bold uppercase mb-1">BẢNG BÁO GIÁ</h2>
              <p className="italic text-sm text-gray-600">Ngày: {new Date().toLocaleDateString('vi-VN')}</p>
              <p className="text-sm font-bold mt-1 text-gray-500">#{deal.id ? deal.id.slice(0,8).toUpperCase() : 'NEW'}</p>
            </div>
          </div>

          {/* 2. Thông tin khách hàng */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
             <h3 className="font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">THÔNG TIN KHÁCH HÀNG</h3>
             <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <p><span className="font-semibold">Đơn vị / Khách hàng:</span> {deal.customer_name}</p>
                <p><span className="font-semibold">Điện thoại:</span> {deal.customer_phone}</p>
                <p><span className="font-semibold">Email:</span> {deal.customer_email}</p>
                <p><span className="font-semibold">Người liên hệ:</span> {deal.customer_name}</p>
             </div>
          </div>

          {/* 3. Bảng Dịch Vụ - Fix lỗi chồng chéo chữ bằng table-fixed */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-gray-300 table-fixed text-sm">
              <thead>
                {/* Header màu xám đậm dịu hơn */}
                <tr className="bg-gray-600 text-white print:bg-gray-600 print:text-white">
                  <th className="border border-gray-300 p-2 w-[5%] text-center">STT</th>
                  <th className="border border-gray-300 p-2 w-[40%] text-left">Tên Sản phẩm / Dịch vụ</th>
                  <th className="border border-gray-300 p-2 w-[15%] text-center">Loại / Chu kỳ</th>
                  <th className="border border-gray-300 p-2 w-[10%] text-center">SL</th>
                  <th className="border border-gray-300 p-2 w-[15%] text-right">Đơn giá</th>
                  <th className="border border-gray-300 p-2 w-[15%] text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="break-inside-avoid">
                    <td className="border border-gray-300 p-2 text-center align-top">{index + 1}</td>
                    <td className="border border-gray-300 p-2 align-top break-words">
                      <div className="font-bold">{item.service_name}</div>
                      {item.description && <div className="text-xs italic text-gray-500 mt-1">{item.description}</div>}
                    </td>
                    <td className="border border-gray-300 p-2 text-center align-top text-xs">
                       <div>{TYPE_CONFIG[item.service_type]?.label}</div>
                       <div className="text-gray-500">{CYCLE_CONFIG[item.billing_cycle]?.label}</div>
                    </td>
                    <td className="border border-gray-300 p-2 text-center align-top">{item.quantity}</td>
                    <td className="border border-gray-300 p-2 text-right align-top">{formatMoney(item.unit_price)}</td>
                    <td className="border border-gray-300 p-2 text-right font-bold align-top">{formatMoney(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. Tổng kết */}
          <div className="flex justify-end mb-12">
             <div className="w-1/2">
                <div className="flex justify-between py-1 border-b border-gray-200">
                   <span className="font-semibold">Tổng cộng:</span>
                   <span className="font-bold">{formatMoney(totalDealValue)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200">
                   <span className="font-semibold">Thuế GTGT (0%):</span>
                   <span>0 ₫</span>
                </div>
                <div className="flex justify-between py-2 text-xl font-extrabold text-red-600 mt-2">
                   <span>TỔNG THANH TOÁN:</span>
                   <span>{formatMoney(totalDealValue)}</span>
                </div>
                <p className="text-right text-xs italic text-gray-500 mt-1">(Bằng chữ: .....................................................................)</p>
             </div>
          </div>

          {/* 5. Chữ ký */}
          <div className="grid grid-cols-2 gap-8 text-center mt-8 break-inside-avoid">
             <div>
                <p className="font-bold uppercase mb-16">Khách hàng xác nhận</p>
                <p className="italic text-sm">(Ký và ghi rõ họ tên)</p>
             </div>
             <div>
                <p className="font-bold uppercase mb-16">Người lập báo giá</p>
                <p className="font-bold">Ms. Kim Anh</p>
             </div>
          </div>
          
          {/* Footer chân trang */}
          <div className="mt-12 border-t pt-4 text-center text-xs text-gray-500">
             <p>Cảm ơn quý khách đã quan tâm đến dịch vụ của NextSoft CRM.</p>
          </div>

        </div>
      </div>

    </div>
  )
}