# 📱 KỊCH BẢN QUÉT QR TOÀN HỆ THỐNG

## 🎯 TỔNG QUAN

Tài liệu này mô tả tất cả các kịch bản quét QR code trong hệ thống đổi pin thông minh, bao gồm:
- Đổi pin thông thường
- Đổi pin khi có reservation
- Đặt pin trước
- Xem thông tin station
- Xử lý lỗi

---

## 📋 CÁC LOẠI QR CODE

### 1. QR Code Đổi Pin (Swap)
```json
{
  "stationName": "STATION_01",
  "location": "PTIT Ha Noi",
  "action": "swap"
}
```

**Mục đích:** Bắt đầu quy trình đổi pin tại trạm

### 2. QR Code Xem Thông Tin Station (Info)
```json
{
  "stationName": "STATION_01",
  "location": "PTIT Ha Noi",
  "action": "info"
}
```

**Mục đích:** Xem thông tin chi tiết về station (pin available, vị trí, v.v.)

### 3. QR Code Đặt Pin Trước (Reserve)
```json
{
  "stationName": "STATION_01",
  "location": "PTIT Ha Noi",
  "action": "reserve"
}
```

**Mục đích:** Mở màn hình đặt pin trước

---

## 🎬 KỊCH BẢN 1: ĐỔI PIN THÔNG THƯỜNG (KHÔNG CÓ RESERVATION)

### Flow Diagram
```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Đến trạm
       │ 2. Quét QR code
       ↓
┌─────────────────────┐
│  App Mobile         │
│  - Parse QR data    │
│  - Extract station  │
└──────┬──────────────┘
       │ 3. Hiển thị form đăng nhập
       ↓
┌─────────────────────┐
│  User Input:        │
│  - Username         │
│  - Password         │
│  - Pin cũ (UID)     │
└──────┬──────────────┘
       │ 4. Gửi HTTP POST request
       ↓
┌─────────────────────┐
│  POST /api/swap/    │
│  request             │
│  {                   │
│    stationName,      │
│    username,         │
│    password,         │
│    returnUid         │
│  }                   │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  Backend Logic:      │
│  1. Xác thực user    │
│  2. Kiểm tra pin cũ  │
│  3. Tìm pin available│
│  4. Tạo transaction  │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  Response:           │
│  - transactionId     │
│  - releaseSlot       │
│  - newBatteryUid     │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  User:               │
│  5. Đưa pin cũ vào   │
│     slot bất kỳ      │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  IoT Device:         │
│  - RFID đọc UID      │
│  - Gửi MQTT status   │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  Backend:            │
│  - Xác thực pin      │
│  - Khóa slot pin cũ │
│  - Mở slot pin mới   │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  User:               │
│  6. Lấy pin mới      │
│     từ slot đã mở    │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  IoT Device:         │
│  - Phát hiện slot    │
│    trống             │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  Backend:            │
│  - Hoàn tất giao dịch│
│  - Cập nhật DB       │
└──────────────────────┘
```

### Chi Tiết Từng Bước

#### Bước 1: User Quét QR Code
```javascript
// App Mobile
const qrData = await scanQRCode();
// qrData = '{"stationName":"STATION_01","location":"PTIT Ha Noi","action":"swap"}'

const stationInfo = JSON.parse(qrData);
// stationInfo = { stationName: "STATION_01", location: "PTIT Ha Noi", action: "swap" }
```

#### Bước 2: App Hiển Thị Form
```javascript
// App Mobile UI
if (stationInfo.action === 'swap') {
    showSwapForm({
        stationName: stationInfo.stationName,
        stationLocation: stationInfo.location
    });
}
```

**Form bao gồm:**
- Username input
- Password input
- Pin cũ UID (có thể tự động lấy từ app hoặc quét RFID)

#### Bước 3: Gửi Request
```javascript
// App Mobile
const response = await fetch('http://your-api.com/api/swap/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        stationName: stationInfo.stationName,
        username: userInput.username,
        password: userInput.password,
        returnUid: userInput.returnUid
    })
});

const result = await response.json();
// result = {
//   success: true,
//   data: {
//     transactionId: "TXN_123",
//     releaseSlot: 2,
//     newBatteryUid: "BAT004"
//   }
// }
```

