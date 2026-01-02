# Nextsoft CRM — Tài liệu Kiến trúc Kỹ thuật (ARCHITECTURE)

**Phạm vi tài liệu**: Repo `nextsoft-crm` (phân tích dựa trên cấu trúc và các file đã được Copilot đọc/đối chiếu).  
**Mục tiêu sử dụng**: onboarding dev, quản lý dự án, kiểm soát AI-generated code.

> Lưu ý về bằng chứng: Các nhận định quan trọng đều có **reference file path** kèm theo. (Ví dụ: `frontend/package.json`, `backend/main.py`, `PROJECT_DOCUMENTATION.md`, …)

---

## 1) Tổng quan kiến trúc

### 1.1 Kiến trúc tổng thể (high-level)
Hệ thống hiện tại là mô hình **2-tier** tách:
- **Frontend**: Next.js App Router (React) + Tailwind CSS, chạy trong `frontend/`.
- **Backend**: FastAPI + SQLAlchemy, chạy trong `backend/`.
- **Database**: PostgreSQL (thể hiện qua `DATABASE_URL`), dùng Supabase pooler.  
- **Auth/Data Access chính**: Frontend dùng **Supabase SDK** để xác thực và truy cập dữ liệu trực tiếp (Direct Supabase from client).

**Evidence / references**
- Frontend stack: `frontend/package.json`, `frontend/app/**`, `frontend/globals.css`.
- Backend stack: `backend/main.py`, `backend/requirements.txt`.
- Database URL: `backend/.env`, `backend/main.py`.
- Supabase usage: `PROJECT_DOCUMENTATION.md`, `frontend/utils/supabase/client.ts`, `frontend/app/login/page.tsx`, `frontend/components/Sidebar.tsx`.

### 1.2 Triết lý triển khai (observed)
- UX theo hướng SPA-like trên App Router.
- Dữ liệu phần lớn đi **Browser → Supabase** (auth + CRUD nhiều bảng).
- Backend FastAPI tồn tại nhưng **không có bằng chứng frontend gọi trực tiếp** (không thấy `fetch('/api')`/gọi URL FastAPI từ code nguồn; chủ yếu là Supabase client).

**Evidence / references**
- Frontend data calls: `frontend/app/(dashboard)/*/page.tsx`, `frontend/app/login/page.tsx`.
- Backend endpoints tồn tại: `backend/main.py`.

---

## 2) Kiến trúc logic (Logical Architecture)

### 2.1 Presentation Layer (UI/UX)
- Nằm trong `frontend/app/` và `frontend/components/`.
- App Router routes theo folder `app/**/page.tsx`.
- Sidebar / AutoLogout / UserPresence phục vụ điều hướng và quản lý phiên.

**References**
- `frontend/app/layout.tsx`, `frontend/app/(dashboard)/layout.tsx`
- `frontend/components/Sidebar.tsx`, `frontend/components/AutoLogout.tsx`, `frontend/components/UserPresence.tsx`

### 2.2 Application Layer (Orchestration)
- Chủ yếu hiện diện trong các page client-side: kiểm tra session, gọi Supabase, map dữ liệu lên UI state.
- Hiện chưa thấy mô hình service layer rõ ràng ở frontend; logic gọi data nằm trực tiếp trong page components.

**References**
- `frontend/app/(dashboard)/page.tsx` và các trang con (customers/deals/deployments/tasks/tickets/...)

### 2.3 Domain Layer (Entities & Business Concepts)
- Khái niệm domain thể hiện qua các bảng và logic UI:
  - `customers`, `deals`, `deployments`, `products`, `tasks`, `tickets`, `contracts`, `profiles`, `deal_items`, …
- Backend có SQLAlchemy models tối thiểu (theo mô tả của Copilot) và các endpoint đọc dữ liệu.

**References**
- Frontend tables: `frontend/app/(dashboard)/**/page.tsx`
- Backend entities/endpoints: `backend/main.py`

### 2.4 Infrastructure Layer (Persistence/External Services)
- Supabase client factory: tạo browser client bằng `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Backend tạo `engine` bằng `DATABASE_URL` (đã xử lý chuyển `postgres://` → `postgresql://`).
- Next config cho images và runtime.

**References**
- Supabase: `frontend/utils/supabase/client.ts`, `PROJECT_DOCUMENTATION.md`
- DB engine: `backend/main.py`, `backend/.env`
- Next config: `frontend/next.config.ts`

