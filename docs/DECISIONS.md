# Nextsoft CRM — Architectural Decisions (DECISIONS / ADR‑lite)

Tài liệu ghi lại các quyết định kiến trúc quan trọng, lý do và trade-offs.  
Mỗi quyết định có thể cập nhật theo thời gian; khi thay đổi, phải bổ sung mục mới.

---

## ADR-001 — Tách Frontend (Next.js) và Backend (FastAPI)

**Status**: Accepted (observed).  
**Context**: Repo có `frontend/` (Next.js App Router) và `backend/` (FastAPI).

**Decision**
- UI/UX và routing chạy trong Next.js (`frontend/app/**`).
- Backend FastAPI tồn tại để cung cấp API/DB querying (hiện có các endpoint minimal).

**Rationale**
- Tách concerns theo runtime/stack (JS/TS vs Python).
- Dễ onboard dev theo chuyên môn.

**Trade-offs**
- Nếu frontend không dùng backend (hiện trạng): backend có thể trở thành “dead code” hoặc nguồn divergence.
- Nếu tương lai dùng backend làm BFF: cần thống nhất pattern gọi dữ liệu.

**References**
- `frontend/app/**`
- `backend/main.py`

---

## ADR-002 — Direct Supabase Access từ Frontend (hiện trạng)

**Status**: Accepted (observed current behavior).  
**Context**: Frontend thực hiện login/logout/getUser và CRUD nhiều bảng qua `supabase.from(...)`.

**Decision**
- Frontend gọi Supabase trực tiếp bằng browser client (`NEXT_PUBLIC_SUPABASE_*`).

**Rationale**
- Giảm công xây dựng BFF ở giai đoạn đầu.
- Tận dụng Supabase Auth + policies + realtime (nếu dùng).

**Consequences / Trade-offs**
- Security boundary phụ thuộc **RLS policies**; sai RLS = rủi ro nghiêm trọng.
- Validation/business rules bị đẩy về client → dễ bypass.
- Audit/logging/ratelimit khó tập trung nếu không có backend trung gian.
- Khi scale: dễ phát sinh nhu cầu BFF cho nghiệp vụ phức tạp.

**References**
- `frontend/utils/supabase/client.ts`
- `frontend/app/login/page.tsx`
- `frontend/app/(dashboard)/**/page.tsx`

---

## ADR-003 — Backend Minimal Endpoints (Public) và nhu cầu hardening

**Status**: Needs review (risk).  
**Context**: `backend/main.py` có 3 endpoint GET và không có auth/CORS.

**Decision (current)**
- Expose endpoints như `/customers` và `/deployments/search` mà không auth.

**Rationale (likely, inferred from minimal code)**
- Phục vụ test nhanh / PoC / health check.

**Risks**
- Nếu backend deploy public: lộ dữ liệu.
- Không CORS: browser không gọi cross-origin (nếu dự tính dùng backend từ frontend).

**Next decision needed**
- Quyết định rõ: backend có vai trò gì?
  - Option A: Chỉ dùng nội bộ/dev → khóa network, không public.
  - Option B: Là BFF/SSOT → thêm auth validation, schemas, routers, logging, CORS.

**References**
- `backend/main.py`

---

## ADR-004 — Version pinning cho backend dependencies

**Status**: Proposed.  
**Context**: `backend/requirements.txt` không pin versions.

**Decision**
- Đưa ra phương án pin versions (ví dụ `fastapi==...`, `sqlalchemy==...`) hoặc dùng `pyproject.toml`/Poetry.

**Rationale**
- Reproducibility: tránh “works on my machine”.
- Tối ưu CI/CD và giảm rủi ro upgrade bất ngờ.

**Trade-offs**
- Cần quy trình update versions định kỳ (dependabot/renovate).

**References**
- `backend/requirements.txt`
