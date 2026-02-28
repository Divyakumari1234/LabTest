import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './configs/mongodb.js';
import labTestsRoutes from './routes/labTests.js';
import reportsRoutes from './routes/reports.js';

const app = express();


app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'The request body contains invalid JSON format',
      details: err.message
    });
  }
  next(err);
})

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});


app.get('/', (req, res) => res.send('API working')); 
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose?.connection?.readyState === 1 ? 'connected' : 'disconnected'
  });
});
app.use('/api/lab-tests', labTestsRoutes);
app.use('/api/reports', reportsRoutes);


app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.method} ${req.path} does not exist`,
  });
});


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || err.status || 500;
  const errorResponse = {
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = err.stack;
  }

  res.status(statusCode).json(errorResponse);
});

async function startServer() {
  try {
    try {
      await connectDB();
    } catch (dbError) {
      console.warn('⚠️ MongoDB connection failed, server will use JSON fallback:', dbError.message);
    }

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
