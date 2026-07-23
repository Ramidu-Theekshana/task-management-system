import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import { errorHandler } from './utils/errors.js';

const app = express();
const PORT = process.env.PORT || 5000;

const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const frontendUrl = rawFrontendUrl.endsWith('/') ? rawFrontendUrl.slice(0, -1) : rawFrontendUrl;

// Enable CORS with credentials for HttpOnly cookie support
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

app.use(express.json());

// Auth Routes
app.use('/api/auth', authRoutes);

// Task Routes
app.use('/api/tasks', taskRoutes);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
export default app; // For testing
