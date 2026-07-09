const prisma = require('../config/db');

exports.getStats = async (req, res) => {
  const role = req.user.role;
  const userId = parseInt(req.user.id);

  try {
    // Recent announcements — shared across all roles
    const recentAnn = await prisma.announcement.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      include: { author: { select: { first_name: true, last_name: true } } }
    });
    const announcements = recentAnn.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      created_at: a.created_at,
      author: `${a.author.first_name} ${a.author.last_name}`
    }));

    // ─── ADMIN ───────────────────────────────────────────────
    if (role === 'admin') {
      const [
        total_employees,
        total_departments,
        pending_admin_leaves,
        pending_tasks
      ] = await Promise.all([
        prisma.employee.count({ where: { status: 'active' } }),
        prisma.department.count(),
        prisma.leave.count({ where: { status: 'pending_admin' } }),
        prisma.task.count({ where: { status: { in: ['pending', 'in-progress'] } } })
      ]);

      const deptRaw = await prisma.department.findMany({
        select: {
          name: true,
          _count: { select: { employees: { where: { status: 'active' } } } }
        }
      });
      const deptHeadcount = deptRaw.map(d => ({ name: d.name, count: d._count.employees }));

      // Recent leave requests awaiting admin action
      const pendingLeaves = await prisma.leave.findMany({
        where: { status: 'pending_admin' },
        orderBy: { created_at: 'desc' },
        take: 8,
        include: {
          employee: { select: { first_name: true, last_name: true, job_title: true } }
        }
      });
      const pendingLeaveList = pendingLeaves.map(l => ({
        id: l.id,
        employee_name: `${l.employee.first_name} ${l.employee.last_name}`,
        job_title: l.employee.job_title,
        type: l.type,
        days: l.days,
        start_date: l.start_date,
        end_date: l.end_date,
        manager_comment: l.manager_comment
      }));

      return res.json({
        success: true, data: {
          role: 'admin',
          stats: { total_employees, total_departments, pending_admin_leaves, pending_tasks },
          deptHeadcount,
          pendingLeaveList,
          announcements
        }
      });
    }

    // ─── MANAGER ─────────────────────────────────────────────
    if (role === 'manager') {
      const [
        team_size,
        pending_manager_leaves,
        pending_tasks
      ] = await Promise.all([
        prisma.employee.count({ where: { status: 'active' } }),
        prisma.leave.count({ where: { status: 'pending_manager' } }),
        prisma.task.count({ where: { status: { in: ['pending', 'in-progress'] } } })
      ]);

      // All leave requests awaiting manager review
      const pendingLeaves = await prisma.leave.findMany({
        where: { status: 'pending_manager' },
        orderBy: { created_at: 'desc' },
        take: 8,
        include: {
          employee: { select: { first_name: true, last_name: true, job_title: true } }
        }
      });
      const pendingLeaveList = pendingLeaves.map(l => ({
        id: l.id,
        employee_name: `${l.employee.first_name} ${l.employee.last_name}`,
        job_title: l.employee.job_title,
        type: l.type,
        days: l.days,
        start_date: l.start_date,
        reason: l.reason
      }));

      // Employees list
      const teamMembers = await prisma.employee.findMany({
        where: { status: 'active' },
        select: { id: true, first_name: true, last_name: true, job_title: true, avatar: true, department: { select: { name: true } } },
        take: 6
      });

      return res.json({
        success: true, data: {
          role: 'manager',
          stats: { team_size, pending_manager_leaves, pending_tasks },
          pendingLeaveList,
          teamMembers,
          announcements
        }
      });
    }

    // ─── EMPLOYEE ─────────────────────────────────────────────
    const [
      balances,
      myLeaves,
      myTasks
    ] = await Promise.all([
      prisma.leaveBalance.findMany({
        where: { employee_id: userId },
        select: { type: true, balance: true }
      }),
      prisma.leave.findMany({
        where: { employee_id: userId },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { id: true, type: true, days: true, start_date: true, end_date: true, status: true }
      }),
      prisma.task.findMany({
        where: { assigned_to: userId, status: { in: ['pending', 'in-progress'] } },
        orderBy: { due_date: 'asc' },
        take: 5,
        select: { id: true, title: true, priority: true, status: true, due_date: true }
      })
    ]);

    const pending_leaves = myLeaves.filter(l => l.status === 'pending_manager' || l.status === 'pending_admin').length;
    const total_leaves_taken = myLeaves.filter(l => l.status === 'approved').length;

    return res.json({
      success: true, data: {
        role: 'employee',
        stats: { pending_leaves, total_leaves_taken, pending_tasks: myTasks.length },
        balances,
        myLeaves,
        myTasks,
        announcements
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
