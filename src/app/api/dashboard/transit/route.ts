import { NextResponse } from 'next/server';

interface MbtaPrediction {
  attributes: {
    departure_time: string | null;
    arrival_time: string | null;
  };
}

export async function GET() {
  try {
    // Stop 95 is Massachusetts Ave @ Beacon St
    const apiKey = process.env.MBTA_API_KEY;
    const baseUrl = 'https://api-v3.mbta.com/predictions?filter[route]=1&filter[stop]=95&sort=departure_time';
    const url = apiKey ? `${baseUrl}&api_key=${apiKey}` : baseUrl;

    const response = await fetch(url, { next: { revalidate: 12 } });

    if (!response.ok) {
      throw new Error('Failed to fetch MBTA data');
    }

    const data = (await response.json()) as { data: MbtaPrediction[] };
    
    // Process predictions to get ETAs in minutes
    const now = new Date();
    const etas = data.data
      .map((prediction) => {
        const time = prediction.attributes.departure_time || prediction.attributes.arrival_time;
        if (!time) return null;
        
        const diffMs = new Date(time).getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        return diffMins;
      })
      .filter((min: number | null) => min !== null && min >= 0)
      .slice(0, 3); // Get next 3 ETAs

    return NextResponse.json({
      route: '1',
      stopName: 'Massachusetts Ave @ Beacon St',
      direction: 'Route 1',
      etas,
      updatedAt: now.toISOString(),
      alert: null // Optional service alert
    });
  } catch (error) {
    console.error('MBTA API Error:', error);
    return NextResponse.json(
      { error: 'MBTA data temporarily unavailable' },
      { status: 503 }
    );
  }
}
