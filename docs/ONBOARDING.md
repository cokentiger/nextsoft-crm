# Nextsoft CRM — Onboarding (ONBOARDING)

Tài liệu này hướng dẫn chạy local và quy ước làm việc cho repo `nextsoft-crm`.

> Thông tin dựa trên cấu trúc repo và mô tả trong `PROJECT_DOCUMENTATION.md`, các manifest và file entry points.

---

## 1) Yêu cầu môi trường (Prerequisites)

### 1.1 Frontend
- Node.js (khuyến nghị LTS)
- npm

**References**
- `frontend/package.json`

### 1.2 Backend
- Python 3.x (repo có pyc `cpython-312` gợi ý Python 3.12, nhưng môi trường có thể khác)
- pip / venv

**References**
- `backend/__pycache__/main.cpython-312.pyc`
- `backend/requirements.txt`

### 1.3 Database / Supabase
- PostgreSQL (thực tế kết nối qua Supabase pooler URL)
- Tài khoản Supabase project (URL + ANON key)

**References**
- `backend/.env` (DATABASE_URL)
- `frontend/utils/supabase/client.ts` (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)

---

## 2) Cấu trúc dự án (đọc nhanh)
- `frontend/`: Next.js App Router UI + Supabase client.
- `backend/`: FastAPI minimal API + SQLAlchemy engine.
- `utils/`: có `utils/supabase/client.ts` (theo tài liệu và tìm kiếm).

**References**
- `PROJECT_DOCUMENTATION.md`
- `backend/main.py`
- `frontend/app/**`

---

## 3) Thiết lập biến môi trường

### 3.1 Backend (`backend/.env`)
Tạo/điều chỉnh file `backend/.env`:
- `DATABASE_URL=postgres://...` (hoặc `postgresql://...`)

Backend có logic normalize scheme `postgres://` → `postgresql://`.

**References**
- `backend/.env`
- `backend/main.py`

### 3.2 Frontend (`frontend/.env.local`)
Tạo/điều chỉnh `frontend/.env.local` (file đã tồn tại theo tree, nhưng nội dung tùy môi trường):
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`

**References**
- `frontend/.env.local` (existence from tree)
- `frontend/utils/supabase/client.ts`

### 3.3 Mẫu `.env.example` (khuyến nghị tạo)
Tạo các file mẫu để onboarding:
- `backend/.env.example`
- `frontend/.env.local.example`

**Không commit secrets**, chỉ commit placeholders.

---

## 4) Chạy local

### 4.1 Chạy Frontend (Next.js)
Từ thư mục `frontend/`:
```bash
npm install
npm run dev
```

**Entry points / routing**
- App Router root: `frontend/app/`
- Login: `frontend/app/login/page.tsx`
- Dashboard: `frontend/app/(dashboard)/page.tsx` và các route con.

**References**
- `frontend/package.json`
- `frontend/app/layout.tsx`, `frontend/app/(dashboard)/**`

### 4.2 Chạy Backend (FastAPI)
Từ thư mục `backend/`:
```bash
python -m venv .venv
source .venv/bin/activate  # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
uvicorn main:app --reload
```

**Entry point**
- `backend/main.py` chứa `app = FastAPI(...)`.

**References**
- `backend/main.py`
- `backend/requirements.txt`
- `PROJECT_DOCUMENTATION.md` (run command)

### 4.3 Chạy DB
- Repo hiện kết nối tới PostgreSQL bằng `DATABASE_URL` (thường là Supabase).
- Nếu muốn chạy PostgreSQL local: cần bổ sung `docker-compose.yml` (chưa có trong repo snapshot).

---

## 5) Scripts chuẩn (khuyến nghị bổ sung)
Hiện trạng script phụ thuộc `frontend/package.json` và hướng dẫn trong `PROJECT_DOCUMENTATION.md`.
Khuyến nghị chuẩn hóa thêm:
- Root `Makefile` hoặc `npm scripts` để chạy full stack:
  - `make dev` → chạy frontend + backend
- Thêm `backend/dev.sh` hoặc `backend/Makefile`

---

## 6) Quy ước code & review

### 6.1 Frontend
- App Router: route theo `app/<route>/page.tsx`.
- Component dùng `PascalCase.tsx`.
- Tailwind CSS v4 (trong globals).

**References**
- `frontend/app/globals.css`
- `frontend/components/*`

### 6.2 Backend
- Hiện có một file `backend/main.py` (monofile).
- Khi mở rộng: ưu tiên tách `routers/`, `schemas/`, `services/`, `repositories/` (xem `docs/ARCHITECTURE.md`).

**References**
- `backend/main.py`
- `docs/ARCHITECTURE.md`

### 6.3 Quy tắc AI
- Tuân thủ `docs/AI_RULES.md`.
