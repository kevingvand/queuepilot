import { useEffect } from 'react';

export function App() {
  useEffect(() => {
    window.queuepilot.api.items.list().then(console.log);
  }, []);

  return <h1>QueuePilot</h1>;
}
