const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  
  try {
    const employee = await prisma.employee.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!employee || employee.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, employee.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: employee.id, role: employee.role.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password_hash, ...safeEmployee } = employee;
    res.json({ success: true, token, user: { ...safeEmployee, role: employee.role.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.user.id },
      include: {
        role: true,
        department: true
      }
    });

    if (!employee) return res.status(404).json({ success: false, message: 'User not found' });
    
    const { password_hash, ...safeEmployee } = employee;
    res.json({ 
      success: true, 
      user: {
        ...safeEmployee,
        role: employee.role.name,
        department_name: employee.department?.name
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ success: false, message: 'Both fields required' });
    
  try {
    const employee = await prisma.employee.findUnique({ where: { id: req.user.id } });
    if (!employee) return res.status(404).json({ success: false, message: 'User not found' });
    
    const valid = await bcrypt.compare(currentPassword, employee.password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.employee.update({
      where: { id: req.user.id },
      data: { password_hash: hash }
    });
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
