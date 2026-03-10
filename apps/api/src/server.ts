import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CrateItemModel } from './models/CrateItem.js';
import { scanMp3Folder } from './jobs/scanMp3Folder.js';
import { TrackFileModel } from './models/TrackFile.js';
import { DiscogsReleaseModel } from './models/DiscogsRelease.js';
import { fetchDiscogsRelease } from './lib/discogs.js';
import { mapDiscogsRelease } from './lib/mapDiscogsRelease.js';
import { TrackMatchModel } from './models/TrackMatch.js';
import { matchTrackFileToRelease } from './lib/matchTrackFileToRelease.js';

dotenv.config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

function toCrateItemDto(doc: any) {
  return {
    id: String(doc._id),
    title: doc.title,
    artist: doc.artist,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function toTrackFileDto(doc: any) {
  return {
    id: String(doc._id),
    filePath: doc.filePath,
    title: doc.title,
    artist: doc.artist,
    bpm: doc.bpm,
    key: doc.key,
    source: doc.source,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function toDiscogsReleaseDto(doc: any) {
  return {
    id: String(doc._id),
    discogsReleaseId: doc.discogsReleaseId,
    title: doc.title,
    year: doc.year,
    artists: doc.artists,
    labels: doc.labels,
    genres: doc.genres,
    styles: doc.styles,
    country: doc.country,
    released: doc.released,
    thumb: doc.thumb,
    tracklist: doc.tracklist,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function toTrackMatchDto(doc: any) {
  return {
    id: String(doc._id),
    trackFileId: String(doc.trackFileId),
    discogsReleaseId: doc.discogsReleaseId,
    discogsTrackPosition: doc.discogsTrackPosition,
    discogsTrackTitle: doc.discogsTrackTitle,
    confidence: doc.confidence,
    status: doc.status,
    matchType: doc.matchType,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

async function findAndSaveBestMatchForTrackFile(trackFile: any, releases?: any[]) {
  const availableReleases = releases ?? (await DiscogsReleaseModel.find().lean());

  let bestMatch: any = null;

  for (const release of availableReleases) {
    const match = matchTrackFileToRelease(trackFile, release);
    if (!match) continue;

    if (!bestMatch || match.confidence > bestMatch.confidence) {
      bestMatch = match;
    }
  }

  if (!bestMatch) {
    return null;
  }

  const saved = await TrackMatchModel.findOneAndUpdate(
    {
      trackFileId: trackFile._id,
      discogsReleaseId: bestMatch.discogsReleaseId,
      discogsTrackPosition: bestMatch.discogsTrackPosition ?? null
    },
    {
      $set: {
        trackFileId: trackFile._id,
        discogsReleaseId: bestMatch.discogsReleaseId,
        discogsTrackPosition: bestMatch.discogsTrackPosition,
        discogsTrackTitle: bestMatch.discogsTrackTitle,
        confidence: bestMatch.confidence,
        status: 'suggested',
        matchType: bestMatch.matchType
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return saved;
}

app.get('/', (_req, res) => {
  res.send('Crate Logic API is running. Try /health');
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'api', time: new Date().toISOString() });
});

app.get('/api/crate-items', async (_req, res) => {
  try {
    const items = await CrateItemModel.find().sort({ createdAt: -1 }).lean();
    res.json(items.map(toCrateItemDto));
  } catch (err) {
    console.error('Failed to fetch crate items:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/crate-items', async (req, res) => {
  try {
    const { title, artist } = req.body as { title?: string; artist?: string };

    if (!title || !artist) {
      return res.status(400).json({ error: 'title and artist are required' });
    }

    const created = await CrateItemModel.create({ title, artist });
    res.status(201).json(toCrateItemDto(created));
  } catch (err) {
    console.error('Failed to create crate item:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/scan-mp3', async (req, res) => {
  try {
    const { rootFolder } = req.body as { rootFolder?: string };

    if (!rootFolder) {
      return res.status(400).json({ error: 'rootFolder is required' });
    }

    const result = await scanMp3Folder({ rootFolder });
    res.json(result);
  } catch (err) {
    console.error('Failed to scan MP3 folder:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/track-files', async (_req, res) => {
  try {
    const files = await TrackFileModel.find()
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    res.json(files.map(toTrackFileDto));
  } catch (err) {
    console.error('Failed to fetch track files:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/track-files/:trackFileId/match', async (req, res) => {
  try {
    const { trackFileId } = req.params;

    const trackFile = await TrackFileModel.findById(trackFileId).lean();
    if (!trackFile) {
      return res.status(404).json({ error: 'TrackFile not found' });
    }

    const saved = await findAndSaveBestMatchForTrackFile(trackFile);

    if (!saved) {
      return res.status(404).json({ error: 'No suitable match found' });
    }

    res.json(toTrackMatchDto(saved));
  } catch (err) {
    console.error('Failed to match track file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/track-files/match-all', async (_req, res) => {
  try {
    const trackFiles = await TrackFileModel.find().lean();
    const releases = await DiscogsReleaseModel.find().lean();

    let matched = 0;
    let unmatched = 0;
    const results: any[] = [];

    for (const trackFile of trackFiles) {
      const saved = await findAndSaveBestMatchForTrackFile(trackFile, releases);

      if (saved) {
        matched++;
        results.push(toTrackMatchDto(saved));
      } else {
        unmatched++;
      }
    }

    res.json({
      totalTrackFiles: trackFiles.length,
      matched,
      unmatched,
      results
    });
  } catch (err) {
    console.error('Failed to bulk match track files:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/track-matches', async (_req, res) => {
  try {
    const matches = await TrackMatchModel.find()
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    res.json(matches.map(toTrackMatchDto));
  } catch (err) {
    console.error('Failed to fetch track matches:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/discogs/releases/:releaseId/import', async (req, res) => {
  try {
    const releaseId = Number(req.params.releaseId);

    if (!Number.isInteger(releaseId) || releaseId <= 0) {
      return res.status(400).json({ error: 'releaseId must be a positive integer' });
    }

    const discogsData = await fetchDiscogsRelease(releaseId);
    const mapped = mapDiscogsRelease(discogsData);

    const doc = await DiscogsReleaseModel.findOneAndUpdate(
      { discogsReleaseId: releaseId },
      { $set: mapped },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    res.json(toDiscogsReleaseDto(doc));
  } catch (err) {
    console.error('Failed to import Discogs release:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/discogs/releases', async (_req, res) => {
  try {
    const docs = await DiscogsReleaseModel.find()
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    res.json(docs.map(toDiscogsReleaseDto));
  } catch (err) {
    console.error('Failed to fetch Discogs releases:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/discogs/releases/:releaseId', async (req, res) => {
  try {
    const releaseId = Number(req.params.releaseId);

    if (!Number.isInteger(releaseId) || releaseId <= 0) {
      return res.status(400).json({ error: 'releaseId must be a positive integer' });
    }

    const doc = await DiscogsReleaseModel.findOne({ discogsReleaseId: releaseId }).lean();

    if (!doc) {
      return res.status(404).json({ error: 'Discogs release not found in local database' });
    }

    res.json(toDiscogsReleaseDto(doc));
  } catch (err) {
    console.error('Failed to fetch Discogs release:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
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