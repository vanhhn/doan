# Tích hợp thanh toán MoMo - Hướng dẫn

## Tổng quan

Hệ thống đã được tích hợp MoMo Payment Gateway để cho phép người dùng nạp tiền vào ví EV Swap thông qua ví điện tử MoMo.

## Luồng thanh toán

1. **User chọn nạp tiền** → Nhập số tiền (tối thiểu 10,000đ)
2. **App gọi Backend API** → POST `/api/payment/momo/create`
3. **Backend tạo payment URL** → Gọi MoMo Payment Gateway API
4. **App mở WebView** → Hiển thị trang thanh toán MoMo
5. **User thanh toán** → Quét QR hoặc đăng nhập MoMo
6. **MoMo xử lý** → Gửi IPN callback về backend
7. **Backend cập nhật** → Cộng tiền vào balance
8. **WebView đóng** → User quay lại app với số dư mới

## Cấu trúc Code

### Frontend (React Native/Expo)

#### 1. MoMoPaymentScreen.tsx

- Màn hình WebView hiển thị trang thanh toán MoMo
- Theo dõi navigation state để detect success/failed
- Auto close khi thanh toán hoàn tất

#### 2. WalletScreen.tsx

- Nút "Nạp tiền" gọi `customerAPI.createMoMoPayment()`
- Navigate đến `MoMoPaymentScreen` với paymentUrl

#### 3. services/api.ts

```typescript
createMoMoPayment: async (amount: number) => {
  return apiClient.request("/api/payment/momo/create", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
};
```

### Backend (Node.js + Express + Prisma)

#### 1. Routes: payment.routes.js

- `POST /api/payment/momo/create` - Tạo payment request
- `POST /api/payment/momo/callback` - IPN từ MoMo (server-to-server)
- `GET /api/payment/momo/return` - Return URL cho user

#### 2. Controller: payment.controller.js

**createMoMoPayment:**

- Validate amount (min 10,000đ)
- Tạo orderId unique
- Tạo signature HMAC-SHA256
- Gọi MoMo API
- Lưu payment record vào DB
- Trả về paymentUrl cho frontend

**momoCallback (IPN):**

- Verify signature từ MoMo
- Kiểm tra resultCode (0 = success)
- Cập nhật payment status
- Cộng tiền vào customer.balance
- Return 200 OK cho MoMo

**momoReturn:**

- Hiển thị kết quả thanh toán
- Auto close sau 3s

#### 3. Database: prisma/schema.prisma

```prisma
model Payment {
  id            Int       @id @default(autoincrement())
  customerId    Int
  orderId       String    @unique
  requestId     String
  amount        Int
  status        String    // pending, completed, failed
  paymentMethod String    // momo
  transactionId String?
  momoData      String?   // JSON
  errorMessage  String?
  completedAt   DateTime?
  createdAt     DateTime  @default(now())
  customer      Customer  @relation(...)
}
```

## Cấu hình

### Environment Variables (.env)

```bash
# MoMo Test Environment (Sandbox)
MOMO_PARTNER_CODE="MOMO"
MOMO_ACCESS_KEY="F8BBA842ECF85"
MOMO_SECRET_KEY="K951B6PE1waDMi640xX08PD3vg6EkVlz"
MOMO_ENDPOINT="https://test-payment.momo.vn/v2/gateway/api/create"
MOMO_RETURN_URL="http://YOUR_SERVER_IP:3000/api/payment/momo/return"
MOMO_NOTIFY_URL="http://YOUR_SERVER_IP:3000/api/payment/momo/callback"
```

**Lưu ý:**

- Đây là credentials **TEST** của MoMo
- Production cần đăng ký tại https://business.momo.vn
- `MOMO_NOTIFY_URL` phải là public URL (không dùng localhost)

### Mobile App (constants.ts)

```typescript
export const API_BASE_URL = "http://192.168.80.120:3000";
```

## Testing

### 1. Test tạo payment (Terminal)

```bash
# Login và lấy token
TOKEN="your_jwt_token"

# Tạo payment request
curl -X POST http://localhost:3000/api/payment/momo/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 50000}'
```

Response:

```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://test-payment.momo.vn/...",
    "orderId": "EVSWAP_1234567890_1",
    "qrCodeUrl": "https://..."
  }
}
```

### 2. Test trong App

1. Login vào app
2. Vào tab **Wallet**
3. Nhấn nút **Nạp tiền**
4. Chọn "Thanh toán MoMo"
5. Nhập số tiền (VD: 50000)
6. Nhấn "Xác nhận"
7. WebView mở trang MoMo
8. Quét QR hoặc đăng nhập để thanh toán
9. Sau khi thành công, đóng WebView
10. Kiểm tra balance đã tăng

### 3. Test Callback (Mock)

```bash
# Simulate MoMo callback
curl -X POST http://localhost:3000/api/payment/momo/callback \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "EVSWAP_1234567890_1",
    "resultCode": 0,
    "amount": 50000,
    "transId": 123456,
    "message": "Success"
  }'
```

## Troubleshooting

### Lỗi "Không thể tạo thanh toán MoMo"

- Kiểm tra `.env` có đầy đủ config MoMo
- Restart backend sau khi sửa .env
- Check network: `curl https://test-payment.momo.vn`

### WebView không load

- Cài package: `npm install react-native-webview`
- Kiểm tra `paymentUrl` có hợp lệ
- Check console log trong MoMoPaymentScreen

### Không nhận được callback

- `MOMO_NOTIFY_URL` phải là public URL
- Nếu test local: dùng ngrok hoặc expose server
- Check firewall không block port 3000

### Balance không tăng sau thanh toán

- Kiểm tra backend log: `tail -f /tmp/backend.log`
- Query database: `SELECT * FROM payments WHERE orderId = '...'`
- Verify callback đã nhận: check payment status

## Production Checklist

- [ ] Đăng ký merchant tại https://business.momo.vn
- [ ] Nhận Partner Code, Access Key, Secret Key chính thức
- [ ] Deploy backend lên server public với HTTPS
- [ ] Cập nhật `MOMO_RETURN_URL` và `MOMO_NOTIFY_URL`
- [ ] Đổi endpoint từ test sang production
- [ ] Test thanh toán thật với số tiền nhỏ
- [ ] Implement transaction logging & monitoring
- [ ] Add error handling & retry mechanism
- [ ] Setup webhook để track payment status

## API Reference

### MoMo Payment Gateway

- Docs: https://developers.momo.vn
- Test environment: https://test-payment.momo.vn
- Production: https://payment.momo.vn

### Signature Algorithm

```javascript
const crypto = require("crypto");

// Sort keys alphabetically và join
const rawSignature = Object.keys(data)
  .sort()
  .map((key) => `${key}=${data[key]}`)
  .join("&");

// HMAC-SHA256
const signature = crypto
  .createHmac("sha256", secretKey)
  .update(rawSignature)
  .digest("hex");
```

### Result Codes

- `0` - Success
- `9000` - Transaction pending
- `1006` - Insufficient balance
- `1000` - Error
- `1001` - Timeout

## Tài liệu tham khảo

- MoMo Developer: https://developers.momo.vn
- React Native WebView: https://github.com/react-native-webview/react-native-webview
- Prisma Docs: https://www.prisma.io/docs
