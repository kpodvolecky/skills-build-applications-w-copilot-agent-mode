import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch(() => setError('Unable to load activities'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {loading && <p role="status">Loading activities...</p>}
      {!loading && error && <p role="alert">Unable to load activities: {error}</p>}
      {!loading && !error && activities.length === 0 && <p>No activities available.</p>}
      {!loading && !error && activities.length > 0 && (
        <ul>
          {activities.map((activity, index) => (
            <li key={index}>{activity.type} - {activity.minutes} minutes - {activity.points} points</li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
