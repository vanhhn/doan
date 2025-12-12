#!/bin/bash

# Script tự động build APK cho EV Swap
# Không cần Expo account, build hoàn toàn offline

echo "🔨 Bắt đầu build APK cho EV Swap..."
echo "===================================="

cd /home/vanh/doan/ev-swap

# Kiểm tra có thư mục android chưa
if [ ! -d "android" ]; then
  echo "📦 Tạo thư mục Android lần đầu..."
  npx expo prebuild --platform android
fi

echo ""
echo "⚙️  Build APK release..."
echo ""

# Build APK
cd android && ./gradlew assembleRelease

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ BUILD THÀNH CÔNG!"
  echo "==================="
  echo ""
  echo "📱 File APK nằm tại:"
  echo "   /home/vanh/doan/ev-swap/android/app/build/outputs/apk/release/app-release.apk"
  echo ""
  echo "📋 Kích thước:"
  ls -lh /home/vanh/doan/ev-swap/android/app/build/outputs/apk/release/app-release.apk | awk '{print "   " $5}'
  echo ""
  echo "💡 Copy file APK về máy để cài đặt lên điện thoại Android"
else
  echo ""
  echo "❌ BUILD THẤT BẠI!"
  echo "================"
  echo "Kiểm tra lỗi ở trên và thử lại"
fi