### 2.5 Separation of Concerns (SoC) — hiện trạng
**Đã tách**: UI (frontend) vs API (backend) về mặt thư mục.  
**Chưa tách tốt**:
- Dữ liệu/validation/business rule đang nằm rải rác trong pages (frontend).
- Backend `main.py` là file đơn (monofile) chứa nhiều concerns (app init + models + endpoints).

**References**
- `frontend/app/**/page.tsx`
- `backend/main.py` (file duy nhất trong backend ngoài requirements)

---

## 3) Cấu trúc vật lý (Physical Structure)

### 3.1 Cây thư mục cấp cao (3–4 tầng)
```
nextsoft-crm/
  PROJECT_DOCUMENTATION.md
  README.md
  package.json
  package-lock.json
  backend/
    .env
    main.py
    requirements.txt
    __pycache__/
  frontend/
    .env.local
    app/
      layout.tsx
      globals.css
      login/page.tsx
      (dashboard)/
        layout.tsx
        page.tsx
        customers/page.tsx
        deals/page.tsx
        deployments/page.tsx
        products/page.tsx
        tasks/page.tsx
        tickets/page.tsx
        reports/page.tsx
        profile/page.tsx
        contracts/page.tsx
    components/
      Sidebar.tsx
      AutoLogout.tsx
      UserPresence.tsx
    public/
      fonts/Roboto-Regular.ttf
      ...
    middleware.ts
    next.config.ts
    tsconfig.json
    eslint.config.mjs
    postcss.config.mjs
    package.json
    utils/
  utils/
    supabase/
      client.ts   (theo tài liệu và kết quả tìm kiếm)
```

**References**
- Directory tree được Copilot in ra sau khi đọc: root, `backend/`, `frontend/`, `frontend/app`, `utils/`.
- `PROJECT_DOCUMENTATION.md` mô tả đường dẫn `utils/supabase/client.ts`.

### 3.2 Quy ước đặt tên
- React components: `PascalCase.tsx` (ví dụ `Sidebar.tsx`).  
- Route folders theo App Router: lower-case (ví dụ `customers/page.tsx`).  
- Backend: file `main.py` và các lớp SQLAlchemy `PascalCase` (nếu có).

**References**
- `frontend/components/*`
- `frontend/app/(dashboard)/*/page.tsx`
- `backend/main.py`

---

## 4) Data Flow & Processing

### 4.1 Luồng chính (hiện trạng phổ biến)
**Browser → Next.js UI → Supabase (Auth + DB) → UI render**

- Login: `supabase.auth.signInWithPassword(...)`
- Auth/session: `supabase.auth.getUser()`, `supabase.auth.signOut()`
- CRUD: `supabase.from('<table>').select/insert/update/delete`

**References**
- Login: `frontend/app/login/page.tsx`
- Logout: `frontend/components/Sidebar.tsx`, `frontend/components/AutoLogout.tsx`
- CRUD tables: `frontend/app/(dashboard)/**/page.tsx`
- Supabase client: `frontend/utils/supabase/client.ts`

### 4.2 Luồng backend (tồn tại nhưng chưa thấy được gọi từ frontend)
Backend có các endpoint public:
- `GET /` (health)
- `GET /customers`
- `GET /deployments/search?feature_key=...` (raw SQL JSONB)

**References**
- `backend/main.py` (decorators `@app.get(...)`)

### 4.3 Điểm xử lý trung tâm & điểm rủi ro khi sửa
**Điểm xử lý trung tâm**
- Supabase client factory: mọi call phụ thuộc biến môi trường public `NEXT_PUBLIC_*`.
- Backend DB engine: phụ thuộc `DATABASE_URL` + logic normalize scheme.

**Rủi ro**
- Nếu hệ thống dùng Direct Supabase: chính sách RLS là “tường lửa” thực sự. Sai RLS = lộ dữ liệu.
- Nếu team bắt đầu pha trộn (Supabase direct + backend API): dễ xảy ra “2 đường nghiệp vụ” cho cùng dữ liệu → khó audit, khó nhất quán.

**References**
- `frontend/utils/supabase/client.ts`
- `backend/main.py`
- Pages sử dụng Supabase trực tiếp: `frontend/app/(dashboard)/**/page.tsx`

---

## 5) Dependencies & Integrations

### 5.1 Frontend dependencies (versions)
- Next.js: `16.0.10`
- React: `19.2.1`
- Supabase:
  - `@supabase/ssr`: `^0.8.0`
  - `@supabase/supabase-js`: `^2.87.1`
