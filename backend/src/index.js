require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const payrollRoutes = require('./routes/payroll');
const taskRoutes = require('./routes/tasks');
const announcementRoutes = require('./routes/announcements');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Socket.io — real-time chat
const onlineUsers = new Map(); // employeeId -> socketId

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join', (employeeId) => {
    onlineUsers.set(String(employeeId), socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('send_message', ({ senderId, receiverId, message }) => {
    const receiverSocket = onlineUsers.get(String(receiverId));
    const payload = { senderId, receiverId, message, createdAt: new Date() };
    if (receiverSocket) io.to(receiverSocket).emit('receive_message', payload);
    socket.emit('receive_message', payload); // echo to sender
  });

  socket.on('disconnect', () => {
    for (const [empId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) { onlineUsers.delete(empId); break; }
    }
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Peraka API running on http://localhost:${PORT}`));

module.exports = { io };
