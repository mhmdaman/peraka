const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);
router.get('/today', ctrl.getToday);
router.post('/check-in', ctrl.checkIn);
router.post('/check-out', ctrl.checkOut);
router.get('/stats', ctrl.getStats);
router.get('/', ctrl.getList);

module.exports = router;
