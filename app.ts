import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import identifyRoutes from './src/routes/identify';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/identify', identifyRoutes);

// Default route
app.get('/', (_, res) => res.send('Default Page'));

export default app;
