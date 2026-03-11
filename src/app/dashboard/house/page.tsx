'use client';

import { useState, useEffect } from 'react';
import TransitView from '@/components/views/TransitView';
import BeerDieView from '@/components/views/BeerDieView';
import WeatherView from '@/components/views/WeatherView';

type ViewType = 'transit' | 'beer-die' | 'weather';

const ROTATION_SCHEDULE: { view: ViewType; duration: number }[] = [
  { view: 'transit', duration: 30000 },
  { view: 'beer-die', duration: 10000 },
  { view: 'weather', duration: 15000 },
];

export default function HouseDashboard() {
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  useEffect(() => {
    const currentDuration = ROTATION_SCHEDULE[currentViewIndex].duration;
    
    const timeoutId = setTimeout(() => {
      setCurrentViewIndex((prev) => (prev + 1) % ROTATION_SCHEDULE.length);
    }, currentDuration);

    return () => clearTimeout(timeoutId);
  }, [currentViewIndex]);

  const currentView = ROTATION_SCHEDULE[currentViewIndex].view;

  // We render all views simultaneously and use CSS opacity/z-index to transition between them.
  // This prevents the iframe from reloading and losing its state.
  return (
    <div className="relative h-[100dvh] w-[100dvw] overflow-hidden bg-black">
      {/* Fullscreen Toggle Button */}
      <button 
        onClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.error(err));
          } else if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }}
        className="absolute bottom-4 right-4 z-50 p-4 bg-black/30 text-white/30 hover:text-white hover:bg-black/80 rounded-lg transition-all"
        title="Toggle Fullscreen"
      >
        ⛶
      </button>

      <div 
        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
          currentView === 'transit' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        <TransitView />
      </div>
      
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
          currentView === 'beer-die' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        <BeerDieView />
      </div>
      
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
          currentView === 'weather' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        <WeatherView />
      </div>
    </div>
  );
}
