const db = require('../config/db');

exports.generate = async (req, res) => {
  const { employee_id, month, year, allowances = 0, pf = 0, tax = 0, other_deductions = 0, bonus = 0 } = req.body;
  try {
    const [emp] = await db.query('SELECT salary_base FROM employees WHERE id = ?', [employee_id]);
    if (!emp.length) return res.status(404).json({ success: false, message: 'Employee not found' });
    const base = emp[0].salary_base;
    const net = parseFloat(base) + parseFloat(allowances) + parseFloat(bonus) - parseFloat(pf) - parseFloat(tax) - parseFloat(other_deductions);
    const [result] = await db.query(
      `INSERT INTO payroll (employee_id, month, year, base_salary, allowances, pf, tax, other_deductions, net_salary, bonus)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE allowances=VALUES(allowances), pf=VALUES(pf), tax=VALUES(tax),
         other_deductions=VALUES(other_deductions), net_salary=VALUES(net_salary), bonus=VALUES(bonus)`,
      [employee_id, month, year, base, allowances, pf, tax, other_deductions, net, bonus]
    );
    res.status(201).json({ success: true, id: result.insertId, net_salary: net });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getList = async (req, res) => {
  const { employee_id, month, year, status } = req.query;
  const empId = req.user.role === 'employee' ? req.user.id : (employee_id || null);
  try {
    let q = `SELECT p.*, CONCAT(e.first_name,' ',e.last_name) as employee_name,
                    d.name as department_name
             FROM payroll p
             JOIN employees e ON p.employee_id = e.id
             LEFT JOIN departments d ON e.department_id = d.id
             WHERE 1=1`;
    const params = [];
    if (empId) { q += ' AND p.employee_id = ?'; params.push(empId); }
    if (month) { q += ' AND p.month = ?'; params.push(month); }
    if (year) { q += ' AND p.year = ?'; params.push(year); }
    if (status) { q += ' AND p.status = ?'; params.push(status); }
    q += ' ORDER BY p.year DESC, p.month DESC';
    const [rows] = await db.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.markPaid = async (req, res) => {
  try {
    await db.query('UPDATE payroll SET status=?, paid_at=NOW() WHERE id=?', ['paid', req.params.id]);
    res.json({ success: true, message: 'Marked as paid' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, CONCAT(e.first_name,' ',e.last_name) as employee_name,
              e.job_title, e.email, d.name as department_name
       FROM payroll p
       JOIN employees e ON p.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Payroll not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
