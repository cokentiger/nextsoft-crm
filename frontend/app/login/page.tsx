'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Đăng nhập thất bại. Kiểm tra lại thông tin.')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-2xl border-t-4 border-red-600">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="text-red-600">Next</span>
            <span className="text-gray-900">soft</span>
            <span className="text-yellow-500 text-lg">.vn</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">Đăng nhập hệ thống quản trị</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input 
                  type="email" required 
                  className="block w-full rounded-md border border-gray-300 pl-10 p-2 focus:border-red-500 focus:ring-red-500 focus:outline-none"
                  placeholder="admin@nextsoft.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Mật khẩu</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input 
                  type="password" required 
                  className="block w-full rounded-md border border-gray-300 pl-10 p-2 focus:border-red-500 focus:ring-red-500 focus:outline-none"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100 flex items-center justify-center font-medium">{error}</div>}

          <button type="submit" disabled={loading} className="group relative flex w-full justify-center rounded-md bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 focus:outline-none disabled:opacity-70 transition-colors shadow-lg shadow-red-200">
            {loading ? <Loader2 className="animate-spin h-5 w-5"/> : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}