- Tailwind CSS v4 (thể hiện qua package và `@import "tailwindcss"`)

**References**
- `frontend/package.json`
- `frontend/app/globals.css`

### 5.2 Backend dependencies
`backend/requirements.txt` có (không pin version):
- `fastapi`, `uvicorn`, `sqlalchemy`, `psycopg2-binary`, `python-dotenv`

**References**
- `backend/requirements.txt`

### 5.3 External integrations
- Supabase (Auth + Database access từ client).
- PostgreSQL (qua Supabase pooler URL trong `DATABASE_URL`).

**References**
- `PROJECT_DOCUMENTATION.md`
- `backend/.env`
- `frontend/utils/supabase/client.ts`

---

## 6) Deployment / Configuration

### 6.1 Entry points
- Backend chạy bằng: `uvicorn main:app --reload` (run từ thư mục `backend/`).
- Frontend chạy bằng: `npm run dev` (Next dev), app router đọc từ `frontend/app/`.

**References**
- Backend: `backend/main.py`, `PROJECT_DOCUMENTATION.md`
- Frontend: `frontend/package.json`, `frontend/app/layout.tsx`

### 6.2 Environment variables (observed)
- Backend:
  - `DATABASE_URL` (trong `backend/.env`; đọc bằng `os.getenv()` trong `backend/main.py`)
- Frontend:
  - `.env.local` tồn tại (đã thấy trong tree)
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (được dùng trong `frontend/utils/supabase/client.ts`)

**References**
- `backend/.env`, `backend/main.py`
- `frontend/.env.local`, `frontend/utils/supabase/client.ts`

---

## 7) Security Posture (hiện trạng)

### 7.1 Backend security
- `backend/main.py` có 3 endpoint, **không có auth dependency**.
- Không có `CORSMiddleware` (không cấu hình CORS).

**References**
- Endpoints: `backend/main.py` (`@app.get(...)`)
- CORS: không có `CORSMiddleware` trong `backend/main.py`

### 7.2 Frontend security
- Dựa vào Supabase Auth (sign-in/sign-out/getUser).
- Nếu frontend truy cập DB trực tiếp: bắt buộc **RLS policies** chuẩn để tránh lộ/ghi sai dữ liệu.

**References**
- `frontend/app/login/page.tsx`, `frontend/components/Sidebar.tsx`
- CRUD trực tiếp: `frontend/app/(dashboard)/**/page.tsx`

---

## 8) Technical Debt & Risks

### 8.1 Technical debt (ưu tiên cao)
1. **Backend public endpoints** (không auth) — nếu deploy public sẽ rủi ro dữ liệu. (`backend/main.py`)  
2. **Thiếu CORS** (nếu dự định gọi backend từ browser). (`backend/main.py`)  
3. **Không có version pin** cho backend deps. (`backend/requirements.txt`)  
4. **Thiếu migrations strategy** (Alembic) — chưa thấy trong repo.  
5. **Logic data access phân tán ở frontend pages** — khó kiểm soát validation/audit.

### 8.2 Khuyến nghị ưu tiên (1–2 tuần)
- Chọn và “đóng” pattern kiến trúc dữ liệu:
  - **Option 1**: Giữ Direct Supabase → đầu tư RLS + audit/logging + server-side validations ở mức cần thiết.
  - **Option 2**: Chuyển sang Backend-for-Frontend (BFF) cho các luồng quan trọng → backend làm single source of truth.  
- Nâng cấp backend tối thiểu: CORS + auth validation (Supabase JWT) + schemas (Pydantic) + pagination.
- Pin versions backend, thêm `.env.example` và scripts chuẩn hóa chạy local.

**References**
- Pattern hiện trạng: `frontend/app/(dashboard)/**/page.tsx`
- Backend gaps: `backend/main.py`, `backend/requirements.txt`

---

## 9) Appendix — Evidence Table (tóm tắt)
Các claim quan trọng và bằng chứng đã được Copilot tổng hợp (rút gọn):
- Supabase cho auth: `PROJECT_DOCUMENTATION.md`, `frontend/app/login/page.tsx`  
- Backend endpoint `/customers`: `backend/main.py` (`@app.get("/customers")`)  
- Postgres + `DATABASE_URL`: `backend/.env`, `backend/main.py`  
- Raw SQL JSONB query: `backend/main.py` (`custom_config ? :key`)  
- Tailwind: `frontend/app/globals.css` (`@import "tailwindcss"`) + `frontend/package.json`
