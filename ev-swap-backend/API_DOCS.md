# 📡 API Documentation

Base URL: `http://localhost:3000`

---

## 🔐 Authentication

### Customer APIs

```
Header: Authorization: Bearer <JWT_TOKEN>
```

### IoT APIs

```
Header: x-api-key: <IOT_API_KEY>
```

---

## 📋 Endpoints Overview

### 1. Authentication

#### POST `/api/auth/register`

Đăng ký tài khoản mới

**Request Body:**

```json
{
  "username": "string (required)",
  "password": "string (required)",
  "fullName": "string (required)",
  "phone": "string (optional)",
  "email": "string (optional)"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Đăng ký thành công.",
  "data": {
    "id": 1,
    "username": "testuser",
    "fullName": "Nguyen Van A",
    "phone": "0987654321",
    "email": "test@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### POST `/api/auth/login`

Đăng nhập

**Request Body:**

```json
{
  "username": "string (required) - có thể dùng username hoặc số điện thoại",
  "password": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Đăng nhập thành công.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "customer": {
      "id": 1,
      "username": "testuser",
      "fullName": "Nguyen Van A",
      "phone": "0987654321",
      "email": "test@example.com",
      "currentBatteryUid": "BAT001",
      "totalSwaps": 5
    }
  }
}
```

---

#### POST `/api/auth/reset-password`

Đặt lại mật khẩu (Quên mật khẩu)

**Request Body:**

```json
{
  "phone": "string (required) - Số điện thoại đã đăng ký",
  "newPassword": "string (required, min 6 characters)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay."
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Không tìm thấy tài khoản với số điện thoại này."
}
```

---

### 2. Customer Profile

#### GET `/api/me/profile`

Lấy thông tin cá nhân (cần JWT)

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "fullName": "Nguyen Van A",
    "phone": "0987654321",
    "email": "test@example.com",
    "currentBatteryUid": "BAT001",
    "totalSwaps": 5,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "currentBattery": {
      "uid": "BAT001",
      "status": "good",
      "chargeLevel": 85,
      "chargeCycles": 120
    }
  }
}
```

---

#### GET `/api/me/history`

Lấy lịch sử giao dịch và nạp tiền (cần JWT)

**Query Params:**

- `limit` (optional, default: 20)
- `offset` (optional, default: 0)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "type": "swap",
        "date": "2024-01-13T10:00:00.000Z",
        "amount": -7000,
        "description": "Đổi pin tại STATION_01",
        "stationName": "STATION_01",
        "cost": 7000
      },
      {
        "type": "topup",
        "date": "2024-01-12T15:30:00.000Z",
        "amount": 50000,
        "description": "Nạp tiền qua MOMO",
        "paymentMethod": "momo"
      }
    ],
    "pagination": {
      "total": 50,
      "limit": 20,
      "offset": 0
    }
  }
}
```

**Note:**

- `type`: "swap" (đổi pin) hoặc "topup" (nạp tiền)
- `amount`: Số âm (-) cho swap, số dương (+) cho topup
- Transactions được sắp xếp theo thời gian mới nhất

---

### 3. Stations

#### GET `/api/stations`

Lấy danh sách tất cả trạm

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "STATION_01",
      "location": "Học viện Công nghệ Bưu chính Viễn thông Hà Nội;21.0063;105.8433",
      "status": "active",
      "totalSlots": 6,
      "availableSlots": 4,
      "lastMaintenance": null,
      "slots": [
        {
          "id": 1,
          "slotNumber": 1,
          "status": "empty",
          "isBatteryPresent": false,
          "chargeLevel": null
        },
        {
          "id": 2,
          "slotNumber": 2,
          "status": "occupied",
          "isBatteryPresent": true,
          "chargeLevel": 100
        }
      ],
      "fullBatteries": 4
    }
  ]
}
```

**Note:**

- `location` format: `Địa chỉ;latitude;longitude`
- Frontend cần split bằng `;` để lấy address, lat, lng
- `status` values: `active`, `inactive`, `maintenance`, `out_of_battery`
- Slot `status` values: `empty`, `occupied`, `charging`, `error`

---

#### GET `/api/stations/:id`

