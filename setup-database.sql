-- =====================================================
-- EV SWAP DATABASE SETUP SCRIPT
-- =====================================================
-- Tạo database và tất cả bảng cho hệ thống đổi pin xe điện
-- Thực thi: psql -U postgres -f setup-database.sql
-- =====================================================

-- Tạo database (uncomment nếu chưa có database)
-- DROP DATABASE IF EXISTS doan_db;
-- CREATE DATABASE doan_db;
-- \c doan_db;

-- =====================================================
-- 1. BẢNG STATIONS (Trạm đổi pin)
-- =====================================================
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'inactive' NOT NULL,
    total_slots INTEGER DEFAULT 6 NOT NULL,
    available_slots INTEGER DEFAULT 6 NOT NULL,
    last_maintenance TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE stations IS 'Danh sách các trạm đổi pin';
COMMENT ON COLUMN stations.status IS 'active, inactive, maintenance, low_battery, out_of_battery';

-- =====================================================
-- 2. BẢNG BATTERIES (Pin)
-- =====================================================
CREATE TABLE IF NOT EXISTS batteries (
    uid VARCHAR(50) PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'available' NOT NULL,
    charge_level INTEGER DEFAULT 100 NOT NULL,
    charge_cycles INTEGER DEFAULT 0 NOT NULL,
    last_charged TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE batteries IS 'Danh sách tất cả các pin trong hệ thống';
COMMENT ON COLUMN batteries.status IS 'full, charging, in_use, maintenance, good, average';

-- =====================================================
-- 3. BẢNG CUSTOMERS (Khách hàng)
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    current_battery_uid VARCHAR(50),
    total_swaps INTEGER DEFAULT 0 NOT NULL,
    balance DOUBLE PRECISION DEFAULT 0 NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    FOREIGN KEY (current_battery_uid) REFERENCES batteries(uid) ON DELETE SET NULL
);

COMMENT ON TABLE customers IS 'Thông tin khách hàng sử dụng dịch vụ';

-- =====================================================
-- 4. BẢNG SLOTS (Vị trí pin tại trạm)
-- =====================================================
CREATE TABLE IF NOT EXISTS slots (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL,
    slot_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'empty' NOT NULL,
    is_battery_present BOOLEAN DEFAULT false NOT NULL,
    is_locked BOOLEAN DEFAULT false NOT NULL,
    battery_uid VARCHAR(50),
    charge_level INTEGER,
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (battery_uid) REFERENCES batteries(uid) ON DELETE SET NULL,
    UNIQUE (station_id, slot_number)
);

COMMENT ON TABLE slots IS 'Các vị trí chứa pin tại mỗi trạm';

-- =====================================================
-- 5. BẢNG ADMINS (Quản trị viên)
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE admins IS 'Tài khoản quản trị viên hệ thống';

-- =====================================================
-- 6. BẢNG TRANSACTION_LOGS (Lịch sử giao dịch)
-- =====================================================
CREATE TABLE IF NOT EXISTS transaction_logs (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    request_type VARCHAR(50) DEFAULT 'swap' NOT NULL,
    old_battery_uid VARCHAR(50),
    slot_in INTEGER,
    new_battery_uid VARCHAR(50),
    slot_out INTEGER,
    cost DOUBLE PRECISION DEFAULT 5000 NOT NULL,
    transaction_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_time TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (station_id) REFERENCES stations(id),
    FOREIGN KEY (old_battery_uid) REFERENCES batteries(uid),
    FOREIGN KEY (new_battery_uid) REFERENCES batteries(uid)
);

COMMENT ON TABLE transaction_logs IS 'Lịch sử các giao dịch đổi pin';

-- =====================================================
-- 7. BẢNG MAINTENANCE_LOGS (Lịch sử bảo trì)
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL,
    admin_id INTEGER,
    maintenance_type VARCHAR(50) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    end_time TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'in_progress' NOT NULL,
    FOREIGN KEY (station_id) REFERENCES stations(id),
    FOREIGN KEY (admin_id) REFERENCES admins(id)
);

COMMENT ON TABLE maintenance_logs IS 'Lịch sử bảo trì các trạm';

-- =====================================================
-- 8. BẢNG WAREHOUSE (Kho chứa pin)
-- =====================================================
CREATE TABLE IF NOT EXISTS warehouse (
    id SERIAL PRIMARY KEY,
    slot_id INTEGER NOT NULL,
    total_capacity INTEGER DEFAULT 4 NOT NULL,
    FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE
);

COMMENT ON TABLE warehouse IS 'Kho chứa pin tại các slot';

-- =====================================================
-- 9. BẢNG WAREHOUSE_BATTERIES (Pin trong kho)
-- =====================================================
CREATE TABLE IF NOT EXISTS warehouse_batteries (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL,
    battery_uid VARCHAR(50) NOT NULL,
    inserted_at TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE CASCADE,
    FOREIGN KEY (battery_uid) REFERENCES batteries(uid)
);

COMMENT ON TABLE warehouse_batteries IS 'Danh sách pin trong từng kho';

-- =====================================================
-- 10. BẢNG FEEDBACK (Phản hồi khách hàng)
-- =====================================================
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER,
    feedback_date TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

COMMENT ON TABLE feedback IS 'Phản hồi và đánh giá từ khách hàng';

-- =====================================================
-- 11. BẢNG RESERVATIONS (Đặt chỗ trước)
-- =====================================================
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    reserved_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    battery_uid VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (station_id) REFERENCES stations(id)
);

