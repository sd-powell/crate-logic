import { useEffect, useState } from 'react';

type CrateItem = {
  _id: string;
  title: string;
  artist: string;
  createdAt?: string;
};

const API_URL = import.meta.env.VITE_API_URL as string;

export default function App() {
  const [items, setItems] = useState<CrateItem[]>([]);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [error, setError] = useState('');

  async function loadItems() {
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/crate-items`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as CrateItem[];
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/crate-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist })
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      setTitle('');
      setArtist('');
      await loadItems();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add');
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
      <h1>Crate Logic</h1>

      <form onSubmit={addItem} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          style={{ flex: 1, padding: 8 }}
        />
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artist"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Add</button>
      </form>

      {error && <p style={{ color: 'crimson' }}>❌ {error}</p>}

      <ul style={{ paddingLeft: 18 }}>
        {items.map((i) => (
          <li key={i._id}>
            <strong>{i.title}</strong> — {i.artist}
          </li>
        ))}
      </ul>
    </div>
  );
}