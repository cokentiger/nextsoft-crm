import sys
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
from dotenv import load_dotenv

# Load biến môi trường
load_dotenv()

# --- THÊM BACKEND PATH VÀO SYS.PATH (Xử lý linh hoạt đường dẫn) ---
backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# --- IMPORT MODULE AI (Xử lý nhiều trường hợp) ---
AIService = None
try:
    from services.ai_service import AIService
    print("✅ Loaded AI Service từ: services.ai_service")
except ImportError as e1:
    print(f"⚠️  Lỗi import services.ai_service: {e1}")
    try:
        from ai_service import AIService
        print("✅ Loaded AI Service từ: ai_service")
    except ImportError as e2:
        print(f"❌ CRITICAL: Không tìm thấy ai_service module!")
        print(f"   Error 1: {e1}")
        print(f"   Error 2: {e2}")
        # Fallback dummy class
        class AIService:
            @staticmethod
            def generate_content(*args, **kwargs):
                return {"error": "Server chưa tìm thấy module AI Service"}

app = FastAPI()

# --- CẤU HÌNH BẢO MẬT (CORS) ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://nextsoft-crm-web.onrender.com",
    "https://nextsoft-crm-web.onrender.com/", 
    "*" # Để test cho dễ
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    template_code: str
    data_context: Dict[str, Any]

@app.get("/")
def read_root():
    return {"status": "online", "service": "Nextsoft CRM Backend AI"}

@app.post("/api/ai/generate")
async def generate_ai_content(req: GenerateRequest):
    print(f"🤖 [API] Request: {req.template_code}")
    
    # Gọi AI Service
    result = AIService.generate_content(req.template_code, req.data_context)
    
    if "error" in result:
        print(f"❌ Error: {result['error']}")
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result