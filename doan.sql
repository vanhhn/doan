DROP TABLE IF EXISTS transaction_logs, slots, customers, admins, batteries, stations, maintenance_logs, warehouse, warehouse_batteries CASCADE;
Drop table feedback;
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
    status VARCHAR(50) NOT NULL DEFAULT 'available', -- full, charging, in_use, maintenance, etc.
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
    password_hash VARCHAR(255) NOT NULL,
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
    status VARCHAR(50) NOT NULL DEFAULT 'empty', 
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
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 6: Ghi lại lịch sử các giao dịch đổi pin
CREATE TABLE transaction_logs (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id),
    station_id INT NOT NULL REFERENCES stations(id),
    request_type VARCHAR(50) NOT NULL DEFAULT 'swap',
    old_battery_uid VARCHAR(50) REFERENCES batteries(uid),
    slot_in INT,
    new_battery_uid VARCHAR(50) REFERENCES batteries(uid),
    slot_out INT,
    transaction_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_time TIMESTAMPTZ NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
);

-- Bảng 7: Lịch sử bảo trì trạm
CREATE TABLE maintenance_logs (
    id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(id),
    admin_id INT REFERENCES admins(id),
    maintenance_type VARCHAR(50) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress'
);

-- Bảng 8. Warehouse: nhà kho 
CREATE TABLE warehouse (
    id SERIAL PRIMARY KEY,
    slot_id INT NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    total_capacity INT NOT NULL DEFAULT 4
);

