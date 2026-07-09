const prisma = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        manager: true,
        _count: {
          select: { employees: { where: { status: 'active' } } }
        }
      }
    });

    const data = departments.map(d => ({
      ...d,
      manager_name: d.manager ? `${d.manager.first_name} ${d.manager.last_name}` : null,
      employee_count: d._count.employees
    }));

    // Don't send _count in the final response
    data.forEach(d => delete d._count);

    res.json({ success: true, data });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.getById = async (req, res) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        manager: true
      }
    });

    if (!department) return res.status(404).json({ success: false, message: 'Not found' });

    const data = {
      ...department,
      manager_name: department.manager ? `${department.manager.first_name} ${department.manager.last_name}` : null
    };

    res.json({ success: true, data });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.create = async (req, res) => {
  const { name, description, manager_id } = req.body;
  try {
    const newDept = await prisma.department.create({
      data: {
        name,
        description,
        manager_id: manager_id ? parseInt(manager_id) : null
      }
    });
    res.status(201).json({ success: true, id: newDept.id });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'Department already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  const { name, description, manager_id } = req.body;
  try {
    await prisma.department.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        description,
        manager_id: manager_id ? parseInt(manager_id) : null
      }
    });
    res.json({ success: true, message: 'Department updated' });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.delete = async (req, res) => {
  try {
    await prisma.department.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};
