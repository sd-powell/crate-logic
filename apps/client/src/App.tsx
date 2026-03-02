import { useEffect, useState } from 'react';

type Health = {
  ok: boolean;
  service: string;
  time: string;
};

export default function App() {
  const [data, setData] = useState<Health | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL as string;

    fetch(`${apiUrl}/health`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as Health;
      })
      .then(setData)
      .catch((e) => setError(e?.message ?? 'Unknown error'));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Crate Logic</h1>

      {!data && !error && <p>Loading API health…</p>}
      {error && <p>❌ API error: {error}</p>}
      {data && (
        <pre style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}