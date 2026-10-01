import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import opportunitiesRouter from './routes/opportunities.js';
import applicationsRouter from './routes/applications.js';
import teamsRouter from './routes/teams.js';
import collegesRouter from './routes/colleges.js';
import citiesRouter from './routes/cities.js';
import organizationsRouter from './routes/organizations.js';
import storiesRouter from './routes/stories.js';
import certificatesRouter from './routes/certificates.js';
import aiRouter from './routes/ai.js';
import { getDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
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

// Static files in public
app.use(express.static(PUBLIC_DIR));

// Page routes
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.get('/browse', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'browse.html')));
app.get('/opportunity', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'opportunity.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html')));
app.get('/org-dashboard', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'org-dashboard.html')));
app.get('/certificate', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'certificate.html')));

async function startServer() {
  await getDb(); // Ensure SQLite and seed are ready
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sangam server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start Sangam server:', err);
});
