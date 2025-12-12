# Hướng dẫn expose backend để nhận MoMo callback

## Cách 1: Sử dụng ngrok (Khuyến nghị)

1. Cài đặt ngrok:

```bash
# Ubuntu/Debian
sudo snap install ngrok

# hoặc download từ: https://ngrok.com/download
```

2. Chạy ngrok:

```bash
ngrok http 3000
```

3. Copy URL từ ngrok (ví dụ: https://abc123.ngrok.io)

4. Cập nhật .env:

```env
MOMO_RETURN_URL="https://abc123.ngrok.io/api/payment/momo/return"
MOMO_NOTIFY_URL="https://abc123.ngrok.io/api/payment/momo/callback"
```

5. Restart backend

## Cách 2: Sử dụng localtunnel

1. Cài đặt:

```bash
npm install -g localtunnel
```

2. Chạy:

```bash
lt --port 3000 --subdomain evswap
```

3. Cập nhật .env với URL từ localtunnel

## Test flow hoàn chỉnh:

1. User mở app → Wallet → Nạp tiền → Chọn MoMo → Nhập 50,000đ
2. App tạo payment request → Nhận deeplink
3. App mở MoMo app bằng deeplink
4. User thanh toán trong MoMo app
5. MoMo gửi callback về backend (qua ngrok URL)
6. Backend tự động cộng tiền vào customer.balance
7. App tự động refresh sau 3 giây → Hiển thị balance mới

## Test local (không cần MoMo thật):

```bash
# Sau khi tạo payment, lấy orderId từ response
/tmp/simulate_momo_payment.sh EVSWAP_1765247572617_6 50000
```
