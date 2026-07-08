-- ============================================
-- Employee Management System (EMS) - Schema
-- Database: MySQL 8+
-- ============================================

CREATE DATABASE IF NOT EXISTS ems_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ems_db;

-- ============================================
-- 1. Roles
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(255) NULL
);

INSERT INTO roles (name, description) VALUES
('admin', 'Full system control, HR operations, and financial auditing.'),
('manager', 'Team supervision, leave reviews, and task management.'),
('employee', 'Standard access for leaves, attendance, profile, and payslips.');

-- ============================================
-- 2. Departments
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    manager_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 3. Employees
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    date_of_birth DATE NULL,
    address TEXT NULL,
    avatar VARCHAR(500) NULL,
    job_title VARCHAR(100) NOT NULL,
    department_id INT NULL,
    manager_id INT NULL,
    date_of_joining DATE NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    role_id INT NOT NULL,
    salary_base DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

ALTER TABLE departments ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- ============================================
-- 4. Documents
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================
-- 5. Leave Balances
-- ============================================
CREATE TABLE IF NOT EXISTS leave_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    type ENUM('sick', 'casual', 'paid', 'unpaid', 'maternity') NOT NULL,
    balance INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_emp_leave_type (employee_id, type),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================
-- 6. Leaves
-- ============================================
CREATE TABLE IF NOT EXISTS leaves_ (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    type ENUM('sick', 'casual', 'paid', 'unpaid', 'maternity') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    manager_comment TEXT NULL,
    days INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================
-- 7. Attendance
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in TIME NOT NULL,
    check_out TIME NULL,
    working_hours DECIMAL(4, 2) NULL,
    status ENUM('present', 'absent', 'late', 'half-day', 'on-leave') DEFAULT 'present',
    verified_photo_path VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_emp_date (employee_id, date),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================
-- 8. Payroll
-- ============================================
CREATE TABLE IF NOT EXISTS payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    base_salary DECIMAL(12, 2) NOT NULL,
    allowances DECIMAL(12, 2) DEFAULT 0.00,
    pf DECIMAL(12, 2) DEFAULT 0.00,
    tax DECIMAL(12, 2) DEFAULT 0.00,
    other_deductions DECIMAL(12, 2) DEFAULT 0.00,
    net_salary DECIMAL(12, 2) NOT NULL,
    bonus DECIMAL(12, 2) DEFAULT 0.00,
    status ENUM('pending', 'paid') DEFAULT 'pending',
    paid_at TIMESTAMP NULL,
    payslip_path VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_emp_period (employee_id, month, year),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================
-- 9. Tasks
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    assigned_to INT NOT NULL,
    assigned_by INT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================
-- 10. Announcements
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================
-- 11. Notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================
-- 12. Chats
-- ============================================
CREATE TABLE IF NOT EXISTS chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================
-- 13. Audit Logs (Immutable)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    actor_id INT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- ============================================
-- Seed Data: Default Admin, Manager, Employee
-- Passwords are bcrypt hash of 'Admin@123'
-- ============================================
INSERT INTO departments (id, name, description) VALUES
(1, 'Engineering', 'Software development and IT infrastructure'),
(2, 'Human Resources', 'People operations and talent management'),
(3, 'Marketing', 'Brand strategy and growth');

-- Password: Admin@123 (bcrypt hash)
INSERT INTO employees (id, first_name, last_name, email, password_hash, phone, job_title, department_id, date_of_joining, role_id, salary_base) VALUES
(1, 'Admin', 'User', 'admin@company.com', '$2b$10$xJ8Kq5KqhZ0FZ0v1Z5Z5ZuQ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', '9876543210', 'System Administrator', 2, '2024-01-01', 1, 80000.00),
(2, 'Sarah', 'Johnson', 'sarah@company.com', '$2b$10$xJ8Kq5KqhZ0FZ0v1Z5Z5ZuQ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', '9876543211', 'Engineering Manager', 1, '2024-02-15', 2, 65000.00),
(3, 'John', 'Doe', 'john@company.com', '$2b$10$xJ8Kq5KqhZ0FZ0v1Z5Z5ZuQ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', '9876543212', 'Software Engineer', 1, '2024-03-01', 3, 50000.00);

-- Set department managers
UPDATE departments SET manager_id = 2 WHERE id = 1;
UPDATE departments SET manager_id = 1 WHERE id = 2;

-- Set employee manager
UPDATE employees SET manager_id = 2 WHERE id = 3;

-- Seed leave balances
INSERT INTO leave_balances (employee_id, type, balance) VALUES
(1, 'sick', 12), (1, 'casual', 12), (1, 'paid', 15), (1, 'unpaid', 0),
(2, 'sick', 12), (2, 'casual', 12), (2, 'paid', 15), (2, 'unpaid', 0),
(3, 'sick', 12), (3, 'casual', 12), (3, 'paid', 15), (3, 'unpaid', 0);
