'use client';

import { useEffect, useState } from 'react';

interface Ranking {
  rank: number;
  name: string;
  elo: number;
  wins: number;
  losses: number;
}

interface Game {
  id: string;
  summary: string;
  score: string;
  timeAgo: string;
  drink: string;
}

interface BeerDieData {
  rankings: Ranking[];
  recentGames: Game[];
  updatedAt: string;
  error?: string;
}

export default function BeerDieView() {
  const [data, setData] = useState<BeerDieData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBeerDieData = async () => {
      try {
        const res = await fetch('/api/dashboard/beer-die');
        const json = await res.json();
        
        if (res.ok) {
          setData(json);
          setError(null);
        } else {
          setError(json.error || 'Beer Die rankings unavailable');
        }
      } catch {
        setError('Beer Die rankings unavailable');
      }
    };

    fetchBeerDieData();
    // Refresh every 1 minute
    const interval = setInterval(fetchBeerDieData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-primary)] p-8 text-[var(--color-text-primary)]">
      <div className="flex justify-between items-end mb-4 border-b-2 border-[var(--color-accent)] pb-2">
        <h1 className="text-[var(--color-accent)] uppercase tracking-widest">Die Standings</h1>
        {data?.updatedAt && (
          <p className="text-medium text-[var(--color-text-secondary)]">
            Updated {new Date(data.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        )}
      </div>

      {error ? (
        <div className="flex-grow flex items-center justify-center">
          <h2 className="text-xlarge text-[var(--color-error)] font-bold">{error}</h2>
        </div>
      ) : data ? (
        <div className="flex flex-row h-full gap-8">
          {/* Left side (~60% width): ELO Rankings */}
          <div className="w-[60%] flex flex-col">
            <h2 className="text-large text-[var(--color-text-secondary)] mb-4">Top Players</h2>
            <div className="flex flex-col gap-3">
              {data.rankings.map((player) => (
                <div key={player.rank} className="flex items-center text-large">
                  <div className="w-16 text-[var(--color-accent)] font-bold">{player.rank}.</div>
                  <div className="flex-grow font-bold">{player.name}</div>
                  <div className="w-24 text-right font-mono text-[var(--color-text-secondary)]">
                    {player.wins}-{player.losses}
                  </div>
                  <div className="w-24 text-right font-mono">{player.elo}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side (~40% width): Latest Games */}
          <div className="w-[40%] flex flex-col border-l-2 border-[var(--color-error)] pl-8">
            <h2 className="text-large text-[var(--color-text-secondary)] mb-4">Latest Games</h2>
            <div className="flex flex-col gap-6">
              {data.recentGames.map((game) => (
                <div key={game.id} className="flex flex-col">
                  <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-large font-bold leading-tight">
                    <span className="whitespace-nowrap">
                      {game.summary.split(' def. ')[0] ?? game.summary}
                    </span>
                    {game.summary.includes(' def. ') && (
                      <>
                        <span className="whitespace-nowrap text-[var(--color-accent)]">def.</span>
                        <span className="whitespace-nowrap">
                          {game.summary.split(' def. ')[1]}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-medium text-[var(--color-accent)] flex items-center gap-4">
                    <span className="font-mono">{game.score}</span>
                    <span className="text-[var(--color-text-secondary)]">•</span>
                    <span className="text-[var(--color-text-secondary)]">{game.timeAgo}</span>
                    <span className="text-[var(--color-text-secondary)]">•</span>
                    <span className="text-[var(--color-text-secondary)]">{game.drink}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-large text-[var(--color-text-secondary)]">Loading standings...</div>
        </div>
      )}
    </div>
  );
}
