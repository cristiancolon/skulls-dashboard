'use client';

import { useEffect, useState } from 'react';
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudFog, 
  CloudDrizzle, 
  CloudHail, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  HelpCircle,
  Droplets
} from 'lucide-react';

interface WeatherCondition {
  text: string;
  icon: string;
}

interface CurrentWeather {
  temp: number;
  feelsLike: number;
  condition: WeatherCondition;
  wind: number;
}

interface TodaySummary {
  high: number;
  low: number;
  precipChance: number;
  sunrise: string;
  sunset: string;
}

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: WeatherCondition;
  precipChance: number;
}

interface WeatherData {
  current: CurrentWeather;
  today: TodaySummary;
  forecast: ForecastDay[];
  updatedAt: string;
  error?: string;
}

function WeatherIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'Sun':
      return <Sun className={className} />;
    case 'CloudSun':
      return <CloudSun className={className} />;
    case 'Cloud':
      return <Cloud className={className} />;
    case 'CloudFog':
      return <CloudFog className={className} />;
    case 'CloudDrizzle':
      return <CloudDrizzle className={className} />;
    case 'CloudHail':
      return <CloudHail className={className} />;
    case 'CloudRain':
      return <CloudRain className={className} />;
    case 'CloudSnow':
      return <CloudSnow className={className} />;
    case 'CloudLightning':
      return <CloudLightning className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
}

export default function WeatherView() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const res = await fetch('/api/dashboard/weather');
        const json = await res.json();
        
        if (res.ok) {
          setData(json);
          setError(null);
        } else {
          setError(json.error || 'Weather data unavailable');
        }
      } catch {
        setError('Weather data unavailable');
      }
    };

    fetchWeatherData();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeatherData, 1800000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-primary)] p-8 text-[var(--color-text-primary)]">
      <div className="flex justify-between items-end mb-8 border-b-2 border-[var(--color-accent)] pb-4">
        <h1 className="text-[var(--color-accent)] uppercase tracking-widest">Weather</h1>
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
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          {/* Top Row: Current & Today */}
          <div className="flex min-h-0 flex-[1.05] flex-row gap-8">
            {/* Top-left: Current Conditions */}
            <div className="flex-1 bg-[#111] rounded-3xl p-8 flex flex-col justify-center border border-[#333]">
              <div className="text-[var(--color-accent)] text-large mb-4 font-bold uppercase tracking-wide">Right Now</div>
              <div className="flex items-center gap-8">
                <div className="text-[6rem] font-bold leading-none tracking-tighter">
                  {data.current.temp}°
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-large font-bold flex items-center gap-4">
                    <WeatherIcon name={data.current.condition.icon} className="w-12 h-12 text-[var(--color-accent)]" />
                    <span>{data.current.condition.text}</span>
                  </div>
                  <div className="text-medium text-[var(--color-text-secondary)]">
                    Feels like {data.current.feelsLike}°
                  </div>
                  <div className="text-medium text-[var(--color-text-secondary)]">
                    Wind {data.current.wind} mph
                  </div>
                </div>
              </div>
            </div>

            {/* Top-right: Today Summary */}
            <div className="flex-1 bg-[#111] rounded-3xl p-8 flex flex-col justify-center border border-[#333]">
              <div className="text-[var(--color-accent)] text-large mb-6 font-bold uppercase tracking-wide">Today</div>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-medium text-[var(--color-text-secondary)]">High / Low</span>
                  <span className="text-xlarge font-bold">
                    <span className="text-white">{data.today.high}°</span>
                    <span className="text-[var(--color-text-secondary)] text-large mx-2">/</span>
                    <span className="text-[var(--color-text-secondary)]">{data.today.low}°</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-medium text-[var(--color-text-secondary)]">Precipitation</span>
                  <span className="text-xlarge font-bold">{data.today.precipChance}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-medium text-[var(--color-text-secondary)]">Sunrise</span>
                  <span className="text-large font-bold">{data.today.sunrise}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-medium text-[var(--color-text-secondary)]">Sunset</span>
                  <span className="text-large font-bold">{data.today.sunset}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: 4-Day Forecast */}
          <div className="flex min-h-0 flex-[0.95] flex-row gap-6">
            {data.forecast.map((day, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-[#333] bg-[#111] p-[0.95rem]">
                <div className="mb-0.5 text-2xl font-bold text-[var(--color-accent)]">{day.day}</div>
                <div className="mb-0.5">
                  <WeatherIcon name={day.condition.icon} className="h-10 w-10 text-white" />
                </div>
                <div className="mb-0.5 flex min-h-9 items-center text-center text-[1.2rem] font-bold leading-tight">
                  {day.condition.text}
                </div>
                <div className="mb-0.5 whitespace-nowrap text-2xl font-bold leading-none">
                  <span className="mr-1 text-[1.05rem] text-[var(--color-text-secondary)]">H:</span>
                  <span className="text-white">{day.high}°</span>
                  <span className="mx-2 text-[var(--color-text-secondary)]">|</span>
                  <span className="mr-1 text-[1.05rem] text-[var(--color-text-secondary)]">L:</span>
                  <span className="text-[var(--color-text-secondary)]">{day.low}°</span>
                </div>
                <div className="flex items-center gap-1 text-[1.05rem] font-bold leading-none text-blue-400">
                  <Droplets className="h-[1.1rem] w-[1.1rem]" /> {day.precipChance}%
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-large text-[var(--color-text-secondary)]">Loading weather...</div>
        </div>
      )}
    </div>
  );
}
