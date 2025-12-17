'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function UserPresence() {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Hàm khởi tạo kết nối
    const initPresence = async () => {
      // 1. Lấy thông tin user hiện tại
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Lấy thêm tên hiển thị (nếu có profile)
      const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
      const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'

      // 2. Tạo kênh Realtime
      const channel = supabase.channel('system_online_tracking')

      channel
        .on('presence', { event: 'sync' }, () => {
          // Khi có thay đổi (ai đó vào/ra), cập nhật danh sách
          const newState = channel.presenceState()
          const users: any[] = []
          
          for (const id in newState) {
            // @ts-ignore
            users.push(newState[id][0]) // Lấy thông tin người dùng
          }
          setOnlineUsers(users)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // 3. Gửi tín hiệu "Tôi đang Online" kèm thông tin
            await channel.track({
              user_id: user.id,
              name: displayName,
              online_at: new Date().toISOString(),
            })
          }
        })
    }

    initPresence()

    // Cleanup: Ngắt kết nối khi tắt component
    return () => {
      supabase.removeAllChannels()
    }
  }, [])

  return (
    <div className="mt-auto pt-6 border-t border-gray-800">
      <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2 px-2">
        <span className="relative flex h-2.5 w-2.5">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
        Trực tuyến ({onlineUsers.length})
      </h3>
      
      <div className="space-y-2 px-2 max-h-40 overflow-y-auto custom-scrollbar">
        {onlineUsers.map((u, idx) => (
          <div key={idx} className="flex items-center gap-2.5 group">
             {/* Avatar chữ cái */}
             <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-gray-600 group-hover:ring-green-500 transition">
               {u.name?.charAt(0).toUpperCase()}
             </div>
             
             <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate font-medium">{u.name}</p>
                <p className="text-[10px] text-gray-600 truncate">Online</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}