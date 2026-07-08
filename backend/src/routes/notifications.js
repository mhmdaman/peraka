const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/unread-count', ctrl.getUnreadCount);
router.put('/:id/read', ctrl.markRead);
router.put('/mark-all-read', ctrl.markAllRead);

module.exports = router;
