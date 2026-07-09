const prisma = require('../config/db');

exports.getAll = async (req, res) => {
  const { assigned_to, assigned_by, status, priority } = req.query;
  const empId = req.user.role === 'employee' ? parseInt(req.user.id) : (assigned_to ? parseInt(assigned_to) : undefined);
  
  try {
    const where = {};
    if (empId) where.assigned_to = empId;
    if (assigned_by) where.assigned_by = parseInt(assigned_by);
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { due_date: 'asc' },
      include: {
        assignee: true,
        assigner: true
      }
    });

    const data = tasks.map(t => ({
      ...t,
      assigned_to_name: `${t.assignee.first_name} ${t.assignee.last_name}`,
      assigned_by_name: `${t.assigner.first_name} ${t.assigner.last_name}`
    }));

    data.forEach(d => {
      delete d.assignee;
      delete d.assigner;
    });

    res.json({ success: true, data });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.create = async (req, res) => {
  const { title, description, assigned_to, priority, due_date } = req.body;
  try {
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        assigned_to: parseInt(assigned_to),
        assigned_by: parseInt(req.user.id),
        priority,
        due_date: new Date(due_date)
      }
    });
    res.status(201).json({ success: true, id: newTask.id });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });
    res.json({ success: true, message: 'Task status updated' });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.update = async (req, res) => {
  const { title, description, assigned_to, priority, due_date, status } = req.body;
  try {
    await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title,
        description,
        assigned_to: assigned_to ? parseInt(assigned_to) : undefined,
        priority,
        due_date: due_date ? new Date(due_date) : undefined,
        status
      }
    });
    res.json({ success: true, message: 'Task updated' });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.delete = async (req, res) => {
  try {
    await prisma.task.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};
