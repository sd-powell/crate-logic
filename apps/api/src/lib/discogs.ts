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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url: string, maxRetries = 5) {
  let attempt = 0;

  while (true) {
    const res = await fetch(url, {
      headers: getDiscogsHeaders()
    });

    if (res.ok) {
      return res.json();
    }

    if (res.status === 429 && attempt < maxRetries) {
      attempt++;

      // Discogs uses a moving 60-second window, so back off properly.
      // Start with 5s, then 10s, 20s, etc.
      const delayMs = 5000 * Math.pow(2, attempt - 1);
      console.warn(`Discogs 429 for ${url}. Retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
      await sleep(delayMs);
      continue;
    }

    const body = await res.text();
    throw new Error(`Discogs request failed: HTTP ${res.status} - ${body}`);
  }
}

export async function fetchDiscogsRelease(releaseId: number) {
  return fetchJsonWithRetry(`${DISCOGS_API_BASE}/releases/${releaseId}`);
}

type DiscogsCollectionItem = {
  basic_information?: {
    id?: number;
  };
};

type DiscogsCollectionResponse = {
  pagination?: {
    pages?: number;
    page?: number;
    per_page?: number;
    items?: number;
  };
  releases?: DiscogsCollectionItem[];
};

export async function fetchDiscogsCollectionPage(
  username: string,
  page = 1,
  perPage = 100
): Promise<DiscogsCollectionResponse> {
  const url =
    `${DISCOGS_API_BASE}/users/${encodeURIComponent(username)}` +
    `/collection/folders/0/releases?page=${page}&per_page=${perPage}`;

  return fetchJsonWithRetry(url) as Promise<DiscogsCollectionResponse>;
}

export async function fetchAllDiscogsCollectionReleaseIds(username: string) {
  const perPage = 100;
  const firstPage = await fetchDiscogsCollectionPage(username, 1, perPage);

  const pages = firstPage.pagination?.pages ?? 1;
  const ids = new Set<number>();

  for (const item of firstPage.releases ?? []) {
    const id = item.basic_information?.id;
    if (typeof id === 'number') {
      ids.add(id);
    }
  }

  for (let page = 2; page <= pages; page++) {
    const data = await fetchDiscogsCollectionPage(username, page, perPage);

    for (const item of data.releases ?? []) {
      const id = item.basic_information?.id;
      if (typeof id === 'number') {
        ids.add(id);
      }
    }
  }

  return Array.from(ids);
}

export async function paceDiscogsRequest() {
  // ~54 requests/minute max, with a little safety buffer
  await sleep(1100);
}