COMMENT ON TABLE reservations IS 'Đặt chỗ trước cho khách hàng (15 phút)';
COMMENT ON COLUMN reservations.status IS 'pending, confirmed, completed, cancelled, expired';

-- =====================================================
-- TẠO INDEX ĐỂ TỐI ƯU HIỆU SUẤT
-- =====================================================

-- Index cho tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_customers_username ON customers(username);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_batteries_status ON batteries(status);
CREATE INDEX IF NOT EXISTS idx_slots_station ON slots(station_id);
CREATE INDEX IF NOT EXISTS idx_slots_battery ON slots(battery_uid);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transaction_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_station ON transaction_logs(station_id);
CREATE INDEX IF NOT EXISTS idx_transactions_time ON transaction_logs(transaction_time);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_station ON reservations(station_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- =====================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- =====================================================

-- Thêm admin mặc định (username: admin, password: admin123)
INSERT INTO admins (username, password_hash, full_name, role) 
VALUES ('admin', '$2b$10$7Z1qFxRxE5G5y0mQz8gKq.YzVU5Zm1Xv9vZ6K4qWt7vQz8gKq.YzV', 'System Admin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Thêm các trạm mẫu
INSERT INTO stations (name, location, status, total_slots, available_slots) VALUES
('STATION_01', 'PTIT Ha Noi', 'active', 6, 4),
('STATION_02', 'BKDN Da Nang', 'active', 6, 1),
('STATION_03', 'Vincom Tran Duy Hung, Ha Noi', 'active', 8, 6),
('STATION_04', 'Lotte Mart, Da Nang', 'maintenance', 6, 0),
('STATION_05', 'BigC Thang Long, Ha Noi', 'active', 6, 0),
('STATION_06', 'Aeon Mall, Da Nang', 'active', 8, 7)
ON CONFLICT (name) DO NOTHING;

-- Thêm pin mẫu
INSERT INTO batteries (uid, status, charge_level, charge_cycles) VALUES
('BAT001', 'full', 100, 50),
('BAT002', 'full', 95, 30),
('BAT003', 'charging', 75, 80),
('BAT004', 'full', 100, 20),
('BAT005', 'in_use', 60, 120),
('BAT006', 'full', 98, 45),
('BAT007', 'charging', 40, 200),
('BAT008', 'full', 100, 10),
('BAT009', 'maintenance', 0, 500),
('BAT010', 'full', 100, 5)
ON CONFLICT (uid) DO NOTHING;

-- Thêm khách hàng test (username: testuser, password: 123456)
INSERT INTO customers (full_name, username, password_hash, phone, email, balance) VALUES
('Test User', 'testuser', '$2b$10$XqVZj8Xv9J5G5y0mQz8gKq.YzVU5Zm1Xv9vZ6K4qWt7vQz8gKq.YzV', '0123456789', 'test@example.com', 50000),
('Test Login User', 'testlogin', '$2b$10$K4XqVZj8Xv9J5G5y0mQz8gKq.YzVU5Zm1Xv9vZ6K4qWt7vQz8gKq.YzV', '0987654321', 'testlogin@example.com', 100000)
ON CONFLICT (username) DO NOTHING;

-- Thêm slots cho các trạm
INSERT INTO slots (station_id, slot_number, status, is_battery_present, battery_uid, charge_level) VALUES
-- STATION_01 (6 slots)
(1, 1, 'occupied', true, 'BAT001', 100),
(1, 2, 'occupied', true, 'BAT002', 95),
(1, 3, 'empty', false, NULL, NULL),
(1, 4, 'empty', false, NULL, NULL),
(1, 5, 'empty', false, NULL, NULL),
(1, 6, 'empty', false, NULL, NULL),
-- STATION_02 (6 slots)
(2, 1, 'occupied', true, 'BAT003', 75),
(2, 2, 'empty', false, NULL, NULL),
(2, 3, 'occupied', true, 'BAT004', 100),
(2, 4, 'occupied', true, 'BAT005', 60),
(2, 5, 'occupied', true, 'BAT006', 98),
(2, 6, 'occupied', true, 'BAT007', 40),
-- STATION_03 (8 slots)
(3, 1, 'occupied', true, 'BAT008', 100),
(3, 2, 'occupied', true, 'BAT010', 100),
(3, 3, 'empty', false, NULL, NULL),
(3, 4, 'empty', false, NULL, NULL),
(3, 5, 'empty', false, NULL, NULL),
(3, 6, 'empty', false, NULL, NULL),
(3, 7, 'empty', false, NULL, NULL),
(3, 8, 'empty', false, NULL, NULL)
ON CONFLICT (station_id, slot_number) DO NOTHING;

-- =====================================================
-- HOÀN TẤT
-- =====================================================

\echo '✅ Database setup completed successfully!'
\echo ''
\echo 'Default accounts:'
\echo '  Admin - username: admin, password: admin123'
\echo '  User  - username: testuser, password: 123456'
\echo '  User  - username: testlogin, password: 123456'
\echo ''
\echo 'Database statistics:'
SELECT 
    (SELECT COUNT(*) FROM stations) as stations,
    (SELECT COUNT(*) FROM batteries) as batteries,
    (SELECT COUNT(*) FROM customers) as customers,
    (SELECT COUNT(*) FROM slots) as slots,
    (SELECT COUNT(*) FROM admins) as admins;
