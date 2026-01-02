# Nextsoft CRM — AI Rules (AI_RULES)

**Mục tiêu**: Quy định sử dụng AI (Copilot / ChatGPT / Gemini) để tăng tốc phát triển nhưng **không phá vỡ kiến trúc, bảo mật và chất lượng** của repo `nextsoft-crm`.

**Áp dụng cho**: mọi thay đổi code trong repo.  
**Tài liệu tham chiếu**: `docs/ARCHITECTURE.md` (phải đọc trước khi AI sinh code).

---

## 1) Nguyên tắc “không thương lượng” (Non‑negotiables)

### 1.1 Không tự ý thay đổi kiến trúc
AI không được:
- Tự tạo pattern mới (BFF, CQRS, Clean Architecture, v.v.) nếu chưa có quyết định kiến trúc.  
- Tự chuyển hướng dữ liệu (từ Supabase direct sang FastAPI hoặc ngược lại) nếu chưa có quyết định trong `docs/DECISIONS.md`.

**References**
- Kiến trúc hiện trạng: `docs/ARCHITECTURE.md` (Frontend gọi Supabase trực tiếp; backend tồn tại nhưng không được gọi).

### 1.2 Không “rewrite core”
AI không được:
- Rewrite toàn bộ `frontend/app/(dashboard)/**` hoặc `backend/main.py` trong một PR.
- Thay đổi ồ ạt khi không có test/plan rollback.

### 1.3 Không thay đổi DB schema nếu không có migration
AI không được:
- Đổi tên cột/bảng, thay đổi kiểu dữ liệu, thêm constraint… nếu chưa có kế hoạch migration (Alembic hoặc migration strategy tương đương).  
- Đưa ra “quick fix” bằng cách thay schema trực tiếp trên Supabase mà không ghi lại.

**References**
- Chưa thấy migration tool trong repo; backend hiện chỉ có `backend/main.py`, `backend/requirements.txt`.

### 1.4 Không đưa secrets vào code / commit
AI không được:
- Viết hardcode key/token/password vào `.ts/.tsx/.py`.
- Gợi ý commit file `.env`, `.env.local` chứa secrets.

**References**
- Backend có `backend/.env`; frontend có `frontend/.env.local` (theo tree).

---

## 2) Quy trình làm việc với AI (bắt buộc)

### 2.1 Bước 0 — AI phải “đọc” trước khi viết
Trước khi viết code, yêu cầu AI thực hiện:
- Scan thư mục liên quan.
- Nêu rõ “điểm chạm” (files sẽ sửa) và ảnh hưởng.

Checklist bắt buộc:
- [ ] Nêu rõ file(s) sẽ thay đổi
- [ ] Nêu rõ luồng dữ liệu bị ảnh hưởng
- [ ] Nêu rủi ro bảo mật / breaking changes

### 2.2 Bước 1 — Sinh thiết kế thay vì code ngay
Mọi thay đổi > 30 dòng hoặc liên quan auth/data access phải qua 2 pha:
1) **Design proposal** (AI đề xuất + con người duyệt)
2) **Implementation** (AI code theo design đã duyệt)

### 2.3 Bước 2 — Self‑review của AI
Sau khi AI sinh code, bắt buộc yêu cầu AI tự review theo tiêu chí:
- Không phá kiến trúc?
- Không lộ secrets?
- Không làm giảm bảo mật (RLS/auth)?
- Có regression risk? cần test nào?

### 2.4 Bước 3 — Human review (bắt buộc)
Không merge code AI nếu:
- Người review không giải thích được logic và rủi ro.
- Không có steps chạy local / test tối thiểu.
- Thay đổi liên quan auth/data mà không có kiểm tra quyền.

---

## 3) “Khu vực nhạy cảm” cần phê duyệt (Approval Required)

### 3.1 Nhóm A — Phải có approval của tech lead
- `frontend/utils/supabase/**` (client factory / auth/session)
- `frontend/middleware.ts` (middleware ảnh hưởng auth/routing)
- `backend/main.py` (backend endpoints, DB engine)
- Mọi file `.env*`, config build/deploy

**References**
- Supabase client: `frontend/utils/supabase/client.ts`
- Middleware: `frontend/middleware.ts`
- Backend core: `backend/main.py`

### 3.2 Nhóm B — Phải có approval + test/verification
- `frontend/app/login/**` (auth flow)
- Mọi trang CRUD trong `frontend/app/(dashboard)/**`
- Các truy vấn liên quan quyền (profiles/role) trong pages

**References**
- Login: `frontend/app/login/page.tsx`
- CRUD pages: `frontend/app/(dashboard)/**/page.tsx`

---

## 4) Quy ước khi yêu cầu AI viết code

### 4.1 Prompt template (khuyến nghị)
- Nêu rõ: mục tiêu, phạm vi, file cần sửa, constraints (không đổi kiến trúc).
- Nêu rõ tiêu chuẩn output: typescript types, error handling, validation.

Mẫu:
> “Hãy sửa **chỉ** `frontend/app/(dashboard)/customers/page.tsx` để thêm phân trang. Không thay đổi cấu trúc thư mục. Không đổi logic auth. Trả về patch + giải thích rủi ro.”

### 4.2 Cấm “mở rộng phạm vi”
Nếu AI đề xuất sửa thêm file ngoài phạm vi, phải:
- Dừng lại
- Lý do hóa + xin duyệt

---

## 5) Tiêu chuẩn tối thiểu cho PR có AI hỗ trợ

PR phải có:
- [ ] Mô tả thay đổi + phạm vi file
- [ ] Steps chạy local (frontend/backend) xác nhận
- [ ] Ghi chú env vars cần có
- [ ] Đánh giá ảnh hưởng bảo mật (nếu liên quan data/auth)
- [ ] Checklist test tối thiểu

---

## 6) Lưu ý đặc thù kiến trúc hiện tại (Direct Supabase)

Vì frontend gọi Supabase trực tiếp:
- Mọi thay đổi CRUD phải xem xét **RLS policies** và quyền theo `profiles.role`.
- Không được assume “client-side check là đủ”. Client-side check chỉ là UX, **không phải security boundary**.

**References**
- Direct Supabase calls: `frontend/app/(dashboard)/**/page.tsx`
- Role check (profiles): được Copilot ghi nhận ở customers/profile pages.
