# 🔋 EV Swap Backend - Hệ thống Trạm đổi pin thông minh

> **Status:** ✅ Hoàn thành - Backend API đã được implement đầy đủ

---

## 1. 🎯 Tổng quan Dự án

**Tên dự án:** Backend Hệ thống Trạm đổi pin thông minh.

**Mục tiêu:** Xây dựng một API Server (backend) làm "bộ não" trung tâm, chịu trách nhiệm kết nối, quản lý và điều phối 3 thành phần:

1.  **Cơ sở dữ liệu (PostgreSQL):** Lưu trữ toàn bộ dữ liệu.
2.  **Ứng dụng Khách hàng (React Native):** Nhận yêu cầu từ người dùng.
3.  **Hệ thống Phần cứng/IoT (Trạm sạc):** Nhận báo cáo và gửi lệnh điều khiển.

---

## 2. 🛠️ Công nghệ & Môi trường

- **Nền tảng:** Node.js
- **Framework:** Express.js
- **Cơ sở dữ liệu (CSDL):** PostgreSQL
  - Kết nối tới CSDL: `postgres`
  - Sử dụng Schema: `doan_db`
- **ORM (Kết nối CSDL):** Prisma
- **Xác thực:** JSON Web Tokens (JWT)
- **Mã hóa mật khẩu:** `bcryptjs`

---

## 3. 👥 Các Tác nhân (Actors)

Hệ thống backend sẽ phục vụ 2 tác nhân chính (không bao gồm Admin):

1.  **Khách hàng (Customer):** Người dùng cuối sử dụng ứng dụng React Native để tìm trạm, đăng nhập và yêu cầu đổi pin.
2.  **Trạm sạc (IoT Hardware):** Vi điều khiển (ví dụ: ESP32) tại các trạm sạc, có nhiệm vụ báo cáo trạng thái (pin đầy, đang sạc...) và thực thi lệnh (mở khóa).

---

## 4. 🚀 Yêu cầu Chức năng (API Endpoints)

Hệ thống API sẽ được chia làm 2 nhóm chính:

### Nhóm 1: API cho Khách hàng (React Native App)

Các API này phục vụ ứng dụng di động của người dùng.

#### A. Xác thực & Tài khoản (`/api/auth` & `/api/me`)

- `POST /api/auth/register`
  - **Mô tả:** Đăng ký tài khoản mới cho `customers`.
  - **Yêu cầu:** `username`, `password`, `full_name`, `phone`, `email`.
  - **Logic:** Mã hóa mật khẩu (bcrypt) và lưu vào bảng `customers`.
- `POST /api/auth/login`
  - **Mô tả:** Đăng nhập cho khách hàng.
  - **Yêu cầu:** `username`, `password`.
  - **Logic:** So sánh mật khẩu đã mã hóa. Nếu đúng, trả về một `token` (JWT).
- `GET /api/me/profile`
  - **Mô tả:** (Cần Token) Lấy thông tin cá nhân của khách hàng đang đăng nhập.
- `GET /api/me/history`
  - **Mô tả:** (Cần Token) Lấy lịch sử giao dịch đổi pin từ bảng `transaction_logs`.

#### B. Trạm sạc & Giao dịch (`/api/stations` & `/api/transactions`)

- `GET /api/stations`
  - **Mô tả:** Lấy danh sách **tất cả** các trạm (để hiển thị lên bản đồ).
  - **Logic:** Truy vấn bảng `stations` (trả về: ID, tên, vị trí, trạng thái, số pin khả dụng).
- `GET /api/stations/:id`
  - **Mô tả:** Lấy thông tin **chi tiết** của một trạm cụ thể.
  - **Logic:** Truy vấn trạm và các `slots` liên quan để biết khay nào trống, khay nào đang sạc, khay nào đầy.
- `POST /api/transactions/start-swap`
  - **Mô tả:** (Cần Token) API quan trọng nhất. Được gọi khi người dùng quét QR tại trạm để yêu cầu đổi pin.
  - **Logic:**
    1.  Backend tìm một `slot` có pin đầy và sẵn sàng.
    2.  Gửi lệnh "mở khóa" `slot` đó đến Phần cứng (thông qua Broker).
    3.  Tạo một bản ghi `transaction_logs` mới với trạng thái `pending`.
