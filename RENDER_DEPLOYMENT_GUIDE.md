# Hướng dẫn Deploy lên Render

## ⚠️ Vấn đề phổ biến khi deploy AI Service lên Render

Khi deploy project lên GitHub + Render, AI Service báo lỗi vì:
1. **Frontend không biết backend URL** → Mặc định gọi `localhost:8000` (không tồn tại trên production)
2. **CORS không cấu hình đúng** → Backend từ chối request từ domain khác

---

## ✅ Cách Fix

### 1️⃣ Frontend (.env.local - Render Environment Variables)

Thêm biến môi trường **Backend API URL**:

```env
NEXT_PUBLIC_API_URL=https://nextsoft-crm-api.onrender.com
```

**Cách làm:**

1. **Tìm Backend Domain trên Render:**
   - Vào Render Dashboard
   - Chọn **Backend Service** (tên service Python)
   - Vào tab **Settings** hoặc **Overview**
   - Tìm dòng **"Render Domain"** → Copy link (ví dụ: `https://nextsoft-crm-api.onrender.com`)

2. **Thêm vào Frontend:**
   - Vào Render Dashboard
   - Chọn **Frontend Service** (tên service Next.js)
   - Vào tab **Environment**
   - Thêm biến mới:
     - **Key:** `NEXT_PUBLIC_API_URL`
     - **Value:** Paste domain vừa copy (ví dụ: `https://nextsoft-crm-api.onrender.com`)
   - Click **Save**
   - Render sẽ **redeploy** tự động

3. **Xác nhận:**
   - Chờ Frontend redeploy xong
   - Mở ứng dụng & test AI Feature

### 2️⃣ Backend (main.py - CORS Configuration)

Cập nhật CORS để chấp nhận request từ Render:

```python
origins = [
    "http://localhost:3000",        # Localhost
    "http://127.0.0.1:3000",        # Localhost IP
    "https://nextsoft-crm-web.onrender.com",      # Frontend Render Domain
    "https://nextsoft-crm-api.onrender.com",      # Backend Render Domain
]
```

### 3️⃣ Cấu hình Render Services

#### Backend Service:
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 8000`
- **Environment Variables:**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`

#### Frontend Service:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start` hoặc `npm run dev`
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_API_URL` ← **QUAN TRỌNG**

---

## 🔍 Cách Debug khi có lỗi

### 1. Kiểm tra Frontend nhận được API URL:
```javascript
// Mở Console (F12) → Tab Console
console.log(process.env.NEXT_PUBLIC_API_URL);
```

### 2. Kiểm tra Network Request:
- Mở DevTools → Tab Network
- Gọi AI Feature → Xem URL request
- Phải là: `https://nextsoft-crm-api.onrender.com/api/ai/generate`
- **Không phải:** `http://127.0.0.1:8000/api/ai/generate`

### 3. Kiểm tra Backend Logs:
- Render Dashboard → Backend Service → Logs
- Xem có lỗi import hay missing environment variables không

---

## 📝 Danh sách biến môi trường cần cấu hình

### Frontend
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=https://[backend-domain].onrender.com
```

### Backend
```
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
DATABASE_URL=...
```

---

## 🚀 Deploy Steps

1. Push code lên GitHub
2. Render tự động build & deploy
3. Cập nhật URLs nếu domain Render thay đổi
4. Test AI Feature → Nếu thành công là OK!

---

## ❓ Lỗi khác có thể gặp

| Lỗi | Nguyên nhân | Fix |
|-----|-----------|-----|
| `CORS error` | Backend CORS chưa add domain | Cập nhật `origins` list |
| `Cannot reach AI Service` | Frontend gọi sai URL | Kiểm tra `NEXT_PUBLIC_API_URL` |
| `500 Internal Server Error` | Backend missing env vars | Thêm biến vào Render Environment |
| `Google Gemini API Error` | GEMINI_API_KEY sai/hết quota | Kiểm tra key + quota Google |

