const router = require('express').Router();
const ctrl = require('../controllers/leaveController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/',           ctrl.getList);
router.post('/',          authorize('employee'),        ctrl.apply);
router.put('/:id/manager-review', authorize('manager', 'admin'), ctrl.managerReview);
router.put('/:id/admin-review',   authorize('admin'),            ctrl.adminReview);
router.get('/balances/:id?',      ctrl.getBalances);

module.exports = router;
