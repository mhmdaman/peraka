const prisma = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        author: true
      }
    });

    const data = announcements.map(a => ({
      ...a,
      created_by_name: `${a.author.first_name} ${a.author.last_name}`
    }));

    data.forEach(d => delete d.author);

    res.json({ success: true, data });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.create = async (req, res) => {
  const { title, content } = req.body;
  try {
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        created_by: parseInt(req.user.id)
      }
    });
    res.status(201).json({ success: true, id: announcement.id });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.update = async (req, res) => {
  const { title, content } = req.body;
  try {
    await prisma.announcement.update({
      where: { id: parseInt(req.params.id) },
      data: { title, content }
    });
    res.json({ success: true, message: 'Announcement updated' });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.delete = async (req, res) => {
  try {
    await prisma.announcement.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};
