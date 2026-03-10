import { normaliseText } from './normaliseText.js';

type TrackFileLike = {
  title?: string;
  artist?: string;
};

type DiscogsTrackLike = {
  position?: string;
  title?: string;
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

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        discogsReleaseId: release.discogsReleaseId,
        discogsTrackPosition: track.position,
        discogsTrackTitle: track.title,
        confidence: Number(score.toFixed(2)),
        matchType
      };
    }
  }

  if (bestScore < 0.5) {
    return null;
  }

  return bestMatch;
}