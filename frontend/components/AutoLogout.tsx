'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

// Cấu hình thời gian (Ví dụ: 30 phút = 1800000 ms)
const TIMEOUT_MS = 30 * 60 * 1000 

export default function AutoLogout() {
  const router = useRouter()
  const supabase = createClient()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Hàm đăng xuất
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login') 
    // Có thể thêm thông báo: alert('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.')
  }

  // Hàm reset bộ đếm
  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(handleLogout, TIMEOUT_MS)
  }

  useEffect(() => {
    // Các sự kiện được coi là "có hoạt động"
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

    // Gắn sự kiện lắng nghe
    const setupEvents = () => {
      events.forEach(event => window.addEventListener(event, resetTimer))
      resetTimer() // Bắt đầu đếm ngay khi vào trang
    }

    // Gỡ sự kiện khi component bị hủy
    const cleanupEvents = () => {
      events.forEach(event => window.removeEventListener(event, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }

    setupEvents()
    return cleanupEvents
  }, [])

  // Component này không hiển thị gì cả (Logic ngầm)
  return null 
}