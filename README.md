## Báo cáo kiểm định kỹ thuật Frontend: Dự án InternHub-FE

Dựa trên cấu trúc mã nguồn Angular được cung cấp và đối chiếu với báo cáo Backend InternHub-BE, dưới đây là phân tích chi tiết về mức độ hoàn thiện của giao diện và kết nối API.

### 1. Bảng so sánh "Backend Feature vs. Frontend Implementation"

| Tính năng nghiệp vụ Backend                                  | Trạng thái triển khai Frontend (UI/API) | Chi tiết Frontend                                                                                                                                          |
| :----------------------------------------------------------- | :-------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hệ thống xác thực & ủy quyền**                             |                                         |                                                                                                                                                            |
| Đăng nhập người dùng (qua email & mật khẩu, cấp JWT)         | **Đã hoàn thiện (API & UI)**            | `Auth.login()` gọi `/api/auth/login`. Có trang đăng nhập (`src/app/login/`).                                                                               |
| Truy xuất quyền hạn (từ JWT)                                 | **Chưa hoàn thiện (Logic)**             | `Auth` service lưu token, nhưng có `TODO` giải mã JWT để lấy chi tiết người dùng/quyền hạn.                                                                |
| Kiểm soát truy cập dựa trên vai trò (RBAC)                   | **Chưa hoàn thiện (Guard)**             | `authGuard` chỉ kiểm tra `isLoggedIn()`, chưa có logic RBAC cụ thể để chặn route theo vai trò/quyền.                                                       |
| **Quản lý người dùng quản trị (ADMIN role)**                 |                                         |                                                                                                                                                            |
| Tạo người dùng (email, vai trò, phòng ban, email kích hoạt)  | **Đã hoàn thiện (API & UI)**            | `Auth.createUser()` gọi `/api/admin/users`. Có form tạo người dùng (`src/app/settings/hr/accounts/user-create/`).                                          |
| Quản lý trạng thái người dùng (kích hoạt/hủy kích hoạt)      | **Chưa hoàn thiện (API & UI)**          | Backend có `AdminUserServiceImpl` nhưng chưa tìm thấy API endpoint và UI tương ứng ở Frontend để thực hiện.                                                |
| **Quản lý hồ sơ thực tập sinh (Internship Profile)**         | **Chỉ là khung/Placeholder (UI)**       | Backend đã hoàn thiện CRUD, gán Mentor/Manager và tạo profile linh hoạt. Frontend chỉ có component giữ chỗ `HrInternsComponent`.                           |
| **Quy trình duyệt & Đánh giá (Manager Workflow)**            | **Chưa triển khai**                     | Backend đã có logic Dashboard duyệt, biểu đồ Radar kỹ năng và ra quyết định (PASS/FAIL). Frontend hoàn toàn thiếu UI này.                                  |
| **Hệ thống thông báo nội bộ (Notification)**                 | **Chưa triển khai**                     | Backend có `NotificationController` để quản lý thông báo sự kiện. Frontend chưa có UI chuông thông báo hoặc danh sách.                                     |
| **Thiết lập dữ liệu ban đầu**                                | **Không áp dụng (Backend)**             | Tính năng tự động khởi tạo Department, Role, Function và Admin của Backend.                                                                                |
| **Giao tiếp qua Email (email kích hoạt)**                    | **Hoàn thiện một phần (API)**           | Frontend gọi `Auth.createUser()` để tạo người dùng, Backend xử lý gửi email. Frontend không có UI trực tiếp để gửi/quản lý email.                          |
| **Ghi nhật ký kiểm toán (Audit Log)**                        | **Chưa triển khai**                     | Backend đã ghi log các hành động Admin nhưng Frontend chưa có UI để xem hoặc lọc.                                                                          |
| **Quản lý danh mục (Department, Role, Skill, University)**   | **Chưa triển khai**                     | Backend hỗ trợ các thực thể này nhưng Frontend thiếu các màn hình CRUD để quản trị thư viện dữ liệu.                                                       |
| **Kích hoạt tài khoản người dùng**                           | **Chưa hoàn thiện (API & UI)**          | Backend có cơ chế tạo token và gửi email nhưng Frontend chưa có điểm cuối API rõ ràng để người dùng kích hoạt tài khoản bằng token.                        |
| **Chi tiết người dùng (Đọc, Cập nhật, Xóa)**                 | **Chưa hoàn thiện (API & UI)**          | Ngoài việc tạo người dùng (Admin), chưa tìm thấy các API endpoint và UI tương ứng ở Frontend để đọc danh sách, xem chi tiết, cập nhật hoặc xóa người dùng. |
| **Nghiệp vụ thực tập chi tiết (MicroTask, TaskSkillRating)** | **Chỉ là khung/Placeholder (UI)**       | Backend đã có logic đánh giá kỹ năng qua từng task. Frontend hiện tại chỉ là các placeholder, thiếu UI cho Mentor đánh giá và Intern nhận task.            |

### 2. Đối chiếu kết nối API: Liệt kê các Angular Services đã được viết. Những service nào đã khớp với các Endpoints của Backend?

- **Auth Service (`src/app/auth/auth.ts`):**
  - **Khớp với Backend `AuthController`:**
    - `Auth.login()` gọi `POST /api/auth/login`.
  - **Khớp với Backend `AdminController`:**
    - `Auth.createUser()` gọi `POST /api/admin/users`.
- **Thiếu hụt Service:**
  - Chưa có service cho `InternService` (Quản lý profile).
  - Chưa có service cho `NotificationService` (Thông báo).
  - Chưa có service cho `ManagerReviewService` (Phê duyệt/Analytics).
