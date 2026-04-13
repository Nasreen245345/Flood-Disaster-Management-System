require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const aidRequestRoutes = require('./routes/aidRequest.routes');
const disasterRoutes = require('./routes/disaster.routes');
const userRoutes = require('./routes/user.routes');
const volunteerRoutes = require('./routes/volunteer.routes');
const organizationRoutes = require('./routes/organization.routes');
const regionAssignmentRoutes = require('./routes/regionAssignment.routes');
const taskRoutes = require('./routes/task.routes');
const distributionRoutes = require('./routes/distribution.routes');
const mapRoutes = require('./routes/map.routes');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:4200', 
        'http://localhost:4201', 
        'http://localhost:4202', 
        'http://127.0.0.1:4200',
        'https://flood-disaster-management-system.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors()); // Handle preflight requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/aid-requests', aidRequestRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/users', userRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/region-assignments', regionAssignmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/distribution', distributionRoutes);
app.use('/api/map', mapRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'DMS Backend API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
});
