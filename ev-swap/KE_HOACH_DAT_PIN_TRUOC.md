# 📋 KẾ HOẠCH TRIỂN KHAI TÍNH NĂNG ĐẶT PIN TRƯỚC

## 🎯 MỤC TIÊU

Tạo tính năng cho phép khách hàng đặt pin trước tại các trạm sạc, đảm bảo pin sẵn sàng khi đến trạm.

---

## 📊 TỔNG QUAN HỆ THỐNG

### Kiến Trúc Hiện Tại
```
App Mobile → HTTP API → MQTT Broker → IoT Device
                ↓
         PostgreSQL Database (AWS RDS)
```

### Kiến Trúc Sau Khi Thêm Reservation
```
App Mobile → HTTP API (Reservation + Swap) → MQTT Broker → IoT Device
                ↓
         PostgreSQL Database (AWS RDS)
                ↓
         Background Cleanup Service
```

---

## 🔄 FLOW HOẠT ĐỘNG

### 1. Flow Đặt Pin Trước

```
┌─────────────┐
│ App Mobile  │
└──────┬──────┘
       │ 1. User chọn station
       │ 2. Xem danh sách pin available
       │ 3. Chọn đặt pin trước
       ↓
┌─────────────────────┐
│ POST /api/reservations│
│ - username           │
│ - password           │
│ - stationName        │
│ - durationMinutes?   │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│ Backend Logic:       │
│ 1. Xác thực user     │
│ 2. Kiểm tra có       │
│    reservation active│
│ 3. Tìm pin available │
│ 4. Tạo reservation   │
│ 5. Cập nhật DB       │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│ Response:            │
│ - reservationId      │
│ - batteryUid         │
│ - slotNumber         │
│ - expiresAt          │
└──────────────────────┘
```

### 2. Flow Đổi Pin Khi Có Reservation

```
┌─────────────┐
│ App Mobile  │
└──────┬──────┘
       │ 1. Quét QR code tại station
       │ 2. Gửi swap request
       ↓
┌─────────────────────┐
│ POST /api/swap/request│
│ - stationName        │
│ - username           │
│ - password           │
│ - returnUid          │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│ Backend Logic:        │
│ 1. Xác thực user     │
│ 2. Kiểm tra có        │
│    reservation?      │
│    → Nếu có: Ưu tiên │
│       pin đã đặt      │
│    → Nếu không: Tìm  │
│       pin available   │
│ 3. Tạo transaction   │
│ 4. Gửi MQTT command  │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│ MQTT → IoT Device    │
│ - Unlock slot        │
│ - Process swap       │
└──────────────────────┘
```

### 3. Flow Hủy Reservation

```
┌─────────────┐
│ App Mobile  │
└──────┬──────┘
       │ 1. Xem danh sách reservations
       │ 2. Chọn hủy reservation
       ↓
┌─────────────────────┐
│ DELETE /api/        │
│ reservations/:id     │
│ ?username=xxx       │
│ &password=xxx       │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│ Backend Logic:       │
│ 1. Xác thực user     │
│ 2. Kiểm tra quyền    │
│ 3. Cập nhật status   │
│    = 'cancelled'     │
│ 4. Giảm reserved_slots│
└──────────────────────┘
```

---

## 📡 API ENDPOINTS

### 1. Tạo Reservation
```http
POST /api/reservations
Content-Type: application/json

{
  "username": "an_nguyen",
  "password": "password123",
  "stationName": "STATION_01",
  "durationMinutes": 15  // Optional, mặc định 15 phút
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đặt pin trước thành công!",
  "data": {
    "reservationId": 1,
    "stationName": "STATION_01",
    "stationLocation": "PTIT Ha Noi",
    "batteryUid": "BAT004",
    "slotNumber": 2,
    "expiresAt": "2025-12-12T21:00:00Z",
    "createdAt": "2025-12-12T20:45:00Z"
  }
}
```

### 2. Lấy Danh Sách Reservations
```http
GET /api/reservations?username=an_nguyen&password=password123&includeExpired=false
```

