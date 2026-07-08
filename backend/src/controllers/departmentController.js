const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, CONCAT(e.first_name,' ',e.last_name) as manager_name,
              (SELECT COUNT(*) FROM employees WHERE department_id = d.id AND status='active') as employee_count
       FROM departments d
       LEFT JOIN employees e ON d.manager_id = e.id
       ORDER BY d.name`
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.*, CONCAT(e.first_name,' ',e.last_name) as manager_name
       FROM departments d LEFT JOIN employees e ON d.manager_id = e.id WHERE d.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  const { name, description, manager_id } = req.body;
  try {
    const [result] = await db.query('INSERT INTO departments (name, description, manager_id) VALUES (?,?,?)', [name, description, manager_id]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Department already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  const { name, description, manager_id } = req.body;
  try {
    await db.query('UPDATE departments SET name=?, description=?, manager_id=? WHERE id=?', [name, description, manager_id, req.params.id]);
    res.json({ success: true, message: 'Department updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
