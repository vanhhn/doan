# Deploy Backend lên Heroku

## Bước 1: Cài đặt Heroku CLI

```bash
# Ubuntu/Debian
curl https://cli-assets.heroku.com/install.sh | sh

# Hoặc dùng snap
sudo snap install --classic heroku
```

## Bước 2: Login Heroku

```bash
heroku login
```

## Bước 3: Tạo app Heroku

```bash
cd /home/vanh/doan/ev-swap-backend
heroku create ev-swap-backend
# Hoặc tên khác: heroku create your-app-name
```

## Bước 4: Thêm PostgreSQL database

```bash
heroku addons:create heroku-postgresql:essential-0
# Hoặc dùng free tier (nếu còn): heroku-postgresql:hobby-dev
```

## Bước 5: Set environment variables

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key-here
heroku config:set MOMO_PARTNER_CODE=MOMOBKUN20180529
heroku config:set MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
heroku config:set MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa

# DATABASE_URL sẽ tự động được set khi add PostgreSQL addon
```

## Bước 6: Deploy code

```bash
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku temp-main:main
# Hoặc nếu đang ở main branch: git push heroku main
```

## Bước 7: Run database migration

```bash
heroku run npx prisma migrate deploy
heroku run npx prisma generate
```

## Bước 8: Seed database (nếu cần)

```bash
# Tạo file seed.js trước, sau đó:
heroku run node seed.js
```

## Bước 9: Xem logs

```bash
heroku logs --tail
```

## Bước 10: Mở app

```bash
heroku open
```

## Lấy URL backend

```bash
heroku info
# URL sẽ là: https://ev-swap-backend-xxxxx.herokuapp.com
```

## Cập nhật URL trong frontend

Sau khi có URL Heroku, cập nhật file `ev-swap/services/api.ts`:

```typescript
export const API_BASE_URL = "https://ev-swap-backend-xxxxx.herokuapp.com";
```

## Lưu ý quan trọng

1. **Database URL**: Heroku tự động inject DATABASE_URL vào env, Prisma sẽ dùng nó
2. **Port**: Heroku tự động set PORT, code đã dùng `process.env.PORT || 3000`
3. **MoMo Callback**: Cập nhật returnUrl và notifyUrl trong payment.controller.js thành Heroku URL
4. **Free tier**: Heroku free tier đã ngừng, cần dùng paid plan hoặc có $13 credit (như offer bạn nhận)
5. **Uploads folder**: Heroku filesystem là ephemeral, nên dùng S3/Cloudinary cho file uploads lâu dài

## Commands hữu ích

```bash
# Restart app
heroku restart

# Scale dynos
heroku ps:scale web=1

# Access PostgreSQL
heroku pg:psql

# Xem config
heroku config

# Xóa app
heroku apps:destroy --app ev-swap-backend
```

## Troubleshooting

- Nếu app crash: `heroku logs --tail`
- Nếu database lỗi: `heroku pg:info`
- Nếu build fail: Check package.json và Node version
