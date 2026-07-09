const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { search, department_id, status, role } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (department_id) {
      where.department_id = parseInt(department_id);
    }
    
    if (status) {
      where.status = status;
    }
    
    if (role) {
      where.role = {
        name: role
      };
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        role: true,
        department: true,
        manager: true
      }
    });

    const data = employees.map(e => ({
      id: e.id,
      first_name: e.first_name,
      last_name: e.last_name,
      email: e.email,
      phone: e.phone,
      job_title: e.job_title,
      date_of_joining: e.date_of_joining,
      status: e.status,
      avatar: e.avatar,
      salary_base: e.salary_base,
      role: e.role?.name,
      department_name: e.department?.name,
      manager_name: e.manager ? `${e.manager.first_name} ${e.manager.last_name}` : null
    }));

    res.json({ success: true, data });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.getById = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        role: true,
        department: true,
        manager: true
      }
    });

    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const data = {
      ...employee,
      role: employee.role?.name,
      role_id: employee.role?.id,
      department_name: employee.department?.name,
      manager_name: employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : null
    };
    // Don't send password_hash
    delete data.password_hash;

    res.json({ success: true, data });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.create = async (req, res) => {
  const { first_name, last_name, email, password, phone, date_of_birth, address,
    job_title, department_id, manager_id, date_of_joining, role_id, salary_base } = req.body;
  try {
    const hash = await bcrypt.hash(password || 'Employee@123', 10);
    
    const newEmployee = await prisma.employee.create({
      data: {
        first_name,
        last_name,
        email,
        password_hash: hash,
        phone,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        address,
        job_title,
        department_id: department_id ? parseInt(department_id) : null,
        manager_id: manager_id ? parseInt(manager_id) : null,
        date_of_joining: new Date(date_of_joining),
        role_id: parseInt(role_id),
        salary_base: parseFloat(salary_base)
      }
    });

    // Seed default leave balances
    const leaveBalances = [
      { employee_id: newEmployee.id, type: 'sick', balance: 12 },
      { employee_id: newEmployee.id, type: 'casual', balance: 12 },
      { employee_id: newEmployee.id, type: 'paid', balance: 15 },
      { employee_id: newEmployee.id, type: 'unpaid', balance: 0 }
    ];

    await prisma.leaveBalance.createMany({
      data: leaveBalances
    });

    res.status(201).json({ success: true, message: 'Employee created', id: newEmployee.id });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'Email already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  const { first_name, last_name, phone, date_of_birth, address, job_title,
    department_id, manager_id, date_of_joining, role_id, salary_base, status } = req.body;
  try {
    await prisma.employee.update({
      where: { id: parseInt(req.params.id) },
      data: {
        first_name,
        last_name,
        phone,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
        address,
        job_title,
        department_id: department_id ? parseInt(department_id) : null,
        manager_id: manager_id ? parseInt(manager_id) : null,
        date_of_joining: date_of_joining ? new Date(date_of_joining) : undefined,
        role_id: role_id ? parseInt(role_id) : undefined,
        salary_base: salary_base ? parseFloat(salary_base) : undefined,
        status
      }
    });
    res.json({ success: true, message: 'Employee updated' });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.uploadAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const avatarPath = `/uploads/avatars/${req.file.filename}`;
  
  try {
    await prisma.employee.update({
      where: { id: parseInt(req.params.id) },
      data: { avatar: avatarPath }
    });
    res.json({ success: true, avatar: avatarPath });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    await prisma.employee.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'inactive' }
    });
    res.json({ success: true, message: 'Employee deactivated' });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};