#### Bước 4: Backend Xử Lý
```javascript
// Backend (mqtt_client.js)
async function handleSwapRequest(stationName, reqData) {
    // 1. Xác thực customer
    const customer = await authenticateCustomer(reqData.username, reqData.password);
    
    // 2. Kiểm tra pin cũ thuộc về customer
    if (customer.current_battery_uid !== reqData.returnUid) {
        throw new Error('Pin không thuộc về bạn');
    }
    
    // 3. Tìm pin available (không có reservation)
    const availableBattery = await findAvailableBattery(stationName);
    
    // 4. Tạo transaction
    const transaction = await createTransaction(customer.id, stationName, availableBattery);
    
    return transaction;
}
```

#### Bước 5-6: User Trả Pin Cũ và Lấy Pin Mới
- User đưa pin cũ vào slot → IoT device gửi MQTT
- Backend xác thực → Mở slot pin mới
- User lấy pin mới → IoT device phát hiện → Hoàn tất

---

## 🎬 KỊCH BẢN 2: ĐỔI PIN KHI CÓ RESERVATION

### Flow Diagram
```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Đã đặt pin trước
       │ 2. Đến trạm
       │ 3. Quét QR code
       ↓
┌─────────────────────┐
│  App Mobile         │
│  - Parse QR         │
│  - Check có         │
│    reservation?     │
└──────┬──────────────┘
       │ 4. Có reservation
       │    → Hiển thị thông tin
       ↓
┌─────────────────────┐
│  User Input:        │
│  - Username         │
│  - Password         │
│  - Pin cũ (UID)     │
└──────┬──────────────┘
       │ 5. Gửi request
       ↓
┌─────────────────────┐
│  Backend:           │
│  1. Xác thực user   │
│  2. Tìm reservation  │
│  3. Ưu tiên pin đã  │
│     đặt             │
│  4. Tạo transaction │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  Response:           │
│  - transactionId     │
│  - releaseSlot (pin  │
│    đã đặt)           │
│  - newBatteryUid     │
│  - reservationId     │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  User:               │
│  6. Trả pin cũ      │
│  7. Lấy pin mới      │
│     (đã được đặt)    │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  Backend:            │
│  - Hoàn tất swap     │
│  - Cập nhật          │
│    reservation =     │
│    'completed'       │
└──────────────────────┘
```

### Chi Tiết

#### Bước 1-3: User Quét QR
```javascript
// App Mobile
const qrData = await scanQRCode();
const stationInfo = JSON.parse(qrData);

// Kiểm tra có reservation không
const reservations = await fetch(`/api/reservations?username=${username}&password=${password}`)
    .then(r => r.json());

const activeReservation = reservations.data.reservations.find(
    r => r.stationName === stationInfo.stationName && r.status === 'active'
);

if (activeReservation) {
    showReservationInfo({
        batteryUid: activeReservation.batteryUid,
        slotNumber: activeReservation.slotNumber,
        expiresAt: activeReservation.expiresAt
    });
}
```

#### Bước 4-5: Gửi Request
```javascript
// App Mobile
const response = await fetch('/api/swap/request', {
    method: 'POST',
    body: JSON.stringify({
        stationName: stationInfo.stationName,
        username: username,
        password: password,
        returnUid: returnUid
    })
});
```

