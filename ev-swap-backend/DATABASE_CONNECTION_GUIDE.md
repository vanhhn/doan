# Hướng Dẫn Kết Nối Database

## Thông Tin Kết Nối

**Database Type:** PostgreSQL  
**Host:** `c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com`  
**Port:** `5432`  
**Database Name:** `d6o7j3fq9u96kq`  
**Username:** `u1cdsnh3k52i4t`  
**Password:** `p6dbf6e3b6666ab0768ef0ef8de83ccf2e86e2f5b262eca4ad640b48b466f9215`  
**SSL Mode:** `REQUIRE` (Bắt buộc)

**Connection URL đầy đủ:**

```
postgres://u1cdsnh3k52i4t:p6dbf6e3b6666ab0768ef0ef8de83ccf2e86e2f5b262eca4ad640b48b466f9215@c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d6o7j3fq9u96kq
```

---

## Phương Pháp Kết Nối

### 1. Sử Dụng pgAdmin 4 (Khuyến nghị)

**Bước 1:** Tải và cài đặt pgAdmin 4

- Website: https://www.pgadmin.org/download/
- Chọn phiên bản phù hợp với hệ điều hành (Windows/Mac/Linux)

**Bước 2:** Tạo kết nối mới

1. Mở pgAdmin 4
2. Click chuột phải vào **Servers** → Chọn **Register** → **Server**
3. Điền thông tin:

**Tab General:**

- Name: `EV Swap Database` (hoặc tên tùy ý)

**Tab Connection:**

- Host name/address: `c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com`
- Port: `5432`
- Maintenance database: `d6o7j3fq9u96kq`
- Username: `u1cdsnh3k52i4t`
- Password: `p6dbf6e3b6666ab0768ef0ef8de83ccf2e86e2f5b262eca4ad640b48b466f9215`
- ✅ Tích chọn: **Save password**

**Tab SSL:**

- SSL mode: `Require`

**Bước 3:** Click **Save** để lưu và kết nối

---

### 2. Sử Dụng DBeaver (Miễn phí, đa nền tảng)

**Bước 1:** Tải và cài đặt DBeaver Community

- Website: https://dbeaver.io/download/
- Hỗ trợ Windows, Mac, Linux

**Bước 2:** Tạo kết nối PostgreSQL

1. Mở DBeaver
2. Click **Database** → **New Database Connection**
3. Chọn **PostgreSQL** → Click **Next**

**Bước 3:** Điền thông tin kết nối

- Host: `c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com`
- Port: `5432`
- Database: `d6o7j3fq9u96kq`
- Username: `u1cdsnh3k52i4t`
- Password: `p6dbf6e3b6666ab0768ef0ef8de83ccf2e86e2f5b262eca4ad640b48b466f9215`
- ✅ Tích chọn: **Save password locally**

**Bước 4:** Cấu hình SSL

1. Click tab **SSL**
2. SSL mode: Chọn **require**

**Bước 5:** Click **Test Connection** để kiểm tra

- Nếu lần đầu, DBeaver sẽ tự động tải PostgreSQL driver
- Sau khi test thành công, click **Finish**

---

### 3. Sử Dụng TablePlus (Mac/Windows/Linux)

**Bước 1:** Tải và cài đặt TablePlus

- Website: https://tableplus.com/
- Có phiên bản miễn phí và trả phí

**Bước 2:** Tạo kết nối mới

1. Mở TablePlus
2. Click nút **Create a new connection**
3. Chọn **PostgreSQL**

**Bước 3:** Điền thông tin

- Name: `EV Swap Database`
- Host: `c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com`
- Port: `5432`
- User: `u1cdsnh3k52i4t`
- Password: `p6dbf6e3b6666ab0768ef0ef8de83ccf2e86e2f5b262eca4ad640b48b466f9215`
- Database: `d6o7j3fq9u96kq`
- SSL: `Enabled` hoặc `Required`

**Bước 4:** Click **Test** → **Connect**

---

### 4. Sử Dụng Command Line (psql)

**Bước 1:** Cài đặt PostgreSQL Client

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# Mac (sử dụng Homebrew)
brew install postgresql

# Windows
# Tải từ: https://www.postgresql.org/download/windows/
```

**Bước 2:** Kết nối qua terminal

```bash
psql "postgres://u1cdsnh3k52i4t:p6dbf6e3b6666ab0768ef0ef8de83ccf2e86e2f5b262eca4ad640b48b466f9215@c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d6o7j3fq9u96kq?sslmode=require"
```

Hoặc kết nối từng tham số:

```bash
psql -h c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com \
     -p 5432 \
     -U u1cdsnh3k52i4t \
     -d d6o7j3fq9u96kq \
     -W
