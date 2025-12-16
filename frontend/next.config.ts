import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // --- Đã xóa devIndicators để tránh lỗi phiên bản ---
  
  // Cấu hình cho phép load ảnh từ bên ngoài (Supabase, v.v...)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;