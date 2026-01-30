import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

import express from 'express';
import cors from 'cors';
import horseDataRoutes from './routes/horseData';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS with explicit configuration
app.use(cors({
    origin: '*', // Allow all origins (for development)
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies

// Routes
app.use('/api', horseDataRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'Backend server is running!',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Start server
app.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🐎 Horse Racing Backend Server`);
    console.log(`🚀 Running on: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});