Lấy chi tiết một trạm

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "STATION_01",
    "location": "Học viện Công nghệ Bưu chính Viễn thông Hà Nội;21.0063;105.8433",
    "status": "active",
    "totalSlots": 6,
    "availableSlots": 4,
    "lastMaintenance": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "slots": [
      {
        "id": 2,
        "stationId": 1,
        "slotNumber": 2,
        "status": "occupied",
        "isBatteryPresent": true,
        "isLocked": true,
        "batteryUid": "UID-004",
        "chargeLevel": 100,
        "lastUpdated": "2024-01-15T10:30:00.000Z",
        "battery": {
          "uid": "UID-004",
          "status": "in_stock",
          "chargeCycles": 45,
          "lastCharged": "2024-01-15T12:00:00.000Z"
        }
      }
    ],
    "slotsSummary": {
      "occupied": 4,
      "charging": 1,
      "empty": 1,
      "maintenance": 0
    }
  }
}
```

---

### 4. Transactions

#### POST `/api/transactions/start-swap`

Yêu cầu đổi pin (cần JWT)

**Request Body:**

```json
{
  "stationId": 1,
  "oldBatteryUid": "BAT001" // optional
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Yêu cầu đổi pin thành công. Vui lòng lấy pin tại khay số 2",
  "data": {
    "transaction": {
      "id": 5,
      "customerId": 1,
      "stationId": 1,
      "requestType": "swap",
      "oldBatteryUid": "UID-001",
      "slotIn": 1,
      "newBatteryUid": "UID-004",
      "slotOut": 2,
      "transactionTime": "2024-01-15T10:00:00.000Z",
      "completedTime": null,
      "status": "pending",
      "station": {
        "name": "STATION_01",
        "location": "Học viện Công nghệ Bưu chính Viễn thông Hà Nội;21.0063;105.8433"
      },
      "newBattery": {
        "uid": "UID-004",
        "status": "in_stock"
      }
    },
    "slotNumber": 2,
    "batteryUid": "UID-004",
    "slotInNumber": 1
  }
}
```

**Error Responses:**

- `400` - Trạm không hoạt động hoặc hết pin
- `404` - Không tìm thấy trạm

---

### 5. Feedback

#### POST `/api/feedback`

Gửi phản hồi (cần JWT)

**Request Body:**

```json
{
  "content": "string (required)",
  "rating": 5 // optional, 1-5
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Gửi feedback thành công. Cảm ơn bạn đã đóng góp ý kiến!",
  "data": {
    "feedbackId": 1,
    "customerId": 1,
    "content": "Dịch vụ rất tốt!",
    "rating": 5,
    "feedbackDate": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 6. IoT APIs

#### POST `/api/iot/battery/validate`

Validate pin khi quét RFID (cần API Key)

**Headers:**

```
x-api-key: <IOT_API_KEY>
```

**Request Body:**

```json
{
  "battery_uid": "BAT001"
}
```

**Response (200):**

```json
{
  "success": true,
  "valid": true,
  "data": {
    "uid": "UID-001",
    "status": "in_stock",
    "chargeCycles": 120
  },
  "message": "Pin hợp lệ."
}
```

**Response (404) - Pin không tồn tại:**

```json
{
  "success": false,
  "valid": false,
  "message": "Pin không hợp lệ. Không tìm thấy trong hệ thống."
}
```

---

#### POST `/api/iot/slot/status-update`

Cập nhật trạng thái slot (cần API Key)

**Request Body:**

```json
{
  "station_id": 1,
  "slot_number": 3,
  "status": "charging", // occupied, charging, empty, error
  "battery_uid": "UID-011", // optional
  "charge_level": 75 // optional
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Cập nhật trạng thái slot thành công.",
  "data": {
    "id": 3,
    "stationId": 1,
    "slotNumber": 3,
    "status": "charging",
    "isBatteryPresent": true,
    "isLocked": true,
    "batteryUid": "UID-011",
    "chargeLevel": 75,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

**Side Effects:**

- Cập nhật thông tin pin trong bảng `batteries`
- Tự động cập nhật `availableSlots` của trạm
- Tự động cập nhật `status` trạm (active/low_battery/out_of_battery)

---

## ❌ Error Responses

### 400 - Bad Request

```json
{
  "success": false,
  "message": "Username và password là bắt buộc."
}
```

### 401 - Unauthorized

```json
{
  "success": false,
  "message": "Không tìm thấy token. Vui lòng đăng nhập."
}
```

### 403 - Forbidden

```json
{
  "success": false,
  "message": "API Key không hợp lệ."
}
```

### 404 - Not Found

```json
{
  "success": false,
  "message": "Không tìm thấy trạm."
}
```

### 409 - Conflict

```json
{
  "success": false,
  "message": "Username đã tồn tại."
}
```

### 500 - Internal Server Error

```json
{
  "success": false,
  "message": "Lỗi server khi xử lý yêu cầu.",
  "error": "Error details..."
}
```

---

## 📝 Notes

1. **JWT Token** có hiệu lực 7 ngày (mặc định)
2. **Slot status** có thể là: `empty`, `occupied`, `charging`, `error`
3. **Battery status** có thể là: `in_stock`, `charging`, `in_use`, `maintenance`
4. **Station status** tự động cập nhật dựa trên số pin available:
   - `active`: Có >= 2 pin đầy
   - `inactive`: Trạm không hoạt động
   - `out_of_battery`: Không có pin đầy
   - `maintenance`: Đang bảo trì
5. **Location format** trong stations: "Address;latitude;longitude" (phân tách bằng dấu chấm phẩy). Frontend cần split để lấy GPS coordinates.
6. **Battery UID format**: "UID-xxx" (ví dụ: UID-001, UID-004)

---

**🚀 Happy Testing!**
