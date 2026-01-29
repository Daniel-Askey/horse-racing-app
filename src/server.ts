import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import horseDataRoutes from './routes/horseData';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow requests from any origin (including AI Studio)
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