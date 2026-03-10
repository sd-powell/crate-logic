const DISCOGS_API_BASE = 'https://api.discogs.com';

function getDiscogsHeaders() {
  const token = process.env.DISCOGS_USER_TOKEN;
  const userAgent = process.env.DISCOGS_USER_AGENT;

  if (!userAgent) {
    throw new Error('DISCOGS_USER_AGENT is not set');
  }

  return {
    'User-Agent': userAgent,
    ...(token ? { Authorization: `Discogs token=${token}` } : {})
  };
}

export async function fetchDiscogsRelease(releaseId: number) {
  const res = await fetch(`${DISCOGS_API_BASE}/releases/${releaseId}`, {
    headers: getDiscogsHeaders()
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discogs release fetch failed: HTTP ${res.status} - ${body}`);
  }

  return res.json();
}