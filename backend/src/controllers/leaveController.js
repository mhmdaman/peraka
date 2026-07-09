const prisma = require('../config/db');

exports.apply = async (req, res) => {
  const { type, start_date, end_date, reason } = req.body;
  const empId = parseInt(req.user.id);
  
  try {
    const d1 = new Date(start_date);
    const d2 = new Date(end_date);
    const days = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;

    // Check balance
    const balanceRecord = await prisma.leaveBalance.findUnique({
      where: {
        employee_id_type: {
          employee_id: empId,
          type
        }
      }
    });

    if (!balanceRecord || balanceRecord.balance < days) {
      return res.status(400).json({ success: false, message: 'Insufficient leave balance' });
    }

    const leave = await prisma.leave.create({
      data: {
        employee_id: empId,
        type,
        start_date: d1,
        end_date: d2,
        reason,
        days
      }
    });

    res.status(201).json({ success: true, id: leave.id, days });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.getList = async (req, res) => {
  const { employee_id, status, type, year } = req.query;
  const empId = req.user.role === 'employee' ? parseInt(req.user.id) : (employee_id ? parseInt(employee_id) : undefined);
  
  try {
    const where = {};
    if (empId) where.employee_id = empId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (year) {
      const y = parseInt(year);
      where.start_date = {
        gte: new Date(Date.UTC(y, 0, 1)),
        lt: new Date(Date.UTC(y + 1, 0, 1))
      };
    }

    const leaves = await prisma.leave.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        employee: {
          include: { manager: true }
        }
      }
    });

    const data = leaves.map(l => ({
      ...l,
      employee_name: `${l.employee.first_name} ${l.employee.last_name}`,
      manager_name: l.employee.manager ? `${l.employee.manager.first_name} ${l.employee.manager.last_name}` : null
    }));

    data.forEach(d => delete d.employee);

    res.json({ success: true, data });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.review = async (req, res) => {
  const { status, manager_comment } = req.body; // approved | rejected
  const id = parseInt(req.params.id);
  
  try {
    const leave = await prisma.leave.findUnique({ where: { id } });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    if (leave.status !== 'pending')
      return res.status(400).json({ success: false, message: 'Already reviewed' });

    // Use a transaction if approved so balance deduction and status update are atomic
    if (status === 'approved') {
      await prisma.$transaction([
        prisma.leave.update({
          where: { id },
          data: { status, manager_comment }
        }),
        prisma.leaveBalance.update({
          where: {
            employee_id_type: {
              employee_id: leave.employee_id,
              type: leave.type
            }
          },
          data: {
            balance: { decrement: leave.days }
          }
        })
      ]);
    } else {
      await prisma.leave.update({
        where: { id },
        data: { status, manager_comment }
      });
    }

    res.json({ success: true, message: `Leave ${status}` });
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
