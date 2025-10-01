import React, { useState, useRef, useEffect } from 'react';
import { Agent } from '../types';

interface WorldMapProps {
  agents: Agent[];
  height?: number;
  onAgentClick?: (agent: Agent) => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ agents, height = 200, onAgentClick }) => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Simulate loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Group agents by country and city with better error handling
  const locationData = agents.reduce((acc, agent) => {
    const country = agent.geoLocation?.country || agent.country || 'Unknown';
    const city = agent.geoLocation?.city || 'Unknown';
    const key = `${country}-${city}`;
    
    if (!acc[key]) {
      acc[key] = {
        country,
        city,
        count: 0,
        online: 0,
        offline: 0,
        agents: [],
        coordinates: agent.geoLocation || { latitude: 0, longitude: 0 }
      };
    }
    
    acc[key].count++;
    acc[key].agents.push(agent);
    
    if (agent.status === 'Online' || agent.status === 'online') {
      acc[key].online++;
    } else {
      acc[key].offline++;
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Enhanced coordinate calculation with fallback positions
  const getCoordinates = (location: any, country: string) => {
    if (location && location.latitude && location.longitude) {
      // Convert lat/lng to percentage positions
      const x = ((location.longitude + 180) / 360) * 100;
      const y = ((90 - location.latitude) / 180) * 100;
      return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
    }
    
    // Fallback positions for common countries
    const countryPositions: Record<string, { x: number; y: number }> = {
      'United States': { x: 25, y: 40 },
      'Germany': { x: 55, y: 30 },
      'China': { x: 75, y: 35 },
      'Russia': { x: 70, y: 25 },
      'Brazil': { x: 35, y: 70 },
      'India': { x: 70, y: 45 },
      'Japan': { x: 85, y: 38 },
      'United Kingdom': { x: 52, y: 28 },
      'France': { x: 53, y: 32 },
      'Canada': { x: 25, y: 25 },
      'Australia': { x: 85, y: 75 },
      'Unknown': { x: 50, y: 50 }
    };
    
    return countryPositions[country] || { x: 50 + Math.random() * 40 - 20, y: 50 + Math.random() * 40 - 20 };
  };

  return (
    <div 
      ref={mapRef}
      className="relative w-full bg-gradient-to-br from-black via-red-950/20 to-gray-900 rounded-lg border border-red-500/30 overflow-hidden"
      style={{ height: `${height}px` }}
    >
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-red-400 text-xs font-mono">INITIALIZING MAP...</div>
          </div>
        </div>
      )}

      {/* Matrix-style background grid */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="hackingGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hackingGrid)" />
        </svg>
      </div>

      {/* Animated scanning lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent animate-pulse"></div>
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Location markers */}
      {isLoaded && Object.entries(locationData).map(([key, data]) => {
        const coords = getCoordinates(data.coordinates, data.country);
        const size = Math.max(10, Math.min(28, data.count * 3));
        const isOnline = data.online > 0;
        
        return (
          <div
            key={key}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
            style={{
              left: `${coords.x}%`,
              top: `${coords.y}%`,
            }}
            onClick={() => onAgentClick && data.agents[0] && onAgentClick(data.agents[0])}
          >
            {/* Pulsing effect for online agents */}
            {isOnline && (
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-60"
                style={{ 
                  width: size + 4, 
                  height: size + 4,
                  backgroundColor: '#EF4444',
                  left: -2,
                  top: -2
                }}
              />
            )}
            
            {/* Main marker with hacking aesthetic */}
            <div
              className="relative rounded-full border-2 shadow-lg transition-all duration-200 group-hover:scale-125"
              style={{ 
                width: size, 
                height: size,
                backgroundColor: isOnline ? '#DC2626' : '#374151',
                borderColor: isOnline ? '#EF4444' : '#6B7280',
                boxShadow: isOnline ? '0 0 20px rgba(239, 68, 68, 0.6)' : '0 0 10px rgba(107, 114, 128, 0.3)'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold font-mono">
                {data.count}
              </div>
              
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-red-400/60"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-red-400/60"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l border-b border-red-400/60"></div>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-red-400/60"></div>
            </div>

            {/* Enhanced tooltip with hacking theme */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
              <div className="bg-black/95 border border-red-500/50 rounded-lg p-3 text-xs whitespace-nowrap shadow-xl backdrop-blur-sm">
                <div className="text-red-400 font-bold font-mono uppercase tracking-wider">{data.city}, {data.country}</div>
                <div className="text-white font-mono">TOTAL: {data.count}</div>
                <div className="text-green-400 font-mono">ONLINE: {data.online}</div>
                <div className="text-gray-400 font-mono">OFFLINE: {data.offline}</div>
                
                {/* Corner accents for tooltip */}
                <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-red-500/40"></div>
                <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-red-500/40"></div>
                <div className="absolute bottom-1 left-1 w-2 h-2 border-l border-b border-red-500/40"></div>
                <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-red-500/40"></div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Corner accent lines with hacking theme */}
      <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-red-500/50"></div>
      <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-red-500/50"></div>
      <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-red-500/50"></div>
      <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-red-500/50"></div>

      {/* Status indicator */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/80 border border-red-500/30 rounded px-2 py-1 text-xs font-mono text-red-400 uppercase tracking-wider">
          GLOBAL NETWORK MAP
        </div>
      </div>
    </div>
  );
};

export default WorldMap;