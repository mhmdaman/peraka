const prisma = require('../config/db');

// Employee applies → status: pending_manager
exports.apply = async (req, res) => {
  const { type, start_date, end_date, reason } = req.body;
  const empId = parseInt(req.user.id);

  if (req.user.role !== 'employee') {
    return res.status(403).json({ success: false, message: 'Only employees can apply for leave' });
  }

  try {
    const d1 = new Date(start_date);
    const d2 = new Date(end_date);
    const days = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;

    const balanceRecord = await prisma.leaveBalance.findUnique({
      where: { employee_id_type: { employee_id: empId, type } }
    });

    if (!balanceRecord || balanceRecord.balance < days) {
      return res.status(400).json({ success: false, message: `Insufficient leave balance (have ${balanceRecord?.balance ?? 0} days, need ${days})` });
    }

    const leave = await prisma.leave.create({
      data: {
        employee_id: empId,
        type,
        start_date: d1,
        end_date: d2,
        reason,
        days,
        status: 'pending_manager'  // first stop: manager
      }
    });

    res.status(201).json({ success: true, id: leave.id, days });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Manager reviews: pending_manager → pending_admin (forward) or rejected
exports.managerReview = async (req, res) => {
  const { action, comment } = req.body; // action: 'forward' | 'reject'
  const id = parseInt(req.params.id);

  try {
    const leave = await prisma.leave.findUnique({
      where: { id },
      include: { employee: true }
    });

    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    if (leave.status !== 'pending_manager') {
      return res.status(400).json({ success: false, message: 'Leave is not awaiting manager review' });
    }

    // Managers can review ANY leave in pending_manager state
    const newStatus = action === 'forward' ? 'pending_admin' : 'rejected';

    await prisma.leave.update({
      where: { id },
      data: { status: newStatus, manager_comment: comment || null }
    });

    res.json({ success: true, message: action === 'forward' ? 'Leave forwarded to HR/Admin' : 'Leave rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin gives final decision: pending_admin → approved or rejected
exports.adminReview = async (req, res) => {
  const { action, comment } = req.body; // action: 'approve' | 'reject'
  const id = parseInt(req.params.id);

  try {
    const leave = await prisma.leave.findUnique({ where: { id } });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    if (leave.status !== 'pending_admin') {
      return res.status(400).json({ success: false, message: 'Leave is not awaiting admin review' });
    }

    if (action === 'approve') {
      await prisma.$transaction([
        prisma.leave.update({
          where: { id },
          data: { status: 'approved', manager_comment: comment || leave.manager_comment }
        }),
        prisma.leaveBalance.update({
          where: { employee_id_type: { employee_id: leave.employee_id, type: leave.type } },
          data: { balance: { decrement: leave.days } }
        })
      ]);
    } else {
      await prisma.leave.update({
        where: { id },
        data: { status: 'rejected', manager_comment: comment || leave.manager_comment }
      });
    }

    res.json({ success: true, message: action === 'approve' ? 'Leave approved' : 'Leave rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// List leaves — scoped by role
exports.getList = async (req, res) => {
  const { status } = req.query;
  const role = req.user.role;
  const userId = parseInt(req.user.id);

  try {
    let where = {};

    if (role === 'employee') {
      // Employee sees only their own leaves
      where.employee_id = userId;
    }
    // Managers and Admins see all leaves (filtered by status below if provided)

    if (status) where.status = status;

    const leaves = await prisma.leave.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        employee: {
          select: { id: true, first_name: true, last_name: true, job_title: true, department: { select: { name: true } } }
        }
      }
    });

    const data = leaves.map(l => ({
      id: l.id,
      employee_id: l.employee_id,
      employee_name: `${l.employee.first_name} ${l.employee.last_name}`,
      job_title: l.employee.job_title,
      department: l.employee.department?.name || null,
      type: l.type,
      start_date: l.start_date,
      end_date: l.end_date,
      reason: l.reason,
      days: l.days,
      status: l.status,
      manager_comment: l.manager_comment,
      created_at: l.created_at
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBalances = async (req, res) => {
  const empId = req.params.id ? parseInt(req.params.id) : parseInt(req.user.id);
  try {
    const balances = await prisma.leaveBalance.findMany({
      where: { employee_id: empId },
      select: { type: true, balance: true }
    });
    res.json({ success: true, data: balances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
