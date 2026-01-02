"use client";
import { useState } from "react";
// Import service
import { aiService } from "../../services/aiService"; 
import { Sparkles, Copy, Mail, RefreshCw } from "lucide-react"; // Thêm icon cho đẹp

interface AIAssistantProps {
  customerName: string;
  dealTitle: string;
  templateCode?: string;
}

// Danh sách văn phong
const TONES = [
  { value: "Chuyên nghiệp", label: "👔 Chuyên nghiệp" },
  { value: "Thân thiện", label: "🤝 Thân thiện" },
  { value: "Quyết liệt", label: "🔥 Quyết liệt (Chốt sale)" },
  { value: "Hài hước", label: "😄 Hài hước/Sáng tạo" },
];

export default function AIAssistant({ 
  customerName, 
  dealTitle, 
  templateCode = "SALE_QUOTE_FOLLOWUP" 
}: AIAssistantProps) {
  
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [tone, setTone] = useState("Chuyên nghiệp"); // Mặc định

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    // Không xóa content cũ ngay để người dùng có thể so sánh hoặc thấy đang chạy lại
    
    // Truyền thêm biến 'style' vào context
    const result = await aiService.generateContent(templateCode, {
      customer_name: customerName,
      deal_title: dealTitle,
      style: tone, // <-- Gửi văn phong xuống Backend
    });

    if (result.success && result.content) {
      setContent(result.content);
    } else {
      setError(result.error || "Có lỗi xảy ra khi gọi AI.");
    }
    setLoading(false);
  };

  // Hàm xử lý nút "Sử dụng" -> Mở Mail Client
  const handleUse = () => {
    const subject = encodeURIComponent(`Báo giá: ${dealTitle}`);
    const body = encodeURIComponent(content);
    // Mở trình quản lý mail mặc định (Outlook/Mail app)
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm mt-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600"/> 
          Trợ lý AI (Marketing)
        </h3>
        
        {/* Chọn Văn Phong */}
        <select 
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-gray-50 focus:border-blue-500 outline-none"
        >
          {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Context Info (Ẩn bớt cho gọn, chỉ hiện khi chưa có nội dung) */}
      {!content && (
        <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 mb-4">
          💡 AI sẽ viết email gửi <strong>{customerName}</strong> về dự án <strong>{dealTitle}</strong> theo giọng văn <strong>{tone}</strong>.
        </div>
      )}

      {/* Nút Tạo nội dung */}
      {!content && !loading && (
        <button
          onClick={handleGenerate}
          className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all flex justify-center items-center gap-2 shadow-md shadow-purple-100"
        >
          <Sparkles className="w-5 h-5" />
          Viết Email Ngay
        </button>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 animate-pulse">Đang suy nghĩ ({tone})...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 mb-3">
          ⚠️ {error}
        </div>
      )}

      {/* Kết quả & Actions */}
      {content && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <textarea
            className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-sans text-gray-800 text-sm leading-relaxed mb-3 shadow-inner"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          <div className="flex flex-wrap justify-end gap-2">
            {/* Nút Viết lại */}
            <button 
              onClick={handleGenerate}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 flex items-center gap-1"
              title="Viết lại bản khác"
            >
              <RefreshCw className="h-4 w-4"/> Viết lại
            </button>

            {/* Nút Copy */}
            <button 
              onClick={() => {
                navigator.clipboard.writeText(content);
                alert("Đã copy nội dung!");
              }}
              className="px-4 py-2 text-sm bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg font-medium flex items-center gap-2"
            >
              <Copy className="h-4 w-4"/> Copy
            </button>

            {/* Nút Sử dụng (Mở Mail) */}
            <button 
              onClick={handleUse}
              className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg font-bold shadow-sm flex items-center gap-2"
            >
              <Mail className="h-4 w-4"/> Gửi Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}