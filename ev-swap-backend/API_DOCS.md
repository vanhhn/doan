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
  "username": "string (required)",
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

Lấy lịch sử giao dịch (cần JWT)

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
        "id": 1,
        "customerId": 1,
        "stationId": 1,
        "requestType": "swap",
        "oldBatteryUid": "BAT001",
        "newBatteryUid": "BAT004",
        "slotIn": 1,
        "slotOut": 2,
        "transactionTime": "2024-01-13T10:00:00.000Z",
        "completedTime": "2024-01-13T10:05:00.000Z",
        "status": "completed",
        "station": {
          "id": 1,
          "name": "STATION_01",
          "location": "PTIT Ha Noi"
        },
        "oldBattery": {
          "uid": "BAT001",
          "chargeLevel": 20
        },
        "newBattery": {
          "uid": "BAT004",
          "chargeLevel": 100
        }
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
      "location": "PTIT Ha Noi",
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
          "status": "full",
          "isBatteryPresent": true,
          "chargeLevel": 100
        }
      ],
      "fullBatteries": 4
    }
  ]
}
```

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
    "location": "PTIT Ha Noi",
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
        "status": "full",
        "isBatteryPresent": true,
        "isLocked": true,
        "batteryUid": "BAT004",
        "chargeLevel": 100,
        "lastUpdated": "2024-01-15T10:30:00.000Z",
        "battery": {
          "uid": "BAT004",
          "status": "good",
          "chargeLevel": 100,
          "chargeCycles": 45,
          "lastCharged": "2024-01-15T12:00:00.000Z"
        }
      }
    ],
    "slotsSummary": {
      "full": 4,
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
      "oldBatteryUid": "BAT001",
      "slotIn": 1,
      "newBatteryUid": "BAT004",
      "slotOut": 2,
      "transactionTime": "2024-01-15T10:00:00.000Z",
      "completedTime": null,
      "status": "pending",
      "station": {
        "name": "STATION_01",
        "location": "PTIT Ha Noi"
      },
      "newBattery": {
        "uid": "BAT004",
        "chargeLevel": 100
      }
    },
    "slotNumber": 2,
    "batteryUid": "BAT004",
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
    "uid": "BAT001",
    "status": "good",
    "chargeLevel": 85,
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
  "status": "charging", // full, charging, empty, maintenance
  "battery_uid": "BAT011", // optional
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
    "batteryUid": "BAT011",
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
2. **Slot status** có thể là: `empty`, `full`, `charging`, `maintenance`
3. **Battery status** có thể là: `good`, `average`, `charging`, `in_use`, `maintenance`
4. **Station status** tự động cập nhật dựa trên số pin available:
   - `active`: Có >= 2 pin đầy
   - `low_battery`: Có 1 pin đầy
   - `out_of_battery`: Không có pin đầy
   - `maintenance`: Đang bảo trì

---

**🚀 Happy Testing!**
