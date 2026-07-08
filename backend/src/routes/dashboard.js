const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);
router.get('/stats', ctrl.getStats);

module.exports = router;
