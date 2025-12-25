# NEXTSOFT CRM - TÀI LIỆU DỰ ÁN TOÀN DIỆN

## 📋 TỔNG QUAN DỰ ÁN

**Tên dự án:** Nextsoft CRM  
**Loại dự án:** Hệ thống quản lý quan hệ khách hàng (CRM)  
**Kiến trúc:** Full-Stack (Frontend: Next.js, Backend: FastAPI)  
**Ngôn ngữ:** TypeScript (Frontend), Python (Backend)  
**Database:** PostgreSQL

---

## 🎯 MỤC ĐÍCH & CHỨC NĂNG CHÍNH

Nextsoft CRM là một nền tảng quản lý toàn diện cho các hoạt động kinh doanh bao gồm:

1. **Quản lý khách hàng** - Theo dõi thông tin khách hàng, sức khỏe khách hàng, giai đoạn vòng đời
2. **Quản lý sản phẩm** - Quản lý các sản phẩm/dịch vụ (phần mềm, server, dịch vụ, bảo trì)
3. **Quản lý thỏa thuận kinh doanh (Deals)** - Theo dõi các giao dịch bán hàng
4. **Quản lý triển khai** - Quản lý các triển khai ứng dụng cho khách hàng
5. **Quản lý nhiệm vụ** - Theo dõi các công việc cần làm
6. **Quản lý vé hỗ trợ** - Hệ thống quản lý yêu cầu hỗ trợ
7. **Báo cáo & Phân tích** - Trực quan hóa dữ liệu kinh doanh
8. **Hồ sơ người dùng** - Quản lý thông tin người dùng
9. **Hợp đồng** - Quản lý các hợp đồng với khách hàng

---

## 📂 CẤU TRÚC DỰ ÁN

```
nextsoft-crm/
├── README.md                          # Tài liệu dự án cơ bản
├── PROJECT_DOCUMENTATION.md           # Tài liệu này
│
├── backend/                           # API Server (FastAPI + PostgreSQL)
│   ├── main.py                        # Entry point - Cấu hình FastAPI, SQLAlchemy, Models, Endpoints
│   ├── requirements.txt                # Dependencies Python
│   └── __pycache__/                   # Cache Python
│
└── frontend/                          # Web Application (Next.js + React)
    ├── package.json                   # Dependencies & Scripts
    ├── tsconfig.json                  # TypeScript Configuration
    ├── next.config.ts                 # Next.js Configuration
    ├── next-env.d.ts                  # TypeScript Types cho Next.js
    ├── middleware.ts                  # Next.js Middleware (authentication, redirects, etc.)
    ├── eslint.config.mjs              # ESLint Configuration
    ├── postcss.config.mjs             # PostCSS Configuration
    ├── tailwind.config.ts             # Tailwind CSS Configuration (khụng hiển thị nhưng được sử dụng)
    ├── globals.css                    # Global Styles
    ├── public/                        # Static Assets (images, icons, etc.)
    │
    ├── app/                           # Next.js App Router Structure
    │   ├── layout.tsx                 # Root Layout
    │   ├── globals.css                # Global CSS
    │   │
    │   ├── login/                     # Trang đăng nhập
    │   │   └── page.tsx               # Login Page
    │   │
    │   └── (dashboard)/               # Route Group cho Dashboard (không ảnh hưởng URL)
    │       ├── layout.tsx             # Dashboard Layout (Sidebar, Navigation)
    │       ├── page.tsx               # Dashboard Home / Overview
    │       │
    │       ├── customers/             # Trang Quản lý Khách hàng
    │       │   └── page.tsx
    │       │
    │       ├── products/              # Trang Quản lý Sản phẩm
    │       │   └── page.tsx
    │       │
    │       ├── deals/                 # Trang Quản lý Thỏa thuận / Giao dịch
    │       │   └── page.tsx
    │       │
    │       ├── deployments/           # Trang Quản lý Triển khai
    │       │   └── page.tsx
    │       │
    │       ├── tasks/                 # Trang Quản lý Nhiệm vụ
    │       │   └── page.tsx
    │       │
    │       ├── tickets/               # Trang Quản lý Vé hỗ trợ
    │       │   └── page.tsx
    │       │
    │       ├── contracts/             # Trang Quản lý Hợp đồng
    │       │   └── page.tsx
    │       │
    │       ├── reports/               # Trang Báo cáo & Phân tích
    │       │   └── page.tsx
    │       │
    │       └── profile/               # Trang Hồ sơ người dùng
    │           └── page.tsx
    │
    ├── components/                    # Reusable React Components
    │   ├── AutoLogout.tsx             # Component tự động đăng xuất khi hết session
    │   ├── Sidebar.tsx                # Component thanh điều hướng bên cạnh
    │   └── UserPresence.tsx           # Component hiển thị trạng thái người dùng online
    │
    └── utils/                         # Utility Functions & Helpers
        └── supabase/
            └── client.ts              # Supabase Client Configuration & Integration
```

