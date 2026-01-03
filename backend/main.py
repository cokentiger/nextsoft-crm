import sys
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
from dotenv import load_dotenv

# 1. Load biến môi trường
load_dotenv()

# 2. IMPORT MODULE AI (Xử lý linh hoạt đường dẫn)
# Code này giúp anh chạy được dù file ai_service.py nằm ở gốc hay trong folder services/
try:
    # Trường hợp chuẩn: nằm trong folder services
    from services.ai_service import AIService
    print("✅ Đã load module: services.ai_service")
except ImportError:
    try:
        # Trường hợp phụ: nằm ngay cạnh main.py
        from ai_service import AIService
        print("✅ Đã load module: ai_service (root)")
    except ImportError:
        print("❌ Lỗi nghiêm trọng: Không tìm thấy file 'ai_service.py'. Vui lòng kiểm tra lại cấu trúc thư mục!")
        # Class giả để không crash app lúc khởi động, nhưng sẽ lỗi khi gọi
        class AIService:
            @staticmethod
            def generate_content(*args, **kwargs):
                return {"error": "Server chưa tìm thấy module AI Service"}

app = FastAPI()

# --- 3. CẤU HÌNH BẢO MẬT (CORS) ---
# Cho phép Frontend gọi vào Backend
origins = [
    "http://localhost:3000",        # Next.js Localhost
    "http://127.0.0.1:3000",        # Next.js IP Local
    "https://nextsoft-crm-web.onrender.com",  # Domain Frontend Render
    "https://nextsoft-crm-api.onrender.com",  # Domain Backend Render (cho localhost calls)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Cho phép mọi method: GET, POST, PUT, DELETE...
    allow_headers=["*"],
)

# --- 4. ĐỊNH NGHĨA DỮ LIỆU ĐẦU VÀO ---
class GenerateRequest(BaseModel):
    template_code: str            # Mã kịch bản (VD: SALE_QUOTE_FOLLOWUP)
    data_context: Dict[str, Any]  # Dữ liệu đi kèm (VD: customer_name, deal_title...)

# --- 5. CÁC API ENDPOINTS ---

@app.get("/")
def read_root():
    return {
        "status": "online", 
        "service": "Nextsoft CRM Backend AI",
        "tech": "FastAPI + Google Gemini"
    }

@app.post("/api/ai/generate")
async def generate_ai_content(req: GenerateRequest):
    """
    API tạo nội dung tự động bằng AI.
    - Input: template_code, data_context
    - Output: { success: true, content: "..." }
    """
    print(f"🤖 [API] Nhận yêu cầu: {req.template_code}")
    print(f"📄 Context: {req.data_context}")
    
    # Gọi sang AI Service (File ai_service.py chúng ta vừa sửa)
    result = AIService.generate_content(req.template_code, req.data_context)
    
    # Xử lý lỗi trả về từ Service
    if "error" in result:
        print(f"❌ [API] Thất bại: {result['error']}")
        # Trả về mã lỗi 400 hoặc 500 tùy tình huống
        status_code = 429 if "429" in str(result["error"]) else 400
        raise HTTPException(status_code=status_code, detail=result["error"])
    
    print("✅ [API] Hoàn tất thành công!")
    return result

# Endpoint cũ (Giữ lại để tương thích code cũ nếu có)
@app.get("/customers")
def get_customers():
    return {"message": "Use Supabase Client directly for now"}