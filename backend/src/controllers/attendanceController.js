const prisma = require('../config/db');

exports.checkIn = async (req, res) => {
  const { employee_id, verified_photo_path } = req.body;
  const empId = employee_id ? parseInt(employee_id) : parseInt(req.user.id);
  
  // Create a Date object for today at midnight UTC for the date field
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  
  try {
    const existing = await prisma.attendance.findFirst({
      where: {
        employee_id: empId,
        date: today
      }
    });

    if (existing) return res.status(409).json({ success: false, message: 'Already checked in today' });
    
    // Determine status (late if past 09:15 local time)
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const status = (hours > 9 || (hours === 9 && minutes > 15)) ? 'late' : 'present';

    const attendance = await prisma.attendance.create({
      data: {
        employee_id: empId,
        date: today,
        check_in: now,
        status,
        verified_photo_path: verified_photo_path || null
      }
    });

    // Format check_in for response
    const checkInTime = now.toTimeString().slice(0, 8);
    res.json({ success: true, message: 'Checked in', check_in: checkInTime, status });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.checkOut = async (req, res) => {
  const empId = parseInt(req.user.id);
  
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  try {
    const record = await prisma.attendance.findFirst({
      where: {
        employee_id: empId,
        date: today
      }
    });

    if (!record) return res.status(404).json({ success: false, message: 'No check-in found for today' });
    if (record.check_out) return res.status(409).json({ success: false, message: 'Already checked out' });

    const checkInDate = new Date(record.check_in);
    const diffMs = now.getTime() - checkInDate.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    await prisma.attendance.update({
      where: { id: record.id },
      data: {
        check_out: now,
        working_hours: diffHrs
      }
    });

    const checkOutTime = now.toTimeString().slice(0, 8);
    res.json({ success: true, message: 'Checked out', check_out: checkOutTime, working_hours: diffHrs.toFixed(2) });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.getToday = async (req, res) => {
  const empId = parseInt(req.user.id);
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  try {
    const record = await prisma.attendance.findFirst({
      where: {
        employee_id: empId,
        date: today
      }
    });
    
    res.json({ success: true, data: record || null });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.getList = async (req, res) => {
  const { employee_id, month, year, status } = req.query;
  const empId = (req.user.role === 'employee') ? parseInt(req.user.id) : (employee_id ? parseInt(employee_id) : undefined);
  
  try {
    const where = {};
    if (empId) where.employee_id = empId;
    if (status) where.status = status;
    
    if (month && year) {
      const m = parseInt(month) - 1; // JS months are 0-indexed
      const y = parseInt(year);
      where.date = {
        gte: new Date(Date.UTC(y, m, 1)),
        lt: new Date(Date.UTC(y, m + 1, 1))
      };
    } else if (year) {
      const y = parseInt(year);
      where.date = {
        gte: new Date(Date.UTC(y, 0, 1)),
        lt: new Date(Date.UTC(y + 1, 0, 1))
      };
    } else if (month) {
      // Month without year is tricky in Prisma without raw queries, skipping for brevity or we default to current year
      const m = parseInt(month) - 1;
      const y = new Date().getFullYear();
      where.date = {
        gte: new Date(Date.UTC(y, m, 1)),
        lt: new Date(Date.UTC(y, m + 1, 1))
      };
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 500,
      include: { employee: true }
    });

    const data = records.map(r => ({
      ...r,
      employee_name: `${r.employee.first_name} ${r.employee.last_name}`
    }));
    
    // Clean up employee object to match old flat structure
    data.forEach(d => delete d.employee);

    res.json({ success: true, data });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.getStats = async (req, res) => {
  const { employee_id, month, year } = req.query;
  const empId = employee_id ? parseInt(employee_id) : parseInt(req.user.id);
  const m = month ? parseInt(month) - 1 : new Date().getMonth();
  const y = year ? parseInt(year) : new Date().getFullYear();

  try {
    const groupResult = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        employee_id: empId,
        date: {
          gte: new Date(Date.UTC(y, m, 1)),
          lt: new Date(Date.UTC(y, m + 1, 1))
        }
      },
      _count: {
        status: true
      }
    });

    const stats = { present: 0, absent: 0, late: 0, 'half-day': 0, 'on-leave': 0 };
    groupResult.forEach(r => {
      stats[r.status] = r._count.status;
    });

    res.json({ success: true, data: stats });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};