---

## 🔧 CÔNG NGHỆ & DEPENDENCIES

### Frontend Stack
- **Framework:** Next.js 16.0.10 (React 19.2.1)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **UI Components:** Lucide React (0.561.0) - Icon Library
- **Charts:** Recharts (3.6.0) - Data Visualization
- **Database Client:** Supabase (@supabase/supabase-js 2.87.1, @supabase/ssr 0.8.0)
- **Dev Tools:** ESLint 9, PostCSS 4

### Backend Stack
- **Framework:** FastAPI (Python)
- **Server:** Uvicorn
- **ORM:** SQLAlchemy
- **Database:** PostgreSQL (psycopg2-binary)
- **Environment:** python-dotenv (load env variables)

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Supabase Integration
- Dự án sử dụng **Supabase** cho xác thực người dùng
- Middleware Next.js xử lý authentication
- Client Supabase trong `utils/supabase/client.ts` để gọi API Supabase
- Token-based authentication (JWT)

### Auto Logout Feature
- Component `AutoLogout.tsx` tự động đăng xuất khi session hết hạn
- Bảo vệ dữ liệu người dùng

---

## 📱 CÁC TRANG CHÍNH

### 1. **Login Page** (`/login`)
- Trang xác thực người dùng
- Sử dụng Supabase authentication

### 2. **Dashboard** (`/dashboard`)
- Trang chủ với tổng quan kinh doanh
- Có thể hiển thị KPIs, charts, metrics quan trọng

### 3. **Customers** (`/dashboard/customers`)
- Danh sách khách hàng với thông tin:
  - Tên khách hàng
  - Email
  - Health Score (sức khỏe tài khoản)
  - Lifecycle Stage (giai đoạn vòng đời)
- Chức năng: Thêm, sửa, xóa khách hàng

### 4. **Products** (`/dashboard/products`)
- Quản lý sản phẩm/dịch vụ
- Phân loại:
  - SOFTWARE (Phần mềm)
  - SERVER (Server/VPS)
  - SERVICE (Dịch vụ)
  - MAINTENANCE (Bảo trì)
- Chu kỳ giá:
  - ONE_TIME (Vĩnh viễn)
  - MONTHLY (Hàng tháng)
  - YEARLY (Hàng năm)
- Chức năng: CRUD operations

### 5. **Deals** (`/dashboard/deals`) ⭐
- Quản lý các giao dịch bán hàng
- Liên kết khách hàng, sản phẩm
- Theo dõi giai đoạn deal, giá trị giao dịch
- Features:
  - SearchableSelect component cho lựa chọn khách hàng/sản phẩm
  - Cấu hình icon & màu sắc theo loại sản phẩm
  - Hiển thị chu kỳ thanh toán với icon
  - CRUD operations
  - Loader khi load dữ liệu

### 6. **Deployments** (`/dashboard/deployments`)
- Quản lý triển khai ứng dụng
- Thông tin:
  - Customer ID
  - App URL
  - Current Version
  - Custom Config (JSON)
- Hỗ trợ JSONB queries để tìm deployment theo custom config

### 7. **Tasks** (`/dashboard/tasks`)
- Quản lý công việc/nhiệm vụ
- Theo dõi deadline, assignee, status

### 8. **Tickets** (`/dashboard/tickets`)
- Hệ thống quản lý vé hỗ trợ
- Theo dõi yêu cầu hỗ trợ của khách hàng

### 9. **Contracts** (`/dashboard/contracts`)
- Quản lý hợp đồng
- Lưu trữ, theo dõi các hợp đồng với khách hàng

### 10. **Reports** (`/dashboard/reports`)
- Báo cáo và phân tích
- Sử dụng Recharts để visualize dữ liệu
- KPIs, trends, revenue reports