CREATE TABLE warehouse_batteries (
    id SERIAL PRIMARY KEY,
    warehouse_id INT NOT NULL REFERENCES warehouse(id) ON DELETE CASCADE,
    battery_uid VARCHAR(50) NOT NULL REFERENCES batteries(uid),
    inserted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Bảng 9. bảng feedback
CREATE TABLE feedback (
    feedback_id SERIAL PRIMARY KEY,               
    customer_id INT NOT NULL REFERENCES customers(id),                      
    content TEXT NOT NULL,                         
    rating INT CHECK (rating BETWEEN 1 AND 5),      
    feedback_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- =================================================================
-- PHẦN 3: CHÈN DỮ LIỆU MẪU PHONG PHÚ
-- =================================================================

-- 1. Thêm các trạm sạc với trạng thái khác nhau
INSERT INTO stations (name, location, status, total_slots, available_slots) VALUES
('STATION_01', 'PTIT Ha Noi', 'active', 6, 4),
('STATION_02', 'BKDN Da Nang', 'active', 6, 1),
('STATION_03', 'Vincom Tran Duy Hung, Ha Noi', 'active', 8, 6),
('STATION_04', 'Lotte Mart, Da Nang', 'maintenance', 6, 0),
('STATION_05', 'BigC Thang Long, Ha Noi', 'active', 6, 0),
('STATION_06', 'Aeon Mall, Da Nang', 'active', 8, 7);

-- 2. Thêm một loạt pin mới với trạng thái đa dạng
INSERT INTO batteries (uid, status, charge_level, charge_cycles, last_charged) VALUES
('BAT001', 'average', 85, 120, '2024-01-15 10:30:00'),
('BAT002', 'average', 45, 80, '2024-01-15 08:15:00'),
('BAT003', 'maintenance', 20, 210, '2024-01-15 07:45:00'),
('BAT004', 'good', 100, 45, '2024-01-15 12:00:00'),
('BAT005', 'good', 100, 30, '2024-01-15 11:30:00'),
('BAT006', 'average', 100, 95, '2024-01-15 10:45:00'),
('BAT007', 'good', 100, 5, '2024-01-15 13:15:00'),
('BAT008', 'good', 100, 15, '2024-01-15 12:30:00'),
('BAT009', 'average', 100, 88, '2024-01-15 11:00:00'),
('BAT010', 'average', 100, 140, '2024-01-15 09:30:00'),
('BAT011', 'average', 75, 112, '2024-01-15 13:00:00'),
('BAT012', 'good', 60, 13, '2024-01-15 12:45:00'),
('BAT013', 'average', 45, 140, '2024-01-15 12:30:00'),
('BAT014', 'average', 30, 88, '2024-01-15 12:15:00'),
('BAT015', 'maintenance', 15, 500, '2024-01-15 08:00:00'),
('BAT016', 'maintenance', 10, 300, '2024-01-15 07:30:00'),
('BAT017', 'maintenance', 0, 256, '2024-01-10 00:00:00'),
('BAT018', 'maintenance', 0, 800, '2024-01-12 00:00:00'),
('BAT019', 'good', 100, 0, '2024-08-01 08:00:00'),
('BAT020', 'maintenance', 0, 280, '2025-10-25 09:15:00'),
('BAT021', 'good', 100, 0, '2024-08-05 11:20:00'),
('BAT022', 'good', 100, 0, '2024-08-07 14:30:00'),
('BAT023', 'good', 100, 0, '2024-08-03 10:45:00'),
('BAT024', 'maintenance', 0, 300, '2025-10-26 10:05:00'),
('BAT025', 'good', 100, 0, '2024-08-09 12:50:00'),
('BAT026', 'good', 100, 0, '2024-08-11 13:15:00'),
('BAT027', 'maintenance', 0, 320, '2025-10-24 14:40:00'),
('BAT028', 'good', 100, 0, '2024-08-13 15:10:00'),
('BAT029', 'good', 100, 0, '2024-08-15 09:30:00'),
('BAT030', 'good', 100, 0, '2024-08-17 11:20:00'),
('BAT031', 'maintenance', 0, 350, '2025-10-23 08:40:00'),
('BAT032', 'good', 100, 0, '2024-08-19 14:05:00'),
('BAT033', 'good', 100, 0, '2024-08-21 10:50:00'),
('BAT034', 'good', 100, 0, '2024-08-23 12:30:00'),
('BAT035', 'maintenance', 0, 260, '2025-10-26 09:55:00'),
('BAT036', 'good', 100, 0, '2024-08-25 13:25:00'),
('BAT037', 'good', 100, 0, '2024-08-27 15:15:00'),
('BAT038', 'good', 100, 0, '2024-08-29 10:50:00'),
('BAT039', 'maintenance', 0, 310, '2025-10-23 16:30:00'),
('BAT040', 'good', 100, 0, '2024-08-02 09:20:00'),
('BAT041', 'good', 100, 0, '2024-08-04 11:40:00'),
('BAT042', 'good', 100, 0, '2024-08-06 14:15:00'),
('BAT043', 'maintenance', 0, 400, '2025-10-25 11:10:00'),
('BAT044', 'good', 100, 0, '2024-08-08 09:45:00'),
('BAT045', 'good', 100, 0, '2024-08-10 13:50:00'),
('BAT046', 'good', 100, 0, '2024-08-12 15:30:00'),
('BAT047', 'maintenance', 0, 270, '2025-10-24 14:05:00'),
('BAT048', 'good', 100, 0, '2024-08-14 10:15:00'),
('BAT049', 'good', 100, 0, '2024-08-16 12:55:00'),
('BAT050', 'good', 100, 0, '2024-08-18 14:40:00'),
('BAT051', 'good', 100, 0, '2024-08-20 09:50:00'),
('BAT052', 'maintenance', 0, 410, '2025-10-24 16:20:00'),
('BAT053', 'good', 100, 0, '2024-08-22 11:35:00'),
('BAT054', 'good', 100, 0, '2024-08-24 13:20:00'),
('BAT055', 'good', 100, 0, '2024-08-26 15:10:00'),
('BAT056', 'good', 100, 0, '2024-08-28 10:40:00'),
('BAT057', 'maintenance', 0, 350, '2025-10-25 12:30:00'),
('BAT058', 'good', 100, 0, '2024-08-30 12:25:00'),
('BAT059', 'good', 100, 0, '2025-06-15 10:20:00'),
('BAT060', 'maintenance', 0, 250, '2025-07-01 08:45:00'),
('BAT061', 'good', 100, 0, '2025-07-10 12:30:00'),
('BAT062', 'good', 100, 0, '2025-08-05 14:50:00'),
('BAT063', 'maintenance', 0, 310, '2025-08-20 09:15:00'),
('BAT064', 'good', 100, 0, '2025-09-02 11:40:00'),
('BAT065', 'good', 100, 0, '2025-09-12 16:05:00'),
('BAT066', 'maintenance', 0, 280, '2025-06-28 07:50:00'),
('BAT067', 'good', 100, 0, '2025-06-22 13:20:00'),
('BAT068', 'good', 100, 0, '2025-07-18 10:30:00'),
('BAT069', 'maintenance', 0, 300, '2025-07-25 15:45:00'),
('BAT070', 'good', 100, 0, '2025-08-11 09:10:00'),
('BAT071', 'good', 100, 0, '2025-08-19 14:00:00'),
('BAT072', 'good', 100, 0, '2025-09-08 12:25:00'),
('BAT073', 'maintenance', 0, 320, '2025-06-05 08:30:00'),
('BAT074', 'good', 100, 0, '2025-06-30 16:45:00'),
('BAT075', 'good', 100, 0, '2025-07-12 11:55:00'),
('BAT076', 'maintenance', 0, 270, '2025-07-20 09:40:00'),
('BAT077', 'good', 100, 0, '2025-08-07 13:35:00'),
('BAT078', 'good', 100, 0, '2025-08-25 10:50:00'),
('BAT079', 'maintenance', 0, 350, '2025-09-05 07:20:00'),
('BAT080', 'good', 100, 0, '2025-09-18 15:30:00'),
('BAT081', 'good', 100, 0, '2025-06-03 12:15:00'),
('BAT082', 'good', 100, 0, '2025-06-21 14:40:00'),
('BAT083', 'maintenance', 0, 290, '2025-07-08 09:05:00'),
('BAT084', 'good', 100, 0, '2025-07-22 16:20:00'),
('BAT085', 'good', 100, 0, '2025-08-03 11:45:00'),
('BAT086', 'maintenance', 0, 310, '2025-08-16 08:50:00'),
('BAT087', 'good', 100, 0, '2025-09-01 14:30:00'),
('BAT088', 'good', 100, 0, '2025-09-14 10:10:00'),
('BAT089', 'maintenance', 0, 260, '2025-06-10 07:15:00'),
('BAT090', 'good', 100, 0, '2025-06-28 13:50:00'),
('BAT091', 'good', 100, 0, '2025-07-10 12:30:00'),
('BAT092', 'good', 100, 0, '2025-08-05 14:50:00'),
('BAT093', 'maintenance', 0, 310, '2025-08-20 09:15:00'),
('BAT094', 'good', 100, 0, '2025-09-02 11:40:00'),
('BAT095', 'good', 100, 0, '2025-09-12 16:05:00'),
('BAT096', 'maintenance', 0, 280, '2025-06-28 07:50:00'),
('BAT097', 'good', 100, 0, '2025-06-22 13:20:00'),
('BAT098', 'good', 100, 0, '2025-07-18 10:30:00'),
('BAT099', 'maintenance', 0, 300, '2025-07-25 15:45:00'),
('BAT100', 'good', 100, 0, '2025-08-11 09:10:00'),
('BAT101', 'average', 85, 120, '2024-01-15 10:30:00'),
('BAT102', 'average', 45, 80, '2024-01-15 08:15:00'),
('BAT103', 'maintenance', 20, 210, '2024-01-15 07:45:00'),
('BAT104', 'good', 100, 45, '2024-01-15 12:00:00'),
('BAT105', 'good', 100, 30, '2024-01-15 11:30:00'),
('BAT106', 'average', 100, 95, '2024-01-15 10:45:00'),
('BAT107', 'good', 100, 5, '2024-01-15 13:15:00'),
('BAT108', 'good', 100, 15, '2024-01-15 12:30:00'),
('BAT109', 'average', 100, 88, '2024-01-15 11:00:00'),
('BAT110', 'average', 100, 140, '2024-01-15 09:30:00'),
('BAT111', 'average', 75, 112, '2024-01-15 13:00:00'),
('BAT112', 'good', 60, 13, '2024-01-15 12:45:00'),
('BAT113', 'average', 45, 140, '2024-01-15 12:30:00'),
('BAT114', 'average', 30, 88, '2024-01-15 12:15:00'),
('BAT115', 'maintenance', 15, 500, '2024-01-15 08:00:00'),
('BAT116', 'maintenance', 10, 300, '2024-01-15 07:30:00'),
('BAT117', 'maintenance', 0, 256, '2024-01-10 00:00:00'),
('BAT118', 'maintenance', 0, 800, '2024-01-12 00:00:00'),
('BAT119', 'good', 100, 0, '2024-08-01 08:00:00'),
('BAT120', 'maintenance', 0, 280, '2025-10-25 09:15:00'),
('BAT121', 'good', 100, 0, '2024-08-05 11:20:00'),
('BAT122', 'good', 100, 0, '2024-08-07 14:30:00'),
('BAT123', 'good', 100, 0, '2024-08-03 10:45:00'),
('BAT124', 'maintenance', 0, 300, '2025-10-26 10:05:00'),
('BAT125', 'good', 100, 0, '2024-08-09 12:50:00'),
('BAT126', 'good', 100, 0, '2024-08-11 13:15:00'),
('BAT127', 'maintenance', 0, 320, '2025-10-24 14:40:00'),
('BAT128', 'good', 100, 0, '2024-08-13 15:10:00'),
('BAT129', 'good', 100, 0, '2024-08-15 09:30:00'),
('BAT130', 'good', 100, 0, '2024-08-17 11:20:00'),
('BAT131', 'maintenance', 0, 350, '2025-10-23 08:40:00'),
('BAT132', 'good', 100, 0, '2024-08-19 14:05:00'),
('BAT133', 'good', 100, 0, '2024-08-21 10:50:00'),
('BAT134', 'good', 100, 0, '2024-08-23 12:30:00'),
('BAT135', 'maintenance', 0, 260, '2025-10-26 09:55:00'),
('BAT136', 'good', 100, 0, '2024-08-25 13:25:00'),
('BAT137', 'good', 100, 0, '2024-08-27 15:15:00'),
('BAT138', 'good', 100, 0, '2024-08-29 10:50:00'),
('BAT139', 'maintenance', 0, 310, '2025-10-23 16:30:00'),
('BAT140', 'good', 100, 0, '2024-08-02 09:20:00'),
('BAT141', 'good', 100, 0, '2024-08-04 11:40:00'),
('BAT142', 'good', 100, 0, '2024-08-06 14:15:00'),
('BAT143', 'maintenance', 0, 400, '2025-10-25 11:10:00'),
('BAT144', 'good', 100, 0, '2024-08-08 09:45:00'),
('BAT145', 'good', 100, 0, '2024-08-10 13:50:00'),
('BAT146', 'good', 100, 0, '2024-08-12 15:30:00'),
('BAT147', 'maintenance', 0, 270, '2025-10-24 14:05:00'),
('BAT148', 'good', 100, 0, '2024-08-14 10:15:00'),
('BAT149', 'good', 100, 0, '2024-08-16 12:55:00'),
('BAT150', 'good', 100, 0, '2024-08-18 14:40:00'),
('BAT151', 'good', 100, 0, '2024-08-20 09:50:00'),
('BAT152', 'maintenance', 0, 410, '2025-10-24 16:20:00'),
('BAT153', 'good', 100, 0, '2024-08-22 11:35:00'),
('BAT154', 'good', 100, 0, '2024-08-24 13:20:00'),
('BAT155', 'good', 100, 0, '2024-08-26 15:10:00'),
('BAT156', 'good', 100, 0, '2024-08-28 10:40:00'),
('BAT157', 'maintenance', 0, 350, '2025-10-25 12:30:00'),
('BAT158', 'good', 100, 0, '2024-08-30 12:25:00'),
('BAT159', 'good', 100, 0, '2025-06-15 10:20:00'),
('BAT160', 'maintenance', 0, 250, '2025-07-01 08:45:00'),
('BAT161', 'good', 100, 0, '2024-09-01 09:10:00'),
('BAT162', 'good', 100, 0, '2024-09-03 11:00:00'),
('BAT163', 'maintenance', 0, 280, '2025-08-10 14:15:00'),
('BAT164', 'good', 100, 0, '2024-09-05 12:20:00'),
('BAT165', 'good', 100, 0, '2024-09-07 15:30:00'),
('BAT166', 'good', 100, 0, '2024-09-09 10:45:00'),
('BAT167', 'maintenance', 0, 360, '2025-09-20 16:10:00'),
('BAT168', 'good', 100, 0, '2024-09-11 09:55:00'),
('BAT169', 'good', 100, 0, '2024-09-13 11:25:00'),
('BAT170', 'good', 100, 0, '2024-09-15 13:40:00'),
('BAT171', 'maintenance', 0, 310, '2025-10-10 15:25:00'),
('BAT172', 'good', 100, 0, '2024-09-17 10:10:00');

INSERT INTO batteries (uid, status, charge_level, charge_cycles, last_charged)
VALUES
('BAT173', 'good', 95, 45, NOW() - INTERVAL '1 day'),
('BAT174', 'good', 87, 60, NOW() - INTERVAL '2 days'),
('BAT175', 'good', 91, 55, NOW() - INTERVAL '1 day'),
('BAT176', 'good', 93, 78, NOW() - INTERVAL '2 days'),
('BAT177', 'good', 89, 65, NOW() - INTERVAL '1 day'),
('BAT178', 'good', 96, 72, NOW() - INTERVAL '2 days'),
('BAT179', 'good', 90, 80, NOW() - INTERVAL '1 day'),
('BAT180', 'good', 94, 68, NOW() - INTERVAL '2 days'),
('BAT181', 'good', 92, 85, NOW() - INTERVAL '1 day'),
('BAT182', 'good', 97, 40, NOW() - INTERVAL '2 days'),
('BAT183', 'good', 88, 95, NOW() - INTERVAL '1 day'),
('BAT184', 'good', 93, 53, NOW() - INTERVAL '2 days'),
('BAT185', 'good', 91, 61, NOW() - INTERVAL '1 day'),
('BAT186', 'good', 95, 70, NOW() - INTERVAL '2 days'),
('BAT187', 'good', 90, 77, NOW() - INTERVAL '1 day'),
('BAT188', 'good', 92, 90, NOW() - INTERVAL '2 days'),
('BAT189', 'good', 94, 65, NOW() - INTERVAL '1 day'),
('BAT190', 'good', 89, 100, NOW() - INTERVAL '2 days'),
('BAT191', 'good', 97, 55, NOW() - INTERVAL '1 day'),
('BAT192', 'good', 96, 60, NOW() - INTERVAL '2 days'),
('BAT193', 'good', 85, 125, NOW() - INTERVAL '1 day'),
('BAT194', 'good', 88, 105, NOW() - INTERVAL '2 days'),
('BAT195', 'good', 90, 115, NOW() - INTERVAL '1 day'),
('BAT196', 'good', 93, 83, NOW() - INTERVAL '2 days'),
('BAT197', 'good', 95, 75, NOW() - INTERVAL '1 day'),
('BAT198', 'good', 91, 64, NOW() - INTERVAL '2 days'),
('BAT199', 'good', 89, 90, NOW() - INTERVAL '1 day'),
('BAT200', 'good', 97, 45, NOW() - INTERVAL '2 days'),
('BAT201', 'good', 94, 50, NOW() - INTERVAL '1 day'),
('BAT202', 'good', 92, 62, NOW() - INTERVAL '2 days'),
('BAT203', 'good', 86, 110, NOW() - INTERVAL '1 day'),
('BAT204', 'good', 89, 98, NOW() - INTERVAL '2 days'),
('BAT205', 'good', 90, 105, NOW() - INTERVAL '1 day'),
('BAT206', 'good', 91, 115, NOW() - INTERVAL '2 days'),
('BAT207', 'good', 95, 72, NOW() - INTERVAL '1 day'),
('BAT208', 'good', 93, 80, NOW() - INTERVAL '2 days'),
('BAT209', 'good', 87, 122, NOW() - INTERVAL '1 day'),
('BAT210', 'good', 96, 66, NOW() - INTERVAL '2 days'),
('BAT211', 'good', 92, 90, NOW() - INTERVAL '1 day'),
('BAT212', 'good', 94, 77, NOW() - INTERVAL '2 days'),
('BAT213', 'good', 88, 99, NOW() - INTERVAL '1 day'),
('BAT214', 'good', 95, 85, NOW() - INTERVAL '2 days'),
('BAT215', 'good', 90, 92, NOW() - INTERVAL '1 day'),
('BAT216', 'good', 97, 45, NOW() - INTERVAL '2 days'),
('BAT217', 'good', 89, 104, NOW() - INTERVAL '1 day'),
('BAT218', 'good', 91, 63, NOW() - INTERVAL '2 days'),
('BAT219', 'good', 92, 73, NOW() - INTERVAL '1 day'),
('BAT220', 'good', 94, 69, NOW() - INTERVAL '2 days'),
('BAT221', 'good', 95, 81, NOW() - INTERVAL '1 day'),
('BAT222', 'good', 90, 109, NOW() - INTERVAL '2 days'),
('BAT223', 'good', 93, 54, NOW() - INTERVAL '1 day'),
('BAT224', 'good', 97, 120, NOW() - INTERVAL '2 days'),
('BAT225', 'good', 88, 95, NOW() - INTERVAL '1 day'),
('BAT226', 'good', 92, 105, NOW() - INTERVAL '2 days'),
('BAT227', 'good', 91, 89, NOW() - INTERVAL '1 day'),
('BAT228', 'good', 90, 118, NOW() - INTERVAL '2 days'),
('BAT229', 'good', 94, 65, NOW() - INTERVAL '1 day'),
('BAT230', 'good', 95, 79, NOW() - INTERVAL '2 days'),
('BAT231', 'good', 89, 100, NOW() - INTERVAL '1 day'),
('BAT232', 'good', 96, 70, NOW() - INTERVAL '2 days'),
('BAT233', 'good', 93, 85, NOW() - INTERVAL '1 day'),
('BAT234', 'good', 91, 60, NOW() - INTERVAL '2 days'),
('BAT235', 'good', 97, 50, NOW() - INTERVAL '1 day');


-- 3. Thêm khách hàng mới 
-- Chuỗi hash (bcrypt, cost 10) cho 'password123' là: tùy mã hash máy tạo mà add vào
INSERT INTO customers (full_name, username, password_hash, phone, email, current_battery_uid, total_swaps) VALUES
('Nguyễn Văn An', 'an_nguyen', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0901234567', 'an.nguyen@email.com', 'BAT001', 15),
('Trần Thị Bình', 'binh_tran', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0901234568', 'binh.tran@email.com', 'BAT002', 8),
('Lê Minh Chi', 'chi_le', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0901234569', 'chi.le@email.com', 'BAT003', 22),
('Phạm Hoàng Dũng', 'dung_pham', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0901234570', 'dung.pham@email.com', NULL, 5),
('Hoàng Thị Em', 'em_hoang', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0901234571', 'em.hoang@email.com', NULL, 0);
--Khách hàng đã thực hiện đổi trả pin.
INSERT INTO customers (full_name, username, password_hash, phone, email, current_battery_uid, total_swaps) VALUES
('Nguyễn Thị Lan', 'nguyenlan', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010173', 'nguyenlan@email.com', 'BAT173', 1),
('Trần Văn Hùng', 'tranvhung', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010174', 'tranvhung@email.com', 'BAT174', 1),
('Lê Thị Hoa', 'lethih', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010175', 'lethih@email.com', 'BAT175', 1),
('Phạm Văn Minh', 'phamminh', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010176', 'phamminh@email.com', 'BAT176', 1),
('Đỗ Thị Hằng', 'dohang', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010177', 'dohang@email.com', 'BAT177', 1),
('Hoàng Văn Nam', 'hoangnam', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010178', 'hoangnam@email.com', 'BAT178', 1),
('Nguyễn Thị Hồng', 'nguyenhong', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010179', 'nguyenhong@email.com', 'BAT179', 1),
('Bùi Văn Dũng', 'buidung', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010180', 'buidung@email.com', 'BAT180', 1),
('Vũ Thị Mai', 'vuthimai', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010181', 'vuthimai@email.com', 'BAT181', 1),
('Ngô Văn Quân', 'ngovanquan', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010182', 'ngovanquan@email.com', 'BAT182', 1),
('Trần Thị Phương', 'tranphuong', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010183', 'tranphuong@email.com', 'BAT183', 1),
('Lê Văn Đức', 'levanduc', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010184', 'levanduc@email.com', 'BAT184', 1),
('Phan Thị Yến', 'phanyen', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010185', 'phanyen@email.com', 'BAT185', 1),
('Đặng Văn Toàn', 'dangtoan', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010186', 'dangtoan@email.com', 'BAT186', 1),
('Nguyễn Thị Ngọc', 'nguyenngoc', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010187', 'nguyenngoc@email.com', 'BAT187', 1),
('Trương Văn Hậu', 'truonghau', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010188', 'truonghau@email.com', 'BAT188', 1),
('Lâm Thị Thảo', 'lamthithao', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010189', 'lamthithao@email.com', 'BAT189', 1),
('Đỗ Văn Hòa', 'dovanhoa', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010190', 'dovanhoa@email.com', 'BAT190', 1),
('Nguyễn Thị Hường', 'nguyenhuong', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010191', 'nguyenhuong@email.com', 'BAT191', 1),
('Hoàng Văn Cường', 'hoangcuong', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010192', 'hoangcuong@email.com', 'BAT192', 1),
('Lê Thị Trang', 'lethitrang', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010193', 'lethitrang@email.com', 'BAT193', 1),
('Phạm Văn Sơn', 'phamson', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010194', 'phamson@email.com', 'BAT194', 1),
('Đinh Thị Lý', 'dinhthily', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010195', 'dinhthily@email.com', 'BAT195', 1),
('Trần Văn Hải', 'tranvanhai', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010196', 'tranvanhai@email.com', 'BAT196', 1),
('Nguyễn Thị Thắm', 'nguyentham', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010197', 'nguyentham@email.com', 'BAT197', 1),
('Vũ Văn Duy', 'vuvanduy', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010198', 'vuvanduy@email.com', 'BAT198', 1),
('Phan Thị Hà', 'phanthih', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010199', 'phanthih@email.com', 'BAT199', 1),
('Trịnh Văn Tâm', 'trinhvantam', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010200', 'trinhvantam@email.com', 'BAT200', 1),
('Phạm Thị Diệu', 'phamthidieu', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010201', 'phamthidieu@email.com', 'BAT201', 1),
('Nguyễn Văn Hiếu', 'nguyenhieu', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010202', 'nguyenhieu@email.com', 'BAT202', 1),
('Lê Thị Hòa', 'lethihoa', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010203', 'lethihoa@email.com', 'BAT203', 1),
('Đỗ Văn Tuấn', 'dovantuan', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010204', 'dovantuan@email.com', 'BAT204', 1),
('Nguyễn Thị Hạnh', 'nguyenhanh', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010205', 'nguyenhanh@email.com', 'BAT205', 1),
('Trần Thị Thúy', 'tranthuy', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010206', 'tranthuy@email.com', 'BAT206', 1),
('Nguyễn Văn Phong', 'nguyenphong', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010207', 'nguyenphong@email.com', 'BAT207', 1),
('Lê Thị Vân', 'lethivan', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010208', 'lethivan@email.com', 'BAT208', 1),
('Phạm Văn Tùng', 'phamtung', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010209', 'phamtung@email.com', 'BAT209', 1),
('Đỗ Thị Oanh', 'dooanh', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010210', 'dooanh@email.com', 'BAT210', 1),
('Vũ Văn Hưng', 'vuhung', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010211', 'vuhung@email.com', 'BAT211', 1),
('Trịnh Thị Mai', 'trinhmai', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010212', 'trinhmai@email.com', 'BAT212', 1),
('Ngô Văn Bình', 'ngobinh', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010213', 'ngobinh@email.com', 'BAT213', 1),
('Hoàng Thị Yến', 'hoangyen', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010214', 'hoangyen@email.com', 'BAT214', 1),
('Nguyễn Văn Lộc', 'nguyenloc', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010215', 'nguyenloc@email.com', 'BAT215', 1),
('Lê Thị Hậu', 'lethihau', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010216', 'lethihau@email.com', 'BAT216', 1),
('Phan Văn Thái', 'phanthai', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010217', 'phanthai@email.com', 'BAT217', 1),
('Đặng Thị Huyền', 'danghai', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010218', 'danghai@email.com', 'BAT218', 1),
('Nguyễn Văn Khoa', 'nguyenkhoa', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010219', 'nguyenkhoa@email.com', 'BAT219', 1),
('Trần Thị Hà', 'tranthihaha', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010220', 'tranthihaha@email.com', 'BAT220', 1),
('Lê Văn Duy', 'levanduy', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010221', 'levanduy@email.com', 'BAT221', 1),
('Phạm Thị Luyến', 'phamluyen', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010222', 'phamluyen@email.com', 'BAT222', 1),
('Bùi Văn Long', 'builong', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010223', 'builong@email.com', 'BAT223', 1),
('Vũ Thị Nga', 'vuthinga', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010224', 'vuthinga@email.com', 'BAT224', 1),
('Đỗ Văn Tuấn', 'dovantuann', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010225', 'dovantuann@email.com', 'BAT225', 1),
('Trần Thị Kim', 'trankim', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010226', 'trankim@email.com', 'BAT226', 1),
('Nguyễn Văn Hòa', 'nguyenhoaa', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010227', 'nguyenhoaa@email.com', 'BAT227', 1),
('Lê Thị Thanh', 'lethithanh', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010228', 'lethithanh@email.com', 'BAT228', 1),
('Phạm Văn Đức', 'phamvanduc', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010229', 'phamvanduc@email.com', 'BAT229', 1),
('Nguyễn Thị Giang', 'nguyengiang', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010230', 'nguyengiang@email.com', 'BAT230', 1),
('Trần Văn Tuấn', 'tranvantuan', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010231', 'tranvantuan@email.com', 'BAT231', 1),
('Lê Thị Hương', 'lethihuong', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010232', 'lethihuong@email.com', 'BAT232', 1),
('Phan Văn Hậu', 'phanvanhau', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010233', 'phanvanhau@email.com', 'BAT233', 1),
('Đặng Thị Lan', 'dangthilan', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010234', 'dangthilan@email.com', 'BAT234', 1),
('Nguyễn Văn Tâm', 'nguyenvantam', '$2b$10$wY9/flH.i6Pc233I6lqVKeY5Qxi2v2Yl3O.sU5GxtfX.Z2.a7kUcy', '0902010235', 'nguyenvantam@email.com', 'BAT235', 1);



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
('superadmin@gmail.com', '$2b$10$/fI00H3sNA3MvaHsSgn5fOFMNuXJArGiJBhtrNrcFzsQhvwI6gEaa', 'Quản trị viên cấp cao', 'super_admin'),
('admin1@gmail.com', '$2b$10$/fI00H3sNA3MvaHsSgn5fOFMNuXJArGiJBhtrNrcFzsQhvwI6gEaa', 'Admin Trạm 1', 'admin'),
('admin2@gmail.com', '$2b$10$/fI00H3sNA3MvaHsSgn5fOFMNuXJArGiJBhtrNrcFzsQhvwI6gEaa', 'Admin Trạm 2', 'admin')
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
INSERT INTO transaction_logs ( customer_id, station_id, old_battery_uid, new_battery_uid, slot_in, slot_out, transaction_time, completed_time, status) VALUES
(6, 1, 'BAT069', 'BAT173', 5, 5, NOW() - INTERVAL '12 minutes', NOW() - INTERVAL '10 minutes', 'completed'),
(7, 2, 'BAT101', 'BAT174', 7, 7, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '13 minutes', 'completed'),
(8, 2, 'BAT102', 'BAT175', 8, 8, NOW() - INTERVAL '18 minutes', NOW() - INTERVAL '16 minutes', 'completed'),
(9, 2, 'BAT106', 'BAT176', 9, 9, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '18 minutes', 'completed'),
(10, 2, 'BAT109', 'BAT177', 10, 10, NOW() - INTERVAL '23 minutes', NOW() - INTERVAL '21 minutes', 'completed'),
(11, 2, 'BAT110', 'BAT178', 11, 11, NOW() - INTERVAL '26 minutes', NOW() - INTERVAL '24 minutes', 'completed'),
(12, 2, 'BAT111', 'BAT179', 12, 12, NOW() - INTERVAL '29 minutes', NOW() - INTERVAL '27 minutes', 'completed'),
(13, 3, 'BAT089', 'BAT180', 13, 13, NOW() - INTERVAL '17 minutes', NOW() - INTERVAL '15 minutes', 'completed'),
(14, 4, 'BAT003', 'BAT181', 21, 21, NOW() - INTERVAL '31 minutes', NOW() - INTERVAL '29 minutes', 'completed'),
(15, 4, 'BAT015', 'BAT182', 21, 21, NOW() - INTERVAL '32 minutes', NOW() - INTERVAL '30 minutes', 'completed'),
(16, 4, 'BAT016', 'BAT183', 21, 21, NOW() - INTERVAL '33 minutes', NOW() - INTERVAL '31 minutes', 'completed'),
(17, 4, 'BAT017', 'BAT184', 21, 21, NOW() - INTERVAL '34 minutes', NOW() - INTERVAL '32 minutes', 'completed'),
(18, 4, 'BAT018', 'BAT185', 22, 22, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '18 minutes', 'completed'),
(19, 4, 'BAT020', 'BAT186', 22, 22, NOW() - INTERVAL '24 minutes', NOW() - INTERVAL '22 minutes', 'completed'),
(20, 4, 'BAT024', 'BAT187', 22, 22, NOW() - INTERVAL '28 minutes', NOW() - INTERVAL '26 minutes', 'completed'),
(21, 4, 'BAT027', 'BAT188', 22, 22, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '28 minutes', 'completed'),
(22, 4, 'BAT031', 'BAT189', 23, 23, NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '23 minutes', 'completed'),
(23, 4, 'BAT035', 'BAT190', 23, 23, NOW() - INTERVAL '26 minutes', NOW() - INTERVAL '24 minutes', 'completed'),
(24, 4, 'BAT039', 'BAT191', 23, 23, NOW() - INTERVAL '27 minutes', NOW() - INTERVAL '25 minutes', 'completed'),
(25, 4, 'BAT043', 'BAT192', 23, 23, NOW() - INTERVAL '29 minutes', NOW() - INTERVAL '27 minutes', 'completed'),
(26, 4, 'BAT047', 'BAT193', 24, 24, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '13 minutes', 'completed'),
(27, 4, 'BAT052', 'BAT194', 24, 24, NOW() - INTERVAL '18 minutes', NOW() - INTERVAL '16 minutes', 'completed'),
(28, 4, 'BAT057', 'BAT195', 24, 24, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '18 minutes', 'completed'),
(29, 4, 'BAT060', 'BAT196', 24, 24, NOW() - INTERVAL '22 minutes', NOW() - INTERVAL '20 minutes', 'completed'),
(30, 4, 'BAT063', 'BAT197', 25, 25, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '28 minutes', 'completed'),
(31, 4, 'BAT066', 'BAT198', 25, 25, NOW() - INTERVAL '33 minutes', NOW() - INTERVAL '31 minutes', 'completed'),
(32, 4, 'BAT069', 'BAT199', 25, 25, NOW() - INTERVAL '36 minutes', NOW() - INTERVAL '34 minutes', 'completed'),
(33, 4, 'BAT073', 'BAT200', 25, 25, NOW() - INTERVAL '38 minutes', NOW() - INTERVAL '36 minutes', 'completed'),
(34, 4, 'BAT076', 'BAT201', 26, 26, NOW() - INTERVAL '14 minutes', NOW() - INTERVAL '12 minutes', 'completed'),
(35, 4, 'BAT079', 'BAT202', 26, 26, NOW() - INTERVAL '16 minutes', NOW() - INTERVAL '14 minutes', 'completed'),
(36, 4, 'BAT083', 'BAT203', 26, 26, NOW() - INTERVAL '18 minutes', NOW() - INTERVAL '16 minutes', 'completed'),
(37, 4, 'BAT086', 'BAT204', 26, 26, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '18 minutes', 'completed'),
(38, 5, 'BAT103', 'BAT205', 27, 27, NOW() - INTERVAL '24 minutes', NOW() - INTERVAL '22 minutes', 'completed'),
(39, 5, 'BAT115', 'BAT206', 28, 28, NOW() - INTERVAL '26 minutes', NOW() - INTERVAL '24 minutes', 'completed'),
(40, 5, 'BAT116', 'BAT207', 29, 29, NOW() - INTERVAL '28 minutes', NOW() - INTERVAL '26 minutes', 'completed'),
(41, 5, 'BAT117', 'BAT208', 30, 30, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '28 minutes', 'completed'),
(42, 5, 'BAT118', 'BAT209', 31, 31, NOW() - INTERVAL '32 minutes', NOW() - INTERVAL '30 minutes', 'completed'),
(43, 5, 'BAT120', 'BAT210', 32, 32, NOW() - INTERVAL '34 minutes', NOW() - INTERVAL '32 minutes', 'completed'),
(44, 5, 'BAT157', 'BAT211', 27, 27, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '18 minutes', 'completed'),
(45, 5, 'BAT160', 'BAT212', 28, 28, NOW() - INTERVAL '22 minutes', NOW() - INTERVAL '20 minutes', 'completed'),
(46, 5, 'BAT163', 'BAT213', 31, 31, NOW() - INTERVAL '24 minutes', NOW() - INTERVAL '22 minutes', 'completed'),
(47, 6, 'BAT093', 'BAT214', 38, 38, NOW() - INTERVAL '27 minutes', NOW() - INTERVAL '25 minutes', 'completed'),
(48, 6, 'BAT096', 'BAT215', 39, 39, NOW() - INTERVAL '29 minutes', NOW() - INTERVAL '27 minutes', 'completed'),
(49, 6, 'BAT099', 'BAT216', 40, 40, NOW() - INTERVAL '31 minutes', NOW() - INTERVAL '29 minutes', 'completed'),
(50, 6, 'BAT113', 'BAT217', 36, 36, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '13 minutes', 'completed'),
(51, 6, 'BAT114', 'BAT218', 37, 37, NOW() - INTERVAL '17 minutes', NOW() - INTERVAL '15 minutes', 'completed'),
(52, 6, 'BAT124', 'BAT219', 33, 33, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '18 minutes', 'completed'),
(53, 6, 'BAT127', 'BAT220', 34, 34, NOW() - INTERVAL '22 minutes', NOW() - INTERVAL '20 minutes', 'completed'),
(54, 6, 'BAT131', 'BAT221', 35, 35, NOW() - INTERVAL '24 minutes', NOW() - INTERVAL '22 minutes', 'completed'),
(55, 6, 'BAT135', 'BAT222', 36, 36, NOW() - INTERVAL '26 minutes', NOW() - INTERVAL '24 minutes', 'completed'),
(56, 6, 'BAT139', 'BAT223', 37, 37, NOW() - INTERVAL '28 minutes', NOW() - INTERVAL '26 minutes', 'completed'),
(57, 6, 'BAT143', 'BAT224', 38, 38, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '28 minutes', 'completed'),
(58, 6, 'BAT147', 'BAT225', 39, 39, NOW() - INTERVAL '32 minutes', NOW() - INTERVAL '30 minutes', 'completed'),
(59, 6, 'BAT152', 'BAT226', 40, 40, NOW() - INTERVAL '34 minutes', NOW() - INTERVAL '32 minutes', 'completed'),
(60, 6, 'BAT167', 'BAT227', 35, 35, NOW() - INTERVAL '37 minutes', NOW() - INTERVAL '35 minutes', 'completed'),
(61, 6, 'BAT171', 'BAT228', 39, 39, NOW() - INTERVAL '42 minutes', NOW() - INTERVAL '40 minutes', 'completed');



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

Insert into warehouse(slot_id, total_capacity) values
(1,4),
(2,4),
(3,4),
(4,4),
(5,4),
(6,4),
(7,4),
(8,4),
(9,4),
(10,4),
(11,4),
(12,4),
(13,4),
(14,4),
(15,4),
(16,4),
(17,4),
(18,4),
(19,4),
(20,4),
(21,4),
(22,4),
(23,4),
(24,4),
(25,4),
(26,4),
(27,4),
(28,4),
(29,4),
(30,4),
(31,4),
(32,4),
(33,4),
(34,4),
(35,4),
(36,4),
(37,4),
(38,4),
(39,4),
(40,4);
INSERT INTO warehouse_batteries (warehouse_id, battery_uid) VALUES
(1, 'BAT019'),(1, 'BAT037'),(1, 'BAT064'),(1, 'BAT092'),
(2, 'BAT021'),(2, 'BAT038'),(2, 'BAT065'),(2, 'BAT094'),
(3, 'BAT022'),(3, 'BAT040'),(3, 'BAT067'),(3, 'BAT095'),
(4, 'BAT023'),(4, 'BAT041'),(4, 'BAT068'),(4, 'BAT097'),
(5, 'BAT025'),(5, 'BAT042'),(5, 'BAT069'),(5, 'BAT098'),
(6, 'BAT026'),(6, 'BAT044'),(6, 'BAT070'),(6, 'BAT100'),
(7, 'BAT101'),(7, 'BAT045'),(7, 'BAT071'),(7, 'BAT104'),
(8, 'BAT102'),(8, 'BAT046'),(8, 'BAT072'),(8, 'BAT105'),
(9, 'BAT106'),(9, 'BAT048'),(9, 'BAT074'),(9, 'BAT107'),
(10, 'BAT109'),(10, 'BAT049'),(10, 'BAT075'),(10, 'BAT108'),
(11, 'BAT110'),(11, 'BAT050'),(11, 'BAT077'),(11, 'BAT112'),
(12, 'BAT111'),(12, 'BAT051'),(12, 'BAT078'),(12, 'BAT119'),
(13, 'BAT089'),(13, 'BAT053'),(13, 'BAT080'),(13, 'BAT121'),
(14, 'BAT028'),(14, 'BAT054'),(14, 'BAT081'),(14, 'BAT122'),
(15, 'BAT029'),(15, 'BAT055'),(15, 'BAT082'),(15, 'BAT123'),
(16, 'BAT030'),(16, 'BAT056'),(16, 'BAT084'),(16, 'BAT125'),
(17, 'BAT032'),(17, 'BAT058'),(17, 'BAT085'),(17, 'BAT126'),
(18, 'BAT033'),(18, 'BAT059'),(18, 'BAT087'),(18, 'BAT128'),
(19, 'BAT034'),(19, 'BAT061'),(19, 'BAT088'),(19, 'BAT129'),
(20, 'BAT036'),(20, 'BAT062'),(20, 'BAT091'),(20, 'BAT130'),
(21, 'BAT003'),(21, 'BAT015'),(21, 'BAT016'),(21, 'BAT017'),
(22, 'BAT018'),(22, 'BAT020'),(22, 'BAT024'),(22, 'BAT027'),
(23, 'BAT031'),(23, 'BAT035'),(23, 'BAT039'),(23, 'BAT043'),
(24, 'BAT047'),(24, 'BAT052'),(24, 'BAT057'),(24, 'BAT060'),
(25, 'BAT063'),(25, 'BAT066'),(25, 'BAT069'),(25, 'BAT073'),
(26, 'BAT076'),(26, 'BAT079'),(26, 'BAT083'),(26, 'BAT086'),
(27, 'BAT130'),(27, 'BAT149'),(27, 'BAT103'),(27, 'BAT157'),
(28, 'BAT132'),(28, 'BAT150'),(28, 'BAT115'),(28, 'BAT160'),
(29, 'BAT133'),(29, 'BAT151'),(29, 'BAT116'),(29, 'BAT161'),
(30, 'BAT134'),(30, 'BAT153'),(30, 'BAT117'),(30, 'BAT162'),
(31, 'BAT136'),(31, 'BAT154'),(31, 'BAT118'),(31, 'BAT163'),
(32, 'BAT137'),(32, 'BAT155'),(32, 'BAT120'),(32, 'BAT164'),
(33, 'BAT138'),(33, 'BAT156'),(33, 'BAT124'),(33, 'BAT165'),
(34, 'BAT140'),(34, 'BAT158'),(34, 'BAT127'),(34, 'BAT166'),
(35, 'BAT141'),(35, 'BAT159'),(35, 'BAT131'),(35, 'BAT167'),
(36, 'BAT142'),(36, 'BAT113'),(36, 'BAT135'),(36, 'BAT168'),
(37, 'BAT144'),(37, 'BAT114'),(37, 'BAT139'),(37, 'BAT169'),
(38, 'BAT145'),(38, 'BAT093'),(38, 'BAT143'),(38, 'BAT170'),
(39, 'BAT146'),(39, 'BAT096'),(39, 'BAT147'),(39, 'BAT171'),
(40, 'BAT148'),(40, 'BAT099'),(40, 'BAT152'),(40, 'BAT172');
INSERT INTO feedback (customer_id, content, rating)
VALUES
(1, 'Rất hài lòng với dịch vụ đổi pin. Pin mới hoạt động ổn định và nhân viên hỗ trợ nhiệt tình.', 5),
(2, 'Trạm hơi đông vào giờ cao điểm nhưng đổi pin nhanh, nhân viên thân thiện.', 4),
(3, 'Ứng dụng dễ sử dụng, nhưng nên cải thiện tốc độ cập nhật trạng thái pin.', 4),
(4, 'Pin bị lỗi sau khi đổi, nhưng nhân viên đã hỗ trợ đổi lại rất nhanh.', 5),
(5, 'Lần đầu sử dụng dịch vụ, mọi thứ ổn nhưng hy vọng có thêm khuyến mãi.', 4);
SELECT
      (SELECT COUNT(*) FROM stations) AS total_stations,
      (SELECT COUNT(*) AS total_active_stations FROM stations WHERE status = 'active') as ready_stations,
      (SELECT COUNT(*) AS total_good_batteries FROM warehouse_batteries wb JOIN batteries b ON wb.battery_uid = b.uid WHERE b.status = 'good') AS good_batteries,
      (SELECT COUNT(*) FROM batteries) AS total_batteries,
      (
          SELECT COUNT(*) 
          FROM customers 
          WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      ) AS new_customers,
      (SELECT COUNT(*) AS maintenance_needed
      FROM stations
      WHERE status = 'maintenance') AS maintenance_needed ;

SELECT 
    b.uid AS battery_uid,
    s.id AS station_id,
    sl.id AS slot_id,
    sl.slot_number
FROM batteries b
JOIN warehouse_batteries wb ON wb.battery_uid = b.uid
JOIN warehouse w ON wb.warehouse_id = w.id
JOIN slots sl ON w.slot_id = sl.id
JOIN stations s ON sl.station_id = s.id
WHERE b.uid IN (
    'BAT001','BAT002','BAT003','BAT006','BAT009','BAT010','BAT011','BAT013','BAT014',
    'BAT015','BAT016','BAT017','BAT018','BAT020','BAT024','BAT027','BAT031','BAT035',
    'BAT039','BAT043','BAT047','BAT052','BAT057','BAT060','BAT063','BAT066','BAT069',
    'BAT073','BAT076','BAT079','BAT083','BAT086','BAT089','BAT093','BAT096','BAT099',
    'BAT101','BAT102','BAT103','BAT106','BAT109','BAT110','BAT111','BAT113','BAT114',
    'BAT115','BAT116','BAT117','BAT118','BAT120','BAT124','BAT127','BAT131','BAT135',
    'BAT139','BAT143','BAT147','BAT152','BAT157','BAT160','BAT163','BAT167','BAT171'
)
ORDER BY s.id, b.uid;

SELECT 
    s.name AS station_name,
    COALESCE(COUNT(b.uid), 0) AS good_battery_count
FROM stations s
LEFT JOIN slots sl ON s.id = sl.station_id	
LEFT JOIN warehouse w ON sl.id = w.slot_id
LEFT JOIN warehouse_batteries wb ON w.id = wb.warehouse_id
LEFT JOIN batteries b ON wb.battery_uid = b.uid AND b.status = 'good'
GROUP BY s.name
ORDER BY s.name;








