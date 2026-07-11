const router = require('express').Router();
const prisma = require('../config/db');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/:userId', async (req, res) => {
  try {
    const userId1 = parseInt(req.user.id);
    const userId2 = parseInt(req.params.userId);

    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { sender_id: userId1, receiver_id: userId2 },
          { sender_id: userId2, receiver_id: userId1 }
        ]
      },
      orderBy: { created_at: 'asc' }
    });

    res.json({ success: true, data: chats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
