const db = require('../config/db');

exports.checkIn = async (req, res) => {
  const { employee_id, verified_photo_path } = req.body;
  const empId = employee_id || req.user.id;
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 8);
  try {
    const [existing] = await db.query('SELECT id, check_out FROM attendance WHERE employee_id=? AND date=?', [empId, today]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Already checked in today' });
    const checkInTime = now;
    const [shift] = ['09:00:00'];
    const status = checkInTime > '09:15:00' ? 'late' : 'present';
    await db.query(
      'INSERT INTO attendance (employee_id, date, check_in, status, verified_photo_path) VALUES (?,?,?,?,?)',
      [empId, today, checkInTime, status, verified_photo_path || null]
    );
    res.json({ success: true, message: 'Checked in', check_in: checkInTime, status });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.checkOut = async (req, res) => {
  const empId = req.user.id;
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 8);
  try {
    const [rows] = await db.query('SELECT * FROM attendance WHERE employee_id=? AND date=?', [empId, today]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'No check-in found for today' });
    if (rows[0].check_out) return res.status(409).json({ success: false, message: 'Already checked out' });
    const [h1, m1, s1] = rows[0].check_in.split(':').map(Number);
    const [h2, m2, s2] = now.split(':').map(Number);
    const hours = ((h2 * 3600 + m2 * 60 + s2) - (h1 * 3600 + m1 * 60 + s1)) / 3600;
    await db.query('UPDATE attendance SET check_out=?, working_hours=? WHERE id=?', [now, hours.toFixed(2), rows[0].id]);
    res.json({ success: true, message: 'Checked out', check_out: now, working_hours: hours.toFixed(2) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getToday = async (req, res) => {
  const empId = req.user.id;
  const today = new Date().toISOString().slice(0, 10);
  try {
    const [rows] = await db.query('SELECT * FROM attendance WHERE employee_id=? AND date=?', [empId, today]);
    res.json({ success: true, data: rows[0] || null });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getList = async (req, res) => {
  const { employee_id, month, year, status } = req.query;
  // Employees can only see their own records
  const empId = (req.user.role === 'employee') ? req.user.id : (employee_id || null);
  try {
    let q = `SELECT a.*, CONCAT(e.first_name,' ',e.last_name) as employee_name
             FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE 1=1`;
    const params = [];
    if (empId) { q += ' AND a.employee_id = ?'; params.push(empId); }
    if (month) { q += ' AND MONTH(a.date) = ?'; params.push(month); }
    if (year) { q += ' AND YEAR(a.date) = ?'; params.push(year); }
    if (status) { q += ' AND a.status = ?'; params.push(status); }
    q += ' ORDER BY a.date DESC LIMIT 500';
    const [rows] = await db.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getStats = async (req, res) => {
  const { employee_id, month, year } = req.query;
  const empId = employee_id || req.user.id;
  const m = month || new Date().getMonth() + 1;
  const y = year || new Date().getFullYear();
  try {
    const [rows] = await db.query(
      `SELECT status, COUNT(*) as count FROM attendance
       WHERE employee_id=? AND MONTH(date)=? AND YEAR(date)=? GROUP BY status`,
      [empId, m, y]
    );
    const stats = { present: 0, absent: 0, late: 0, 'half-day': 0, 'on-leave': 0 };
    rows.forEach(r => { stats[r.status] = r.count; });
    res.json({ success: true, data: stats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
