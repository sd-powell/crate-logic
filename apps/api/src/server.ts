import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' })); // Vite default
app.use(express.json());

app.get('/', (_req, res) => res.send('Crate Logic API is running. Try /health'));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'api', time: new Date().toISOString() });
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));