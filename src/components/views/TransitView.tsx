'use client';

import { useEffect, useState } from 'react';

interface TransitData {
  route: string;
  stopName: string;
  direction: string;
  etas: number[];
  updatedAt: string;
  alert: string | null;
  error?: string;
}

export default function TransitView() {
  const [data, setData] = useState<TransitData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransitData = async () => {
      try {
        const res = await fetch('/api/dashboard/transit');
        const json = await res.json();
        
        if (res.ok) {
          setData(json);
          setError(null);
        } else {
          setError(json.error || 'MBTA data temporarily unavailable');
        }
      } catch {
        setError('MBTA data temporarily unavailable');
      }
    };

    fetchTransitData();
    // Refresh every 12 seconds (5 times per minute)
    const interval = setInterval(fetchTransitData, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-[var(--color-primary)] text-[var(--color-text-primary)]">
      {/* Top / main area: MIT Passio iframe */}
      <div className="flex-1 w-full relative">
        <iframe 
          src="https://passiogo.com/" 
          className="absolute inset-0 w-full h-full border-none block"
          title="MIT Passio Shuttle Map"
        />
        {/* Optional overlay if iframe fails could go here, but iframe handles itself usually */}
      </div>

      {/* Bottom strip: MBTA Route 1 ETA board */}
      <div className="shrink-0 h-[13%] min-h-[108px] w-full border-t-4 border-[var(--color-accent)] flex items-center px-8 bg-black">
        {error ? (
          <div className="flex flex-col justify-center w-full">
            <h2 className="text-large text-[var(--color-error)] font-bold">MBTA data temporarily unavailable</h2>
            {data?.updatedAt && (
              <p className="text-medium text-[var(--color-text-secondary)] mt-2">
                Last updated: {new Date(data.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
          </div>
        ) : data ? (
          <div className="flex flex-row justify-between items-center w-full">
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-[var(--color-accent)] text-black font-bold text-2xl px-4 py-1 rounded-lg">
                  {data.route}
                </div>
                <h2 className="text-large font-bold">
                  {data.stopName} — {data.direction}
                </h2>
              </div>
              <p className="text-medium text-[var(--color-text-secondary)]">
                Updated {new Date(data.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
            
            <div className="flex gap-8 items-center">
              {data.etas.length > 0 ? (
                data.etas.map((eta, idx) => (
                  <div key={idx} className="text-xlarge font-bold text-white">
                    {eta} <span className="text-large text-[var(--color-accent)]">min</span>
                  </div>
                ))
              ) : (
                <div className="text-xlarge font-bold text-[var(--color-text-secondary)]">
                  No upcoming buses
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-large text-[var(--color-text-secondary)]">Loading transit data...</div>
        )}
      </div>
    </div>
  );
}
