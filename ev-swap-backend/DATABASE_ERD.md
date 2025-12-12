# Sơ Đồ ERD - EV Swap Database

## Tổng Quan

Database quản lý hệ thống đổi pin xe điện với 12 bảng chính

---

## Sơ Đồ ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EV SWAP DATABASE SCHEMA                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│    CUSTOMER      │         │     BATTERY      │         │     STATION      │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ PK id            │    ┌────│ PK uid           │         │ PK id            │
│    fullName      │    │    │    status        │         │    name          │
│    username      │    │    │    chargeCycles  │         │    location      │
│    passwordHash  │    │    │    lastCharged   │         │    status        │
│    phone         │    │    │    createdAt     │         │    totalSlots    │
│    email         │    │    └──────────────────┘         │    availableSlots│
│ FK currentBattery│────┘         │      │                │    lastMaint...  │
│    Uid           │               │      │                │    createdAt     │
│    totalSwaps    │               │      │                └──────────────────┘
│    balance       │               │      │                     │    │    │
│    avatarUrl     │               │      │                     │    │    │
│    createdAt     │               │      │                     │    │    │
└──────────────────┘               │      │                     │    │    │
      │   │   │                    │      │                     │    │    │
      │   │   │                    │      └─────────────────────┘    │    │
      │   │   │                    │                                 │    │
      │   │   └────────────────────┼─────────────────────────────────┘    │
      │   │                        │                                      │
      │   │                        │                                      │
      │   │     ┌──────────────────┴──────────────┐                      │
      │   │     │           SLOT                   │                      │
      │   │     ├──────────────────────────────────────┤                      │
      │   │     │ PK id                            │                      │
      │   │     │ FK stationId        ─────────────┤──────────────────────┘
      │   │     │ FK batteryUid       ──────────────├──────┐
      │   │     │    slotNumber                    │      │
      │   │     │    status                        │      │
      │   │     │    isBatteryPresent              │      │
      │   │     │    isLocked                      │      │
      │   │     │    lastUpdated                   │      │
      │   │     └──────────────────────────────────────┘      │
      │   │                  │                            │
      │   │                  │                            │
      │   │                  │                            │
      │   │     ┌────────────┴────────────┐               │
      │   │     │      WAREHOUSE          │               │
      │   │     ├─────────────────────────┤               │
      │   │     │ PK id                   │               │
      │   │     │ FK slotId               │               │
      │   │     │    totalCapacity        │               │
      │   │     └─────────────────────────┘               │
      │   │                  │                            │
      │   │                  │                            │
      │   │     ┌────────────┴────────────┐               │
      │   │     │  WAREHOUSE_BATTERY      │               │
      │   │     ├─────────────────────────┤               │
      │   │     │ PK id                   │               │
      │   │     │ FK warehouseId          │               │
      │   │     │ FK batteryUid   ────────┼───────────────┘
      │   │     │    insertedAt           │
      │   │     └─────────────────────────┘
      │   │
      │   │
      │   │     ┌───────────────────────────────────────────────┐
      │   │     │         TRANSACTION_LOG                       │
      │   │     ├───────────────────────────────────────────────┤
      │   │     │ PK id                                         │
      │   └─────┤ FK customerId                                 │
      │         │ FK stationId                                  │
      │         │ FK oldBatteryUid  ────────────────────────────┼──────┐
      │         │ FK newBatteryUid  ────────────────────────────┼──┐   │
      │         │    requestType                                │  │   │
      │         │    slotIn                                     │  │   │
      │         │    slotOut                                    │  │   │
      │         │    cost                                       │  │   │
      │         │    transactionTime                            │  │   │
      │         │    completedTime                              │  │   │
      │         │    status                                     │  │   │
      │         └───────────────────────────────────────────────┘  │   │
      │                                                             │   │
      │                                                             ▼   ▼
      │                                            (Liên kết với BATTERY)
      │
      │         ┌──────────────────────────┐
      │         │      FEEDBACK            │
      │         ├──────────────────────────┤
      │         │ PK feedbackId            │
      └─────────┤ FK customerId            │
                │    content               │
                │    rating (1-5)          │
                │    feedbackDate          │
                └──────────────────────────┘

      ┌─────────┐
      │         │
      │         │         ┌──────────────────────────┐
      │         │         │     RESERVATION          │
      │         │         ├──────────────────────────┤
      │         │         │ PK id                    │
      │         └─────────┤ FK customerId            │
      │                   │ FK stationId             │
      │                   │    reservedTime          │
      │                   │    status                │
      │                   │    batteryUid            │
      │                   │    createdAt             │
      │                   │    updatedAt             │
      │                   └──────────────────────────┘
      │
      │
      │                   ┌──────────────────────────┐
      │                   │       PAYMENT            │
      │                   ├──────────────────────────┤
      │                   │ PK id                    │
      └───────────────────┤ FK customerId            │
                          │    orderId               │
                          │    requestId             │
                          │    amount                │
                          │    status                │
                          │    paymentMethod         │
                          │    transactionId         │
                          │    momoData              │
                          │    errorMessage          │
                          │    createdAt             │
                          │    completedAt           │
                          └──────────────────────────┘


