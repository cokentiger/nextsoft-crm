'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Package, Plus, Trash2, Search, Save, X, Server, Code, Wrench, Clock, Calendar, Zap } from 'lucide-react'

// Cấu hình hiển thị Badge cho đẹp
const TYPE_CONFIG: any = {
  'SOFTWARE': { label: 'Phần mềm', icon: Package, color: 'bg-blue-100 text-blue-700' },
  'SERVER': { label: 'Máy chủ / VPS', icon: Server, color: 'bg-purple-100 text-purple-700' },
  'SERVICE': { label: 'Dịch vụ / Gia công', icon: Code, color: 'bg-orange-100 text-orange-700' },
  'MAINTENANCE': { label: 'Bảo trì', icon: Wrench, color: 'bg-gray-100 text-gray-700' }
}

const CYCLE_CONFIG: any = {
  'ONE_TIME': { label: 'Một lần (Vĩnh viễn)', icon: Zap, color: 'text-gray-600' },
  'MONTHLY': { label: 'Tháng (Thuê bao)', icon: Clock, color: 'text-green-600 font-bold' },
  'YEARLY': { label: 'Năm (Gia hạn)', icon: Calendar, color: 'text-blue-600 font-bold' }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Form Data mở rộng
  const [formData, setFormData] = useState({ 
    name: '', sku: '', price: 0, description: '', 
    category: 'SOFTWARE', billing_cycle: 'ONE_TIME' 
  })
  
  const supabase = createClient()

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { loadProducts() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('products').insert([formData])
    
    if (!error) {
      await loadProducts()
      setIsModalOpen(false)
      // Reset form về mặc định
      setFormData({ name: '', sku: '', price: 0, description: '', category: 'SOFTWARE', billing_cycle: 'ONE_TIME' })
    } else {
      alert('Lỗi: ' + error.message)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) loadProducts()
  }

  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh mục Sản phẩm & Dịch vụ</h1>
          <p className="text-gray-500">Quản lý các gói phần mềm, server và đơn giá dịch vụ.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 transition shadow-md shadow-red-100">
          <Plus className="h-5 w-5" /> Thêm mới
        </button>
      </div>

      {/* Danh sách sản phẩm (Table) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 font-bold">Mã (SKU)</th>
              <th className="px-6 py-4 font-bold">Tên Sản phẩm / Dịch vụ</th>
              <th className="px-6 py-4 font-bold">Phân loại</th>
              <th className="px-6 py-4 font-bold">Đơn giá niêm yết</th>
              <th className="px-6 py-4 font-bold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => {
              const TypeIcon = TYPE_CONFIG[p.category]?.icon || Package
              const CycleIcon = CYCLE_CONFIG[p.billing_cycle]?.icon || Zap
              
              return (
                <tr key={p.id} className="hover:bg-yellow-50/30 transition group">
                  <td className="px-6 py-4 font-medium text-gray-400 font-mono">{p.sku}</td>
                  <td className="px-6 py-4">
                     <div className="font-bold text-gray-900 text-base">{p.name}</div>
                     <div className="text-xs text-gray-500 mt-1 line-clamp-1">{p.description}</div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${TYPE_CONFIG[p.category]?.color || 'bg-gray-100'}`}>
                        <TypeIcon className="h-3.5 w-3.5" />
                        {TYPE_CONFIG[p.category]?.label || p.category}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="font-bold text-red-600 text-base">{formatMoney(p.price)}</div>
                     <div className={`text-xs flex items-center gap-1 mt-0.5 ${CYCLE_CONFIG[p.billing_cycle]?.color}`}>
                        <CycleIcon className="h-3 w-3" />
                        {CYCLE_CONFIG[p.billing_cycle]?.label}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {products.length === 0 && !loading && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400 italic">Chưa có dữ liệu. Hãy thêm sản phẩm đầu tiên!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm mới */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Thêm Sản phẩm / Dịch vụ</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="h-6 w-6 text-gray-400 hover:text-red-600" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. Tên & SKU */}
                <div className="grid grid-cols-3 gap-4">
                   <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tên Sản phẩm <span className="text-red-500">*</span></label>
                      <input required type="text" placeholder="VD: Phần mềm Nha khoa Pro..."
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-red-500 outline-none font-medium"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                   </div>
                   <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mã (SKU)</label>
                      <input type="text" placeholder="SOFT-01"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-red-500 outline-none font-mono text-sm"
                        value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})}
                      />
                   </div>
                </div>

                {/* 2. Phân loại & Chu kỳ */}
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Loại hình</label>
                      <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-red-500 outline-none bg-white"
                        value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="SOFTWARE">📦 Phần mềm</option>
                        <option value="SERVER">☁️ Máy chủ / VPS</option>
                        <option value="SERVICE">🛠️ Dịch vụ IT / Gia công</option>
                        <option value="MAINTENANCE">🔧 Gói Bảo trì</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Chu kỳ thu phí</label>
                      <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-red-500 outline-none bg-white"
                        value={formData.billing_cycle} onChange={e => setFormData({...formData, billing_cycle: e.target.value})}>
                        <option value="ONE_TIME">⚡ Một lần (Vĩnh viễn)</option>
                        <option value="MONTHLY">📅 Hàng tháng (Thuê bao)</option>
                        <option value="YEARLY">📆 Hàng năm (Gia hạn)</option>
                      </select>
                   </div>
                </div>

                {/* 3. Giá & Mô tả */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Đơn giá niêm yết (VNĐ) <span className="text-red-500">*</span></label>
                    <input required type="number" placeholder="0"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-red-500 outline-none font-bold text-gray-800"
                      value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    />
                    <p className="text-xs text-gray-400 mt-1 italic">
                       {formData.billing_cycle === 'ONE_TIME' ? 'Thu một lần duy nhất.' : 
                        formData.billing_cycle === 'MONTHLY' ? 'Giá thu định kỳ mỗi tháng.' : 'Giá thu định kỳ mỗi năm.'}
                    </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mô tả chi tiết</label>
                  <textarea rows={3} placeholder="Ghi chú về tính năng, cấu hình..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-red-500 outline-none text-sm"
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
               <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-100 transition">Hủy bỏ</button>
               <button type="submit" form="productForm" disabled={loading} className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow-lg shadow-red-200 flex items-center gap-2">
                <Save className="h-4 w-4" /> Lưu sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}