#### Bước 6: Backend Ưu Tiên Reservation
```javascript
// Backend (mqtt_client.js)
async function handleSwapRequest(stationName, reqData) {
    const customer = await authenticateCustomer(reqData.username, reqData.password);
    
    // Kiểm tra có reservation không
    const reservation = await dbPool.query(
        `SELECT * FROM reservations 
         WHERE customer_id = $1 
           AND station_id = (SELECT id FROM stations WHERE name = $2)
           AND status = 'active' 
           AND expires_at > NOW()`,
        [customer.id, stationName]
    );
    
    let fullSlot;
    
    if (reservation.rows.length > 0) {
        // Có reservation → Ưu tiên pin đã đặt
        const res = reservation.rows[0];
        fullSlot = await dbPool.query(
            `SELECT slot_number, battery_uid FROM slots 
             WHERE battery_uid = $1 AND station_id = $2`,
            [res.battery_uid, res.station_id]
        );
        console.log(`[RESERVATION] Sử dụng pin đã đặt: ${res.battery_uid}`);
    } else {
        // Không có reservation → Tìm pin available như bình thường
        fullSlot = await findAvailableBattery(stationName);
    }
    
    // Tạo transaction với reservation_id
    const transaction = await createTransaction(
        customer.id, 
        stationName, 
        fullSlot,
        reservation.rows[0]?.id
    );
    
    return transaction;
}
```

---

## 🎬 KỊCH BẢN 3: ĐẶT PIN TRƯỚC

### Flow Diagram
```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Mở app
       │ 2. Chọn station
       │ 3. Quét QR "reserve"
       │    (hoặc chọn từ danh sách)
       ↓
┌─────────────────────┐
│  App Mobile         │
│  - Parse QR         │
│  - action="reserve" │
└──────┬──────────────┘
       │ 4. Hiển thị màn hình đặt pin
       ↓
┌─────────────────────┐
│  GET /api/stations/ │
│  {name}/available-  │
│  batteries          │
└──────┬──────────────┘
       │ 5. Hiển thị danh sách pin
       ↓
┌─────────────────────┐
│  User:              │
│  - Chọn pin         │
│  - Xác nhận đặt     │
└──────┬──────────────┘
       │ 6. Gửi POST request
       ↓
┌─────────────────────┐
│  POST /api/         │
│  reservations       │
│  {                  │
│    username,        │
│    password,        │
│    stationName,      │
│    durationMinutes  │
│  }                  │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  Backend:            │
│  1. Xác thực user    │
│  2. Kiểm tra có      │
│     reservation?     │
│  3. Tìm pin available│
│  4. Tạo reservation  │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  Response:           │
│  - reservationId     │
│  - batteryUid         │
│  - slotNumber         │
│  - expiresAt          │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  App Mobile:          │
│  - Hiển thị thông tin │
│  - Countdown timer    │
│  - Nút "Đến Trạm"     │
└──────────────────────┘
```

### Chi Tiết

#### Bước 1-3: User Chọn Đặt Pin
```javascript
// App Mobile
const qrData = await scanQRCode();
// qrData = '{"stationName":"STATION_01","action":"reserve"}'

const stationInfo = JSON.parse(qrData);

if (stationInfo.action === 'reserve') {
    navigateToReservationScreen(stationInfo.stationName);
}
```

#### Bước 4: Lấy Danh Sách Pin Available
```javascript
// App Mobile
const response = await fetch(
    `/api/stations/${stationInfo.stationName}/available-batteries`
);
const data = await response.json();

// data = {
//   station: { name: "STATION_01", available_slots: 4, reserved_slots: 1 },
//   batteries: [
//     { slotNumber: 1, batteryUid: "BAT001", batteryStatus: "good", isReserved: false },
//     { slotNumber: 2, batteryUid: "BAT004", batteryStatus: "good", isReserved: true }
//   ]
// }

showBatteryList(data.data.batteries.filter(b => !b.isReserved));
```

#### Bước 5-6: Tạo Reservation
```javascript
// App Mobile
const response = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: currentUser.username,
        password: currentUser.password,
        stationName: stationInfo.stationName,
        durationMinutes: 15
    })
});

const result = await response.json();
// result = {
//   success: true,
//   data: {
//     reservationId: 1,
//     batteryUid: "BAT001",
//     slotNumber: 1,
//     expiresAt: "2025-12-12T21:00:00Z"
//   }
// }

showReservationConfirmation(result.data);
startCountdownTimer(result.data.expiresAt);
```

---

## 🎬 KỊCH BẢN 4: XEM THÔNG TIN STATION

