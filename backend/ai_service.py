import os
from google import genai
from google.genai import types
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Load biến môi trường
load_dotenv()

# 2. Cấu hình Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️  Cảnh báo: Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env")

# Khởi tạo Client Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class AIService:
    @staticmethod
    def generate_content(template_code: str, data_context: dict):
        try:
            # --- Lấy Provider ---
            provider_res = supabase.table("ai_providers").select("*").eq("is_active", True).single().execute()
            if not provider_res.data:
                return {"error": "Không tìm thấy nhà cung cấp AI nào được kích hoạt."}
            
            provider = provider_res.data
            config = provider.get("config", {})
            
            # --- Lấy Template ---
            template_res = supabase.table("ai_templates").select("*").eq("code", template_code).single().execute()
            if not template_res.data:
                return {"error": f"Không tìm thấy kịch bản mẫu: {template_code}"}
            
            template = template_res.data
            prompt = template["prompt_template"]

            # --- Trộn dữ liệu ---
            for key, value in data_context.items():
                prompt = prompt.replace(f"{{{{{key}}}}}", str(value))

            # --- Gọi Provider ---
            if provider.get("code") == "GEMINI":
                return AIService._call_gemini_new_sdk(config, prompt)
            
            return {"error": f"Chưa hỗ trợ Provider: {provider.get('code')}"}

        except Exception as e:
            print(f"❌ System Error: {str(e)}")
            return {"error": f"Lỗi hệ thống: {str(e)}"}

    @staticmethod
    def _call_gemini_new_sdk(config, prompt):
        """
        Hàm gọi Gemini SDK mới (google-genai)
        Hỗ trợ: Gemini 1.5, 2.0, 2.5...
        """
        try:
            api_key = config.get("api_key")
            if not api_key:
                return {"error": "Thiếu API Key Gemini."}

            # Lấy model từ DB (VD: gemini-2.5-flash)
            raw_model = config.get("model", "gemini-1.5-flash")
            
            # Logic lọc model cũ/lỗi (chỉ chặn đúng thằng 2.0 nếu anh muốn)
            if "2.0" in raw_model:
                print("⚠️ Phát hiện model Gemini 2.0 (Preview/Quota Limit). Tự động chuyển về 1.5 Flash.")
                model_name = "gemini-1.5-flash"
            else:
                # Với gemini-2.5-flash, nó sẽ chạy vào đây -> OK
                model_name = raw_model.replace("models/", "")

            print(f"🤖 Đang gọi Gemini (Model: {model_name})...")

            # Khởi tạo Client (Version v1 là chuẩn cho cả 1.5 và 2.5 Stable)
            client = genai.Client(
                api_key=api_key,
                http_options={'api_version': 'v1'} 
            )

            # Gọi API
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=config.get("temperature", 0.7),
                    max_output_tokens=config.get("max_output_tokens", 8192),
                )
            )

            if response.text:
                return {"success": True, "content": response.text}
            else:
                return {"error": "AI trả về rỗng (Safety Block)."}

        except Exception as e:
            error_msg = str(e)
            print(f"❌ Gemini SDK Error: {error_msg}")
            
            if "429" in error_msg:
                 return {"error": "Lỗi 429: Hết hạn mức (Quota)."}
            if "404" in error_msg:
                 return {"error": f"Lỗi 404: Model '{model_name}' không tồn tại hoặc Key chưa kích hoạt."}
            
            return {"error": f"Lỗi Gemini SDK: {error_msg}"}