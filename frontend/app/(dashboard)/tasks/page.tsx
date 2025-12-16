'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, CheckCircle, Trash2, Pencil, Search, User, Clock, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [submitting, setSubmitting] = useState(false)
  const [customers, setCustomers] = useState<any[]>([]); const [deals, setDeals] = useState<any[]>([]); const [tickets, setTickets] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([]); const [currentUser, setCurrentUser] = useState<string|null>(null)
  const [viewMode, setViewMode] = useState<'MINE'|'ALL'>('ALL'); const [searchTerm, setSearchTerm] = useState(''); const [editingId, setEditingId] = useState<string|null>(null)
  const supabase = createClient(); const router = useRouter()
  const [formData, setFormData] = useState({ title: '', status: 'TODO', customer_id: '', deal_id: '', ticket_id: '', assigned_to: '', due_date: '' })

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser(); setCurrentUser(user?.id||null)
      const t = await supabase.from('tasks').select('*, customers(name), deals(title), tickets(title), profiles(full_name, email)').order('due_date', { ascending: true })
      const c = await supabase.from('customers').select('id, name'); const d = await supabase.from('deals').select('id, title, customer_id').in('stage', ['NEW', 'NEGOTIATION'])
      const tk = await supabase.from('tickets').select('id, title, customer_id').in('status', ['OPEN', 'IN_PROGRESS']); const e = await supabase.from('profiles').select('id, full_name, email')
      setTasks(t.data||[]); setCustomers(c.data||[]); setDeals(d.data||[]); setTickets(tk.data||[]); setEmployees(e.data||[]); setLoading(false)
    }; fetch()
  }, [])

  const filtered = tasks.filter(t => (viewMode === 'ALL' || t.assigned_to === currentUser) && t.title.toLowerCase().includes(searchTerm.toLowerCase()))
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    const payload = { title: formData.title, status: formData.status, customer_id: formData.customer_id||null, deal_id: formData.deal_id||null, ticket_id: formData.ticket_id||null, assigned_to: formData.assigned_to||currentUser, due_date: formData.due_date||null }
    if (editingId) await supabase.from('tasks').update(payload).eq('id', editingId); else await supabase.from('tasks').insert([payload])
    setSubmitting(false); setShowModal(false); setEditingId(null); setFormData({ title: '', status: 'TODO', customer_id: '', deal_id: '', ticket_id: '', assigned_to: '', due_date: '' }); 
    const t = await supabase.from('tasks').select('*, customers(name), deals(title), tickets(title), profiles(full_name, email)').order('due_date', { ascending: true }); setTasks(t.data||[])
  }
  const handleDelete = async (id: string) => { if(confirm("Xóa việc?")) { await supabase.from('tasks').delete().eq('id', id); setTasks(tasks.filter(t => t.id !== id)) } }
  const toggleStatus = async (task: any) => { const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'; await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id); setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t)) }
  const handleEdit = (t: any) => { setEditingId(t.id); setFormData({ title: t.title, status: t.status, customer_id: t.customer_id, deal_id: t.deal_id, ticket_id: t.ticket_id, assigned_to: t.assigned_to, due_date: t.due_date ? t.due_date.split('T')[0] : '' }); setShowModal(true) }
  const isOverdue = (date: string) => { if (!date) return false; return new Date(date) < new Date(new Date().setHours(0,0,0,0)) }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Công việc</h1><p className="text-sm text-gray-500">Quản lý To-do list & Deadline</p></div>
        <button onClick={() => { setEditingId(null); setShowModal(true) }} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-red-700 shadow-md shadow-red-200"><Plus className="h-4 w-4"/> Thêm việc</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
         <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input type="text" placeholder="Tìm tên việc..." className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
         <div className="flex bg-white border rounded-md p-1"><button onClick={() => setViewMode('MINE')} className={`px-4 py-1.5 text-xs font-medium rounded ${viewMode==='MINE'?'bg-red-50 text-red-700':'text-gray-500 hover:bg-gray-50'}`}>Việc tôi</button><button onClick={() => setViewMode('ALL')} className={`px-4 py-1.5 text-xs font-medium rounded ${viewMode==='ALL'?'bg-red-50 text-red-700':'text-gray-500 hover:bg-gray-50'}`}>Tất cả</button></div>
      </div>

      <div className="space-y-3">
        {filtered.map(t => {
            const overdue = t.due_date && isOverdue(t.due_date) && t.status !== 'DONE';
            return (
            <div key={t.id} className={`bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm hover:shadow-md transition ${t.status === 'DONE' ? 'opacity-60 bg-gray-50' : 'border-l-4 border-l-transparent hover:border-l-yellow-500'}`}>
                <div className="flex gap-4 items-start">
                    <button onClick={() => toggleStatus(t)} className={`mt-0.5 h-6 w-6 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${t.status === 'DONE' ? 'bg-green-500 border-green-500 text-white' : 'hover:border-red-500'}`}>{t.status === 'DONE' && <CheckCircle className="h-4 w-4"/>}</button>
                    <div>
                        <div className={`font-medium text-base ${t.status === 'DONE' ? 'line-through text-gray-500' : 'text-gray-900'} ${overdue ? 'text-red-600 font-bold' : ''}`}>{t.title}</div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1.5 items-center">
                            {t.due_date && (<span className={`flex items-center gap-1 font-medium ${overdue ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded' : 'text-yellow-600'}`}><Clock className="h-3.5 w-3.5"/> {new Date(t.due_date).toLocaleDateString('vi-VN')}{overdue && " (Quá hạn)"}</span>)}
                            <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded"><User className="h-3 w-3"/> {t.profiles?.full_name||'--'}</span>
                            {t.customers && <span>• KH: {t.customers.name}</span>}
                            {t.deals && <span className="text-red-600 font-medium">• Deal: {t.deals.title}</span>}
                            {t.tickets && <span className="text-yellow-600 font-medium">• Ticket: {t.tickets.title}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2"><button onClick={() => handleEdit(t)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Pencil className="h-4 w-4"/></button><button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4"/></button></div>
            </div>
        )})}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl"><h2 className="text-lg font-bold mb-4">{editingId ? 'Sửa' : 'Thêm'} công việc</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <div><label className="text-xs font-bold text-gray-500 uppercase">NỘI DUNG</label><input className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required/></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Người làm</label><select className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.assigned_to||""} onChange={e => setFormData({...formData, assigned_to: e.target.value})}><option value="">-- Chọn --</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name||e.email}</option>)}</select></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Hạn chót</label><input type="date" className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} /></div>
                    </div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Khách hàng</label><select className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none" value={formData.customer_id||""} onChange={e => setFormData({...formData, customer_id: e.target.value, deal_id: '', ticket_id: ''})}><option value="">-- Chọn (Tùy chọn) --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Thuộc Deal</label><select className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none disabled:bg-gray-100" value={formData.deal_id||""} onChange={e => setFormData({...formData, deal_id: e.target.value, ticket_id: ''})} disabled={!formData.customer_id}><option value="">-- Không --</option>{deals.filter(d => !formData.customer_id || d.customer_id === formData.customer_id).map(d => <option key={d.id} value={d.id}>{d.title}</option>)}</select></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Thuộc Ticket</label><select className="w-full border border-gray-300 p-2 rounded mt-1 text-sm focus:border-red-500 outline-none disabled:bg-gray-100" value={formData.ticket_id||""} onChange={e => setFormData({...formData, ticket_id: e.target.value, deal_id: ''})} disabled={!formData.customer_id}><option value="">-- Không --</option>{tickets.filter(t => !formData.customer_id || t.customer_id === formData.customer_id).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Hủy</button><button className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 flex items-center gap-1">{submitting && <Loader2 className="h-3 w-3 animate-spin"/>} Lưu</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}