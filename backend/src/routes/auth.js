const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const prisma = require('../config/db');

router.post('/login', ctrl.login);
router.get('/me', authenticate, ctrl.getMe);
router.put('/change-password', authenticate, ctrl.changePassword);

// Roles list (used by Add Employee form)
router.get('/roles', authenticate, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({ orderBy: { id: 'asc' } });
    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

