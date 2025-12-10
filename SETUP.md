# 🚀 Hướng dẫn Cài đặt và Chạy Backend

## 📋 Yêu cầu hệ thống

- **Node.js**: v16 trở lên
- **PostgreSQL**: v12 trở lên
- **npm** hoặc **yarn**

---

## 🛠️ Bước 1: Cài đặt Dependencies

```bash
npm install
```

---

## 🗄️ Bước 2: Cấu hình Database

### 2.1. Tạo database PostgreSQL

```sql
CREATE DATABASE doan_db;
```

### 2.2. Import dữ liệu từ file SQL

```bash
psql -U postgres -d doan_db -f doan.sql
```

### 2.3. Cấu hình file `.env`

Mở file `.env` và cập nhật thông tin kết nối database:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/doan_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
IOT_API_KEY="your-iot-api-key-change-this"
```

**Thay thế:**

- `username`: tên user PostgreSQL của bạn (mặc định: `postgres`)
- `password`: mật khẩu PostgreSQL của bạn

---

## 🔧 Bước 3: Generate Prisma Client

```bash
npm run prisma:generate
```

---

## ▶️ Bước 4: Chạy Server

### Development mode (với nodemon - tự động restart):

```bash
npm run dev
```

### Production mode:

```bash
npm start
```

Server sẽ chạy tại: **http://localhost:3000**

---

## 📡 API Endpoints

### 🔐 Authentication (Khách hàng)

| Method | Endpoint             | Mô tả             | Auth Required |
| ------ | -------------------- | ----------------- | ------------- |
| POST   | `/api/auth/register` | Đăng ký tài khoản | ❌            |
| POST   | `/api/auth/login`    | Đăng nhập         | ❌            |

### 👤 Customer Profile

| Method | Endpoint          | Mô tả                 | Auth Required |
| ------ | ----------------- | --------------------- | ------------- |
| GET    | `/api/me/profile` | Xem thông tin cá nhân | ✅ JWT Token  |
| GET    | `/api/me/history` | Xem lịch sử giao dịch | ✅ JWT Token  |

### 🏢 Stations (Trạm sạc)

| Method | Endpoint            | Mô tả                     | Auth Required |
| ------ | ------------------- | ------------------------- | ------------- |
| GET    | `/api/stations`     | Lấy danh sách tất cả trạm | ❌            |
| GET    | `/api/stations/:id` | Xem chi tiết một trạm     | ❌            |

### 🔄 Transactions (Giao dịch)

| Method | Endpoint                       | Mô tả           | Auth Required |
| ------ | ------------------------------ | --------------- | ------------- |
| POST   | `/api/transactions/start-swap` | Yêu cầu đổi pin | ✅ JWT Token  |

### 💬 Feedback

| Method | Endpoint        | Mô tả        | Auth Required |
| ------ | --------------- | ------------ | ------------- |
| POST   | `/api/feedback` | Gửi phản hồi | ✅ JWT Token  |

### 🤖 IoT (Phần cứng)

| Method | Endpoint                      | Mô tả                    | Auth Required |
| ------ | ----------------------------- | ------------------------ | ------------- |
| POST   | `/api/iot/battery/validate`   | Validate pin (RFID)      | ✅ API Key    |
| POST   | `/api/iot/slot/status-update` | Cập nhật trạng thái slot | ✅ API Key    |

---

## 🧪 Test API với cURL/Postman

### 1. Đăng ký tài khoản

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "fullName": "Nguyen Van A",
    "phone": "0987654321",
    "email": "test@example.com"
  }'
```

### 2. Đăng nhập

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Đăng nhập thành công.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "customer": { ... }
  }
}
```

### 3. Lấy thông tin profile (cần token)

```bash
curl -X GET http://localhost:3000/api/me/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Lấy danh sách trạm

```bash
curl -X GET http://localhost:3000/api/stations
```

### 5. Yêu cầu đổi pin

```bash
curl -X POST http://localhost:3000/api/transactions/start-swap \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "stationId": 1,
    "oldBatteryUid": "BAT001"
  }'
```

### 6. Gửi feedback

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "Dịch vụ rất tốt!",
    "rating": 5
  }'
```

### 7. IoT - Validate pin (cần API Key)

```bash
curl -X POST http://localhost:3000/api/iot/battery/validate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-iot-api-key-change-this" \
  -d '{
    "battery_uid": "BAT001"
  }'
```

### 8. IoT - Cập nhật trạng thái slot

```bash
curl -X POST http://localhost:3000/api/iot/slot/status-update \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-iot-api-key-change-this" \
  -d '{
    "station_id": 1,
    "slot_number": 3,
    "status": "charging",
    "battery_uid": "BAT011",
    "charge_level": 75
  }'
```

---

## 🔑 Authentication

### JWT Token (Customer API)

- Thêm vào header: `Authorization: Bearer <token>`
- Token có hiệu lực 7 ngày (mặc định)

### API Key (IoT API)

- Thêm vào header: `x-api-key: <your-api-key>`
- Cấu hình trong file `.env`: `IOT_API_KEY`

---

## 📊 Prisma Studio (Database GUI)

Để xem và quản lý database trực quan:

```bash
npm run prisma:studio
```

Truy cập: **http://localhost:5555**

---

## 🐛 Troubleshooting

### Lỗi kết nối database

```
Error: P1001: Can't reach database server
```

**Giải pháp:**

- Kiểm tra PostgreSQL đã chạy chưa: `sudo systemctl status postgresql`
- Kiểm tra lại `DATABASE_URL` trong file `.env`
- Đảm bảo database `doan_db` đã được tạo

### Lỗi Prisma Client chưa được generate

```
Error: @prisma/client did not initialize yet
```

**Giải pháp:**

```bash
npm run prisma:generate
```

---

## 📁 Cấu trúc Project

```
ev-swap-backend/
├── prisma/
│   └── schema.prisma           # Prisma schema
├── src/
│   ├── config/
│   │   └── database.js         # Prisma client
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── customer.controller.js
│   │   ├── station.controller.js
│   │   ├── transaction.controller.js
│   │   └── iot.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── iot-auth.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── customer.routes.js
│   │   ├── station.routes.js
│   │   ├── transaction.routes.js
│   │   ├── feedback.routes.js
│   │   └── iot.routes.js
│   └── index.js                # Entry point
├── .env                        # Environment variables
├── .gitignore
├── package.json
├── doan.sql                    # Database schema & sample data
└── SETUP.md                    # This file
```

---

## 🎯 Các tài khoản test có sẵn

Sau khi import `doan.sql`, bạn có thể đăng nhập với các tài khoản sau:

**Username:** `an_nguyen`  
**Password:** `password123`

**Username:** `binh_tran`  
**Password:** `password123`

**Username:** `chi_le`  
**Password:** `password123`

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra:

1. Node.js version: `node -v` (>= v16)
2. PostgreSQL đang chạy
3. Database đã import đầy đủ
4. File `.env` đã cấu hình đúng

---

**Happy Coding! 🚀**
