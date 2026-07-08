const db = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    const [[{ total_employees }]] = await db.query("SELECT COUNT(*) as total_employees FROM employees WHERE status='active'");
    const [[{ present_today }]] = await db.query("SELECT COUNT(*) as present_today FROM attendance WHERE date=? AND status IN ('present','late')", [today]);
    const [[{ pending_leaves }]] = await db.query("SELECT COUNT(*) as pending_leaves FROM leaves_ WHERE status='pending'");
    const [[{ total_payroll }]] = await db.query("SELECT COALESCE(SUM(net_salary),0) as total_payroll FROM payroll WHERE month=? AND year=? AND status='paid'", [month, year]);
    const [[{ pending_tasks }]] = await db.query("SELECT COUNT(*) as pending_tasks FROM tasks WHERE status IN ('pending','in-progress')");
    const [[{ total_departments }]] = await db.query("SELECT COUNT(*) as total_departments FROM departments");

    // Attendance trend last 7 days
    const [attendanceTrend] = await db.query(
      `SELECT date, COUNT(*) as count, status FROM attendance
       WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY date, status ORDER BY date`,
    );

    // Department headcount
    const [deptHeadcount] = await db.query(
      `SELECT d.name, COUNT(e.id) as count FROM departments d
       LEFT JOIN employees e ON e.department_id = d.id AND e.status='active'
       GROUP BY d.id, d.name`
    );

    // Monthly payroll trend last 6 months
    const [payrollTrend] = await db.query(
      `SELECT month, year, SUM(net_salary) as total FROM payroll
       WHERE (year = ? AND month <= ?) OR (year = ? AND month > ?)
       GROUP BY year, month ORDER BY year, month LIMIT 6`,
      [year, month, year - 1, month]
    );

    // Recent announcements
    const [announcements] = await db.query(
      `SELECT a.id, a.title, a.created_at, CONCAT(e.first_name,' ',e.last_name) as author
       FROM announcements a JOIN employees e ON a.created_by = e.id
       ORDER BY a.created_at DESC LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        stats: { total_employees, present_today, pending_leaves, total_payroll, pending_tasks, total_departments },
        attendanceTrend,
        deptHeadcount,
        payrollTrend,
        announcements,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
