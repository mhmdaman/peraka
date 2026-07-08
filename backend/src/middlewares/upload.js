const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const storage = (subdir) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads', subdir);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const imageFilter = (req, file, cb) => {
  if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const docFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported file type'), false);
};

exports.uploadAvatar = multer({ storage: storage('avatars'), fileFilter: imageFilter, limits: { fileSize: 2 * 1024 * 1024 } });
exports.uploadDocument = multer({ storage: storage('documents'), fileFilter: docFilter, limits: { fileSize: 10 * 1024 * 1024 } });
exports.uploadAttendancePhoto = multer({ storage: storage('attendance'), fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