- **BreadcrumbService (`src/app/shared/breadcrumb.service.ts`):**
  - Đây là một dịch vụ UI/utility, **không tương tác trực tiếp với API Backend**.

Các API endpoint của Backend liên quan đến `User`, `Audit Log` và các hoạt động CRUD đầy đủ cho các thực thể khác (ngoại trừ login và tạo user admin) hiện chưa được tìm thấy service tương ứng ở Frontend.

### 3. Phân tích Giao diện (Components): Liệt kê các trang/màn hình đã có. Xác định xem các form đã được dựng hay chưa.

- **Các trang/màn hình đã có:**
  - Trang Landing (`src/app/landing-page/`)
  - Trang Đăng nhập (`src/app/login/`)
  - Dashboard tổng quan và các khu vực con (`src/app/dashboard/` với các module như `approval`, `capacity`, `execution`, `main-layout`, `management`, `sidebar`, `topbar`).
  - Khu vực tạo người dùng (`src/app/settings/hr/accounts/user-create/`).
  - Các thành phần giữ chỗ trong `settings/evaluation/skills/`, `settings/hr/interns/`, `settings/partners/list/`.
- **Các form đã được dựng:**
  - **Form Đăng nhập:** Có (`src/app/login/login.html`).
  - **Form Tạo người dùng:** Có (`src/app/settings/hr/accounts/user-create/user-create.component.html`).
  - **Form Quản lý phòng ban:** **Chưa được xác định rõ ràng.** Backend có thực thể Department nhưng Frontend chưa có component/form quản lý trực tiếp.

### 4. Kiểm tra Cơ chế Bảo mật:

- **HttpInterceptor để gắn JWT Token vào header:** **Đã có (`src/app/auth/jwt.interceptor.ts`).** Interceptor này hoạt động chính xác để thêm `Authorization: Bearer [token]` vào các request API đã xác thực.
- **AuthGuard để chặn các route (ADMIN, HR, MENTOR) như ma trận RBAC ở Backend:** **Chưa hoàn thiện cho RBAC (`src/app/auth/auth.guard.ts`).** `authGuard` hiện chỉ kiểm tra trạng thái đăng nhập chung (`isLoggedIn()`). Nó cần được mở rộng để phân tích vai trò/quyền của người dùng từ JWT (sau khi giải mã) hoặc từ một API trả về quyền hạn để thực hiện kiểm soát truy cập dựa trên vai trò chi tiết như mô tả của Backend.

### 5. Xác định các tính năng "Chờ":

Dựa trên các thực thể Backend chưa có triển khai UI hoặc chỉ là Placeholder ở Frontend:

- **Quản lý kỹ năng (Skill):** `src/app/settings/evaluation/skills/skills.ts` là một component giữ chỗ.
- **Quản lý đại học (University):** Không có UI/service tương ứng.
- **Quản lý hồ sơ thực tập sinh (InternshipProfile):** Cần triển khai UI cho các tính năng CRUD và gán Mentor/Manager đã có ở BE.
- **Màn hình duyệt của Manager:** Cần triển khai Dashboard xem danh sách chờ duyệt và biểu đồ Radar phân tích năng lực.
- **Hệ thống thông báo:** Cần thêm UI hiển thị thông báo thời gian thực và lịch sử thông báo.
- **Quản lý vị trí thực tập (InternshipPosition):** `partners/list/list.ts` hiện tại là placeholder.
- **Quản lý nhiệm vụ nhỏ (MicroTask):** Không có UI/service tương ứng.
- **Đánh giá kỹ năng nhiệm vụ (TaskSkillRating):** Không có UI/service tương ứng.
- **Xem/Quản lý Nhật ký kiểm toán (AuditLog):** Không có UI/service tương ứng.
- **Quản lý người dùng đầy đủ (Đọc, Cập nhật, Xóa):** Frontend chưa có các màn hình hoặc dịch vụ cho các chức năng này.
- **Kích hoạt tài khoản người dùng:** Frontend thiếu điểm cuối API và UI để xử lý quy trình kích hoạt tài khoản.
- **Quản lý các thực thể `Department`, `Role`, `Function`:** Frontend thiếu UI/service cho các chức năng CRUD đầy đủ.

### Các tệp quan trọng đã được phân tích:

- `src/app/auth/auth.ts`: Dịch vụ xác thực và giao tiếp API login/tạo người dùng admin.
- `src/app/auth/jwt.interceptor.ts`: Interceptor để gắn JWT token vào header.
- `src/app/auth/auth.guard.ts`: Guard kiểm tra trạng thái đăng nhập cơ bản.
- `src/app/shared/breadcrumb.service.ts`: Dịch vụ quản lý breadcrumb (utility, không liên quan API Backend).
- `src/app/shared/models/user.model.ts`: Định nghĩa các model dữ liệu cho người dùng.
- `src/app/login/login.ts`: Component cho trang đăng nhập.
- `src/app/login/login.html`: Template HTML của trang đăng nhập.
- `src/app/settings/hr/accounts/user-create/user-create.component.ts`: Component cho form tạo người dùng.
- `src/app/settings/hr/accounts/user-create/user-create.component.html`: Template HTML của form tạo người dùng.
- `src/app/landing-page/landing-page.component.ts`: Component cho trang landing.
- `src/app/settings/evaluation/skills/skills.ts`: Component giữ chỗ cho kỹ năng.
- `src/app/settings/hr/interns/interns.ts`: Component giữ chỗ cho thực tập sinh.
- `src/app/settings/partners/list/list.ts`: Component giữ chỗ cho danh sách đối tác.
