'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, CheckCircle, Trash2, Pencil, Search, User, Clock, Loader2, Briefcase, Ticket, ArrowRight, X, AlertCircle, LayoutGrid, Check, ChevronDown } from 'lucide-react'

// --- COMPONENT SEARCHABLE SELECT (Tái sử dụng) ---
const SearchableSelect = ({ options, value, onChange, placeholder, labelKey = 'name', disabled = false }: any) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter((opt: any) => {
    const label = opt[labelKey] || opt.email || '' // Fallback cho user dùng email
    return label.toLowerCase().includes(search.toLowerCase())
  })
  
  const selectedOption = options.find((opt: any) => opt.id === value)
  const selectedLabel = selectedOption ? (selectedOption[labelKey] || selectedOption.email) : placeholder

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className={`relative w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={wrapperRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full border border-gray-300 px-3 py-2.5 rounded-lg bg-white flex justify-between items-center cursor-pointer hover:border-red-500 transition h-11 ${disabled ? 'bg-gray-100' : ''}`}
      >
        <span className={`text-sm truncate ${selectedOption ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          {selectedLabel}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute z-[9999] mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-hidden flex flex-col w-full animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input 
                autoFocus type="text" 
                className="w-full pl-8 pr-2 py-2 text-sm border border-gray-200 rounded outline-none focus:border-red-500"
                placeholder="Gõ để tìm..."
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
                  <span className="truncate mr-2">{opt[labelKey] || opt.email}</span>
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
export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Data liên kết
  const [customers, setCustomers] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  
  const [currentUser, setCurrentUser] = useState<string|null>(null)
  const [viewMode, setViewMode] = useState<'MINE'|'ALL'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string|null>(null)
  
  const supabase = createClient()

  // Form State
  const [formData, setFormData] = useState({ 
    title: '', status: 'TODO', customer_id: '', deal_id: '', ticket_id: '', assigned_to: '', due_date: '', priority: 'NORMAL'
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user?.id || null)

    const t = await supabase.from('tasks').select('*, customers(name), deals(title), tickets(title), profiles(full_name, email)').order('due_date', { ascending: true })
    
    // Load Data select
    const c = await supabase.from('customers').select('id, name')
    const d = await supabase.from('deals').select('id, title, customer_id').neq('stage', 'WON').neq('stage', 'LOST')
    const tk = await supabase.from('tickets').select('id, title, customer_id').neq('status', 'RESOLVED')
    // Lấy tên nhân viên, nếu không có full_name thì lấy email
    const e = await supabase.from('profiles').select('id, full_name, email')

    setTasks(t.data || [])
    setCustomers(c.data || [])
    setDeals(d.data || [])
    setTickets(tk.data || [])
    setEmployees(e.data || [])
    setLoading(false)
  }

  // --- LOGIC ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    const payload = {
      title: formData.title,
      status: formData.status,
      customer_id: formData.customer_id || null,
      deal_id: formData.deal_id || null,
      ticket_id: formData.ticket_id || null,
      assigned_to: formData.assigned_to || currentUser,
      due_date: formData.due_date || null,
      priority: formData.priority || 'NORMAL'
    }

    if (editingId) await supabase.from('tasks').update(payload).eq('id', editingId)
    else await supabase.from('tasks').insert([payload])

    setSubmitting(false); setShowModal(false); setEditingId(null)
    setFormData({ title: '', status: 'TODO', customer_id: '', deal_id: '', ticket_id: '', assigned_to: '', due_date: '', priority: 'NORMAL' })
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa công việc này?")) return
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  const moveNextStatus = async (task: any) => {
    let nextStatus = 'TODO'
    if (task.status === 'TODO') nextStatus = 'IN_PROGRESS'
    else if (task.status === 'IN_PROGRESS') nextStatus = 'DONE'
    else return

    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t))
    await supabase.from('tasks').update({ status: nextStatus }).eq('id', task.id)
  }

  const handleEdit = (t: any) => {
    setEditingId(t.id)
    setFormData({
      title: t.title,
      status: t.status || 'TODO',
      customer_id: t.customer_id || '',
      deal_id: t.deal_id || '',
      ticket_id: t.ticket_id || '',
      assigned_to: t.assigned_to || '',
      due_date: t.due_date ? t.due_date.split('T')[0] : '',
      priority: t.priority || 'NORMAL'
    })
    setShowModal(true)
  }

  const isOverdue = (date: string) => {
    if (!date) return false
    return new Date(date) < new Date(new Date().setHours(0,0,0,0))
  }

  const filtered = tasks.filter(t => (viewMode === 'ALL' || t.assigned_to === currentUser) && t.title.toLowerCase().includes(searchTerm.toLowerCase()))
  const todoTasks = filtered.filter(t => t.status === 'TODO' || !t.status)
  const progressTasks = filtered.filter(t => t.status === 'IN_PROGRESS')
  const doneTasks = filtered.filter(t => t.status === 'DONE')

  const TaskCard = ({ task }: { task: any }) => {
    const overdue = isOverdue(task.due_date) && task.status !== 'DONE'
    return (
      <div className={`group bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-all mb-3 flex flex-col gap-2 relative ${task.status === 'DONE' ? 'opacity-70 bg-gray-50 border-gray-200' : 'border-gray-200 hover:border-blue-300'}`}>
        {task.priority === 'HIGH' && <div className="absolute left-0 top-3 bottom-3 w-1 bg-red-500 rounded-r"></div>}
        <div className="flex justify-between items-start pl-2">
          <div className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">{task.title}</div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={() => handleEdit(task)} className="p-1 text-gray-400 hover:text-blue-600 rounded bg-gray-50 hover:bg-blue-50"><Pencil className="h-3 w-3"/></button>
             <button onClick={() => handleDelete(task.id)} className="p-1 text-gray-400 hover:text-red-600 rounded bg-gray-50 hover:bg-red-50"><Trash2 className="h-3 w-3"/></button>
          </div>
        </div>
        <div className="space-y-1 pl-2">
           <div className="flex justify-between items-center text-xs">
              <span className={`flex items-center gap-1 font-medium ${overdue ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded' : 'text-gray-500'}`}>
                 <Clock className="h-3 w-3"/> {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'Không hạn'}
              </span>
              {task.profiles && <div className="flex items-center gap-1 text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded max-w-[100px] truncate"><User className="h-3 w-3"/> {task.profiles.full_name?.split(' ').pop()}</div>}
           </div>
           {(task.customers || task.deals || task.tickets) && (
             <div className="pt-2 border-t border-gray-50 mt-1 flex flex-col gap-1">
                {task.customers && <div className="text-[10px] text-gray-500 flex items-center gap-1 truncate"><User className="h-3 w-3"/> {task.customers.name}</div>}
                {task.deals && <div className="text-[10px] text-blue-600 flex items-center gap-1 truncate font-medium"><Briefcase className="h-3 w-3"/> {task.deals.title}</div>}
                {task.tickets && <div className="text-[10px] text-purple-600 flex items-center gap-1 truncate font-medium"><Ticket className="h-3 w-3"/> {task.tickets.title}</div>}
             </div>
           )}
        </div>
        {task.status !== 'DONE' && (
          <button onClick={() => moveNextStatus(task)} className="mt-1 w-full py-1.5 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded flex items-center justify-center gap-1 transition-colors">
             Tiếp theo <ArrowRight className="h-3 w-3"/>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 flex-shrink-0">
        <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><LayoutGrid className="h-6 w-6 text-gray-600"/> Bảng Công Việc</h1><p className="text-sm text-gray-500">Quản lý tiến độ theo mô hình Kanban.</p></div>
        <div className="flex gap-3 w-full sm:w-auto">
           <div className="flex bg-white border rounded-lg p-1">
              <button onClick={() => setViewMode('MINE')} className={`px-4 py-1.5 text-xs font-bold rounded ${viewMode==='MINE'?'bg-red-50 text-red-700':'text-gray-500 hover:bg-gray-50'}`}>Của tôi</button>
              <button onClick={() => setViewMode('ALL')} className={`px-4 py-1.5 text-xs font-bold rounded ${viewMode==='ALL'?'bg-red-50 text-red-700':'text-gray-500 hover:bg-gray-50'}`}>Tất cả</button>
           </div>
           <button onClick={() => { setEditingId(null); setShowModal(true) }} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 shadow-md">
             <Plus className="h-4 w-4"/> <span className="hidden sm:inline">Thêm việc</span>
           </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="mb-4 relative max-w-md flex-shrink-0"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input type="text" placeholder="Tìm kiếm công việc..." className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-red-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>

      {/* KANBAN BOARD */}
      {loading ? <div className="flex-1 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-red-600"/></div> : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden min-h-0">
          <div className="flex flex-col bg-gray-100/50 rounded-xl border border-gray-200 h-full overflow-hidden">
             <div className="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center"><h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm"><AlertCircle className="h-4 w-4 text-gray-500"/> Cần làm (To Do)</h3><span className="bg-white text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold border border-gray-200">{todoTasks.length}</span></div>
             <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">{todoTasks.map(t => <TaskCard key={t.id} task={t}/>)}</div>
          </div>
          <div className="flex flex-col bg-blue-50/50 rounded-xl border border-blue-100 h-full overflow-hidden">
             <div className="p-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center"><h3 className="font-bold text-blue-800 flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 text-blue-600 animate-spin-slow"/> Đang thực hiện</h3><span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold border border-blue-100">{progressTasks.length}</span></div>
             <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">{progressTasks.map(t => <TaskCard key={t.id} task={t}/>)}</div>
          </div>
          <div className="flex flex-col bg-green-50/50 rounded-xl border border-green-100 h-full overflow-hidden">
             <div className="p-3 bg-green-50 border-b border-green-100 flex justify-between items-center"><h3 className="font-bold text-green-800 flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-green-600"/> Hoàn thành</h3><span className="bg-white text-green-600 px-2 py-0.5 rounded-full text-xs font-bold border border-green-100">{doneTasks.length}</span></div>
             <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">{doneTasks.map(t => <TaskCard key={t.id} task={t}/>)}</div>
          </div>
        </div>
      )}

      {/* MODAL - ĐÃ SỬA: SIZE TO HƠN + SEARCHABLE SELECT */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
            {/* max-w-2xl: Modal to và thoáng hơn */}
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center rounded-t-xl">
                   <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Cập nhật Công việc' : 'Thêm Công việc mới'}</h2>
                   <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400 hover:text-red-600"/></button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Tên công việc <span className="text-red-500">*</span></label>
                        <input className="w-full border border-gray-300 px-4 py-2.5 rounded-lg text-sm focus:border-red-500 outline-none font-medium h-11" 
                          value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="Ví dụ: Gọi điện cho khách A..."/>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Người thực hiện</label>
                           {/* Dùng SearchableSelect thay vì select thường */}
                           <SearchableSelect 
                             options={employees} 
                             value={formData.assigned_to} 
                             onChange={(val: string) => setFormData({...formData, assigned_to: val})} 
                             placeholder="-- Chọn nhân viên --"
                             labelKey="full_name" // Hiển thị tên đầy đủ
                           />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Hạn chót (Deadline)</label>
                           <input type="date" className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:border-red-500 outline-none h-11" 
                             value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Trạng thái</label>
                           <select className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:border-red-500 outline-none bg-white h-11" 
                             value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                             <option value="TODO">📝 Cần làm</option>
                             <option value="IN_PROGRESS">⏳ Đang làm</option>
                             <option value="DONE">✅ Hoàn thành</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Mức độ ưu tiên</label>
                           <select className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:border-red-500 outline-none bg-white h-11" 
                             value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                             <option value="NORMAL">Bình thường</option>
                             <option value="HIGH">🔥 Gấp (High)</option>
                           </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t mt-2">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Liên kết dữ liệu (Tùy chọn)</label>
                        <div className="space-y-4">
                           {/* Khách hàng - Searchable */}
                           <div>
                             <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Khách hàng</label>
                             <SearchableSelect 
                               options={customers} 
                               value={formData.customer_id} 
                               onChange={(val: string) => setFormData({...formData, customer_id: val, deal_id: '', ticket_id: ''})} 
                               placeholder="-- Chọn Khách hàng --"
                             />
                           </div>
                           
                           <div className="grid grid-cols-2 gap-6">
                              {/* Deal - Searchable (Lọc theo khách) */}
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Theo Deal</label>
                                <SearchableSelect 
                                  options={deals.filter(d => !formData.customer_id || d.customer_id === formData.customer_id)} 
                                  value={formData.deal_id} 
                                  onChange={(val: string) => setFormData({...formData, deal_id: val, ticket_id: ''})} 
                                  placeholder="-- Chọn Deal --"
                                  labelKey="title"
                                  disabled={!formData.customer_id}
                                />
                              </div>
                              {/* Ticket - Searchable (Lọc theo khách) */}
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Theo Ticket</label>
                                <SearchableSelect 
                                  options={tickets.filter(t => !formData.customer_id || t.customer_id === formData.customer_id)} 
                                  value={formData.ticket_id} 
                                  onChange={(val: string) => setFormData({...formData, ticket_id: val, deal_id: ''})} 
                                  placeholder="-- Chọn Ticket --"
                                  labelKey="title"
                                  disabled={!formData.customer_id}
                                />
                              </div>
                           </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">Hủy</button>
                        <button type="submit" className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 flex items-center gap-2 shadow-lg transition-all active:scale-95">
                           {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Lưu công việc'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}