**Response:**
```json
{
  "success": true,
  "message": "Lấy danh sách đặt pin thành công",
  "data": {
    "customer": {
      "id": 1,
      "username": "an_nguyen",
      "fullName": "An Nguyen"
    },
    "reservations": [
      {
        "id": 1,
        "stationName": "STATION_01",
        "stationLocation": "PTIT Ha Noi",
        "batteryUid": "BAT004",
        "slotNumber": 2,
        "status": "active",
        "expiresAt": "2025-12-12T21:00:00Z",
        "createdAt": "2025-12-12T20:45:00Z"
      }
    ]
  }
}
```

### 3. Lấy Chi Tiết Reservation
```http
GET /api/reservations/1?username=an_nguyen&password=password123
```

### 4. Hủy Reservation
```http
DELETE /api/reservations/1?username=an_nguyen&password=password123
```

**Response:**
```json
{
  "success": true,
  "message": "Đã hủy đơn đặt pin thành công."
}
```

### 5. Xem Pin Available Tại Station
```http
GET /api/stations/STATION_01/available-batteries
```

**Response:**
```json
{
  "success": true,
  "message": "Lấy danh sách pin thành công",
  "data": {
    "station": {
      "id": 1,
      "name": "STATION_01",
      "location": "PTIT Ha Noi",
      "total_slots": 6,
      "available_slots": 4,
      "reserved_slots": 1
    },
    "batteries": [
      {
        "slotNumber": 1,
        "batteryUid": "BAT001",
        "batteryStatus": "good",
        "isReserved": false
      },
      {
        "slotNumber": 2,
        "batteryUid": "BAT004",
        "batteryStatus": "good",
        "isReserved": true
      }
    ]
  }
}
```

---

## 🗄️ DATABASE SCHEMA

