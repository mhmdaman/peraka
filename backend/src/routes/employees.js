const router = require('express').Router();
const ctrl = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadAvatar } = require('../middlewares/upload');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('admin'), ctrl.create);
router.put('/:id', authorize('admin', 'manager'), ctrl.update);
router.post('/:id/avatar', authorize('admin'), uploadAvatar.single('avatar'), ctrl.uploadAvatar);
router.delete('/:id', authorize('admin'), ctrl.deleteEmployee);

module.exports = router;
