const router = require('express').Router();
const ctrl = require('../controllers/leaveController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', ctrl.getList);
router.post('/', ctrl.apply);
router.put('/:id/review', authorize('admin', 'manager'), ctrl.review);
router.get('/balances/:id?', ctrl.getBalances);

module.exports = router;
