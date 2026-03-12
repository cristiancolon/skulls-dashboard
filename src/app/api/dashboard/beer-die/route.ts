import { NextResponse } from 'next/server';

const SHEET_ID = '1do4lJRRvJSRx8qTW0NAMJTWJjM4u0-uVJP8K3D3oJis';
const PLAYER_STATS_SHEET = 'Player Stats';
const GAME_LEDGER_SHEET = 'Game Ledger';
const CACHE_WINDOW_MS = 60_000;

interface BeerDieResponse {
  rankings: {
    rank: number;
    name: string;
    elo: number;
    wins: number;
    losses: number;
  }[];
  recentGames: {
    id: string;
    summary: string;
    score: string;
    timeAgo: string;
  }[];
  updatedAt: string;
}

let cachedBeerDieResponse: BeerDieResponse | null = null;
let cachedBeerDieResponseAt = 0;

function parseCsv(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }

      currentRow.push(currentValue);
      if (currentRow.some((cell) => cell.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  if (currentValue !== '' || currentRow.length > 0) {
    currentRow.push(currentValue);
    if (currentRow.some((cell) => cell.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const [headers, ...dataRows] = rows;
  return dataRows.map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? '';
    });
    return record;
  });
}

async function fetchSheetRows(sheetName: string): Promise<Record<string, string>[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${sheetName}`);
  }

  const csvText = await response.text();
  return parseCsv(csvText);
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatScore(scoreType: string, winnerRemaining: string): string {
  const remaining = winnerRemaining?.trim();
  const type = scoreType?.trim().toLowerCase();

  if (!remaining) {
    return type ? scoreType : 'Final';
  }

  if (type === 'quarters') {
    return `${remaining} ${remaining === '1' ? 'qtr' : 'qtrs'} left`;
  }

  return `${remaining} ${scoreType}`;
}

function formatDisplayName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length < 2) {
    return parts[0] ?? '';
  }

  return `${parts[0]} ${parts[1][0]}.`;
}

function formatTeam(player1: string, player2: string): string {
  return [player1, player2]
    .map((name) => formatDisplayName(name))
    .filter(Boolean)
    .join(' / ');
}

export async function GET() {
  try {
    const now = Date.now();

    if (cachedBeerDieResponse && now - cachedBeerDieResponseAt < CACHE_WINDOW_MS) {
      return NextResponse.json(cachedBeerDieResponse);
    }

    const [rawPlayerStatsRows, rawGameLedgerRows] = await Promise.all([
      fetchSheetRows(PLAYER_STATS_SHEET),
      fetchSheetRows(GAME_LEDGER_SHEET),
    ]);

    const rankings = rawPlayerStatsRows
      .map((row) => ({
        rank: Number.parseInt(row.rank ?? '', 10),
        name: formatDisplayName(row.player_name ?? ''),
        elo: Math.round(Number.parseFloat(row.ELO ?? '')),
        wins: Number.parseInt(row.wins ?? '', 10),
        losses: Number.parseInt(row.losses ?? '', 10),
      }))
      .filter(
        (row) =>
          row.name &&
          Number.isFinite(row.rank) &&
          Number.isFinite(row.elo) &&
          Number.isFinite(row.wins) &&
          Number.isFinite(row.losses)
      )
      .sort((a, b) => a.rank - b.rank || b.elo - a.elo)
      .slice(0, 10);

    const recentGames = rawGameLedgerRows
      .map((row) => {
        const teamA = formatTeam(row.team_a_player_1 ?? '', row.team_a_player_2 ?? '');
        const teamB = formatTeam(row.team_b_player_1 ?? '', row.team_b_player_2 ?? '');
        const winningTeam = (row.winning_team ?? '').trim().toUpperCase() === 'A' ? teamA : teamB;
        const losingTeam = (row.winning_team ?? '').trim().toUpperCase() === 'A' ? teamB : teamA;
        const timestamp = row.timestamp ?? '';
        const timestampMs = new Date(timestamp).getTime();

        return {
          id: row.game_id || `${timestamp}-${winningTeam}`,
          summary: `${winningTeam} def. ${losingTeam}`,
          score: formatScore(row.score_type ?? '', row.winner_remaining ?? ''),
          timeAgo: formatRelativeTime(timestamp),
          drink: (row.drink_type ?? '').trim() || 'Unknown',
          timestampMs,
        };
      })
      .filter((row) => row.summary !== ' def. ' && Number.isFinite(row.timestampMs))
      .sort((a, b) => b.timestampMs - a.timestampMs)
      .slice(0, 6)
      .map((row) => ({
        id: row.id,
        summary: row.summary,
        score: row.score,
        timeAgo: row.timeAgo,
        drink: row.drink,
      }));

    const responseData: BeerDieResponse = {
      rankings,
      recentGames,
      updatedAt: new Date().toISOString()
    };

    cachedBeerDieResponse = responseData;
    cachedBeerDieResponseAt = now;

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Beer Die API Error:', error);
    return NextResponse.json(
      { error: 'Beer Die rankings unavailable' },
      { status: 503 }
    );
  }
}
