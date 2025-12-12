
DROP TABLE IF EXISTS transaction_logs, slots, customers, admins, batteries, stations CASCADE;

-- Bảng 1: Quản lý các trạm
CREATE TABLE stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'inactive', -- active, inactive, maintenance, low_battery, out_of_battery
    total_slots INT NOT NULL DEFAULT 6,
    available_slots INT NOT NULL DEFAULT 6,
    last_maintenance TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 2: Quản lý thông tin của từng viên pin
CREATE TABLE batteries (
    uid VARCHAR(50) PRIMARY KEY,
    status VARCHAR(50) NOT NULL DEFAULT 'in_stock', -- in_stock, in_use, charging, full, maintenance, low_charge
    charge_level INT NOT NULL DEFAULT 100 CHECK (charge_level >= 0 AND charge_level <= 100),
    charge_cycles INT NOT NULL DEFAULT 0,
    last_charged TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 3: Quản lý tài khoản khách hàng
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Luôn lưu mật khẩu đã băm
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    current_battery_uid VARCHAR(50) NULL REFERENCES batteries(uid) ON DELETE SET NULL,
    total_swaps INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 4: Quản lý trạng thái chi tiết của từng khay sạc
CREATE TABLE slots (
    id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    slot_number INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'empty', -- empty, authenticated, charging, full, error, maintenance
    is_battery_present BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    battery_uid VARCHAR(50) NULL REFERENCES batteries(uid) ON DELETE SET NULL,
    charge_level INT CHECK (charge_level >= 0 AND charge_level <= 100),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (station_id, slot_number)
);

-- Bảng 5: Quản lý tài khoản quản trị viên
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- user, admin, super_admin
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 6: Ghi lại lịch sử các giao dịch đổi pin
CREATE TABLE transaction_logs (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id),
    station_id INT NOT NULL REFERENCES stations(id),
    request_type VARCHAR(50) NOT NULL DEFAULT 'swap', -- swap, return_only, pickup_only
    old_battery_uid VARCHAR(50) REFERENCES batteries(uid),
    slot_in INT,
    new_battery_uid VARCHAR(50) REFERENCES batteries(uid),
    slot_out INT,
    transaction_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_time TIMESTAMPTZ NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' -- pending, completed, failed, cancelled
);

-- Bảng 7: Lịch sử bảo trì trạm
CREATE TABLE maintenance_logs (
    id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(id),
    admin_id INT REFERENCES admins(id),
    maintenance_type VARCHAR(50) NOT NULL, -- routine, repair, upgrade, battery_replacement
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress' -- in_progress, completed, cancelled
);

-- =================================================================
-- PHẦN 2: TẠO CÁC FUNCTION VÀ TRIGGER
-- =================================================================

-- Function cập nhật trạng thái trạm dựa trên số slot có pin
CREATE OR REPLACE FUNCTION update_station_status()
RETURNS TRIGGER AS $$
DECLARE
    station_total_slots INT;
    station_available_slots INT;
    station_status VARCHAR(50);
BEGIN
    -- Lấy thông tin trạm
    SELECT total_slots INTO station_total_slots 
    FROM stations WHERE id = NEW.station_id;
    
    -- Đếm số slot có pin
    SELECT COUNT(*) INTO station_available_slots
    FROM slots 
    WHERE station_id = NEW.station_id 
    AND is_battery_present = TRUE;
    
    -- Xác định trạng thái trạm
    IF station_available_slots = 0 THEN
        station_status := 'out_of_battery';
    ELSIF station_available_slots <= (station_total_slots * 0.2) THEN
        station_status := 'low_battery';
    ELSE
        station_status := 'active';
    END IF;
    
    -- Cập nhật trạng thái trạm
    UPDATE stations 
    SET status = station_status, 
        available_slots = station_available_slots,
        last_updated = CURRENT_TIMESTAMP
    WHERE id = NEW.station_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger tự động cập nhật trạng thái trạm
CREATE TRIGGER trigger_update_station_status
    AFTER INSERT OR UPDATE OR DELETE ON slots
    FOR EACH ROW
    EXECUTE FUNCTION update_station_status();

-- =================================================================
-- PHẦN 3: CHÈN DỮ LIỆU MẪU PHONG PHÚ
-- =================================================================

-- 1. Thêm các trạm sạc với trạng thái khác nhau
INSERT INTO stations (name, location, status, total_slots, available_slots) VALUES
('STATION_01', 'PTIT Ha Noi', 'active', 6, 4),
('STATION_02', 'BKDN Da Nang', 'low_battery', 6, 1),
('STATION_03', 'Vincom Tran Duy Hung, Ha Noi', 'active', 8, 6),
('STATION_04', 'Lotte Mart, Da Nang', 'maintenance', 6, 0),
('STATION_05', 'BigC Thang Long, Ha Noi', 'out_of_battery', 6, 0),
('STATION_06', 'Aeon Mall, Da Nang', 'active', 8, 7);

