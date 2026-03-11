import { normaliseText } from './normaliseText.js';

const AUTO_MATCH_THRESHOLD = 0.8;

type TrackFileLike = {
  title?: string;
  artist?: string;
  durationSeconds?: number;
};

type DiscogsTrackLike = {
  position?: string;
  title?: string;
  duration?: string;
  durationSeconds?: number;
  artists?: Array<{ name?: string }>;
};

type DiscogsReleaseLike = {
  discogsReleaseId: number;
  artists?: Array<{ name?: string }>;
  tracklist?: DiscogsTrackLike[];
};

type MatchResult = {
  discogsReleaseId: number;
  discogsTrackPosition?: string;
  discogsTrackTitle?: string;
  confidence: number;
  matchType: string;
} | null;

export function matchTrackFileToRelease(
  trackFile: TrackFileLike,
  release: DiscogsReleaseLike
): MatchResult {
  const fileTitle = normaliseText(trackFile.title);
  const fileArtist = normaliseText(trackFile.artist);
  const fileDuration = trackFile.durationSeconds;

  if (!fileTitle || !release.tracklist?.length) {
    return null;
  }

  const releaseArtist = normaliseText(release.artists?.[0]?.name);

  let bestMatch: MatchResult = null;
  let bestScore = 0;

  for (const track of release.tracklist) {
    const trackTitle = normaliseText(track.title);
    const trackArtist =
      normaliseText(track.artists?.[0]?.name) || releaseArtist;

    let score = 0;
    let matchType = 'none';

    if (fileTitle && trackTitle && fileTitle === trackTitle) {
      score += 0.8;
      matchType = 'exact-title';
    } else if (
      fileTitle &&
      trackTitle &&
      (fileTitle.includes(trackTitle) || trackTitle.includes(fileTitle))
    ) {
      score += 0.55;
      matchType = 'partial-title';
    }

    if (fileArtist && trackArtist && fileArtist === trackArtist) {
      score += 0.2;
      matchType =
        matchType === 'none' ? 'exact-artist' : `${matchType}+artist`;
    }

    // Duration bonus if both sides have it
    if (
      typeof fileDuration === 'number' &&
      typeof track.durationSeconds === 'number'
    ) {
      const diff = Math.abs(fileDuration - track.durationSeconds);

      if (diff <= 2) {
        score += 0.2;
        matchType += '+duration-close';
      } else if (diff <= 5) {
        score += 0.1;
        matchType += '+duration-near';
      } else if (diff >= 20) {
        score -= 0.15;
        matchType += '+duration-mismatch';
      }
    }

    score = Math.max(0, Math.min(1, Number(score.toFixed(2))));

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        discogsReleaseId: release.discogsReleaseId,
        discogsTrackPosition: track.position,
        discogsTrackTitle: track.title,
        confidence: score,
        matchType
      };
    }
  }

  if (bestScore < AUTO_MATCH_THRESHOLD) {
    return null;
  }

  return bestMatch;
}