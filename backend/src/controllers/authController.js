const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  try {
    const [rows] = await db.query(
      `SELECT e.*, r.name as role FROM employees e
       JOIN roles r ON e.role_id = r.id
       WHERE e.email = ? AND e.status = 'active'`,
      [email]
    );
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const employee = rows[0];
    const valid = await bcrypt.compare(password, employee.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: employee.id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password_hash, ...safeEmployee } = employee;
    res.json({ success: true, token, user: safeEmployee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.id, e.first_name, e.last_name, e.email, e.phone, e.date_of_birth,
              e.address, e.avatar, e.job_title, e.department_id, e.manager_id,
              e.date_of_joining, e.status, e.salary_base, e.created_at,
              r.name as role, d.name as department_name
       FROM employees e
       JOIN roles r ON e.role_id = r.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.id = ?`,
      [req.user.id]
    );
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ success: false, message: 'Both fields required' });
  try {
    const [rows] = await db.query('SELECT password_hash FROM employees WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE employees SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