┌──────────────────┐         ┌──────────────────────────┐
│      ADMIN       │         │    MAINTENANCE_LOG       │
├──────────────────┤         ├──────────────────────────┤
│ PK id            │    ┌────┤ PK id                    │
│    username      │    │    │ FK stationId             │
│    passwordHash  │────┘    │ FK adminId               │
│    fullName      │         │    maintenanceType       │
│    role          │         │    description           │
│    createdAt     │         │    startTime             │
└──────────────────┘         │    endTime               │
                             │    status                │
                             └──────────────────────────┘
```

---

## Chi Tiết Các Bảng

### 1. **CUSTOMER** (Khách hàng)

- **PK**: `id` (INT)
- **Thuộc tính**:
  - `fullName`: Họ tên
  - `username`: Tên đăng nhập (unique)
  - `passwordHash`: Mật khẩu đã mã hóa
  - `phone`: Số điện thoại (unique)
  - `email`: Email (unique)
  - `currentBatteryUid`: Pin đang sử dụng
  - `totalSwaps`: Tổng số lần đổi pin
  - `balance`: Số dư tài khoản
  - `avatarUrl`: URL ảnh đại diện
  - `createdAt`: Ngày tạo
- **Quan hệ**:
  - 1-1 với `Battery` (pin hiện tại)
  - 1-N với `TransactionLog`
  - 1-N với `Feedback`
  - 1-N với `Reservation`
  - 1-N với `Payment`

---

### 2. **BATTERY** (Pin)

- **PK**: `uid` (STRING)
- **Thuộc tính**:
  - `status`: Trạng thái (full, charging, in_use, maintenance)
  - `chargeCycles`: Số chu kỳ sạc
  - `lastCharged`: Lần sạc cuối
  - `createdAt`: Ngày tạo
- **Quan hệ**:
  - 1-N với `Customer` (khách đang dùng)
  - 1-N với `Slot` (đang ở slot nào)
  - 1-N với `TransactionLog` (lịch sử giao dịch - old/new)
  - 1-N với `WarehouseBattery`

---

### 3. **STATION** (Trạm sạc)

- **PK**: `id` (INT)
- **Thuộc tính**:
  - `name`: Tên trạm (unique)
  - `location`: Địa điểm
  - `status`: Trạng thái (active, inactive, maintenance, out_of_battery)
  - `totalSlots`: Tổng số slot
  - `availableSlots`: Số slot khả dụng
  - `lastMaintenance`: Bảo trì lần cuối
  - `createdAt`: Ngày tạo
- **Quan hệ**:
  - 1-N với `Slot`
  - 1-N với `TransactionLog`
  - 1-N với `MaintenanceLog`
  - 1-N với `Reservation`

---

### 4. **SLOT** (Ngăn chứa pin trong trạm)

- **PK**: `id` (INT)
- **FK**: `stationId`, `batteryUid`
- **Thuộc tính**:
  - `slotNumber`: Số slot trong trạm
  - `status`: Trạng thái (empty, occupied, charging, error)
  - `isBatteryPresent`: Có pin hay không
  - `isLocked`: Khóa hay mở
  - `lastUpdated`: Cập nhật lần cuối
- **Quan hệ**:
  - N-1 với `Station`
  - N-1 với `Battery`
  - 1-N với `Warehouse`
- **Unique**: (`stationId`, `slotNumber`)

---

### 5. **TRANSACTION_LOG** (Lịch sử giao dịch)

- **PK**: `id` (INT)
- **FK**: `customerId`, `stationId`, `oldBatteryUid`, `newBatteryUid`
- **Thuộc tính**:
  - `requestType`: Loại yêu cầu (swap, return)
  - `slotIn`: Slot trả pin cũ
  - `slotOut`: Slot lấy pin mới
  - `cost`: Chi phí (7000đ mặc định)
  - `transactionTime`: Thời gian giao dịch
  - `completedTime`: Thời gian hoàn thành
  - `status`: Trạng thái (pending, completed, failed, cancelled)
- **Quan hệ**:
  - N-1 với `Customer`
  - N-1 với `Station`
  - N-1 với `Battery` (2 quan hệ: oldBattery và newBattery)

---

### 6. **RESERVATION** (Đặt chỗ)

- **PK**: `id` (INT)
- **FK**: `customerId`, `stationId`
- **Thuộc tính**:
  - `reservedTime`: Thời gian đặt
  - `status`: Trạng thái (pending, confirmed, completed, cancelled, expired)
  - `batteryUid`: Pin được đặt
  - `createdAt`: Ngày tạo
  - `updatedAt`: Ngày cập nhật
- **Quan hệ**:
  - N-1 với `Customer`
  - N-1 với `Station`

---

### 7. **PAYMENT** (Thanh toán)

- **PK**: `id` (INT)
- **FK**: `customerId`
- **Thuộc tính**:
  - `orderId`: Mã đơn hàng (unique)
  - `requestId`: Mã yêu cầu
  - `amount`: Số tiền
  - `status`: Trạng thái (pending, completed, failed, cancelled)
  - `paymentMethod`: Phương thức (momo, cash, card)
  - `transactionId`: Mã giao dịch từ MoMo
  - `momoData`: Dữ liệu từ MoMo (JSON)
  - `errorMessage`: Lỗi nếu có
  - `createdAt`: Ngày tạo
  - `completedAt`: Ngày hoàn thành
- **Quan hệ**:
  - N-1 với `Customer`

---

### 8. **FEEDBACK** (Phản hồi)

- **PK**: `feedbackId` (INT)
- **FK**: `customerId`
- **Thuộc tính**:
  - `content`: Nội dung
  - `rating`: Đánh giá (1-5 sao)
  - `feedbackDate`: Ngày phản hồi
- **Quan hệ**:
  - N-1 với `Customer`

---

### 9. **WAREHOUSE** (Kho pin)

- **PK**: `id` (INT)
- **FK**: `slotId`
- **Thuộc tính**:
  - `totalCapacity`: Tổng sức chứa (4 pin mặc định)
- **Quan hệ**:
  - N-1 với `Slot`
  - 1-N với `WarehouseBattery`

---

### 10. **WAREHOUSE_BATTERY** (Pin trong kho)

- **PK**: `id` (INT)
- **FK**: `warehouseId`, `batteryUid`
- **Thuộc tính**:
  - `insertedAt`: Thời gian cho vào kho
- **Quan hệ**:
  - N-1 với `Warehouse`
  - N-1 với `Battery`

---

### 11. **ADMIN** (Quản trị viên)

- **PK**: `id` (INT)
- **Thuộc tính**:
  - `username`: Tên đăng nhập (unique)
  - `passwordHash`: Mật khẩu đã mã hóa
  - `fullName`: Họ tên
  - `role`: Vai trò (user, superadmin)
  - `createdAt`: Ngày tạo
- **Quan hệ**:
  - 1-N với `MaintenanceLog`

---

### 12. **MAINTENANCE_LOG** (Lịch sử bảo trì)

- **PK**: `id` (INT)
- **FK**: `stationId`, `adminId`
- **Thuộc tính**:
  - `maintenanceType`: Loại bảo trì
  - `description`: Mô tả
  - `startTime`: Thời gian bắt đầu
  - `endTime`: Thời gian kết thúc
  - `status`: Trạng thái (in_progress, completed, cancelled)
- **Quan hệ**:
  - N-1 với `Station`
  - N-1 với `Admin`

---

## Luồng Dữ Liệu Chính

### 1. **Đăng ký/Đăng nhập**

```
Customer → (username, password) → Authentication → Token
```

### 2. **Đổi pin (Battery Swap)**

```
Customer → chọn Station → tạo Reservation
→ tạo TransactionLog (pending)
→ trả oldBattery vào Slot
→ lấy newBattery từ Slot
→ cập nhật Customer.currentBatteryUid
→ trừ Customer.balance
→ TransactionLog (completed)
```

### 3. **Nạp tiền**

```
Customer → tạo Payment (pending)
→ gọi MoMo API
→ MoMo callback
→ cập nhật Customer.balance
→ Payment (completed)
```

### 4. **Đánh giá dịch vụ**

```
Customer → tạo Feedback → lưu rating + content
```

### 5. **Bảo trì trạm**

```
Admin → tạo MaintenanceLog
→ cập nhật Station.status = "maintenance"
→ hoàn thành → MaintenanceLog (completed)
→ Station.status = "active"
```

---

## Indexes & Constraints

### Primary Keys

- Tất cả bảng có PK auto-increment (trừ Battery dùng UID)

### Foreign Keys với Cascade

- `Slot.stationId` → `Station.id` (ON DELETE CASCADE)
- `Warehouse.slotId` → `Slot.id` (ON DELETE CASCADE)
- `WarehouseBattery.warehouseId` → `Warehouse.id` (ON DELETE CASCADE)

### Foreign Keys với Set Null

- `Customer.currentBatteryUid` → `Battery.uid` (ON DELETE SET NULL)
- `Slot.batteryUid` → `Battery.uid` (ON DELETE SET NULL)

### Unique Constraints

- `Customer.username`, `Customer.phone`, `Customer.email`
- `Station.name`
- `(Slot.stationId, Slot.slotNumber)` - composite unique
- `Payment.orderId`

---

## Thống Kê Database

| Bảng             | Số Cột | Quan Hệ  |
| ---------------- | ------ | -------- |
| Customer         | 11     | 5 FK out |
| Battery          | 6      | 4 FK in  |
| Station          | 8      | 4 FK in  |
| Slot             | 10     | 4 FK     |
| TransactionLog   | 13     | 4 FK out |
| Reservation      | 8      | 2 FK out |
| Payment          | 13     | 1 FK out |
| Feedback         | 5      | 1 FK out |
| Warehouse        | 3      | 2 FK     |
| WarehouseBattery | 4      | 2 FK out |
| Admin            | 6      | 1 FK in  |
| MaintenanceLog   | 8      | 2 FK out |

**Tổng cộng**: 12 bảng, 95+ cột, 20+ quan hệ FK

---

**Cập nhật**: 12/12/2025  
**Database**: PostgreSQL on AWS RDS (Heroku)  
**ORM**: Prisma
