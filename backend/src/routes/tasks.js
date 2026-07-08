const router = require('express').Router();
const ctrl = require('../controllers/taskController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.post('/', authorize('admin', 'manager'), ctrl.create);
router.put('/:id', authorize('admin', 'manager'), ctrl.update);
router.patch('/:id/status', ctrl.updateStatus);
router.delete('/:id', authorize('admin', 'manager'), ctrl.delete);

module.exports = router;
