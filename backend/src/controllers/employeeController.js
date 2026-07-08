const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { search, department_id, status, role } = req.query;
    let q = `SELECT e.id, e.first_name, e.last_name, e.email, e.phone, e.job_title,
                    e.date_of_joining, e.status, e.avatar, e.salary_base,
                    r.name as role, d.name as department_name,
                    CONCAT(m.first_name,' ',m.last_name) as manager_name
             FROM employees e
             JOIN roles r ON e.role_id = r.id
             LEFT JOIN departments d ON e.department_id = d.id
             LEFT JOIN employees m ON e.manager_id = m.id
             WHERE 1=1`;
    const params = [];
    if (search) { q += ' AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (department_id) { q += ' AND e.department_id = ?'; params.push(department_id); }
    if (status) { q += ' AND e.status = ?'; params.push(status); }
    if (role) { q += ' AND r.name = ?'; params.push(role); }
    q += ' ORDER BY e.created_at DESC';
    const [rows] = await db.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.id, e.first_name, e.last_name, e.email, e.phone, e.date_of_birth,
              e.address, e.avatar, e.job_title, e.department_id, e.manager_id,
              e.date_of_joining, e.status, e.salary_base, e.created_at,
              r.name as role, r.id as role_id, d.name as department_name,
              CONCAT(m.first_name,' ',m.last_name) as manager_name
       FROM employees e
       JOIN roles r ON e.role_id = r.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN employees m ON e.manager_id = m.id
       WHERE e.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  const { first_name, last_name, email, password, phone, date_of_birth, address,
    job_title, department_id, manager_id, date_of_joining, role_id, salary_base } = req.body;
  try {
    const hash = await bcrypt.hash(password || 'Employee@123', 10);
    const [result] = await db.query(
      `INSERT INTO employees (first_name, last_name, email, password_hash, phone, date_of_birth,
        address, job_title, department_id, manager_id, date_of_joining, role_id, salary_base)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [first_name, last_name, email, hash, phone, date_of_birth, address,
        job_title, department_id, manager_id, date_of_joining, role_id, salary_base]
    );
    // Seed default leave balances
    const empId = result.insertId;
    await db.query(
      `INSERT INTO leave_balances (employee_id, type, balance) VALUES
       (?,\'sick\',12),(?,\'casual\',12),(?,\'paid\',15),(?,\'unpaid\',0)`,
      [empId, empId, empId, empId]
    );
    res.status(201).json({ success: true, message: 'Employee created', id: empId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Email already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  const { first_name, last_name, phone, date_of_birth, address, job_title,
    department_id, manager_id, date_of_joining, role_id, salary_base, status } = req.body;
  try {
    await db.query(
      `UPDATE employees SET first_name=?, last_name=?, phone=?, date_of_birth=?, address=?,
        job_title=?, department_id=?, manager_id=?, date_of_joining=?, role_id=?, salary_base=?, status=?
       WHERE id=?`,
      [first_name, last_name, phone, date_of_birth, address, job_title,
        department_id, manager_id, date_of_joining, role_id, salary_base, status, req.params.id]
    );
    res.json({ success: true, message: 'Employee updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.uploadAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const avatarPath = `/uploads/avatars/${req.file.filename}`;
  await db.query('UPDATE employees SET avatar = ? WHERE id = ?', [avatarPath, req.params.id]);
  res.json({ success: true, avatar: avatarPath });
};

exports.deleteEmployee = async (req, res) => {
  try {
    await db.query('UPDATE employees SET status = ? WHERE id = ?', ['inactive', req.params.id]);
    res.json({ success: true, message: 'Employee deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