# Nhập password khi được yêu cầu
```

**Các lệnh psql cơ bản:**

```sql
-- Xem danh sách bảng
\dt

-- Xem cấu trúc bảng
\d table_name

-- Chạy query
SELECT * FROM users LIMIT 10;

-- Thoát
\q
```

---

### 5. Kết Nối Từ Code (Node.js)

**Sử dụng Prisma (đang dùng trong project):**

```javascript
// Trong file .env
DATABASE_URL =
  "postgres://u1cdsnh3k52i4t:p6dbf6e3b6666ab0768ef0ef8de83ccf2e86e2f5b262eca4ad640b48b466f9215@c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d6o7j3fq9u96kq?sslmode=require";
```

**Sử dụng pg (PostgreSQL client):**

```javascript
const { Client } = require("pg");

const client = new Client({
  host: "c3v5n5ajfopshl.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com",
  port: 5432,
  database: "d6o7j3fq9u96kq",
  user: "u1cdsnh3k52i4t",
  password: "p6dbf6e3b6666ab0768ef0ef8de83ccf2e86e2f5b262eca4ad640b48b466f9215",
  ssl: {
    rejectUnauthorized: false,
  },
});

client
  .connect()
  .then(() => console.log("Connected to database"))
  .catch((err) => console.error("Connection error", err));
```

---

## Lưu Ý Quan Trọng

### Bảo Mật

- ⚠️ **KHÔNG** chia sẻ thông tin này công khai trên GitHub, Slack, Email công ty
- ⚠️ **KHÔNG** commit file chứa password vào Git
- ⚠️ Chỉ chia sẻ với người có quyền truy cập
- ✅ Sử dụng biến môi trường (`.env`) cho thông tin nhạy cảm
- ✅ Thêm `.env` vào `.gitignore`

### SSL/TLS

- Database này **BẮT BUỘC** phải sử dụng SSL
- Nếu kết nối thất bại, kiểm tra SSL mode = `require`

### IP Whitelisting

- Database này hosted trên AWS RDS qua Heroku
- Không giới hạn IP (public access enabled)
- Nếu có lỗi connection timeout, kiểm tra firewall/network

### Quyền Truy Cập

User này có **FULL PERMISSIONS** trên database:

- SELECT (đọc dữ liệu)
- INSERT (thêm dữ liệu)
- UPDATE (cập nhật dữ liệu)
- DELETE (xóa dữ liệu)
- CREATE/DROP (tạo/xóa bảng)

⚠️ **Cẩn thận khi chạy các lệnh DELETE hoặc DROP!**

---

## Cấu Trúc Database

### Các Bảng Chính

```
- users (Người dùng)
- stations (Trạm sạc)
- reservations (Đặt chỗ)
- transactions (Giao dịch)
- payment_cards (Thẻ thanh toán)
- reviews (Đánh giá)
- iot_devices (Thiết bị IoT)
- notification_tokens (Token thông báo)
```

Xem chi tiết schema tại: `/prisma/schema.prisma`

---

## Troubleshooting

### Lỗi: "connection refused"

- Kiểm tra kết nối internet
- Kiểm tra firewall không chặn port 5432

### Lỗi: "password authentication failed"

- Kiểm tra lại username và password
- Copy-paste để tránh nhầm lẫn

### Lỗi: "SSL connection required"

- Bật SSL mode = `require` trong cài đặt connection
- Với psql: thêm `?sslmode=require` vào connection string

### Lỗi: "database does not exist"

- Kiểm tra lại tên database: `d6o7j3fq9u96kq`
- Database name có phân biệt chữ hoa/thường

### Kết nối chậm

- Database hosted trên AWS us-east-1 (Virginia)
- Từ Việt Nam có thể bị latency cao (200-300ms)
- Điều này là bình thường cho kết nối xuyên lục địa

---

## Hỗ Trợ

Nếu gặp vấn đề khi kết nối, liên hệ:

- Kiểm tra log trong Heroku: `heroku logs --tail --app ev-swap-backend-2025`
- Kiểm tra database status: `heroku pg:info --app ev-swap-backend-2025`

---

**Ngày cập nhật:** 12/12/2025  
**Quản lý bởi:** EV Swap Backend Team
