import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

// Load environment variable
dotenv.config()
const app = express(); // Express app

// Middleware
app.use(cors());
app.use(express.json());

// Routes to be added
app.use('/api/auth', authRoutes)


// Health Check endpoint
app.get('/api/health', (req, res) =>{
    res.json({
        message:'jobIFY platform API is running',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    });
});

// Database Connection

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected Successfully'))
.catch(err => console.log('MongoDB connection Error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong' });
});

// 404 handler
app.use( (req, res) => {
    res.status(404).json({ message: 'Route not Found!'});
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Auth test: http://localhost:${PORT}/api/auth/test`);
});