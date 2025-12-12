# Hướng dẫn cập nhật App Online

## Phương án 1: EAS Update (OTA) - Cập nhật JavaScript không cần APK mới

### Bước 1: Setup EAS

```bash
# Login EAS (cần tài khoản Expo)
npx eas-cli login

# Configure project
npx eas-cli update:configure
```

### Bước 2: Publish Update

```bash
cd /home/vanh/doan/ev-swap

# Publish update lên channel production
npx eas-cli update --branch production --message "Fix bugs and improve performance"

# Hoặc channel development để test
npx eas-cli update --branch development --message "Testing new features"
```

### Bước 3: User sẽ tự động nhận update khi mở app

**Lưu ý**:

- Chỉ cập nhật được JavaScript/React code
- Không cập nhật được native code (Java/Kotlin/Swift)
- Nếu thay đổi native dependencies → Cần build APK mới

---

## Phương án 2: Google Play Store - Phân phối chính thức

### Bước 1: Tạo tài khoản Google Play Console

- Truy cập: https://play.google.com/console
- Phí đăng ký: $25 (1 lần duy nhất)

### Bước 2: Tạo app trên Play Console

- Tạo app mới
- Điền thông tin: tên, mô tả, icon, screenshots
- Thiết lập phân loại nội dung

### Bước 3: Build AAB (Android App Bundle)

```bash
cd /home/vanh/doan/ev-swap/android

# Build AAB thay vì APK
./gradlew bundleRelease

# File output: android/app/build/outputs/bundle/release/app-release.aab
```

### Bước 4: Upload lên Play Console

- Vào "Release" → "Production"
- Upload file .aab
- Điền release notes
- Submit for review (2-7 ngày)

### Bước 5: Cập nhật app sau này

```bash
# Tăng versionCode và versionName trong android/app/build.gradle
versionCode 2
versionName "1.1.0"

# Build lại
./gradlew bundleRelease

# Upload version mới lên Play Console
```

---

## Phương án 3: APK Direct Download - Đơn giản nhất

### Bước 1: Host APK trên server

```bash
# Upload APK lên hosting (Cloudinary, Firebase, hoặc server riêng)
# Ví dụ với Cloudinary:
# https://res.cloudinary.com/your-cloud/raw/upload/EVSwap-v1.0.apk
```

### Bước 2: Tạo landing page

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Download EV Swap App</title>
  </head>
  <body>
    <h1>EV Swap - Battery Swap App</h1>
    <a href="https://your-server.com/EVSwap-latest.apk" download>
      <button>Download APK (Version 1.0)</button>
    </a>
    <p>Latest update: Dec 12, 2025</p>
  </body>
</html>
```

### Bước 3: Share link với users

- User download APK mới
- Cài đè lên app cũ (nếu signature key giống nhau)

---

## Phương án 4: Firebase App Distribution - Cho Beta Testing

### Bước 1: Setup Firebase

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

### Bước 2: Upload APK

```bash
# Upload qua Firebase Console hoặc CLI
firebase appdistribution:distribute \
  android/app/build/outputs/apk/release/app-release.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups testers
```

### Bước 3: Testers nhận email với link download

---

## So sánh các phương án

| Phương án      | Tốc độ                    | Chi phí  | Phù hợp cho                      |
| -------------- | ------------------------- | -------- | -------------------------------- |
| **EAS Update** | ⚡ Nhanh nhất (vài phút)  | Miễn phí | Update nhỏ, bug fixes            |
| **Play Store** | 🐢 Chậm (2-7 ngày review) | $25/năm  | Production, phân phối chính thức |
| **Direct APK** | ⚡ Nhanh                  | Miễn phí | Internal testing, demo           |
| **Firebase**   | ⚡ Nhanh                  | Miễn phí | Beta testing                     |

---

## Khuyến nghị cho dự án của bạn

### Giai đoạn Development (hiện tại)

1. **EAS Update** cho code changes nhỏ
2. **Direct APK** share cho người test

### Giai đoạn Production (sau này)

1. **Google Play Store** cho users chính thức
2. **EAS Update** cho hotfixes
3. **Firebase** cho beta testers

---

## Quick Start - Setup ngay bây giờ

```bash
# 1. Setup EAS
cd /home/vanh/doan/ev-swap
npx eas-cli login

# 2. Configure
npx eas-cli build:configure

# 3. Test update
npx eas-cli update --branch development --message "First OTA update"
```

Sau đó chỉ cần chạy `npx eas-cli update` mỗi khi có thay đổi code!
