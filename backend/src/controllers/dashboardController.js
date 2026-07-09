const prisma = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const today = new Date(new Date().setUTCHours(0,0,0,0));
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    const [
      total_employees,
      present_today,
      pending_leaves,
      total_departments,
      pending_tasks,
      payroll_agg
    ] = await Promise.all([
      prisma.employee.count({ where: { status: 'active' } }),
      prisma.attendance.count({ where: { date: today, status: { in: ['present', 'late'] } } }),
      prisma.leave.count({ where: { status: 'pending' } }),
      prisma.department.count(),
      prisma.task.count({ where: { status: { in: ['pending', 'in-progress'] } } }),
      prisma.payroll.aggregate({
        where: { month, year, status: 'paid' },
        _sum: { net_salary: true }
      })
    ]);

    const total_payroll = payroll_agg._sum.net_salary || 0;

    // Attendance trend last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const attendanceTrendRaw = await prisma.attendance.groupBy({
      by: ['date', 'status'],
      where: { date: { gte: sevenDaysAgo } },
      _count: { _all: true },
      orderBy: { date: 'asc' }
    });
    const attendanceTrend = attendanceTrendRaw.map(a => ({
      date: a.date,
      status: a.status,
      count: a._count._all
    }));

    // Department headcount
    const deptHeadcountRaw = await prisma.department.findMany({
      select: {
        name: true,
        _count: {
          select: { employees: { where: { status: 'active' } } }
        }
      }
    });
    const deptHeadcount = deptHeadcountRaw.map(d => ({
      name: d.name,
      count: d._count.employees
    }));

    // Monthly payroll trend last 6 months
    const payrollTrendRaw = await prisma.payroll.groupBy({
      by: ['month', 'year'],
      where: {
        OR: [
          { year: year, month: { lte: month } },
          { year: year - 1, month: { gt: month } }
        ]
      },
      _sum: { net_salary: true },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
      take: 6
    });
    const payrollTrend = payrollTrendRaw.map(p => ({
      month: p.month,
      year: p.year,
      total: p._sum.net_salary || 0
    }));

    // Recent announcements
    const recentAnnouncements = await prisma.announcement.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      include: { author: true }
    });
    const announcements = recentAnnouncements.map(a => ({
      id: a.id,
      title: a.title,
      created_at: a.created_at,
      author: `${a.author.first_name} ${a.author.last_name}`
    }));

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
