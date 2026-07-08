const db = require('../config/db');

exports.getAll = async (req, res) => {
  const { assigned_to, assigned_by, status, priority } = req.query;
  const empId = req.user.role === 'employee' ? req.user.id : (assigned_to || null);
  try {
    let q = `SELECT t.*, CONCAT(a.first_name,' ',a.last_name) as assigned_to_name,
                    CONCAT(b.first_name,' ',b.last_name) as assigned_by_name
             FROM tasks t
             JOIN employees a ON t.assigned_to = a.id
             JOIN employees b ON t.assigned_by = b.id
             WHERE 1=1`;
    const params = [];
    if (empId) { q += ' AND t.assigned_to = ?'; params.push(empId); }
    if (assigned_by) { q += ' AND t.assigned_by = ?'; params.push(assigned_by); }
    if (status) { q += ' AND t.status = ?'; params.push(status); }
    if (priority) { q += ' AND t.priority = ?'; params.push(priority); }
    q += ' ORDER BY t.due_date ASC';
    const [rows] = await db.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  const { title, description, assigned_to, priority, due_date } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, due_date) VALUES (?,?,?,?,?,?)',
      [title, description, assigned_to, req.user.id, priority, due_date]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE tasks SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ success: true, message: 'Task status updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  const { title, description, assigned_to, priority, due_date, status } = req.body;
  try {
    await db.query(
      'UPDATE tasks SET title=?, description=?, assigned_to=?, priority=?, due_date=?, status=? WHERE id=?',
      [title, description, assigned_to, priority, due_date, status, req.params.id]
    );
    res.json({ success: true, message: 'Task updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM tasks WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
