import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import authRouter from './server/routes/auth.js';
import usersRouter from './server/routes/users.js';
import opportunitiesRouter from './server/routes/opportunities.js';
import applicationsRouter from './server/routes/applications.js';
import teamsRouter from './server/routes/teams.js';
import collegesRouter from './server/routes/colleges.js';
import citiesRouter from './server/routes/cities.js';
import organizationsRouter from './server/routes/organizations.js';
import storiesRouter from './server/routes/stories.js';
import certificatesRouter from './server/routes/certificates.js';
import aiRouter from './server/routes/ai.js';
import locationRouter from './server/routes/location.js';
import { getDb } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  // Initialize SQLite database and seed data
  try {
    await getDb();
    console.log('Sangam SQLite backend initialized successfully.');
  } catch (err) {
    console.warn('SQLite init notice:', err);
  }

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Ensure the browser allows this origin to request geolocation.
  // Without this header, some browser configurations silently deny
  // the permission without ever showing the user a prompt.
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'geolocation=(self)');
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'Sangam Collegiate Volunteer & Internship Network',
      database: 'SQLite (sql.js persistent)',
      timestamp: new Date().toISOString()
    });
  });

  // REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/opportunities', opportunitiesRouter);
  app.use('/api/applications', applicationsRouter);
  app.use('/api/teams', teamsRouter);
  app.use('/api/colleges', collegesRouter);
  app.use('/api/cities', citiesRouter);
  app.use('/api/organizations', organizationsRouter);
  app.use('/api/stories', storiesRouter);
  app.use('/api/certificates', certificatesRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/location', locationRouter);

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: Vite middleware handles SPA and dev serving
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sangam server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Sangam server:', err);
});