- `POST /api/feedback`
  - **Mô tả:** (Cần Token) Cho phép người dùng gửi phản hồi (lưu vào bảng `feedback`).

---

### Nhóm 2: API & Broker cho Phần cứng (IoT)

Các API này phục vụ cho vi điều khiển tại trạm sạc. (Cần được bảo vệ bằng API Key bí mật).

#### A. API (Phần cứng gọi Backend)

- `POST /api/iot/battery/validate`
  - [cite_start]**Mô tả:** Được gọi khi trạm sạc quét RFID của một viên pin[cite: 11, 14].
  - **Yêu cầu:** `{ "battery_uid": "BAT-XYZ" }`
  - [cite_start]**Logic:** Backend kiểm tra `battery_uid` trong bảng `batteries` để xác nhận pin có hợp lệ hay không[cite: 15].
- `POST /api/iot/slot/status-update`
  - **Mô tả:** API đa năng mà phần cứng gọi liên tục để báo cáo trạng thái của một khay sạc.
  - **Yêu cầu (Ví dụ):** `{ "station_id": 1, "slot_number": 3, "status": "charging", "battery_uid": "BAT-XYZ" }`
  - **Logic:** Cập nhật CSDL (bảng `slots` và `batteries`) theo thời gian thực khi có sự kiện:
    - Pin được cắm vào.
    - [cite_start]Bắt đầu sạc[cite: 32].
    - [cite_start]Sạc đầy[cite: 33].
    - Pin bị rút ra.

#### [cite_start]B. Broker / Kênh Giao tiếp (Backend gọi Phần cứng) [cite: 6]

- **Công nghệ:** MQTT hoặc WebSocket (Như file Word mô tả là "Broker").
- **Mục đích:** Dùng cho các lệnh thời gian thực mà Backend cần "ra lệnh" cho phần cứng.
- **Luồng hoạt động (Ví dụ):**
  1.  **Phần cứng (Subscribe):** Trạm sạc sẽ "lắng nghe" một kênh, ví dụ: `station/1/commands`.
  2.  **Backend (Publish):** Khi API `start-swap` được gọi, Backend sẽ gửi một tin nhắn vào kênh đó, ví dụ: `{ "command": "unlock", "slot": 4 }`.
  3.  [cite_start]**Kết quả:** Phần cứng nhận lệnh và kích hoạt "Relay (khoá chốt)" [cite: 23] để mở khay số 4.

---

## 5. ✅ Trạng thái Implementation

### ✔️ Đã hoàn thành:

#### **Cơ sở hạ tầng:**

- ✅ Khởi tạo Node.js project với Express.js
- ✅ Cấu hình Prisma ORM với PostgreSQL
- ✅ Tạo schema database từ file SQL có sẵn
- ✅ JWT Authentication cho Customer
- ✅ API Key Authentication cho IoT devices

#### **API Endpoints đã implement:**

**1. Authentication & Customer Management:**

- ✅ `POST /api/auth/register` - Đăng ký tài khoản
- ✅ `POST /api/auth/login` - Đăng nhập (trả về JWT)
- ✅ `GET /api/me/profile` - Xem thông tin cá nhân
- ✅ `GET /api/me/history` - Lịch sử giao dịch đổi pin

**2. Stations Management:**

- ✅ `GET /api/stations` - Danh sách tất cả trạm (cho map)
- ✅ `GET /api/stations/:id` - Chi tiết một trạm (bao gồm slots)

**3. Transactions:**

- ✅ `POST /api/transactions/start-swap` - Yêu cầu đổi pin
  - Tự động tìm slot có pin đầy
  - Mở khóa slot
  - Tạo transaction log
- ✅ `POST /api/feedback` - Gửi phản hồi

**4. IoT Hardware APIs:**

- ✅ `POST /api/iot/battery/validate` - Validate pin qua RFID
- ✅ `POST /api/iot/slot/status-update` - Cập nhật trạng thái slot
  - Tự động cập nhật trạng thái pin
  - Tự động cập nhật available_slots của trạm

---

## 6. 🚀 Hướng dẫn Chạy Project

### Cài đặt nhanh:

```bash
# 1. Cài dependencies
npm install

# 2. Import database (đảm bảo PostgreSQL đang chạy)
psql -U postgres -d doan_db -f doan.sql

# 3. Cấu hình .env (đã tạo sẵn, chỉ cần sửa DATABASE_URL)
# Mở file .env và điều chỉnh username/password PostgreSQL

# 4. Generate Prisma Client
npm run prisma:generate

# 5. Chạy server
npm run dev
```

