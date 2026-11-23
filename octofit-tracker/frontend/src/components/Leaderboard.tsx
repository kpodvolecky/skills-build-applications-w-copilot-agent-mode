import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => setEntries(data.leaderboard))
      .catch(() => setError('Unable to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {loading && <p role="status">Loading leaderboard...</p>}
      {!loading && error && <p role="alert">Unable to load leaderboard: {error}</p>}
      {!loading && !error && entries.length === 0 && <p>No leaderboard rankings available.</p>}
      {!loading && !error && entries.length > 0 && (
        <ol>{entries.map((entry) => <li key={entry.rank}>{entry.teamName}: {entry.totalPoints}</li>)}</ol>
      )}
    </CapabilityCard>
  );
}
