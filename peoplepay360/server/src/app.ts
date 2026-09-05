import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import authRoutes from './modules/auth/routes/auth.routes';

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Public routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Centralised error handler — must be last
app.use(errorHandler);

export default app;
