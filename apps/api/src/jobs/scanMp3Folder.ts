import fs from 'node:fs/promises';
import path from 'node:path';
import { parseFile } from 'music-metadata';
import { TrackFileModel } from '../models/TrackFile.js';

type ScanOptions = {
  rootFolder: string;
};

function isMp3(filePath: string) {
  return filePath.toLowerCase().endsWith('.mp3');
}

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && isMp3(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function pickFirstString(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0].trim();
  return undefined;
}

function normaliseCamelotKey(key?: string) {
  if (!key) return undefined;
  const k = key.trim().toUpperCase();
  const m = k.match(/^0?(\d{1,2})(A|B)$/);
  if (!m) return k;
  return `${Number(m[1])}${m[2]}`; // strips leading zero
}

/**
 * Mixed In Key often writes key into:
 * - standard ID3 "TKEY"
 * - or custom "TXXX:Initial Key" / "TXXX:INITIALKEY"
 *
 * music-metadata exposes:
 * - common.bpm (usually TBPM)
 * - common.title, common.artist
 * - and raw/native tags in metadata.native
 */
function extractKey(metadata: any): string | undefined {
  // Try common fields first (may or may not exist depending on tags)
  const commonKey = pickFirstString(metadata?.common?.key);
  if (commonKey) return commonKey;

  // Search native tags for likely key fields
  const native = metadata?.native ?? {};
  for (const format of Object.keys(native)) {
    const tags = native[format] as Array<{ id: string; value: any }>;

    for (const t of tags) {
      const id = String(t.id).toLowerCase();

      // Standard ID3 frame for key is often "TKEY"
      if (id === 'tkey') {
        const v = pickFirstString(t.value);
        if (v) return v;
      }

      // Custom text frames often appear as "TXXX:Initial Key" etc.
      if (id.startsWith('txxx')) {
        const val = pickFirstString(t.value);
        // Some parsers put "Initial Key" in the id string, others in value objects
        const idStr = String(t.id).toLowerCase();
        if (idStr.includes('initial key') || idStr.includes('initialkey')) {
          if (val) return val;
        }

        // If value is an object with description/value (happens sometimes)
        if (t.value && typeof t.value === 'object') {
          const desc = String(t.value.description ?? '').toLowerCase();
          const value = pickFirstString(t.value.value);
          if ((desc.includes('initial key') || desc.includes('initialkey')) && value) return value;
        }
      }
    }
  }

  return undefined;
}

export async function scanMp3Folder({ rootFolder }: ScanOptions) {
  const mp3Files = await walk(rootFolder);
  console.log(`Found ${mp3Files.length} mp3 files under ${rootFolder}`);

  let upserted = 0;
  let failed = 0;

  for (const filePath of mp3Files) {
    try {
      const metadata = await parseFile(filePath, { skipCovers: true });

      const title = metadata.common.title ?? undefined;
      const artist = metadata.common.artist ?? undefined;
      const bpm = typeof metadata.common.bpm === 'number' ? metadata.common.bpm : undefined;
      const key = normaliseCamelotKey(extractKey(metadata));
      const durationSeconds =
        typeof metadata.format.duration === 'number'
          ? Math.round(metadata.format.duration)
          : undefined;

      await TrackFileModel.updateOne(
        { filePath },
        {
          $set: {
            filePath,
            title,
            artist,
            bpm,
            key,
            durationSeconds,
            source: 'mixedinkey'
          }
        },
        { upsert: true }
      );

      upserted++;
    } catch (err) {
      failed++;
      console.error(`Failed to read ${filePath}`, err);
    }
  }

  return { scanned: mp3Files.length, upserted, failed };
}