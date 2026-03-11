import { NextResponse } from 'next/server';

// Weather code mapping to simple conditions and icons
const getWeatherCondition = (code: number) => {
  switch (true) {
    case code === 0: return { text: 'Clear', icon: 'Sun' };
    case code === 1: return { text: 'Mainly Clear', icon: 'Sun' };
    case code === 2: return { text: 'Partly Cloudy', icon: 'CloudSun' };
    case code === 3: return { text: 'Overcast', icon: 'Cloud' };
    case code === 45 || code === 48: return { text: 'Fog', icon: 'CloudFog' };
    case code === 51: return { text: 'Light Drizzle', icon: 'CloudDrizzle' };
    case code === 53: return { text: 'Moderate Drizzle', icon: 'CloudDrizzle' };
    case code === 55: return { text: 'Dense Drizzle', icon: 'CloudDrizzle' };
    case code === 56 || code === 57: return { text: 'Freezing Drizzle', icon: 'CloudHail' };
    case code === 61: return { text: 'Light Rain', icon: 'CloudRain' };
    case code === 63: return { text: 'Moderate Rain', icon: 'CloudRain' };
    case code === 65: return { text: 'Heavy Rain', icon: 'CloudRain' };
    case code === 66 || code === 67: return { text: 'Freezing Rain', icon: 'CloudHail' };
    case code === 71: return { text: 'Light Snow', icon: 'CloudSnow' };
    case code === 73: return { text: 'Moderate Snow', icon: 'CloudSnow' };
    case code === 75: return { text: 'Heavy Snow', icon: 'CloudSnow' };
    case code === 77: return { text: 'Snow Grains', icon: 'CloudSnow' };
    case code === 80: return { text: 'Light Rain Showers', icon: 'CloudRain' };
    case code === 81: return { text: 'Moderate Rain Showers', icon: 'CloudRain' };
    case code === 82: return { text: 'Violent Rain Showers', icon: 'CloudRain' };
    case code === 85: return { text: 'Light Snow Showers', icon: 'CloudSnow' };
    case code === 86: return { text: 'Heavy Snow Showers', icon: 'CloudSnow' };
    case code === 95: return { text: 'Thunderstorm', icon: 'CloudLightning' };
    case code === 96 || code === 99: return { text: 'Thunderstorm w/ Hail', icon: 'CloudLightning' };
    default: return { text: 'Unknown', icon: 'HelpCircle' };
  }
};

export async function GET() {
  try {
    // Back Bay, Boston coordinates (Copley Square)
    const lat = 42.3505;
    const lon = -71.0800;
    
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FNew_York`,
      { next: { revalidate: 1800 } } // Revalidate every 30 minutes
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();
    
    const current = {
      temp: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      condition: getWeatherCondition(data.current.weather_code),
      wind: Math.round(data.current.wind_speed_10m),
    };

    const today = {
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      precipChance: data.daily.precipitation_probability_max[0],
      sunrise: new Date(data.daily.sunrise[0]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      sunset: new Date(data.daily.sunset[0]).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };

    const forecast = data.daily.time.slice(1, 5).map((time: string, index: number) => {
      const date = new Date(time);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
        day: days[date.getDay()],
        high: Math.round(data.daily.temperature_2m_max[index + 1]),
        low: Math.round(data.daily.temperature_2m_min[index + 1]),
        condition: getWeatherCondition(data.daily.weather_code[index + 1]),
        precipChance: data.daily.precipitation_probability_max[index + 1] ?? 0,
      };
    });

    return NextResponse.json({
      current,
      today,
      forecast,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weather API Error:', error);
    return NextResponse.json(
      { error: 'Weather data unavailable' },
      { status: 503 }
    );
  }
}
