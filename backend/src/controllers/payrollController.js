const prisma = require('../config/db');

exports.generate = async (req, res) => {
  const { employee_id, month, year, allowances = 0, pf = 0, tax = 0, other_deductions = 0, bonus = 0 } = req.body;
  const empId = parseInt(employee_id);
  const m = parseInt(month);
  const y = parseInt(year);

  try {
    const emp = await prisma.employee.findUnique({
      where: { id: empId },
      select: { salary_base: true }
    });

    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    const base = parseFloat(emp.salary_base);
    const net = base + parseFloat(allowances) + parseFloat(bonus) - parseFloat(pf) - parseFloat(tax) - parseFloat(other_deductions);

    const payroll = await prisma.payroll.upsert({
      where: {
        employee_id_month_year: {
          employee_id: empId,
          month: m,
          year: y
        }
      },
      update: {
        base_salary: base,
        allowances: parseFloat(allowances),
        pf: parseFloat(pf),
        tax: parseFloat(tax),
        other_deductions: parseFloat(other_deductions),
        net_salary: net,
        bonus: parseFloat(bonus)
      },
      create: {
        employee_id: empId,
        month: m,
        year: y,
        base_salary: base,
        allowances: parseFloat(allowances),
        pf: parseFloat(pf),
        tax: parseFloat(tax),
        other_deductions: parseFloat(other_deductions),
        net_salary: net,
        bonus: parseFloat(bonus)
      }
    });

    res.status(201).json({ success: true, id: payroll.id, net_salary: net });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.getList = async (req, res) => {
  const { employee_id, month, year, status } = req.query;
  const empId = req.user.role === 'employee' ? parseInt(req.user.id) : (employee_id ? parseInt(employee_id) : undefined);
  
  try {
    const where = {};
    if (empId) where.employee_id = empId;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    const payrolls = await prisma.payroll.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
      include: {
        employee: {
          include: { department: true }
        }
      }
    });

    const data = payrolls.map(p => ({
      ...p,
      employee_name: `${p.employee.first_name} ${p.employee.last_name}`,
      department_name: p.employee.department?.name
    }));

    data.forEach(d => delete d.employee);

    res.json({ success: true, data });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.markPaid = async (req, res) => {
  try {
    await prisma.payroll.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        status: 'paid',
        paid_at: new Date()
      }
    });
    res.json({ success: true, message: 'Marked as paid' });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.getById = async (req, res) => {
  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        employee: {
          include: { department: true }
        }
      }
    });

    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });

    const data = {
      ...payroll,
      employee_name: `${payroll.employee.first_name} ${payroll.employee.last_name}`,
      job_title: payroll.employee.job_title,
      email: payroll.employee.email,
      department_name: payroll.employee.department?.name
    };

    delete data.employee;

    res.json({ success: true, data });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};