-- 2. Thêm một loạt pin mới với trạng thái đa dạng
INSERT INTO batteries (uid, status, charge_level, charge_cycles, last_charged) VALUES
-- Pin khách hàng đang sử dụng
('BAT001', 'in_use', 85, 120, '2024-01-15 10:30:00'),
('BAT002', 'in_use', 45, 80, '2024-01-15 08:15:00'),
('BAT003', 'in_use', 20, 210, '2024-01-15 07:45:00'),

-- Pin đầy sẵn sàng
('BAT004', 'full', 100, 45, '2024-01-15 12:00:00'),
('BAT005', 'full', 100, 30, '2024-01-15 11:30:00'),
('BAT006', 'full', 100, 95, '2024-01-15 10:45:00'),
('BAT007', 'full', 100, 5, '2024-01-15 13:15:00'),
('BAT008', 'full', 100, 15, '2024-01-15 12:30:00'),
('BAT009', 'full', 100, 88, '2024-01-15 11:00:00'),
('BAT010', 'full', 100, 140, '2024-01-15 09:30:00'),

-- Pin đang sạc
('BAT011', 'charging', 75, 112, '2024-01-15 13:00:00'),
('BAT012', 'charging', 60, 13, '2024-01-15 12:45:00'),
('BAT013', 'charging', 45, 140, '2024-01-15 12:30:00'),
('BAT014', 'charging', 30, 88, '2024-01-15 12:15:00'),

-- Pin yếu cần sạc
('BAT015', 'low_charge', 15, 500, '2024-01-15 08:00:00'),
('BAT016', 'low_charge', 10, 300, '2024-01-15 07:30:00'),

-- Pin bảo trì
('BAT017', 'maintenance', 0, 1000, '2024-01-10 00:00:00'),
('BAT018', 'maintenance', 0, 800, '2024-01-12 00:00:00');

