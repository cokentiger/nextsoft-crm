'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Search, Server, Globe, Activity, Code, Trash2, Pencil, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const supabase = createClient()
  const router = useRouter()

  const [formData, setFormData] = useState({
    customer_id: '',
    app_url: '',
    server_ip: '',
    current_version: '1.0.0',
    status: 'LIVE',
    custom_config_str: '{}'
  })

  useEffect(() => {
    const fetch = async () => {
      const d = await supabase.from('deployments').select('*, customers(name)').order('last_updated', { ascending: false })
      const c = await supabase.from('customers').select('id, name')
      setDeployments(d.data || [])
      setCustomers(c.data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = deployments.filter(d => 
    (d.app_url.toLowerCase().includes(searchTerm.toLowerCase()) || 
     d.server_ip.includes(searchTerm) || 
     d.customers?.name.toLowerCase().includes(searchTerm.toLowerCase())) && 
    (filterStatus === 'ALL' || d.status === filterStatus)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    let configJson = {}
    try {
      configJson = JSON.parse(formData.custom_config_str)
    } catch {
      alert("Lỗi: Custom Config phải là định dạng JSON hợp lệ!")
      setSubmitting(false)
      return
    }

    const payload = {
      customer_id: formData.customer_id,
      app_url: formData.app_url,
      server_ip: formData.server_ip,
      current_version: formData.current_version,
      status: formData.status,
      custom_config: configJson,
      last_updated: new Date().toISOString()
    }

    if (editingId) await supabase.from('deployments').update(payload).eq('id', editingId)
    else await supabase.from('deployments').insert([payload])

    setSubmitting(false)
    setShowModal(false)
    setEditingId(null)
    
    // Refresh data
    const d = await supabase.from('deployments').select('*, customers(name)').order('last_updated', { ascending: false })
    setDeployments(d.data || [])
    
    // Reset form
    setFormData({ customer_id: '', app_url: '', server_ip: '', current_version: '1.0.0', status: 'LIVE', custom_config_str: '{}' })
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa thông tin triển khai này?")) return
    await supabase.from('deployments').delete().eq('id', id)
    setDeployments(deployments.filter(d => d.id !== id))
  }

  const handleEdit = (d: any) => {
    setEditingId(d.id)
    setFormData({
      customer_id: d.customer_id || '',
      app_url: d.app_url || '',
      server_ip: d.server_ip || '',
      current_version: d.current_version || '',
      status: d.status || 'LIVE',
      // Fix lỗi null JSON
      custom_config_str: d.custom_config ? JSON.stringify(d.custom_config, null, 2) : '{}'
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({ customer_id: '', app_url: '', server_ip: '', current_version: '1.0.0', status: 'LIVE', custom_config_str: '{}' })
    setEditingId(null)
    setShowModal(false)
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'LIVE': return 'bg-green-100 text-green-700 border-green-200'
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'DOWN': return 'bg-red-100 text-red-700 border-red-200'
      case 'DEV': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-blue-100 text-blue-700'
    }
  }

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Triển khai</h1>
          <p className="text-sm text-gray-500">Quản lý Server & Domain</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-red-700 shadow-md shadow-red-200">
          <Plus className="h-4 w-4" /> Thêm mới
        </button>
      </div>

      {/* FILTER */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            type="text" placeholder="Tìm IP, Domain..." 
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" 
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <select 
          className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm outline-none focus:border-red-500" 
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Tất cả</option>
          <option value="LIVE">Live</option>
          <option value="MAINTENANCE">Bảo trì</option>
          <option value="DOWN">Sập</option>
          <option value="DEV">Dev</option>
        </select>
      </div>

      {/* GRID */}
      {loading ? <p className="text-center py-10">Đang tải...</p> : 
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden border-t-4 border-t-transparent hover:border-t-red-500">
              <div className="px-5 py-4 border-b border-gray-50 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2 font-bold text-gray-700">
                  <Globe className="h-4 w-4 text-red-600" />
                  <a href={d.app_url.startsWith('http') ? d.app_url : `https://${d.app_url}`} target="_blank" rel="noreferrer" className="hover:underline hover:text-red-600 truncate max-w-[150px]">
                    {d.app_url}
                  </a>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(d.status)}`}>{d.status}</span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Khách hàng</span>
                  <span className="text-sm font-medium text-gray-900">{d.customers?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Server className="h-3 w-3" /> IP</span>
                  <span className="text-sm font-mono bg-gray-100 px-1.5 rounded">{d.server_ip}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Activity className="h-3 w-3" /> Ver</span>
                  <span className="text-sm font-bold text-red-600">{d.current_version}</span>
                </div>
                <div className="mt-2 bg-gray-900 rounded p-2 relative group">
                  <div className="text-[10px] text-gray-400 mb-1 flex items-center gap-1"><Code className="h-3 w-3" /> Config</div>
                  <pre className="text-[10px] text-yellow-400 font-mono overflow-hidden h-12">
                    {JSON.stringify(d.custom_config, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                <span>Updated: {new Date(d.last_updated).toLocaleDateString('vi-VN')}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(d)} className="text-gray-400 hover:text-red-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(d.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      }

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Cập nhật' : 'Khai báo mới'}</h2>
              <button onClick={resetForm}><X className="h-5 w-5 text-gray-400 hover:text-red-500" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Khách hàng</label>
                <select required className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 focus:outline-none bg-white" value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })}>
                  <option value="">-- Chọn --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Domain / URL</label>
                  <input required className="w-full border border-gray-300 p-2 rounded mt-1 text-sm font-mono focus:border-red-500 focus:outline-none" value={formData.app_url} onChange={e => setFormData({ ...formData, app_url: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Server IP</label>
                  <input required className="w-full border border-gray-300 p-2 rounded mt-1 text-sm font-mono focus:border-red-500 focus:outline-none" value={formData.server_ip} onChange={e => setFormData({ ...formData, server_ip: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Version</label>
                  <input className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 focus:outline-none" value={formData.current_version} onChange={e => setFormData({ ...formData, current_version: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Trạng thái</label>
                  <select className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 focus:outline-none bg-white" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="LIVE">Live (Đang chạy)</option>
                    <option value="MAINTENANCE">Bảo trì</option>
                    <option value="DOWN">Sập (Down)</option>
                    <option value="DEV">Dev / Test</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 flex justify-between mb-1">
                  <span>CONFIG (JSON)</span>
                  <span className="font-normal text-gray-400">VD: {"{ \"theme\": \"dark\" }"}</span>
                </label>
                <textarea 
                  className="w-full border border-gray-300 p-2 rounded mt-1 text-xs font-mono bg-gray-50 h-24 focus:bg-white focus:border-red-500 focus:outline-none transition-all" 
                  value={formData.custom_config_str} 
                  onChange={e => setFormData({ ...formData, custom_config_str: e.target.value })}
                  placeholder='{ "key": "value" }'
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 flex items-center gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}