### Flow Diagram
```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Quét QR "info"
       ↓
┌─────────────────────┐
│  App Mobile         │
│  - Parse QR         │
│  - action="info"    │
└──────┬──────────────┘
       │ 2. Gửi GET request
       ↓
┌─────────────────────┐
│  GET /api/stations/ │
│  {name}/available-  │
│  batteries          │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  Response:           │
│  - Station info       │
│  - Pin available      │
│  - Pin reserved       │
└──────┬──────────────┘
       │
       ↓
┌──────────────────────┐
│  App Mobile:          │
│  - Hiển thị thông tin │
│  - Nút "Đặt Pin"      │
│  - Nút "Đổi Pin"      │
└──────────────────────┘
```

### Chi Tiết
```javascript
// App Mobile
const qrData = await scanQRCode();
const stationInfo = JSON.parse(qrData);

if (stationInfo.action === 'info') {
    const response = await fetch(
        `/api/stations/${stationInfo.stationName}/available-batteries`
    );
    const data = await response.json();
    
    showStationInfo({
        name: data.data.station.name,
        location: data.data.station.location,
        availableSlots: data.data.station.available_slots,
        reservedSlots: data.data.station.reserved_slots,
        batteries: data.data.batteries
    });
}
```

---

## 🎬 KỊCH BẢN 5: XỬ LÝ LỖI

### 5.1. QR Code Không Hợp Lệ
```javascript
// App Mobile
try {
    const qrData = await scanQRCode();
    const stationInfo = JSON.parse(qrData);
    
    if (!stationInfo.stationName) {
        throw new Error('QR code không hợp lệ');
    }
} catch (error) {
    showError('QR code không hợp lệ. Vui lòng quét lại.');
}
```

### 5.2. Station Không Tồn Tại
```javascript
// Backend
const station = await dbPool.query(
    'SELECT * FROM stations WHERE name = $1',
    [stationName]
);

if (station.rows.length === 0) {
    return res.status(404).json({
        success: false,
        message: `Không tìm thấy trạm '${stationName}'`
    });
}
```

### 5.3. Không Có Pin Available
```javascript
// Backend
const availableBattery = await findAvailableBattery(stationName);

if (!availableBattery) {
    return res.status(400).json({
        success: false,
        message: 'Không có pin sẵn sàng tại trạm này. Vui lòng thử lại sau.'
    });
}
```

### 5.4. Reservation Đã Hết Hạn
```javascript
// Backend
const reservation = await dbPool.query(
    `SELECT * FROM reservations 
     WHERE id = $1 AND customer_id = $2`,
    [reservationId, customerId]
);

if (reservation.rows.length === 0) {
    return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt pin'
    });
}

if (new Date(reservation.rows[0].expires_at) < new Date()) {
    return res.status(400).json({
        success: false,
        message: 'Đơn đặt pin đã hết hạn'
    });
}
```

### 5.5. Pin Đã Được Đặt Bởi Người Khác
```javascript
// Backend
const reservationCheck = await dbPool.query(
    `SELECT customer_id FROM reservations 
     WHERE battery_uid = $1 
       AND status = 'active' 
       AND expires_at > NOW()`,
    [batteryUid]
);

if (reservationCheck.rows.length > 0 && 
    reservationCheck.rows[0].customer_id !== currentCustomer.id) {
    // Bỏ qua pin này, tìm pin khác
    continue;
}
```

---

## 📱 IMPLEMENTATION CHO APP MOBILE

### Component Quét QR
```javascript
// React Native Example
import QRCodeScanner from 'react-native-qrcode-scanner';

function QRScannerScreen({ navigation }) {
    const onSuccess = (e) => {
        try {
            const qrData = JSON.parse(e.data);
            
            switch (qrData.action) {
                case 'swap':
                    navigation.navigate('SwapForm', { stationInfo: qrData });
                    break;
                case 'reserve':
                    navigation.navigate('ReservationScreen', { stationInfo: qrData });
                    break;
                case 'info':
                    navigation.navigate('StationInfo', { stationInfo: qrData });
                    break;
                default:
                    showError('QR code không hợp lệ');
            }
        } catch (error) {
            showError('Không thể đọc QR code');
        }
    };
    
    return (
        <QRCodeScanner
            onRead={onSuccess}
            showMarker={true}
            reactivate={true}
        />
    );
}
```