-- 3. Thêm khách hàng mới 
-- Mật khẩu cho tất cả tài khoản mẫu là 'password123'
-- Chuỗi hash (bcrypt, cost 10) cho 'password123' là: '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy'
INSERT INTO customers (full_name, username, password_hash, phone, email, current_battery_uid, total_swaps) VALUES
('Nguyễn Văn An', 'an_nguyen', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0901234567', 'an.nguyen@email.com', 'BAT001', 15),
('Trần Thị Bình', 'binh_tran', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0901234568', 'binh.tran@email.com', 'BAT002', 8),
('Lê Minh Chi', 'chi_le', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0901234569', 'chi.le@email.com', 'BAT003', 22),
('Phạm Hoàng Dũng', 'dung_pham', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0901234570', 'dung.pham@email.com', NULL, 5),
('Hoàng Thị Em', 'em_hoang', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0901234571', 'em.hoang@email.com', NULL, 0);

-- 4. Thêm/Cập nhật các khay sạc cho các trạm
INSERT INTO slots (station_id, slot_number, status, is_battery_present, is_locked, battery_uid, charge_level) VALUES
-- Trạm 1 (PTIT) - 4 pin có sẵn
(1, 1, 'empty', FALSE, FALSE, NULL, NULL),
(1, 2, 'full', TRUE, TRUE, 'BAT004', 100),
(1, 3, 'charging', TRUE, TRUE, 'BAT011', 75),
(1, 4, 'full', TRUE, TRUE, 'BAT005', 100),
(1, 5, 'empty', FALSE, FALSE, NULL, NULL),
(1, 6, 'empty', FALSE, FALSE, NULL, NULL),

-- Trạm 2 (BKDN) - 1 pin có sẵn (low_battery)
(2, 1, 'full', TRUE, TRUE, 'BAT006', 100),
(2, 2, 'empty', FALSE, FALSE, NULL, NULL),
(2, 3, 'empty', FALSE, FALSE, NULL, NULL),
(2, 4, 'empty', FALSE, FALSE, NULL, NULL),
(2, 5, 'empty', FALSE, FALSE, NULL, NULL),
(2, 6, 'empty', FALSE, FALSE, NULL, NULL),

-- Trạm 3 (Vincom) - 6 pin có sẵn
(3, 1, 'full', TRUE, TRUE, 'BAT007', 100),
(3, 2, 'full', TRUE, TRUE, 'BAT008', 100),
(3, 3, 'charging', TRUE, TRUE, 'BAT012', 60),
(3, 4, 'charging', TRUE, TRUE, 'BAT013', 45),
(3, 5, 'full', TRUE, TRUE, 'BAT009', 100),
(3, 6, 'charging', TRUE, TRUE, 'BAT014', 30),
(3, 7, 'full', TRUE, TRUE, 'BAT010', 100),
(3, 8, 'empty', FALSE, FALSE, NULL, NULL),

-- Trạm 4 (Lotte) - Bảo trì
(4, 1, 'maintenance', FALSE, FALSE, NULL, NULL),
(4, 2, 'maintenance', FALSE, FALSE, NULL, NULL),
(4, 3, 'maintenance', FALSE, FALSE, NULL, NULL),
(4, 4, 'maintenance', FALSE, FALSE, NULL, NULL),
(4, 5, 'maintenance', FALSE, FALSE, NULL, NULL),
(4, 6, 'maintenance', FALSE, FALSE, NULL, NULL),

-- Trạm 5 (BigC) - Hết pin
(5, 1, 'empty', FALSE, FALSE, NULL, NULL),
(5, 2, 'empty', FALSE, FALSE, NULL, NULL),
(5, 3, 'empty', FALSE, FALSE, NULL, NULL),
(5, 4, 'empty', FALSE, FALSE, NULL, NULL),
(5, 5, 'empty', FALSE, FALSE, NULL, NULL),
(5, 6, 'empty', FALSE, FALSE, NULL, NULL),

-- Trạm 6 (Aeon) - 7 pin có sẵn
(6, 1, 'full', TRUE, TRUE, 'BAT015', 15),
(6, 2, 'full', TRUE, TRUE, 'BAT016', 10),
(6, 3, 'empty', FALSE, FALSE, NULL, NULL),
(6, 4, 'empty', FALSE, FALSE, NULL, NULL),
(6, 5, 'empty', FALSE, FALSE, NULL, NULL),
(6, 6, 'empty', FALSE, FALSE, NULL, NULL),
(6, 7, 'empty', FALSE, FALSE, NULL, NULL),
(6, 8, 'empty', FALSE, FALSE, NULL, NULL)
ON CONFLICT (station_id, slot_number) DO UPDATE SET
    status = EXCLUDED.status,
    is_battery_present = EXCLUDED.is_battery_present,
    is_locked = EXCLUDED.is_locked,
    battery_uid = EXCLUDED.battery_uid,
    charge_level = EXCLUDED.charge_level,
    last_updated = CURRENT_TIMESTAMP;

-- 5. Thêm tài khoản admin
INSERT INTO admins (username, password_hash, full_name, role) VALUES
('superadmin', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', 'Quản trị viên cấp cao', 'super_admin'),
('admin1', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', 'Admin Trạm 1', 'admin'),
('admin2', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', 'Admin Trạm 2', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 6. Thêm log bảo trì
INSERT INTO maintenance_logs (station_id, admin_id, maintenance_type, description, start_time, end_time, status) VALUES
(4, 1, 'repair', 'Sửa chữa hệ thống sạc', '2024-01-15 08:00:00', '2024-01-15 16:00:00', 'completed'),
(1, 2, 'routine', 'Bảo trì định kỳ', '2024-01-14 10:00:00', '2024-01-14 12:00:00', 'completed'),
(2, 3, 'battery_replacement', 'Thay thế pin yếu', '2024-01-15 14:00:00', NULL, 'in_progress');

-- 7. Thêm một vài log giao dịch cũ
INSERT INTO transaction_logs (customer_id, station_id, old_battery_uid, new_battery_uid, slot_in, slot_out, transaction_time, completed_time, status) VALUES
(1, 1, 'BAT001', 'BAT004', 1, 2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '5 minutes', 'completed'),
(2, 2, 'BAT002', 'BAT006', 2, 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '3 minutes', 'completed'),
(3, 3, 'BAT003', 'BAT007', 3, 1, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 55 minutes', 'completed'),
(4, 1, NULL, 'BAT005', NULL, 4, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour' + INTERVAL '2 minutes', 'completed');

-- =================================================================
-- PHẦN 4: TẠO CÁC VIEW HỮU ÍCH
-- =================================================================

-- View tổng quan trạm
CREATE VIEW station_overview AS
SELECT 
    s.id,
    s.name,
    s.location,
    s.status,
    s.total_slots,
    s.available_slots,
    COUNT(sl.id) as occupied_slots,
    (s.total_slots - COUNT(sl.id)) as empty_slots,
    s.last_maintenance
FROM stations s
LEFT JOIN slots sl ON s.id = sl.station_id AND sl.is_battery_present = TRUE
GROUP BY s.id, s.name, s.location, s.status, s.total_slots, s.available_slots, s.last_maintenance;

-- View thống kê pin
CREATE VIEW battery_stats AS
SELECT 
    status,
    COUNT(*) as count,
    AVG(charge_level) as avg_charge_level,
    AVG(charge_cycles) as avg_cycles
FROM batteries
GROUP BY status;

-- View giao dịch gần đây
CREATE VIEW recent_transactions AS
SELECT 
    tl.id,
    c.full_name as customer_name,
    s.name as station_name,
    tl.request_type,
    tl.old_battery_uid,
    tl.new_battery_uid,
    tl.transaction_time,
    tl.completed_time,
    tl.status
FROM transaction_logs tl
JOIN customers c ON tl.customer_id = c.id
JOIN stations s ON tl.station_id = s.id
ORDER BY tl.transaction_time DESC;

-- Thông báo hoàn tất
SELECT 'Tạo và chèn toàn bộ dữ liệu mẫu thành công!' as "Status";
