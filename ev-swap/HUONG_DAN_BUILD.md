# HƯỚNG DẪN BUILD APK - KHÔNG CẦN ANDROID SDK

## Cách 1: EAS Build (Khuyến nghị - Build trên cloud)

### Bước 1: Đăng ký/Đăng nhập Expo

```bash
# Tạo account miễn phí tại: https://expo.dev/signup
# Hoặc đăng nhập:
eas login
```

### Bước 2: Build APK

```bash
cd /home/vanh/doan/ev-swap
eas build --platform android --profile preview
```

**Ưu điểm:**

- Không cần cài Android SDK
- Build trên cloud (server của Expo)
- Tự động download APK khi xong
- Miễn phí

**Thời gian:** 10-15 phút

---

## Cách 2: Expo Publish + APK (Không cần account)

### Bước 1: Cài Expo Dev Client

```bash
cd /home/vanh/doan/ev-swap
npx expo install expo-dev-client
```

### Bước 2: Start server

```bash
npx expo start --no-dev --minify
```

### Bước 3: Quét QR bằng Expo Go app

- Tải "Expo Go" từ Google Play Store
- Mở app, quét QR code
- App sẽ chạy trực tiếp trên điện thoại

**Lưu ý:** Đây không phải APK độc lập, cần Expo Go app

---

## Cách 3: Build APK chuẩn (Cần Android SDK)

Nếu muốn APK độc lập mà không dùng EAS:

### 1. Cài Android Studio

- Download: https://developer.android.com/studio
- Hoặc chỉ cài Android SDK command-line tools

### 2. Set biến môi trường

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 3. Build APK

```bash
cd /home/vanh/doan/ev-swap
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

**File APK:** `android/app/build/outputs/apk/release/app-release.apk`

---

## KHUYẾN NGHỊ

**→ Dùng EAS Build (Cách 1)**

- Dễ nhất, nhanh nhất
- Chỉ cần đăng ký account Expo (miễn phí)
- Không cần cài gì trên máy

```bash
# Tạo account tại: https://expo.dev/signup
# Username: <tên của bạn>
# Email: <email của bạn>
# Password: <mật khẩu>

# Sau đó chạy:
eas login
eas build --platform android --profile preview
```

APK sẽ được build trên cloud và cung cấp link download!