### Component Swap Form
```javascript
function SwapFormScreen({ route }) {
    const { stationInfo } = route.params;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [returnUid, setReturnUid] = useState('');
    
    const handleSwap = async () => {
        try {
            const response = await fetch('http://your-api.com/api/swap/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stationName: stationInfo.stationName,
                    username,
                    password,
                    returnUid
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                navigation.navigate('SwapInProgress', { 
                    transactionId: result.data.transactionId,
                    releaseSlot: result.data.releaseSlot
                });
            } else {
                showError(result.message);
            }
        } catch (error) {
            showError('Lỗi kết nối. Vui lòng thử lại.');
        }
    };
    
    return (
        <View>
            <Text>Trạm: {stationInfo.stationName}</Text>
            <TextInput placeholder="Username" value={username} onChangeText={setUsername} />
            <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
            <TextInput placeholder="Pin cũ UID" value={returnUid} onChangeText={setReturnUid} />
            <Button title="Đổi Pin" onPress={handleSwap} />
        </View>
    );
}
```

---

## 🧪 TESTING SCENARIOS

### Test Case 1: Đổi Pin Thông Thường
1. Quét QR code swap
2. Nhập username/password
3. Nhập pin cũ UID
4. Gửi request
5. ✅ Kiểm tra transaction được tạo
6. ✅ Kiểm tra pin mới được assign

### Test Case 2: Đổi Pin Với Reservation
1. Đặt pin trước
2. Quét QR code swap tại cùng station
3. Nhập thông tin
4. Gửi request
5. ✅ Kiểm tra pin đã đặt được ưu tiên
6. ✅ Kiểm tra reservation được completed

### Test Case 3: Reservation Hết Hạn
1. Tạo reservation
2. Đợi hết hạn (hoặc mock time)
3. Quét QR code swap
4. ✅ Kiểm tra không sử dụng pin đã hết hạn
5. ✅ Kiểm tra reservation status = 'expired'

### Test Case 4: Không Có Pin Available
1. Mock tất cả pin đều bị reserved
2. Quét QR code swap
3. ✅ Kiểm tra error message phù hợp

---

## 📊 MONITORING & LOGGING

### Log Events Quan Trọng
```javascript
// Backend logging
console.log('[QR_SCAN] User quét QR:', {
    stationName: stationInfo.stationName,
    action: stationInfo.action,
    timestamp: new Date().toISOString()
});

console.log('[SWAP_REQUEST] Nhận request:', {
    stationName,
    username,
    hasReservation: reservation ? true : false,
    timestamp: new Date().toISOString()
});

console.log('[RESERVATION] Tạo reservation:', {
    reservationId,
    customerId,
    batteryUid,
    expiresAt,
    timestamp: new Date().toISOString()
});
```

---

## 🔒 SECURITY CONSIDERATIONS

1. **QR Code Validation:**
   - Validate JSON structure
   - Check stationName tồn tại
   - Sanitize input

2. **Authentication:**
   - Mọi request đều yêu cầu username/password
   - Password được hash bằng bcrypt

3. **Authorization:**
   - Customer chỉ có thể xem/hủy reservations của mình
   - Kiểm tra ownership trước khi swap

4. **Rate Limiting:**
   - Giới hạn số requests từ cùng IP
   - Giới hạn số reservations của mỗi customer

---

## 📚 TÀI LIỆU THAM KHẢO

- `HUONG_DAN_QUET_QR.md` - Hướng dẫn cơ bản
- `KE_HOACH_DAT_PIN_TRUOC.md` - Kế hoạch reservation
- `mqtt_client.js` - Backend implementation
- `reservation_api.js` - Reservation logic

---

**Ngày tạo:** 12/12/2025  
**Version:** 1.0  
**Status:** ✅ Complete

