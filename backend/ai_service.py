import os
from google import genai
from google.genai import types
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Lấy biến môi trường (Hỗ trợ cả local .env và Render Environment)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Khởi tạo Client an toàn
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("⚠️  Cảnh báo: Thiếu cấu hình Supabase. AI Service sẽ không hoạt động.")

class AIService:
    @staticmethod
    def generate_content(template_code: str, data_context: dict):
        if not supabase:
            return {"error": "Server chưa cấu hình Supabase (Thiếu URL/KEY)."}

        try:
            # 1. Lấy Provider
            provider_res = supabase.table("ai_providers").select("*").eq("is_active", True).single().execute()
            if not provider_res.data:
                return {"error": "Không tìm thấy Provider AI nào kích hoạt."}
            
            provider = provider_res.data
            config = provider.get("config", {})
            
            # 2. Lấy Template
            template_res = supabase.table("ai_templates").select("*").eq("code", template_code).single().execute()
            if not template_res.data:
                return {"error": f"Không tìm thấy template: {template_code}"}
            
            template = template_res.data
            prompt = template["prompt_template"]

            # 3. Trộn dữ liệu
            for key, value in data_context.items():
                prompt = prompt.replace(f"{{{{{key}}}}}", str(value))

            # 4. Gọi Google Gemini
            if provider.get("code") == "GEMINI":
                return AIService._call_gemini_new_sdk(config, prompt)
            
            return {"error": f"Chưa hỗ trợ Provider: {provider.get('code')}"}

        except Exception as e:
            print(f"❌ System Error: {str(e)}")
            return {"error": f"Lỗi hệ thống: {str(e)}"}

    @staticmethod
    def _call_gemini_new_sdk(config, prompt):
        try:
            api_key = config.get("api_key")
            if not api_key:
                return {"error": "Thiếu API Key trong cấu hình Provider."}

            # Xử lý Model Name
            raw_model = config.get("model", "gemini-1.5-flash")
            if "2.0" in raw_model:
                print("⚠️ Model 2.0 chưa ổn định -> Chuyển về 1.5-flash")
                model_name = "gemini-1.5-flash"
            else:
                model_name = raw_model.replace("models/", "")

            print(f"🤖 Gọi Gemini: {model_name}")

            client = genai.Client(api_key=api_key, http_options={'api_version': 'v1'})
            
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
            return {"error": "AI trả về rỗng."}

        except Exception as e:
            return {"error": f"Lỗi Gemini: {str(e)}"}