import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; reason: string; focus?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const email = encodeURIComponent('mona@example.com');
    getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${email}`)
      .then((data) => setSuggestions(data.suggestions))
      .catch(() => setError('Unable to load workout suggestions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {loading && <p role="status">Loading workout suggestions...</p>}
      {!loading && error && <p role="alert">Unable to load workout suggestions: {error}</p>}
      {!loading && !error && suggestions.length === 0 && <p>No workout suggestions available.</p>}
      {!loading && !error && suggestions.length > 0 && (
        <ul>{suggestions.map((suggestion, index) => (
          <li key={index}>{suggestion.title}: {suggestion.reason}</li>
        ))}</ul>
      )}
    </CapabilityCard>
  );
}
