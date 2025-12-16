'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User, Lock, Save, Loader2, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState('')
  
  // State đổi mật khẩu
  const [passwords, setPasswords] = useState({ newPass: '', confirmPass: '' })
  const [message, setMessage] = useState({ text: '', type: '' }) // type: 'success' | 'error'

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Lấy role từ bảng profiles
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (data) setRole(data.role)
      }
    }
    getUser()
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ text: '', type: '' })

    if (passwords.newPass.length < 6) {
      setMessage({ text: 'Mật khẩu phải có ít nhất 6 ký tự!', type: 'error' })
      return
    }

    if (passwords.newPass !== passwords.confirmPass) {
      setMessage({ text: 'Mật khẩu xác nhận không khớp!', type: 'error' })
      return
    }

    setLoading(true)
    // Gọi hàm update của Supabase
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass })

    if (error) {
      setMessage({ text: 'Lỗi: ' + error.message, type: 'error' })
    } else {
      setMessage({ text: 'Đổi mật khẩu thành công!', type: 'success' })
      setPasswords({ newPass: '', confirmPass: '' })
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tài khoản của tôi</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. THÔNG TIN CÁ NHÂN (Chỉ xem) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 border-2 border-red-200">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Thông tin hồ sơ</h2>
              <p className="text-sm text-gray-500">Quản lý bởi Admin</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Email đăng nhập</label>
              <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 text-gray-700 text-sm font-medium">
                {user?.email}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Vai trò (Role)</label>
              <div className="mt-1 flex items-center gap-2">
                <span className={`px-3 py-1 rounded text-xs font-bold ${role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {role || 'LOADING...'}
                </span>
                {role === 'ADMIN' && <ShieldCheck className="h-4 w-4 text-purple-600"/>}
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 italic">Nếu muốn thay đổi email hoặc tên, vui lòng liên hệ bộ phận kỹ thuật.</p>
            </div>
          </div>
        </div>

        {/* 2. ĐỔI MẬT KHẨU */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-yellow-500">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-bold text-gray-900">Đổi mật khẩu</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Mật khẩu mới</label>
              <input 
                type="password" required 
                className="w-full mt-1 p-2 rounded border border-gray-300 text-sm focus:border-red-500 focus:outline-none"
                placeholder="••••••••"
                value={passwords.newPass}
                onChange={e => setPasswords({...passwords, newPass: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Xác nhận mật khẩu</label>
              <input 
                type="password" required 
                className="w-full mt-1 p-2 rounded border border-gray-300 text-sm focus:border-red-500 focus:outline-none"
                placeholder="••••••••"
                value={passwords.confirmPass}
                onChange={e => setPasswords({...passwords, confirmPass: e.target.value})}
              />
            </div>

            {/* Thông báo lỗi/thành công */}
            {message.text && (
              <div className={`p-3 rounded text-sm font-medium flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {message.type === 'success' && <ShieldCheck className="h-4 w-4"/>}
                {message.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700 flex items-center justify-center gap-2 shadow-md shadow-red-100"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Save className="h-4 w-4" /> Cập nhật mật khẩu</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}