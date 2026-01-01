# VALIDATION RULES - EV-SWAP BACKEND

## Tổng quan

Hệ thống validation được thiết kế để đảm bảo dữ liệu đầu vào hợp lệ trước khi insert vào database, giúp:

- Bảo vệ database khỏi dữ liệu không hợp lệ
- Cải thiện trải nghiệm người dùng với thông báo lỗi rõ ràng
- Tăng tính bảo mật của hệ thống
- Tái sử dụng logic validation

## Cấu trúc Validation

### 1. Validation Utils (`src/utils/validation.js`)

File chứa các hàm validation cơ bản có thể tái sử dụng:

- `validateUsername()`: Validate tên đăng nhập
- `validatePassword()`: Validate mật khẩu
- `validateFullName()`: Validate tên đầy đủ
- `validatePhone()`: Validate số điện thoại
- `validateEmail()`: Validate email
- `validateRegistrationData()`: Validate toàn bộ dữ liệu đăng ký
- `sanitizeRegistrationData()`: Làm sạch dữ liệu (trim, lowercase)

### 2. Validation Middleware (`src/middleware/validation.middleware.js`)

Middleware để validate request trước khi đến controller:

- `validateRegister`: Validate dữ liệu đăng ký
- `validateLogin`: Validate dữ liệu đăng nhập
- `validateResetPassword`: Validate đặt lại mật khẩu
- `validateUpdateProfile`: Validate cập nhật profile
- `validateSwapRequest`: Validate yêu cầu đổi pin
- `validatePaymentRequest`: Validate yêu cầu thanh toán

### 3. Áp dụng trong Routes (`src/routes/auth.routes.js`)

```javascript
router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
```

## Chi tiết Validation Rules

### 1. Username

**Quy tắc:**

- Bắt buộc
- Độ dài: 3-50 ký tự
- Chỉ chứa: chữ cái (a-z, A-Z), số (0-9), dấu gạch dưới (\_)
- Regex: `/^[a-zA-Z0-9_]{3,50}$/`

**Ví dụ hợp lệ:**

- `john_doe`
- `user123`
- `admin_2024`

**Ví dụ không hợp lệ:**

- `ab` (quá ngắn)
- `john-doe` (có dấu gạch ngang)
- `user@123` (có ký tự đặc biệt)

### 2. Password

**Quy tắc:**

- Bắt buộc
- Độ dài: 6-100 ký tự
- Không có quy tắc phức tạp (để đơn giản cho người dùng)

**Lưu ý:**

- Password được hash bằng bcrypt trước khi lưu vào database
- Salt rounds: 10

**Ví dụ hợp lệ:**

- `password123`
- `MyP@ssw0rd`
- `simple`

**Ví dụ không hợp lệ:**

- `12345` (quá ngắn, < 6 ký tự)
- Chuỗi dài hơn 100 ký tự

### 3. Full Name

**Quy tắc:**

- Bắt buộc
- Độ dài: 2-100 ký tự (sau khi trim)
- Được phép chứa bất kỳ ký tự nào (hỗ trợ tiếng Việt có dấu)

**Ví dụ hợp lệ:**

- `Nguyễn Văn A`
- `John Doe`
- `李明`

**Ví dụ không hợp lệ:**

- `A` (quá ngắn, < 2 ký tự)
- Chuỗi dài hơn 100 ký tự

### 4. Phone

**Quy tắc:**

- Tùy chọn (optional)
- Độ dài: 10 chữ số
- Chỉ chứa số (0-9)
- Regex: `/^[0-9]{10}$/`

**Ví dụ hợp lệ:**

- `0987654321` (10 số)

**Ví dụ không hợp lệ:**

- `098765432` (quá ngắn, < 10 số)
- `09876543210` (quá dài, > 10 số)
- `098-765-4321` (có dấu gạch ngang)
- `(098) 765-4321` (có ký tự đặc biệt)

### 5. Email

**Quy tắc:**

- Tùy chọn (optional)
- Độ dài: tối đa 100 ký tự
- Phải có định dạng email hợp lệ
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Tự động chuyển thành lowercase

**Ví dụ hợp lệ:**

- `user@example.com`
- `john.doe@company.co.uk`
- `admin+test@domain.org`

**Ví dụ không hợp lệ:**

- `invalidemail` (thiếu @)
- `user@` (thiếu domain)
- `@example.com` (thiếu local part)

## Data Sanitization (Làm sạch dữ liệu)