Server chạy tại: **http://localhost:3000**

📖 **Xem hướng dẫn chi tiết:** [SETUP.md](./SETUP.md)

---

## 7. 📁 Cấu trúc Project

```
ev-swap-backend/
├── prisma/
│   └── schema.prisma           # Database schema (Prisma)
├── src/
│   ├── config/
│   │   └── database.js         # Prisma client instance
│   ├── controllers/            # Business logic
│   │   ├── auth.controller.js
│   │   ├── customer.controller.js
│   │   ├── station.controller.js
│   │   ├── transaction.controller.js
│   │   └── iot.controller.js
│   ├── middleware/             # Authentication
│   │   ├── auth.middleware.js  (JWT cho Customer)
│   │   └── iot-auth.middleware.js (API Key cho IoT)
│   ├── routes/                 # Route definitions
│   │   ├── auth.routes.js
│   │   ├── customer.routes.js
│   │   ├── station.routes.js
│   │   ├── transaction.routes.js
│   │   ├── feedback.routes.js
│   │   └── iot.routes.js
│   └── index.js                # Entry point
├── .env                        # Environment variables
├── doan.sql                    # Database SQL với dữ liệu mẫu
├── package.json
├── SETUP.md                    # Hướng dẫn cài đặt chi tiết
└── readme.md                   # File này
```

---

## 8. 🔐 Security Features

- ✅ **JWT Authentication** cho Customer APIs
- ✅ **API Key Authentication** cho IoT devices
- ✅ **Password Hashing** với bcryptjs (cost: 10)
- ✅ **CORS** enabled
- ✅ **Input validation** trên tất cả endpoints

---

## 9. 🎨 Tech Stack

| Layer         | Technology             |
| ------------- | ---------------------- |
| **Runtime**   | Node.js v16+           |
| **Framework** | Express.js 4.x         |
| **Database**  | PostgreSQL 12+         |
| **ORM**       | Prisma 5.x             |
| **Auth**      | JWT + bcryptjs         |
| **Dev Tools** | Nodemon, Prisma Studio |

---

## 10. 📊 Database Models

Prisma đã generate các model từ database:

- `Station` - Trạm sạc
- `Battery` - Pin
- `Customer` - Khách hàng
- `Slot` - Khay sạc
- `TransactionLog` - Lịch sử giao dịch
- `Feedback` - Phản hồi
- `Warehouse` & `WarehouseBattery` - Kho pin
- `Admin` & `MaintenanceLog` - Quản trị & bảo trì

---

## 11. 🧪 Testing APIs

### Postman Collection

Import các endpoint sau vào Postman:

**Base URL:** `http://localhost:3000`

**Headers:**

- Customer APIs: `Authorization: Bearer <JWT_TOKEN>`
- IoT APIs: `x-api-key: <IOT_API_KEY>`

Xem chi tiết trong [SETUP.md](./SETUP.md)

---

## 12. 📝 Notes & TODOs

### ✅ Đã hoàn thành:

- [x] Tất cả API endpoints theo yêu cầu
- [x] JWT & API Key authentication
- [x] Prisma schema mapping
- [x] Error handling
- [x] Input validation

### 🔜 Có thể mở rộng trong tương lai:

- [ ] **MQTT/WebSocket Broker** cho giao tiếp real-time với IoT
  - Hiện tại: Comment TODO trong code
  - Có thể dùng: mqtt.js hoặc socket.io
- [ ] Admin APIs (quản lý trạm, bảo trì)
- [ ] Rate limiting
- [ ] API documentation (Swagger)
- [ ] Unit tests
- [ ] Docker containerization

---

## 13. 🤝 Contributing

Để thêm tính năng mới:

1. Tạo controller trong `src/controllers/`
2. Tạo routes trong `src/routes/`
3. Register routes trong `src/index.js`
4. Test với Postman/cURL

---

## 📞 Support

Nếu gặp vấn đề:

1. Kiểm tra PostgreSQL đang chạy: `sudo systemctl status postgresql`
2. Verify `.env` configuration
3. Check logs trong terminal

---

**🎉 Project hoàn thành và sẵn sàng sử dụng!**
