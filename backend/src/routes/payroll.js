const router = require('express').Router();
const ctrl = require('../controllers/payrollController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', ctrl.getList);
router.get('/:id', ctrl.getById);
router.post('/', authorize('admin'), ctrl.generate);
router.put('/:id/mark-paid', authorize('admin'), ctrl.markPaid);

module.exports = router;