Trước khi lưu vào database, dữ liệu được sanitize:

### 1. Trim whitespace

- `username`: Xóa khoảng trắng đầu/cuối
- `fullName`: Xóa khoảng trắng đầu/cuối
- `phone`: Xóa khoảng trắng đầu/cuối
- `email`: Xóa khoảng trắng đầu/cuối

### 2. Lowercase

- `email`: Chuyển thành chữ thường (để đảm bảo unique)

### 3. Null handling

- Các trường optional nếu là chuỗi rỗng sẽ được chuyển thành `null`

**Ví dụ:**

```javascript
// Input
{
  username: "  john_doe  ",
  email: "  John@Example.COM  ",
  fullName: "  John Doe  "
}

// Sau sanitization
{
  username: "john_doe",
  email: "john@example.com",
  fullName: "John Doe"
}
```

## Kiểm tra Unique Constraints

Sau khi validate format, hệ thống kiểm tra unique constraints trong database:

### 1. Username

- Phải duy nhất trong bảng `customers`
- Error code: 409 (Conflict)
- Message: "Username đã tồn tại."

### 2. Email

- Phải duy nhất trong bảng `customers` (nếu cung cấp)
- Error code: 409 (Conflict)
- Message: "Email đã được sử dụng."

### 3. Phone

- Phải duy nhất trong bảng `customers` (nếu cung cấp)
- Error code: 409 (Conflict)
- Message: "Số điện thoại đã được sử dụng."

## Error Responses

### Format

```json
{
  "success": false,
  "message": "Mô tả lỗi cụ thể"
}
```

### HTTP Status Codes

- `400 Bad Request`: Lỗi validation format
- `409 Conflict`: Dữ liệu trùng lặp (unique constraint)
- `500 Internal Server Error`: Lỗi server

### Ví dụ Error Response

```json
{
  "success": false,
  "message": "Username phải từ 3-50 ký tự, chỉ chứa chữ cái, số và dấu gạch dưới."
}
```

## Validation cho các API khác

### 1. Swap Request Validation

```javascript
validateSwapRequest: {
  stationId: required, integer, > 0
}
```

### 2. Payment Request Validation

```javascript
validatePaymentRequest: {
  amount: required, number, > 0, <= 10,000,000
}
```

### 3. Update Profile Validation

```javascript
validateUpdateProfile: {
  fullName: optional, 2-100 chars,
  email: optional, valid email format,
  phone: optional, 10 digits
}
```

## Best Practices

1. **Luôn validate ở backend**: Không tin tưởng dữ liệu từ client
2. **Validate sớm**: Sử dụng middleware để validate trước khi vào controller
3. **Message rõ ràng**: Thông báo lỗi phải giúp người dùng sửa lỗi
4. **Sanitize input**: Trim whitespace, lowercase email
5. **Check database constraints**: Kiểm tra unique sau khi validate format
6. **Handle Prisma errors**: Bắt lỗi P2002 (unique constraint violation)

## Testing

### Manual Testing với curl

**Test đăng ký hợp lệ:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "fullName": "Test User",
    "phone": "0987654321",
    "email": "test@example.com"
  }'
```

**Test validation error:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "password": "123",
    "fullName": "T"
  }'
```

Expected: Lỗi về độ dài username, password, fullName

**Test duplicate username:**

```bash
# Đăng ký lần 1 (thành công)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "duplicate_test",
    "password": "password123",
    "fullName": "Test User"
  }'

# Đăng ký lần 2 với cùng username (lỗi)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "duplicate_test",
    "password": "password123",
    "fullName": "Another User"
  }'
```

Expected: HTTP 409 - "Username đã tồn tại."

## Maintenance

Khi cần thêm validation rule mới:

1. Thêm function vào `src/utils/validation.js`
2. Thêm middleware vào `src/middleware/validation.middleware.js`
3. Apply middleware vào route tương ứng
4. Cập nhật documentation này

## Security Considerations

1. **SQL Injection**: Prisma tự động escape parameters
2. **XSS Prevention**: Không render user input trực tiếp ra HTML
3. **Password Security**: Luôn hash với bcrypt, không lưu plain text
4. **Rate Limiting**: Nên thêm rate limiting cho register/login endpoints
5. **CAPTCHA**: Xem xét thêm CAPTCHA cho production

---

Tài liệu này được tạo ngày: 15/12/2025
Phiên bản: 1.0
