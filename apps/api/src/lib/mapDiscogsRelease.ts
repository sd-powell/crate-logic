type DiscogsArtist = {
  name?: string;
  anv?: string;
  join?: string;
};

type DiscogsTrack = {
  position?: string;
  type_?: string;
  title?: string;
  duration?: string;
  artists?: DiscogsArtist[];
};

type DiscogsLabel = {
  name?: string;
  catno?: string;
};

type DiscogsImage = {
  type?: string;
  uri?: string;
  resource_url?: string;
  uri150?: string;
  width?: number;
  height?: number;
};

type DiscogsReleaseResponse = {
  id: number;
  title?: string;
  year?: number;
  artists?: DiscogsArtist[];
  labels?: DiscogsLabel[];
  genres?: string[];
  styles?: string[];
  country?: string;
  released?: string;
  notes?: string;
  thumb?: string;
  tracklist?: DiscogsTrack[];
  images?: DiscogsImage[];
};

export function mapDiscogsRelease(data: DiscogsReleaseResponse) {
  return {
    discogsReleaseId: data.id,
    title: data.title ?? undefined,
    year: data.year ?? undefined,
    artists: (data.artists ?? []).map((a) => ({
      name: a.name ?? undefined,
      anv: a.anv ?? undefined,
      join: a.join ?? undefined
    })),
    labels: (data.labels ?? []).map((l) => ({
      name: l.name ?? undefined,
      catno: l.catno ?? undefined
    })),
    genres: data.genres ?? [],
    styles: data.styles ?? [],
    country: data.country ?? undefined,
    released: data.released ?? undefined,
    notes: data.notes ?? undefined,
    thumb: data.thumb ?? undefined,
    tracklist: (data.tracklist ?? []).map((t) => ({
      position: t.position ?? undefined,
      type_: t.type_ ?? undefined,
      title: t.title ?? undefined,
      duration: t.duration ?? undefined,
      artists: (t.artists ?? []).map((a) => ({
        name: a.name ?? undefined,
        anv: a.anv ?? undefined,
        join: a.join ?? undefined
      }))
    })),
    images: (data.images ?? []).map((img) => ({
      type: img.type ?? undefined,
      uri: img.uri ?? undefined,
      resource_url: img.resource_url ?? undefined,
      uri150: img.uri150 ?? undefined,
      width: img.width ?? undefined,
      height: img.height ?? undefined
    })),
    raw: data
  };
}