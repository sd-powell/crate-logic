import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CrateItemModel } from './models/CrateItem';

dotenv.config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Crate Logic API is running. Try /health');
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'api', time: new Date().toISOString() });
});

app.get('/api/crate-items', async (_req, res) => {
  const items = await CrateItemModel.find().sort({ createdAt: -1 }).lean();
  res.json(items);
});

app.post('/api/crate-items', async (req, res) => {
  const { title, artist } = req.body as { title?: string; artist?: string };

  if (!title || !artist) {
    return res.status(400).json({ error: 'title and artist are required' });
  }

  const created = await CrateItemModel.create({ title, artist });
  res.status(201).json(created);
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const mongoUrl = process.env.MONGO_URL;

async function start() {
  if (!mongoUrl) {
    throw new Error('MONGO_URL is not set. Add it to apps/api/.env');
  }

  await mongoose.connect(mongoUrl);
  console.log('✅ Connected to MongoDB');

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});