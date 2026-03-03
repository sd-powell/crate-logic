import { useEffect, useState } from 'react';

type CrateItem = {
  id: string;
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
    try {
      const res = await fetch(`${API_URL}/api/crate-items`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/api/crate-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, artist })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setTitle('');
      setArtist('');

      await loadItems();
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 600 }}>
      <h1>Crate Logic</h1>

      <form onSubmit={addItem} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={title}
          placeholder="Track title"
          onChange={(e) => setTitle(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />

        <input
          value={artist}
          placeholder="Artist"
          onChange={(e) => setArtist(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />

        <button>Add</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong> — {item.artist}
          </li>
        ))}
      </ul>
    </div>
  );
}