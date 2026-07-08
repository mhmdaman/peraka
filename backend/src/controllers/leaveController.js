const db = require('../config/db');

exports.apply = async (req, res) => {
  const { type, start_date, end_date, reason } = req.body;
  const empId = req.user.id;
  try {
    const d1 = new Date(start_date), d2 = new Date(end_date);
    const days = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;

    // Check balance
    const [balance] = await db.query(
      'SELECT balance FROM leave_balances WHERE employee_id=? AND type=?', [empId, type]
    );
    if (!balance.length || balance[0].balance < days)
      return res.status(400).json({ success: false, message: 'Insufficient leave balance' });

    const [result] = await db.query(
      `INSERT INTO leaves_ (employee_id, type, start_date, end_date, reason, days) VALUES (?,?,?,?,?,?)`,
      [empId, type, start_date, end_date, reason, days]
    );
    res.status(201).json({ success: true, id: result.insertId, days });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getList = async (req, res) => {
  const { employee_id, status, type, year } = req.query;
  const empId = req.user.role === 'employee' ? req.user.id : (employee_id || null);
  try {
    let q = `SELECT l.*, CONCAT(e.first_name,' ',e.last_name) as employee_name,
                    CONCAT(m.first_name,' ',m.last_name) as manager_name
             FROM leaves_ l
             JOIN employees e ON l.employee_id = e.id
             LEFT JOIN employees m ON e.manager_id = m.id
             WHERE 1=1`;
    const params = [];
    if (empId) { q += ' AND l.employee_id = ?'; params.push(empId); }
    if (status) { q += ' AND l.status = ?'; params.push(status); }
    if (type) { q += ' AND l.type = ?'; params.push(type); }
    if (year) { q += ' AND YEAR(l.start_date) = ?'; params.push(year); }
    q += ' ORDER BY l.created_at DESC';
    const [rows] = await db.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.review = async (req, res) => {
  const { status, manager_comment } = req.body; // approved | rejected
  const { id } = req.params;
  try {
    const [leave] = await db.query('SELECT * FROM leaves_ WHERE id = ?', [id]);
    if (!leave.length) return res.status(404).json({ success: false, message: 'Leave not found' });
    if (leave[0].status !== 'pending')
      return res.status(400).json({ success: false, message: 'Already reviewed' });

    await db.query('UPDATE leaves_ SET status=?, manager_comment=? WHERE id=?', [status, manager_comment, id]);

    // Deduct balance if approved
    if (status === 'approved') {
      await db.query(
        'UPDATE leave_balances SET balance = balance - ? WHERE employee_id=? AND type=?',
        [leave[0].days, leave[0].employee_id, leave[0].type]
      );
    }
    res.json({ success: true, message: `Leave ${status}` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getBalances = async (req, res) => {
  const empId = req.params.id || req.user.id;
  try {
    const [rows] = await db.query('SELECT type, balance FROM leave_balances WHERE employee_id=?', [empId]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