### 11. **Profile** (`/dashboard/profile`)
- Hồ sơ người dùng
- Cập nhật thông tin cá nhân

---

## 🎨 COMPONENTS & UI

### Shared Components
1. **Sidebar.tsx** - Navigation sidebar
   - Danh sách các trang chính
   - Logo/Branding
   - Active page indicator

2. **AutoLogout.tsx** - Session management
   - Tự động đăng xuất khi hết session
   - Warning message trước khi logout

3. **UserPresence.tsx** - User status
   - Hiển thị người dùng online/offline
   - Real-time presence tracking

### Page-Specific Components
- **Deals Page** có `SearchableSelect` component:
  - Dropdown searchable cho khách hàng/sản phẩm
  - Filter options theo input
  - Click outside để đóng
  - Display selected value

---

## 📊 DATABASE SCHEMA (Backend)

### Models trong SQLAlchemy:

```python
class Customer:
  - id (UUID, PK)
  - name (String)
  - email (String)
  - health_score (Integer)
  - lifecycle_stage (String)

class Deployment:
  - id (UUID, PK)
  - customer_id (UUID, FK)
  - app_url (String)
  - current_version (String)
  - custom_config (JSONB)
```

### API Endpoints:
- `GET /` - Health check
- `GET /customers` - Lấy danh sách khách hàng
- `GET /deployments/search?feature_key=...` - Tìm deployment theo JSONB config

---

## 🚀 CHẠY DỰ ÁN

### Frontend
```bash
cd frontend
npm install
npm run dev
# Truy cập: http://localhost:3000
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # hoặc venv\Scripts\activate trên Windows
pip install -r requirements.txt
uvicorn main:app --reload
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

---

## 🔄 WORKFLOW & FEATURES

### Thêm Khách Hàng/Sản Phẩm/Deal
1. Nhấn nút "+" trong header
2. Modal form hiện lên
3. Nhập thông tin
4. Submit form
5. Data được thêm vào database

### Sửa Thông Tin
1. Nhấn icon Pencil (Sửa)
2. Modal form mở với dữ liệu hiện tại
3. Thay đổi thông tin
4. Submit để lưu

### Xóa
1. Nhấn icon Trash (Xóa)
2. Confirm dialog
3. Xóa dữ liệu khỏi database

### Tìm Kiếm
- Trang Deals có SearchableSelect để tìm khách hàng/sản phẩm nhanh
- Typed search, case-insensitive filtering

---

## 🔒 SECURITY FEATURES

1. **Supabase Authentication** - Xác thực an toàn
2. **Auto Logout** - Bảo vệ khỏi unauthorized access
3. **Middleware** - Route protection
4. **Environment Variables** - Sensitive data management
5. **Server-Side Sessions** - SSR với Supabase

---

## 📝 STYLE GUIDE & CONVENTIONS

- **CSS Framework:** Tailwind CSS
  - Tailwind classes cho styling
  - Consistent color palette: red, blue, purple, orange, gray, green
  - Responsive design với breakpoints

- **Icons:** Lucide React
  - Plus, Pencil, Trash2 cho CRUD
  - Calendar, User, Search cho filters
  - Product-specific icons: Package, Server, Code, Wrench
  - Status icons: Check, Zap, Clock

- **Color Config:** Tùy loại (TYPE_CONFIG, CYCLE_CONFIG)
  - Background + Text color + Border color
  - Consistent icons cho mỗi loại

---

## 🎯 NEXT STEPS & IMPROVEMENTS

### Có thể cần thêm:
1. **Error Handling** - Try-catch blocks, error boundaries
2. **Loading States** - Skeleton screens, spinners
3. **Toast Notifications** - Success/error messages
4. **Form Validation** - Client-side validation
5. **API Error Handling** - Backend error responses
6. **Pagination** - Cho danh sách dài
7. **Filtering & Sorting** - Advanced search
8. **Real-time Updates** - WebSocket integration
9. **Role-Based Access Control** - RBAC
10. **Audit Logging** - Theo dõi thay đổi dữ liệu

---

## 📞 LIÊN HỆ & SUPPORT

- **Repository:** GitHub (cokentiger/nextsoft-crm)
- **Branch chính:** main
- **Environment:** Docker Container (Ubuntu 24.04.3 LTS)

---

**Cập nhật lần cuối:** 2025-12-25
