const prisma = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { employee_id: parseInt(req.user.id) },
      orderBy: { created_at: 'desc' },
      take: 50
    });
    res.json({ success: true, data: notifications });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.markRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        id: parseInt(req.params.id),
        employee_id: parseInt(req.user.id)
      },
      data: { is_read: true }
    });
    res.json({ success: true });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { employee_id: parseInt(req.user.id) },
      data: { is_read: true }
    });
    res.json({ success: true });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        employee_id: parseInt(req.user.id),
        is_read: false
      }
    });
    res.json({ success: true, count });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};
