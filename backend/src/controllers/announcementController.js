const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, CONCAT(e.first_name,' ',e.last_name) as created_by_name
       FROM announcements a JOIN employees e ON a.created_by = e.id
       ORDER BY a.created_at DESC LIMIT 50`
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.create = async (req, res) => {
  const { title, content } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO announcements (title, content, created_by) VALUES (?,?,?)',
      [title, content, req.user.id]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.update = async (req, res) => {
  const { title, content } = req.body;
  try {
    await db.query('UPDATE announcements SET title=?, content=? WHERE id=?', [title, content, req.params.id]);
    res.json({ success: true, message: 'Announcement updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM announcements WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