### Bảng `reservations` (Đã có sẵn)
```sql
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id),
    station_id INT NOT NULL REFERENCES stations(id),
    slot_id INT REFERENCES slots(id) ON DELETE SET NULL,
    battery_uid VARCHAR(50) REFERENCES batteries(uid) ON DELETE SET NULL,
    reservation_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Status Values
- `active`: Đang hoạt động, chưa hết hạn
- `completed`: Đã hoàn thành (đã swap thành công)
- `expired`: Đã hết hạn
- `cancelled`: Đã bị hủy

### Indexes (Đã có sẵn)
```sql
CREATE INDEX idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX idx_reservations_station_id ON reservations(station_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_expires_at ON reservations(expires_at);
```

---

## 🔧 CẤU TRÚC CODE

### Files Đã Tạo

1. **`reservation_api.js`**
   - Business logic cho reservation
   - Functions: create, get, cancel, findAvailableBattery
   - Database operations

2. **`reservation_routes.js`**
   - Express routes cho API endpoints
   - Request validation
   - Response formatting

3. **`reservation_cleanup.js`**
   - Background service để expire reservations
   - Tự động cleanup reservations hết hạn

4. **`mqtt_client.js`** (Đã cập nhật)
   - Tích hợp reservation routes
   - Cập nhật DB config sang AWS RDS
   - Logic swap ưu tiên reservation

---

## 🔄 TÍCH HỢP VỚI HỆ THỐNG HIỆN TẠI

### 1. Cập Nhật `handleSwapRequest()` trong `mqtt_client.js`

**Logic hiện tại:**
- Tìm pin available ngẫu nhiên
- Kiểm tra reservation của pin đó
- Nếu pin đã được đặt bởi người khác → bỏ qua

**Logic mới (Đã tích hợp):**
- Kiểm tra customer có reservation active không?
  - Nếu có → Ưu tiên pin đã đặt
  - Nếu không → Tìm pin available như cũ
- Khi tìm pin, bỏ qua pin đã được đặt bởi người khác
- Khi swap thành công → Cập nhật reservation status = 'completed'

### 2. Database Config
- ✅ Đã cập nhật từ localhost → AWS RDS
- ✅ SSL connection enabled

---

## ⚙️ BACKGROUND SERVICES

### Cleanup Service

**Mục đích:** Tự động expire reservations hết hạn

**Cách chạy:**
```bash
# Chạy một lần
node reservation_cleanup.js

# Hoặc tích hợp vào cron job (mỗi phút)
# Windows: Task Scheduler
# Linux: crontab
```

**Hoặc tích hợp vào `mqtt_client.js`:**
```javascript
// Chạy cleanup mỗi 5 phút
setInterval(async () => {
    const cleanup = require('./reservation_cleanup');
    await cleanup.cleanupExpiredReservations();
}, 5 * 60 * 1000);
```

---

## 📱 UI/UX FLOW CHO APP MOBILE

### Màn Hình 1: Chọn Station
```
┌─────────────────────────┐
│  Danh Sách Trạm Sạc     │
├─────────────────────────┤
│ 📍 STATION_01           │
│    PTIT Ha Noi          │
│    ⚡ 4 pin available    │
│    🔒 1 pin đã đặt      │
│    [Xem Chi Tiết]       │
├─────────────────────────┤
│ 📍 STATION_02           │
│    BKDN Da Nang         │
│    ⚡ 1 pin available    │
│    [Xem Chi Tiết]       │
└─────────────────────────┘
```

### Màn Hình 2: Chi Tiết Station
```
┌─────────────────────────┐
│  STATION_01             │
│  PTIT Ha Noi            │
├─────────────────────────┤
│  Pin Available:         │
│  ┌─────────────────┐    │
│  │ Slot 1: BAT001  │    │
│  │ Status: Good ✅ │    │
│  │ [Đặt Pin Trước] │    │
│  └─────────────────┘    │
│  ┌─────────────────┐    │
│  │ Slot 2: BAT004  │    │
│  │ Status: Good ✅ │    │
│  │ 🔒 Đã được đặt  │    │
│  └─────────────────┘    │
│                          │
│  [Quét QR Để Đổi Pin]    │
└─────────────────────────┘
```

### Màn Hình 3: Đặt Pin Trước
```
┌─────────────────────────┐
│  Đặt Pin Trước          │
├─────────────────────────┤
│  Pin: BAT001            │
│  Slot: 1                │
│  Trạm: STATION_01       │
│                         │
│  Thời gian giữ chỗ:     │
│  ⏱️ 15 phút             │
│                         │
│  [Xác Nhận Đặt Pin]     │
│  [Hủy]                  │
└─────────────────────────┘
```

### Màn Hình 4: Danh Sách Reservations
```
┌─────────────────────────┐
│  Đơn Đặt Pin Của Tôi     │
├─────────────────────────┤
│  🔋 STATION_01          │
│     Pin: BAT001         │
│     Slot: 1             │
│     ⏰ Còn 12 phút      │
│     [Hủy Đặt Pin]       │
├─────────────────────────┤
│  ✅ STATION_02          │
│     Pin: BAT005         │
│     Đã hoàn thành       │
│     (12/12/2025 20:30)  │
└─────────────────────────┘
```

---

## 🧪 TESTING PLAN

### 1. Unit Tests
- ✅ Test `createReservation()` với các trường hợp:
  - Pin available → Success
  - Không có pin available → Error
  - Customer đã có reservation active → Error
  - Station không tồn tại → Error

- ✅ Test `cancelReservation()` với các trường hợp:
  - Reservation active → Success
  - Reservation đã expired → Error
  - Reservation không thuộc về customer → Error

- ✅ Test `findAvailableBattery()`:
  - Tìm pin không bị reserved
  - Bỏ qua pin đã được reserved

### 2. Integration Tests
- ✅ Test API endpoints với Postman/Thunder Client
- ✅ Test flow đặt pin → swap → hoàn thành
- ✅ Test cleanup service

### 3. End-to-End Tests
- ✅ Test từ app mobile:
  1. Đăng nhập
  2. Xem danh sách stations
  3. Đặt pin trước
  4. Đến trạm và quét QR
  5. Swap pin thành công
  6. Reservation tự động completed

---

## 🚀 DEPLOYMENT PLAN

### Phase 1: Development (Hoàn thành ✅)
- [x] Tạo reservation API
- [x] Tích hợp vào mqtt_client.js
- [x] Cập nhật DB config
- [x] Tạo cleanup service

### Phase 2: Testing
- [ ] Test API endpoints
- [ ] Test integration với swap flow
- [ ] Test cleanup service
- [ ] Test với app mobile

### Phase 3: Deployment
- [ ] Deploy lên server
- [ ] Setup cleanup cron job
- [ ] Monitor logs
- [ ] Collect feedback

---

## 📝 CHECKLIST TRIỂN KHAI

### Backend
- [x] Tạo `reservation_api.js`
- [x] Tạo `reservation_routes.js`
- [x] Tích hợp routes vào `mqtt_client.js`
- [x] Cập nhật DB config sang AWS RDS
- [x] Tạo cleanup service
- [ ] Tích hợp cleanup vào main service
- [ ] Test tất cả endpoints

### Frontend (App Mobile)
- [ ] Màn hình danh sách stations với số pin available
- [ ] Màn hình chi tiết station với danh sách pin
- [ ] Màn hình đặt pin trước
- [ ] Màn hình danh sách reservations
- [ ] Tích hợp API calls
- [ ] Xử lý errors và edge cases

### Database
- [x] Bảng `reservations` đã có sẵn
- [x] Indexes đã có sẵn
- [ ] Verify data integrity
- [ ] Backup strategy

### Documentation
- [x] API documentation (trong file này)
- [ ] User guide cho app mobile
- [ ] Admin guide

---

## 🔒 SECURITY CONSIDERATIONS

1. **Authentication:**
   - ✅ Mọi API đều yêu cầu username + password
   - ✅ Password được hash bằng bcrypt

2. **Authorization:**
   - ✅ Customer chỉ có thể xem/hủy reservations của mình
   - ✅ Kiểm tra ownership trước khi cancel

3. **Data Validation:**
   - ✅ Validate input parameters
   - ✅ SQL injection protection (parameterized queries)

4. **Rate Limiting:**
   - ⚠️ Cần thêm rate limiting để tránh spam
   - ⚠️ Giới hạn số reservations active của mỗi customer

---

## 📊 MONITORING & METRICS

### Metrics Cần Theo Dõi
1. Số lượng reservations được tạo mỗi ngày
2. Tỷ lệ reservations được completed vs expired
3. Thời gian trung bình từ reservation → swap
4. Số lượng reservations bị hủy
5. Pin availability rate tại mỗi station

### Logs
- ✅ Đã có console.log trong code
- ⚠️ Cần tích hợp logging service (Winston, Pino)

---

## 🐛 TROUBLESHOOTING

### Vấn Đề Thường Gặp

1. **Reservation không tự động expire**
   - Giải pháp: Đảm bảo cleanup service đang chạy
   - Check: `node reservation_cleanup.js`

2. **Pin không available khi đặt**
   - Giải pháp: Kiểm tra query `findAvailableBattery()`
   - Verify: Pin có status = 'full' và không bị reserved

3. **Swap không ưu tiên reservation**
   - Giải pháp: Kiểm tra logic trong `handleSwapRequest()`
   - Verify: Query reservation của customer trước khi tìm pin

---

## 📚 TÀI LIỆU THAM KHẢO

- File code: `reservation_api.js`, `reservation_routes.js`
- Database schema: `database_schema.sql`
- API test: Sử dụng Postman hoặc Thunder Client
- MQTT flow: `mqtt_client.js`

---

## 📅 TIMELINE

- **Week 1:** Development (✅ Hoàn thành)
- **Week 2:** Testing & Bug fixes
- **Week 3:** Frontend integration
- **Week 4:** Deployment & Monitoring

---

**Ngày tạo:** 12/12/2025  
**Trạng thái:** Development Phase - 80% hoàn thành  
**Next Steps:** Testing và tích hợp frontend

