import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import authRoutes from './modules/auth/routes/auth.routes';
import usersRoutes from './modules/users/routes/users.routes';
import employeeRoutes from './modules/employees/routes/employees.routes';
import contractRoutes from './modules/contracts/routes/contracts.routes';
import workingSchedulesRoutes from './modules/working-schedules/routes/working-schedules.routes';

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', usersRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/working-schedules', workingSchedulesRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Centralised error handler — must be last
app.use(errorHandler);

export default app;
