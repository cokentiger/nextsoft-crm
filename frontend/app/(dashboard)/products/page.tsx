'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Package, Plus, Trash2, Search, Save, X } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', sku: '', price: 0, description: '' })
  
  const supabase = createClient()

  // 1. Tải danh sách sản phẩm
  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { loadProducts() }, [])

  // 2. Hàm thêm sản phẩm mới
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('products').insert([formData])
    
    if (!error) {
      await loadProducts() // Tải lại danh sách
      setIsModalOpen(false) // Đóng modal
      setFormData({ name: '', sku: '', price: 0, description: '' }) // Reset form
    } else {
      alert('Lỗi: ' + error.message)
    }
    setLoading(false)
  }

  // 3. Hàm xóa sản phẩm
  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) loadProducts()
  }

  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách Sản phẩm</h1>
          <p className="text-gray-500">Quản lý các gói phần mềm và bảng giá.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 transition shadow-md shadow-red-100">
          <Plus className="h-5 w-5" /> Thêm sản phẩm
        </button>
      </div>

      {/* Danh sách sản phẩm (Table) */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-bold">Mã (SKU)</th>
              <th className="px-6 py-4 font-bold">Tên Sản phẩm</th>
              <th className="px-6 py-4 font-bold">Giá niêm yết</th>
              <th className="px-6 py-4 font-bold">Mô tả</th>
              <th className="px-6 py-4 font-bold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-yellow-50/30 transition">
                <td className="px-6 py-4 font-medium text-gray-400">{product.sku}</td>
                <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                   <div className="p-1.5 bg-yellow-100 rounded text-yellow-600"><Package className="h-4 w-4"/></div>
                   {product.name}
                </td>
                <td className="px-6 py-4 font-bold text-red-600">{formatMoney(product.price)}</td>
                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{product.description || '-'}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(product.id)} className="text-gray-400 hover:text-red-600 transition">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && !loading && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Chưa có sản phẩm nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm mới */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Thêm sản phẩm mới</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-gray-400 hover:text-red-500" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm <span className="text-red-500">*</span></label>
                <input required type="text" placeholder="Ví dụ: Nextsoft CRM - Gói Basic"
                  className="w-full p-2 border border-gray-300 rounded focus:border-red-500 outline-none"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã (SKU)</label>
                    <input type="text" placeholder="CRM-01"
                    className="w-full p-2 border border-gray-300 rounded focus:border-red-500 outline-none"
                    value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (VNĐ)</label>
                    <input required type="number" placeholder="0"
                    className="w-full p-2 border border-gray-300 rounded focus:border-red-500 outline-none"
                    value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                <textarea rows={3} placeholder="Mô tả tính năng gói này..."
                  className="w-full p-2 border border-gray-300 rounded focus:border-red-500 outline-none"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-2.5 rounded font-bold hover:bg-red-700 flex justify-center items-center gap-2">
                <Save className="h-4 w-4" /> Lưu sản phẩm
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}